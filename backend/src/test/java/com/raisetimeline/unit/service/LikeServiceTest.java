package com.raisetimeline.unit.service;

import com.raisetimeline.dto.LikeResponse;
import com.raisetimeline.entity.User;
import com.raisetimeline.mapper.LikeMapper;
import com.raisetimeline.service.LikeService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * LikeService ユニットテスト
 *
 * テスト技法: 状態遷移テスト
 *
 * 状態遷移図:
 *   [未いいね] --like()--> [いいね済み]
 *   [いいね済み] --like()--> [いいね済み]  ← 冪等: DuplicateKeyException を無視
 *   [いいね済み] --unlike()--> [未いいね]
 *   [未いいね] --unlike()--> [未いいね]    ← DELETE が0件でもエラーにならない
 *
 * 重要: DuplicateKeyException が外部に漏れず、liked=true が維持されることを確認する。
 * これは DB の UNIQUE 制約を利用した冪等設計のホワイトボックステスト。
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("LikeService ユニットテスト")
class LikeServiceTest {

    @Mock private LikeMapper likeMapper;
    @InjectMocks private LikeService likeService;

    private static final Long POST_ID = 10L;
    private static final Long USER_ID = 1L;

    @BeforeEach
    void setUpSecurityContext() {
        User user = User.builder().id(USER_ID).email("test@example.com").build();
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(user, null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("LIKE-U-01: 初回いいね → liked=true, likeCount=1（状態: 未いいね → いいね済み）")
    void likeFirstTime() {
        when(likeMapper.countByPostId(POST_ID)).thenReturn(1L);
        when(likeMapper.existsByPostIdAndUserId(POST_ID, USER_ID)).thenReturn(true);

        LikeResponse result = likeService.like(POST_ID);

        assertThat(result.isLikedByCurrentUser()).isTrue();
        assertThat(result.getLikeCount()).isEqualTo(1L);
        verify(likeMapper).insert(any());
    }

    @Test
    @DisplayName("LIKE-U-02: いいね済みで再いいね → DuplicateKeyException を無視・liked=true 維持（冪等性・状態遷移）")
    void likeDuplicate_isIdempotent() {
        // DB の UNIQUE 制約によって2回目の insert は DuplicateKeyException になる
        doThrow(new DuplicateKeyException("Duplicate entry"))
                .when(likeMapper).insert(any());
        when(likeMapper.countByPostId(POST_ID)).thenReturn(1L);
        when(likeMapper.existsByPostIdAndUserId(POST_ID, USER_ID)).thenReturn(true);

        // 例外が外に漏れずに正常終了すること
        LikeResponse result = likeService.like(POST_ID);

        assertThat(result.isLikedByCurrentUser()).isTrue();
        assertThat(result.getLikeCount()).isEqualTo(1L);
    }

    @Test
    @DisplayName("LIKE-U-03: いいね済みで解除 → liked=false, likeCount が減る（状態: いいね済み → 未いいね）")
    void unlike() {
        when(likeMapper.countByPostId(POST_ID)).thenReturn(0L);
        when(likeMapper.existsByPostIdAndUserId(POST_ID, USER_ID)).thenReturn(false);

        LikeResponse result = likeService.unlike(POST_ID);

        assertThat(result.isLikedByCurrentUser()).isFalse();
        assertThat(result.getLikeCount()).isEqualTo(0L);
        verify(likeMapper).delete(POST_ID, USER_ID);
    }

    @Test
    @DisplayName("LIKE-U-04: いいねなしで解除 → liked=false のまま、エラーにならない（状態: 未いいね → 未いいね）")
    void unlikeWhenNotLiked_noError() {
        // DELETE が0件でも例外にならない（likeMapper.delete は void）
        when(likeMapper.countByPostId(POST_ID)).thenReturn(0L);
        when(likeMapper.existsByPostIdAndUserId(POST_ID, USER_ID)).thenReturn(false);

        LikeResponse result = likeService.unlike(POST_ID);

        assertThat(result.isLikedByCurrentUser()).isFalse();
        verify(likeMapper).delete(POST_ID, USER_ID); // delete は呼ばれるが例外にならない
    }
}
