package com.raisetimeline.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.raisetimeline.entity.Post;
import com.raisetimeline.mapper.PostMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockPart;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * PostController 統合テスト（グレーボックス）
 *
 * テスト技法: 境界値分析（文字数）+ 権限チェック（ForbiddenException）
 *
 * 検証スコープ: HTTP → JwtAuthenticationFilter → PostController → PostService → Mapper → DB
 *
 * 権限チェックのテストパターン:
 *   - 自分の投稿: 200/204
 *   - 他人の投稿: 403
 *   - 未認証:     401
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@DisplayName("PostController 統合テスト")
class PostControllerIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired PostMapper postMapper;

    private static final String REGISTER_URL = "/api/auth/register";
    private static final String POSTS_URL    = "/api/posts";

    // ─────────────────────────────────────────────
    // ヘルパー: ユーザー登録 → アクセストークン + userId を取得
    // ─────────────────────────────────────────────
    record AuthInfo(String token, Long userId) {}

    private AuthInfo registerAndLogin(String username, String email) throws Exception {
        MvcResult result = mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "username", username,
                                "email",    email,
                                "password", "Password1"
                        ))))
                .andExpect(status().isCreated())
                .andReturn();

        var json = objectMapper.readTree(result.getResponse().getContentAsString());
        return new AuthInfo(
                json.get("accessToken").asText(),
                json.get("userId").asLong()
        );
    }

    // ─────────────────────────────────────────────
    // GET /api/posts
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("POST-I-01: 認証済みリクエスト → 200（正常系）")
    void getTimelineAuthenticated() throws Exception {
        AuthInfo auth = registerAndLogin("user1", "user1@example.com");

        mockMvc.perform(get(POSTS_URL)
                        .header("Authorization", "Bearer " + auth.token()))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST-I-02: 未認証リクエスト → 401（異常系）")
    void getTimelineUnauthenticated() throws Exception {
        mockMvc.perform(get(POSTS_URL))
                .andExpect(status().isUnauthorized());
    }

    // ─────────────────────────────────────────────
    // POST /api/posts（境界値: 文字数）
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("POST-I-03: content=280文字 → 201（境界値: 上限ちょうど）")
    void createPostWith280Chars() throws Exception {
        AuthInfo auth = registerAndLogin("user2", "user2@example.com");

        mockMvc.perform(multipart(POSTS_URL)
                        .part(new MockPart("content", "a".repeat(280).getBytes(StandardCharsets.UTF_8)))
                        .header("Authorization", "Bearer " + auth.token()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.content").isNotEmpty());
    }

    @Test
    @DisplayName("POST-I-04: content=281文字 → 400（境界値: 上限超過）")
    void createPostWith281Chars() throws Exception {
        AuthInfo auth = registerAndLogin("user3", "user3@example.com");

        mockMvc.perform(multipart(POSTS_URL)
                        .part(new MockPart("content", "a".repeat(281).getBytes(StandardCharsets.UTF_8)))
                        .header("Authorization", "Bearer " + auth.token()))
                .andExpect(status().isBadRequest());
    }

    // ─────────────────────────────────────────────
    // PUT /api/posts/{id}（権限チェック）
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("POST-I-05: 自分の投稿を編集 → 200（権限チェック: 正常系）")
    void updateOwnPost() throws Exception {
        AuthInfo auth = registerAndLogin("user4", "user4@example.com");

        // DB に直接投稿を作成（同一トランザクション内で参照可能）
        Post post = Post.builder().userId(auth.userId()).content("編集前").build();
        postMapper.insert(post);

        mockMvc.perform(put(POSTS_URL + "/" + post.getId())
                        .header("Authorization", "Bearer " + auth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("content", "編集後"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value("編集後"));
    }

    @Test
    @DisplayName("POST-I-06: 他ユーザーの投稿を編集 → 403（権限チェック: 異常系）")
    void updateOtherUserPost() throws Exception {
        AuthInfo authorA = registerAndLogin("userA", "usera@example.com");
        AuthInfo authorB = registerAndLogin("userB", "userb@example.com");

        // ユーザー A の投稿
        Post post = Post.builder().userId(authorA.userId()).content("A の投稿").build();
        postMapper.insert(post);

        // ユーザー B が編集を試みる → 403
        mockMvc.perform(put(POSTS_URL + "/" + post.getId())
                        .header("Authorization", "Bearer " + authorB.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("content", "Bによる改ざん"))))
                .andExpect(status().isForbidden());
    }

    // ─────────────────────────────────────────────
    // DELETE /api/posts/{id}（権限チェック）
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("POST-I-07: 自分の投稿を削除 → 204（権限チェック: 正常系）")
    void deleteOwnPost() throws Exception {
        AuthInfo auth = registerAndLogin("user5", "user5@example.com");

        Post post = Post.builder().userId(auth.userId()).content("削除対象").build();
        postMapper.insert(post);

        mockMvc.perform(delete(POSTS_URL + "/" + post.getId())
                        .header("Authorization", "Bearer " + auth.token()))
                .andExpect(status().isNoContent());
    }
}
