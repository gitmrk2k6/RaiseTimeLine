/**
 * auth.ts ユニットテスト
 *
 * テスト技法: ブラックボックス（状態遷移・正常系）
 *   localStorage と document.cookie の状態変化をテストする
 *
 * 状態遷移:
 *   [未認証] --setTokens()--> [認証済み] --removeTokens()--> [未認証]
 */

import {
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
  setTokens,
  removeTokens,
  isAuthenticated,
  getUserId,
  setUserId,
  getUsername,
  setUsername,
} from "../../../lib/auth";

const ACCESS_KEY = "raisetimeline_access_token";
const REFRESH_KEY = "raisetimeline_refresh_token";
const USER_ID_KEY = "raisetimeline_user_id";
const USERNAME_KEY = "raisetimeline_username";

describe("auth ユーティリティ", () => {
  beforeEach(() => {
    localStorage.clear();
    // cookie をリセット
    document.cookie = `${ACCESS_KEY}=; path=/; max-age=0`;
  });

  // ───────────────────────────────────────
  // setAccessToken / getAccessToken
  // ───────────────────────────────────────
  describe("setAccessToken / getAccessToken", () => {
    it("AUTH-FE-01: setAccessToken → localStorage と cookie が更新される", () => {
      setAccessToken("my-access-token");

      // localStorage に保存されること
      expect(localStorage.getItem(ACCESS_KEY)).toBe("my-access-token");

      // cookie に "1" がセットされること（存在フラグ）
      expect(document.cookie).toContain(`${ACCESS_KEY}=1`);
    });

    it("AUTH-FE-02: getAccessToken → localStorage から値を取得できる", () => {
      localStorage.setItem(ACCESS_KEY, "stored-access-token");

      expect(getAccessToken()).toBe("stored-access-token");
    });

    it("token がない場合 getAccessToken は null を返す", () => {
      expect(getAccessToken()).toBeNull();
    });
  });

  // ───────────────────────────────────────
  // setRefreshToken / getRefreshToken
  // ───────────────────────────────────────
  describe("setRefreshToken / getRefreshToken", () => {
    it("setRefreshToken → localStorage に保存される", () => {
      setRefreshToken("my-refresh-token");
      expect(localStorage.getItem(REFRESH_KEY)).toBe("my-refresh-token");
    });

    it("getRefreshToken → localStorage から値を取得できる", () => {
      localStorage.setItem(REFRESH_KEY, "stored-refresh-token");
      expect(getRefreshToken()).toBe("stored-refresh-token");
    });
  });

  // ───────────────────────────────────────
  // removeTokens
  // ───────────────────────────────────────
  describe("removeTokens", () => {
    it("AUTH-FE-03: removeTokens → 全キーと cookie が消える", () => {
      // 事前: 全トークンをセット
      localStorage.setItem(ACCESS_KEY, "access");
      localStorage.setItem(REFRESH_KEY, "refresh");
      localStorage.setItem(USER_ID_KEY, "1");
      localStorage.setItem(USERNAME_KEY, "testuser");
      document.cookie = `${ACCESS_KEY}=1; path=/`;

      removeTokens();

      // localStorage から削除されること
      expect(localStorage.getItem(ACCESS_KEY)).toBeNull();
      expect(localStorage.getItem(REFRESH_KEY)).toBeNull();
      expect(localStorage.getItem(USER_ID_KEY)).toBeNull();
      expect(localStorage.getItem(USERNAME_KEY)).toBeNull();

      // cookie が無効化されること（max-age=0 で消える）
      expect(document.cookie).not.toContain(`${ACCESS_KEY}=1`);
    });
  });

  // ───────────────────────────────────────
  // isAuthenticated（状態遷移テスト）
  // ───────────────────────────────────────
  describe("isAuthenticated", () => {
    it("AUTH-FE-04: アクセストークンがある → true（状態: 認証済み）", () => {
      setAccessToken("valid-token");
      expect(isAuthenticated()).toBe(true);
    });

    it("AUTH-FE-05: アクセストークンがない → false（状態: 未認証）", () => {
      expect(isAuthenticated()).toBe(false);
    });

    it("状態遷移: 認証済み → removeTokens → 未認証", () => {
      setTokens("access-token", "refresh-token");
      expect(isAuthenticated()).toBe(true);

      removeTokens();
      expect(isAuthenticated()).toBe(false);
    });
  });

  // ───────────────────────────────────────
  // setUserId / getUserId
  // ───────────────────────────────────────
  describe("setUserId / getUserId", () => {
    it("setUserId → getUserId で取得できる", () => {
      setUserId(42);
      expect(getUserId()).toBe(42);
    });

    it("未セット時は null を返す", () => {
      expect(getUserId()).toBeNull();
    });
  });

  // ───────────────────────────────────────
  // setUsername / getUsername
  // ───────────────────────────────────────
  describe("setUsername / getUsername", () => {
    it("setUsername → getUsername で取得できる", () => {
      setUsername("yamada_taro");
      expect(getUsername()).toBe("yamada_taro");
    });

    it("未セット時は null を返す", () => {
      expect(getUsername()).toBeNull();
    });
  });

  // ───────────────────────────────────────
  // setTokens（まとめて設定）
  // ───────────────────────────────────────
  describe("setTokens", () => {
    it("setTokens → access と refresh 両方がセットされる", () => {
      setTokens("access-token", "refresh-token");

      expect(getAccessToken()).toBe("access-token");
      expect(getRefreshToken()).toBe("refresh-token");
    });
  });
});
