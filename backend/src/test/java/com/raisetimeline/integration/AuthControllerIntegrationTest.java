package com.raisetimeline.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * AuthController 統合テスト（グレーボックス）
 *
 * テスト技法: 同値分割 + Bean Validation + 分岐網羅
 *
 * 検証スコープ: HTTP → Spring Security → Controller → Service → Mapper → Testcontainers PostgreSQL
 *
 * @SpringBootTest: 本番と同じアプリケーションコンテキストを起動（SecurityFilterChain を含む）
 * @AutoConfigureMockMvc: MockMvc を自動設定（実際の HTTP ソケットは使わない）
 * @Transactional: テストごとにロールバックしてデータを分離
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@DisplayName("AuthController 統合テスト")
class AuthControllerIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    private static final String REGISTER_URL = "/api/auth/register";
    private static final String LOGIN_URL    = "/api/auth/login";
    private static final String REFRESH_URL  = "/api/auth/refresh";

    // ─────────────────────────────────────────────
    // POST /api/auth/register
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("AUTH-I-01: 有効データで登録 → 201 + accessToken 含む JSON（正常系）")
    void registerSuccess() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "username", "testuser",
                "email",    "test@example.com",
                "password", "Password1"
        ));

        mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.userId").isNumber())
                .andExpect(jsonPath("$.username").value("testuser"));
    }

    @Test
    @DisplayName("AUTH-I-02: メールアドレス重複 → 409 + field=email（同値分割: 無効クラス）")
    void registerDuplicateEmail() throws Exception {
        // 1件目登録（正常）
        mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "username", "user1",
                                "email",    "dup@example.com",
                                "password", "Password1"
                        ))))
                .andExpect(status().isCreated());

        // 同一メールで2件目登録 → 409
        mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "username", "user2",
                                "email",    "dup@example.com",
                                "password", "Password1"
                        ))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.field").value("email"));
    }

    @Test
    @DisplayName("AUTH-I-03: username=null → 400（Bean Validation）")
    void registerMissingUsername() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "email",    "valid@example.com",
                "password", "Password1"
        ));

        mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.username").isNotEmpty());
    }

    // ─────────────────────────────────────────────
    // POST /api/auth/login
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("AUTH-I-04: 正しい認証情報でログイン → 200 + accessToken（正常系）")
    void loginSuccess() throws Exception {
        // 事前登録
        mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "username", "loginuser",
                                "email",    "login@example.com",
                                "password", "Password1"
                        ))))
                .andExpect(status().isCreated());

        mockMvc.perform(post(LOGIN_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email",    "login@example.com",
                                "password", "Password1"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty());
    }

    @Test
    @DisplayName("AUTH-I-05: 誤パスワードでログイン → 401（同値分割: 無効クラス）")
    void loginWrongPassword() throws Exception {
        // 事前登録
        mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "username", "pwduser",
                                "email",    "pwd@example.com",
                                "password", "Password1"
                        ))))
                .andExpect(status().isCreated());

        mockMvc.perform(post(LOGIN_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email",    "pwd@example.com",
                                "password", "WrongPassword1"
                        ))))
                .andExpect(status().isUnauthorized());
    }

    // ─────────────────────────────────────────────
    // POST /api/auth/refresh
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("AUTH-I-06: アクセストークンをリフレッシュとして使用 → 400（分岐網羅: type 不一致）")
    void refreshWithAccessToken() throws Exception {
        // 事前登録してアクセストークンを取得
        MvcResult result = mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "username", "refreshuser",
                                "email",    "refresh@example.com",
                                "password", "Password1"
                        ))))
                .andExpect(status().isCreated())
                .andReturn();

        String accessToken = objectMapper.readTree(result.getResponse().getContentAsString())
                .get("accessToken").asText();

        // アクセストークンをリフレッシュトークンとして送信 → type="access" なので 400
        mockMvc.perform(post(REFRESH_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("refreshToken", accessToken))))
                .andExpect(status().isBadRequest());
    }
}
