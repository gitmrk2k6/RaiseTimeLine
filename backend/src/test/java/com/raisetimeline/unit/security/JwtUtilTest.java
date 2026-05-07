package com.raisetimeline.unit.security;

import com.raisetimeline.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * JwtUtil ユニットテスト
 *
 * テスト技法: ホワイトボックス（分岐網羅）
 *   isAccessToken / isRefreshToken の try-catch 分岐を全て通す
 *
 * 分岐一覧:
 *   isAccessToken:  正常(access) → true / 正常(refresh) → false / JwtException → false / IllegalArgumentException → false
 *   isRefreshToken: 正常(refresh) → true / 正常(access) → false / JwtException → false / IllegalArgumentException → false
 */
@DisplayName("JwtUtil ユニットテスト")
class JwtUtilTest {

    // テスト用: 256bit 以上のシークレット
    private static final String SECRET =
            "test-secret-key-for-junit-testing-must-be-256bits-long-enough-for-hmacsha";
    private static final long ACCESS_EXP_MS  = 900_000L;    // 15 分
    private static final long REFRESH_EXP_MS = 604_800_000L; // 7 日

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil(SECRET, ACCESS_EXP_MS, REFRESH_EXP_MS);
    }

    // ───────────────────────────────────────────────
    // generateAccessToken / isAccessToken
    // ───────────────────────────────────────────────
    @Nested
    @DisplayName("isAccessToken()")
    class IsAccessToken {

        @Test
        @DisplayName("JWT-01: アクセストークンを渡すと true を返す（正常系）")
        void returnsTrueForAccessToken() {
            String token = jwtUtil.generateAccessToken(1L, "user@example.com");
            assertThat(jwtUtil.isAccessToken(token)).isTrue();
        }

        @Test
        @DisplayName("JWT-03: リフレッシュトークンを渡すと false を返す（型ミスマッチ）")
        void returnsFalseForRefreshToken() {
            String token = jwtUtil.generateRefreshToken(1L, "user@example.com");
            assertThat(jwtUtil.isAccessToken(token)).isFalse();
        }

        @Test
        @DisplayName("JWT-05: 改ざんされたトークンを渡すと false を返す（JwtException 分岐）")
        void returnsFalseForTamperedToken() {
            String token = jwtUtil.generateAccessToken(1L, "user@example.com");
            String tampered = token.substring(0, token.length() - 5) + "XXXXX";
            assertThat(jwtUtil.isAccessToken(tampered)).isFalse();
        }

        @Test
        @DisplayName("JWT-06: 空文字列を渡すと false を返す（境界値）")
        void returnsFalseForEmptyString() {
            assertThat(jwtUtil.isAccessToken("")).isFalse();
        }

        @Test
        @DisplayName("JWT-07: null を渡すと false を返す（境界値）")
        void returnsFalseForNull() {
            assertThat(jwtUtil.isAccessToken(null)).isFalse();
        }
    }

    // ───────────────────────────────────────────────
    // generateRefreshToken / isRefreshToken
    // ───────────────────────────────────────────────
    @Nested
    @DisplayName("isRefreshToken()")
    class IsRefreshToken {

        @Test
        @DisplayName("JWT-02: リフレッシュトークンを渡すと true を返す（正常系）")
        void returnsTrueForRefreshToken() {
            String token = jwtUtil.generateRefreshToken(1L, "user@example.com");
            assertThat(jwtUtil.isRefreshToken(token)).isTrue();
        }

        @Test
        @DisplayName("JWT-03': アクセストークンを渡すと false を返す（型ミスマッチ）")
        void returnsFalseForAccessToken() {
            String token = jwtUtil.generateAccessToken(1L, "user@example.com");
            assertThat(jwtUtil.isRefreshToken(token)).isFalse();
        }
    }

    // ───────────────────────────────────────────────
    // extractUserId
    // ───────────────────────────────────────────────
    @Nested
    @DisplayName("extractUserId()")
    class ExtractUserId {

        @Test
        @DisplayName("JWT-04: トークンに埋め込まれた userId を正しく返す（正常系）")
        void returnsEmbeddedUserId() {
            Long userId = 42L;
            String token = jwtUtil.generateAccessToken(userId, "user@example.com");
            assertThat(jwtUtil.extractUserId(token)).isEqualTo(userId);
        }

        @Test
        @DisplayName("JWT-04': リフレッシュトークンからも userId を取得できる")
        void extractsUserIdFromRefreshToken() {
            Long userId = 99L;
            String token = jwtUtil.generateRefreshToken(userId, "other@example.com");
            assertThat(jwtUtil.extractUserId(token)).isEqualTo(userId);
        }
    }
}
