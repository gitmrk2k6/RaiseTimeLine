package com.raisetimeline.unit.service;

import com.raisetimeline.dto.CommentRequest;
import com.raisetimeline.dto.CommentResponse;
import com.raisetimeline.entity.Comment;
import com.raisetimeline.entity.User;
import com.raisetimeline.exception.ForbiddenException;
import com.raisetimeline.mapper.CommentMapper;
import com.raisetimeline.service.CommentService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

/**
 * CommentService ユニットテスト
 *
 * テスト技法: デシジョンテーブル（deleteComment の権限チェック）
 *
 * deleteComment の条件と結果:
 * ┌────────────────┬──────────────────┬──────────────────┬───────────────────────────┐
 * │ コメントが存在  │ postId が一致     │ userId が一致     │ 結果                      │
 * ├────────────────┼──────────────────┼──────────────────┼───────────────────────────┤
 * │       No       │        -         │        -         │ IllegalArgumentException   │
 * │       Yes      │       No         │        -         │ IllegalArgumentException   │
 * │       Yes      │       Yes        │       No         │ ForbiddenException         │
 * │       Yes      │       Yes        │       Yes        │ 削除成功                   │
 * └────────────────┴──────────────────┴──────────────────┴───────────────────────────┘
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("CommentService ユニットテスト")
class CommentServiceTest {

    @Mock private CommentMapper commentMapper;
    @InjectMocks private CommentService commentService;

    private static final Long POST_ID         = 10L;
    private static final Long COMMENT_ID      = 100L;
    private static final Long CURRENT_USER_ID = 1L;
    private static final Long OTHER_USER_ID   = 2L;
    private static final Long OTHER_POST_ID   = 99L;

    @BeforeEach
    void setUpSecurityContext() {
        User user = User.builder().id(CURRENT_USER_ID).email("test@example.com").build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user, null, Collections.emptyList()));
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    // ─────────────────────────────────────────────
    // createComment()
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("CMT-U-01: 正常なコメント作成 → CommentResponse を返す（正常系）")
    void createCommentSuccess() {
        CommentRequest req = new CommentRequest();
        req.setContent("素晴らしい投稿ですね！");

        CommentResponse expected = new CommentResponse();
        expected.setId(1L);
        expected.setContent("素晴らしい投稿ですね！");

        doAnswer(inv -> { ((Comment) inv.getArgument(0)).setId(1L); return null; })
                .when(commentMapper).insert(any(Comment.class));
        when(commentMapper.findResponseById(1L)).thenReturn(expected);

        CommentResponse result = commentService.createComment(POST_ID, req);

        assertThat(result.getContent()).isEqualTo("素晴らしい投稿ですね！");
        verify(commentMapper).insert(argThat(c ->
                POST_ID.equals(c.getPostId()) && CURRENT_USER_ID.equals(c.getUserId())));
    }

    // ─────────────────────────────────────────────
    // deleteComment() — デシジョンテーブル全4ケース
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("CMT-U-02: 自分のコメントを削除 → delete() が呼ばれる（デシジョンテーブル C4: 全条件 true）")
    void deleteOwnComment() {
        Comment comment = Comment.builder()
                .id(COMMENT_ID).postId(POST_ID).userId(CURRENT_USER_ID).content("自分のコメント").build();
        when(commentMapper.findById(COMMENT_ID)).thenReturn(Optional.of(comment));

        commentService.deleteComment(POST_ID, COMMENT_ID);

        verify(commentMapper).delete(COMMENT_ID);
    }

    @Test
    @DisplayName("CMT-U-03: 他ユーザーのコメントを削除 → ForbiddenException（デシジョンテーブル C3: userId 不一致）")
    void deleteOtherUsersComment() {
        Comment comment = Comment.builder()
                .id(COMMENT_ID).postId(POST_ID).userId(OTHER_USER_ID).content("他人のコメント").build();
        when(commentMapper.findById(COMMENT_ID)).thenReturn(Optional.of(comment));

        assertThatThrownBy(() -> commentService.deleteComment(POST_ID, COMMENT_ID))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("権限");

        verify(commentMapper, never()).delete(anyLong());
    }

    @Test
    @DisplayName("CMT-U-04: 存在しないコメントID → IllegalArgumentException（デシジョンテーブル C1: コメントなし）")
    void deleteNonExistentComment() {
        when(commentMapper.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> commentService.deleteComment(POST_ID, 999L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("見つかりません");

        verify(commentMapper, never()).delete(anyLong());
    }

    @Test
    @DisplayName("CMT-U-05: postId が不一致のコメント → IllegalArgumentException（デシジョンテーブル C2: postId 不一致）")
    void deleteCommentWithWrongPostId() {
        // コメントは存在するが、別の投稿に属している
        Comment comment = Comment.builder()
                .id(COMMENT_ID).postId(OTHER_POST_ID).userId(CURRENT_USER_ID).content("別投稿のコメント").build();
        when(commentMapper.findById(COMMENT_ID)).thenReturn(Optional.of(comment));

        assertThatThrownBy(() -> commentService.deleteComment(POST_ID, COMMENT_ID))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("見つかりません");

        verify(commentMapper, never()).delete(anyLong());
    }
}
