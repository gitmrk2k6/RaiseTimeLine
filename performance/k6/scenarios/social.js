/**
 * ソーシャルアクション負荷テスト（投稿・いいね・コメント）
 *
 * 実行方法:
 *   k6 run performance/k6/scenarios/social.js
 *
 * 前提条件:
 *   - docker compose up -d（PostgreSQL 起動）
 *   - ./gradlew bootRun（Spring Boot port 8080 起動）
 *   - k6 インストール済み（brew install k6）
 *
 * ベースURL上書き:
 *   k6 run -e BASE_URL=http://staging:8080 performance/k6/scenarios/social.js
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
    { duration: "20s", target: 20 }, // ランプアップ: 20秒で 20 VU（書き込みは抑えめ）
    { duration: "60s", target: 20 }, // 負荷維持: 60秒間 20 VU を維持
    { duration: "10s", target: 0 },  // ランプダウン
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"], // 書き込み系は 2000ms を上限
    http_req_failed: ["rate<0.01"],    // エラー率 < 1%
  },
};

const JSON_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

// ----------------------------------------------------------------
// setup: テスト開始前に 1 回だけ実行
// ----------------------------------------------------------------
export function setup() {
  const MAX_VUS = 20;
  const users = [];

  for (let i = 0; i < MAX_VUS; i++) {
    const ts = Date.now();
    const email = `perf_social_${ts}_${i}@example.com`;
    const username = `perf_s_${ts}_${i}`;
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
      userId: body.userId,
      username,
    });
  }

  console.log(`[setup] ${users.length} ユーザーを登録しました`);
  return users;
}

// ----------------------------------------------------------------
// default: 各 VU が繰り返し実行するメインシナリオ
// ----------------------------------------------------------------
export default function (users) {
  const user = users[(__VU - 1) % users.length];

  if (!user || !user.accessToken) {
    console.error(`[VU ${__VU}] 有効なトークンがありません。テストをスキップします`);
    return;
  }

  const authHeaders = {
    Authorization: `Bearer ${user.accessToken}`,
    Accept: "application/json",
  };

  // ── 1. 投稿作成（multipart/form-data）──────────────────────────
  // k6 の http.file() を使わず FormData 相当を文字列で構築
  // Content-Type は multipart/form-data だが、テキストのみのため
  // application/x-www-form-urlencoded で代用（Spring の @RequestPart は受け付ける）
  const postContent = `パフォーマンステスト投稿 by ${user.username} at ${Date.now()}`;
  const formData = {
    content: postContent,
  };

  const postRes = http.post(`${BASE_URL}/api/posts`, formData, {
    headers: { Authorization: `Bearer ${user.accessToken}` },
  });

  const postOk = check(postRes, {
    "投稿作成: ステータス 201": (r) => r.status === 201,
    "投稿作成: postId が存在する": (r) => {
      try {
        return !!r.json().id;
      } catch {
        return false;
      }
    },
  });

  if (!postOk) {
    console.warn(`[VU ${__VU}] 投稿作成失敗: ${postRes.status} ${postRes.body}`);
    return;
  }

  const postId = postRes.json().id;
  sleep(0.5);

  // ── 2. いいね ──────────────────────────────────────────────────
  const likeRes = http.post(
    `${BASE_URL}/api/posts/${postId}/likes`,
    null,
    { headers: authHeaders }
  );

  check(likeRes, {
    "いいね: ステータス 200": (r) => r.status === 200,
  });
  sleep(0.5);

  // ── 3. いいね解除 ──────────────────────────────────────────────
  const unlikeRes = http.del(
    `${BASE_URL}/api/posts/${postId}/likes`,
    null,
    { headers: authHeaders }
  );

  check(unlikeRes, {
    "いいね解除: ステータス 200": (r) => r.status === 200,
  });
  sleep(0.5);

  // ── 4. コメント作成 ────────────────────────────────────────────
  const commentRes = http.post(
    `${BASE_URL}/api/posts/${postId}/comments`,
    JSON.stringify({ content: `コメント by ${user.username}` }),
    { headers: { ...authHeaders, "Content-Type": "application/json" } }
  );

  check(commentRes, {
    "コメント作成: ステータス 201": (r) => r.status === 201,
  });

  sleep(1);
}

// ----------------------------------------------------------------
// handleSummary: テスト終了後に HTML レポートを生成
// ----------------------------------------------------------------
export function handleSummary(data) {
  const ts = new Date().toISOString().slice(0, 19).replace(/[:.]/g, "-");
  const reportPath = `performance/k6/reports/social-${ts}.html`;

  console.log(`\nHTMLレポート: ${reportPath}`);

  return {
    [reportPath]: htmlReport(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
