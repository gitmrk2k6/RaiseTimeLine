/**
 * api.ts インターセプターテスト
 *
 * テスト技法: グレーボックス（状態遷移 + 並行性）
 *
 * 状態遷移図:
 *   [有効トークン]  --GET /posts--> [200 成功]
 *   [期限切れトークン] --GET /posts (401)--> [自動リフレッシュ] --GET /posts--> [200 成功]
 *   [期限切れ + リフレッシュも無効] → removeTokens() + /login リダイレクト
 *   [並行3リクエスト + 全401] → リフレッシュは1回だけ呼ばれる
 *
 * 実装上の重要ポイント:
 *   - `isRefreshing` フラグ: 並行 401 で refresh が重複しないよう制御
 *   - `failedQueue`: refresh 完了後に待機中リクエストをまとめて再実行
 *   - この2つが正しく動かないと「ログインループ」バグが発生する
 *
 * テスト構成:
 *   - MSW (msw/node) で HTTP レベルのモックを行う
 *   - vi.resetModules() + 動的 import で api.ts の isRefreshing/failedQueue を
 *     テストごとにリセット（モジュールレベル変数のステート漏洩を防ぐ）
 *   - window.location を beforeEach でモック化し、/login リダイレクトを検証する
 */

import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import {
  setAccessToken,
  setRefreshToken,
  getAccessToken,
} from "../../lib/auth";

const BASE_URL = "http://localhost:8080/api";

// ─────────────────────────────────────────────────────
// MSW サーバーのセットアップ
// ─────────────────────────────────────────────────────
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
});
afterAll(() => server.close());

// ─────────────────────────────────────────────────────
// window.location のモック
//
// 理由①: jsdom の location.href = '/login' は実際のナビゲーションを試みてエラーになる場合がある
// 理由②: MSW の toAbsoluteUrl は XHR URL 解決時に window.location.href を参照する。
//         空文字列だと解決に失敗するため、有効なベース URL をセットしておく。
// ─────────────────────────────────────────────────────
beforeEach(() => {
  Object.defineProperty(window, "location", {
    writable: true,
    configurable: true,
    value: { href: "http://localhost:3000/" },
  });
});

// ─────────────────────────────────────────────────────
// api モジュールを各テストで新鮮な状態にするヘルパー
//
// api.ts の `isRefreshing` と `failedQueue` はモジュールレベルの変数。
// vi.resetModules() + 動的 import することで各テスト間のステート漏洩を防ぐ。
// ─────────────────────────────────────────────────────
async function freshApi() {
  vi.resetModules();
  const mod = await import("../../lib/api");
  return mod.default;
}

// ─────────────────────────────────────────────────────
// テストケース
// ─────────────────────────────────────────────────────

describe("api.ts インターセプター", () => {
  describe("API-01: 有効なアクセストークン → そのままリクエスト成功", () => {
    it("Authorization ヘッダーが自動付与されてリクエストが通る（正常系）", async () => {
      setAccessToken("valid-token");

      server.use(
        http.get(`${BASE_URL}/posts`, ({ request }) => {
          const auth = request.headers.get("Authorization");
          if (auth === "Bearer valid-token") {
            return HttpResponse.json([{ id: 1, content: "テスト投稿" }]);
          }
          return new HttpResponse(null, { status: 401 });
        })
      );

      const api = await freshApi();
      const res = await api.get("/posts");

      expect(res.status).toBe(200);
      expect(res.data).toHaveLength(1);
    });
  });

  describe("API-02: 期限切れトークン → 自動リフレッシュ → 再リクエスト成功", () => {
    it("401 後に refresh → 新トークンで再実行して成功する（状態遷移）", async () => {
      setAccessToken("expired-token");
      setRefreshToken("valid-refresh-token");

      let postRequestCount = 0;

      server.use(
        http.get(`${BASE_URL}/posts`, ({ request }) => {
          postRequestCount++;
          const auth = request.headers.get("Authorization");
          if (auth === "Bearer new-access-token") {
            return HttpResponse.json([{ id: 1 }]);
          }
          return new HttpResponse(null, { status: 401 });
        }),
        http.post(`${BASE_URL}/auth/refresh`, () => {
          return HttpResponse.json({ accessToken: "new-access-token" });
        })
      );

      const api = await freshApi();
      const res = await api.get("/posts");

      expect(res.status).toBe(200);
      // accessToken が新しいものに更新されていること
      expect(getAccessToken()).toBe("new-access-token");
      // 1回目(401) + 2回目(新トークンで成功) = 計2回リクエスト
      expect(postRequestCount).toBe(2);
    });
  });

  describe("API-03: リフレッシュトークンも無効 → removeTokens + /login リダイレクト", () => {
    it("refresh 失敗後にトークンをクリアして /login へリダイレクトする（状態遷移）", async () => {
      setAccessToken("expired-token");
      setRefreshToken("expired-refresh-token");

      server.use(
        http.get(`${BASE_URL}/posts`, () =>
          new HttpResponse(null, { status: 401 })
        ),
        http.post(`${BASE_URL}/auth/refresh`, () =>
          new HttpResponse(null, { status: 401 })
        )
      );

      const api = await freshApi();

      await expect(api.get("/posts")).rejects.toThrow();

      // トークンがクリアされていること
      expect(getAccessToken()).toBeNull();
      // /login へリダイレクトされていること
      expect(window.location.href).toBe("/login");
    });
  });

  describe("API-04: 並行リクエストが同時に401 → refresh は1回だけ呼ばれる", () => {
    it("isRefreshing フラグにより refresh の重複呼出を防ぐ（並行性テスト）", async () => {
      setAccessToken("expired-token");
      setRefreshToken("valid-refresh-token");

      let refreshCallCount = 0;

      server.use(
        http.get(`${BASE_URL}/posts`, ({ request }) => {
          const auth = request.headers.get("Authorization");
          if (auth === "Bearer new-access-token") {
            return HttpResponse.json([]);
          }
          return new HttpResponse(null, { status: 401 });
        }),
        http.post(`${BASE_URL}/auth/refresh`, async () => {
          refreshCallCount++;
          // 意図的に待機して、並行リクエストが全て 401 を受け取れるようにする
          await new Promise((r) => setTimeout(r, 50));
          return HttpResponse.json({ accessToken: "new-access-token" });
        })
      );

      const api = await freshApi();

      // 3つのリクエストを同時に発行
      const results = await Promise.all([
        api.get("/posts"),
        api.get("/posts"),
        api.get("/posts"),
      ]);

      // 全て成功すること
      results.forEach((r) => expect(r.status).toBe(200));

      // refresh は1回だけ呼ばれること（isRefreshing フラグの効果）
      expect(refreshCallCount).toBe(1);
    });
  });

  describe("API-05: localStorage にリフレッシュトークンがない → 即座に /login リダイレクト", () => {
    it("refreshToken 未保存なら refresh を試みずに /login へ遷移する（異常系）", async () => {
      // refreshToken は localStorage にセットしない
      setAccessToken("expired-token");

      server.use(
        http.get(`${BASE_URL}/posts`, () =>
          new HttpResponse(null, { status: 401 })
        )
      );

      const api = await freshApi();

      await expect(api.get("/posts")).rejects.toThrow();

      // トークンがクリアされていること
      expect(getAccessToken()).toBeNull();
      // /login へリダイレクトされていること
      expect(window.location.href).toBe("/login");
    });
  });
});
