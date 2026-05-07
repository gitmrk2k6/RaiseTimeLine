package com.raisetimeline.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.raisetimeline.entity.Comment;
import com.raisetimeline.entity.Post;
import com.raisetimeline.mapper.CommentMapper;
import com.raisetimeline.mapper.PostMapper;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * CommentController 統合テスト（グレーボックス）
 *
 * テスト技法: デシジョンテーブル（deleteComment の権限チェック）
 *
 * 検証スコープ: HTTP → JwtAuthenticationFilter → CommentController → CommentService → Mapper → DB
 *
 * ┌──────────────┬─────────────────┬──────────┐
 * │ コメント所有者 │ リクエスト送信者 │ 結果      │
 * ├──────────────┼─────────────────┼──────────┤
 * │    userA     │    userA        │ 204 成功  │
 * │    userA     │    userB        │ 403 禁止  │
 * └──────────────┴─────────────────┴──────────┘
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@DisplayName("CommentController 統合テスト")
class CommentControllerIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired PostMapper postMapper;
    @Autowired CommentMapper commentMapper;

    private static final String REGISTER_URL = "/api/auth/register";

    // ─────────────────────────────────────────────
    // ヘルパー
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
    // DELETE /api/posts/{postId}/comments/{commentId}
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("CMT-I-01: 自分のコメントを削除 → 204（デシジョンテーブル: 所有者一致）")
    void deleteOwnComment() throws Exception {
        AuthInfo auth = registerAndLogin("cmtuser1", "cmt1@example.com");

        Post post = Post.builder().userId(auth.userId()).content("投稿").build();
        postMapper.insert(post);

        Comment comment = Comment.builder()
                .postId(post.getId()).userId(auth.userId()).content("自分のコメント").build();
        commentMapper.insert(comment);

        mockMvc.perform(delete("/api/posts/" + post.getId() + "/comments/" + comment.getId())
                        .header("Authorization", "Bearer " + auth.token()))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("CMT-I-02: 他ユーザーのコメントを削除 → 403（デシジョンテーブル: 所有者不一致）")
    void deleteOtherUserComment() throws Exception {
        AuthInfo authorA = registerAndLogin("cmtuserA", "cmtA@example.com");
        AuthInfo authorB = registerAndLogin("cmtuserB", "cmtB@example.com");

        Post post = Post.builder().userId(authorA.userId()).content("投稿").build();
        postMapper.insert(post);

        // A がコメントを作成
        Comment comment = Comment.builder()
                .postId(post.getId()).userId(authorA.userId()).content("Aのコメント").build();
        commentMapper.insert(comment);

        // B が A のコメントを削除しようとする → 403
        mockMvc.perform(delete("/api/posts/" + post.getId() + "/comments/" + comment.getId())
                        .header("Authorization", "Bearer " + authorB.token()))
                .andExpect(status().isForbidden());
    }
}
