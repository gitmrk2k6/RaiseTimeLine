/**
 * タイムライン負荷テスト
 *
 * 実行方法:
 *   k6 run performance/k6/scenarios/timeline.js
 *
 * 前提条件:
 *   - docker compose up -d（PostgreSQL 起動）
 *   - ./gradlew bootRun（Spring Boot port 8080 起動）
 *   - k6 インストール済み（brew install k6）
 *
 * ベースURL上書き:
 *   k6 run -e BASE_URL=http://staging:8080 performance/k6/scenarios/timeline.js
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";

// ----------------------------------------------------------------
// 負荷プロファイル・しきい値
// ----------------------------------------------------------------
export const options = {
  stages: [
    { duration: "30s", target: 50 }, // ランプアップ: 30秒で 50 VU に増加
    { duration: "60s", target: 50 }, // 負荷維持: 60秒間 50 VU を維持
    { duration: "10s", target: 0 },  // ランプダウン: 10秒で 0 VU に減少
  ],
  thresholds: {
    // docs/monitoring-and-logging.md の WARN 閾値に合わせる
    http_req_duration: ["p(95)<1000"], // p95 レスポンスタイム < 1000ms
    http_req_failed: ["rate<0.01"],    // エラー率 < 1%
  },
};

const JSON_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

// ----------------------------------------------------------------
// setup: テスト開始前に 1 回だけ実行（BCrypt を負荷下に晒さないための分離）
// ----------------------------------------------------------------
export function setup() {
  const MAX_VUS = 50;
  const users = [];

  for (let i = 0; i < MAX_VUS; i++) {
    const ts = Date.now();
    const email = `perf_tl_${ts}_${i}@example.com`;
    const username = `perf_tl_${ts}_${i}`;
    const password = "Password1!";

    const res = http.post(
      `${BASE_URL}/api/auth/register`,
      JSON.stringify({ username, email, password }),
      { headers: JSON_HEADERS }
    );

    if (res.status !== 201) {
      console.error(`[setup] ユーザー登録失敗 (index=${i}): ${res.status} ${res.body}`);
      continue;
    }

    const body = res.json();
    users.push({
      accessToken: body.accessToken,
      refreshToken: body.refreshToken,
      userId: body.userId,
    });
  }

  console.log(`[setup] ${users.length} ユーザーを登録しました`);
  return users;
}

// ----------------------------------------------------------------
// default: 各 VU が繰り返し実行するメインシナリオ
// ----------------------------------------------------------------
export default function (users) {
  // __VU は 1 始まりのため -1 して配列インデックスに変換
  const user = users[(__VU - 1) % users.length];

  if (!user || !user.accessToken) {
    console.error(`[VU ${__VU}] 有効なトークンがありません。テストをスキップします`);
    return;
  }

  const authHeaders = {
    Authorization: `Bearer ${user.accessToken}`,
    Accept: "application/json",
  };

  // タイムラインを最大 5 ページ取得（カーソルページネーション）
  let cursor = null;
  for (let page = 0; page < 5; page++) {
    const url = cursor
      ? `${BASE_URL}/api/posts?limit=20&before=${encodeURIComponent(cursor)}`
      : `${BASE_URL}/api/posts?limit=20`;

    const res = http.get(url, { headers: authHeaders });

    const ok = check(res, {
      "タイムライン取得: ステータス 200": (r) => r.status === 200,
      "タイムライン取得: レスポンスボディが配列": (r) => {
        try {
          return Array.isArray(r.json());
        } catch {
          return false;
        }
      },
    });

    if (!ok) {
      console.warn(`[VU ${__VU}] page=${page} タイムライン取得失敗: ${res.status}`);
      break;
    }

    const posts = res.json();
    if (!Array.isArray(posts) || posts.length === 0) {
      // 投稿なし（DB が空など）の場合はループ終了
      break;
    }

    // 最後の投稿の createdAt を次ページのカーソルに設定
    cursor = posts[posts.length - 1].createdAt;
    sleep(1); // ユーザーの思考時間をシミュレート
  }
}

// ----------------------------------------------------------------
// teardown: テスト終了後にテストデータを削除（自動クリーンアップ）
// ----------------------------------------------------------------
export function teardown(users) {
  console.log(`\n[teardown] クリーンアップ開始 (${users.length} ユーザー分の投稿を削除)`);

  for (const user of users) {
    const authHeaders = {
      Authorization: `Bearer ${user.accessToken}`,
      Accept: "application/json",
    };

    // ユーザーの投稿をカーソルページネーションで全件取得して削除
    let cursor = null;
    let deleted = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const url = cursor
        ? `${BASE_URL}/api/users/${user.userId}/posts?limit=20&before=${encodeURIComponent(cursor)}`
        : `${BASE_URL}/api/users/${user.userId}/posts?limit=20`;

      const res = http.get(url, { headers: authHeaders });
      if (res.status !== 200) break;

      const posts = res.json();
      if (!Array.isArray(posts) || posts.length === 0) break;

      for (const post of posts) {
        http.del(`${BASE_URL}/api/posts/${post.id}`, null, { headers: authHeaders });
        deleted++;
      }

      if (posts.length < 20) break;
      cursor = posts[posts.length - 1].createdAt;
    }

    if (deleted > 0) {
      console.log(`[teardown] userId=${user.userId}: ${deleted} 件の投稿を削除しました`);
    }
  }

  console.log("[teardown] クリーンアップ完了");
}

// ----------------------------------------------------------------
// handleSummary: テスト終了後に HTML レポートを生成
// ----------------------------------------------------------------
export function handleSummary(data) {
  const ts = new Date().toISOString().slice(0, 19).replace(/[:.]/g, "-");
  const reportPath = `performance/k6/reports/timeline-${ts}.html`;

  console.log(`\nHTMLレポート: ${reportPath}`);

  return {
    [reportPath]: htmlReport(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
