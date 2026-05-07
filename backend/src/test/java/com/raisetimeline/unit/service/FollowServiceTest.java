package com.raisetimeline.unit.service;

import com.raisetimeline.dto.FollowResponse;
import com.raisetimeline.mapper.FollowMapper;
import com.raisetimeline.service.FollowService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DuplicateKeyException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * FollowService ユニットテスト
 *
 * テスト技法: 状態遷移テスト + デシジョンテーブル
 *
 * 状態遷移図:
 *   [未フォロー] --follow()--> [フォロー中]
 *   [フォロー中] --follow()--> [フォロー中]    ← 冪等: DuplicateKeyException を無視
 *   [フォロー中] --unfollow()--> [未フォロー]
 *   [未フォロー] --follow(自分自身)--> [エラー] ← デシジョンテーブル条件
 *
 * FollowService は currentUserId を引数で受け取るため SecurityContextHolder 不要。
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FollowService ユニットテスト")
class FollowServiceTest {

    @Mock private FollowMapper followMapper;
    @InjectMocks private FollowService followService;

    private static final Long CURRENT_USER_ID = 1L;
    private static final Long TARGET_USER_ID  = 2L;

    @Test
    @DisplayName("FOL-U-01: 初回フォロー → isFollowing=true（状態: 未フォロー → フォロー中）")
    void followFirstTime() {
        when(followMapper.countFollowers(TARGET_USER_ID)).thenReturn(1L);
        when(followMapper.exists(CURRENT_USER_ID, TARGET_USER_ID)).thenReturn(true);

        FollowResponse result = followService.follow(TARGET_USER_ID, CURRENT_USER_ID);

        assertThat(result.isFollowing()).isTrue();
        assertThat(result.getFollowerCount()).isEqualTo(1L);
        verify(followMapper).insert(any());
    }

    @Test
    @DisplayName("FOL-U-02: 重複フォロー → DuplicateKeyException を無視・isFollowing=true 維持（冪等性）")
    void followDuplicate_isIdempotent() {
        doThrow(new DuplicateKeyException("Duplicate entry"))
                .when(followMapper).insert(any());
        when(followMapper.countFollowers(TARGET_USER_ID)).thenReturn(1L);
        when(followMapper.exists(CURRENT_USER_ID, TARGET_USER_ID)).thenReturn(true);

        // 例外が外に漏れず正常終了すること
        FollowResponse result = followService.follow(TARGET_USER_ID, CURRENT_USER_ID);

        assertThat(result.isFollowing()).isTrue();
    }

    @Test
    @DisplayName("FOL-U-03: 自分自身をフォロー → IllegalArgumentException（デシジョンテーブル: targetId==currentUserId）")
    void followSelf_throwsIllegalArgument() {
        assertThatThrownBy(() -> followService.follow(CURRENT_USER_ID, CURRENT_USER_ID))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("自分自身をフォローできません");

        // insert は呼ばれないこと（ホワイトボックス: 早期リターンの確認）
        verify(followMapper, never()).insert(any());
    }

    @Test
    @DisplayName("FOL-U-04: フォロー解除 → isFollowing=false（状態: フォロー中 → 未フォロー）")
    void unfollow() {
        when(followMapper.countFollowers(TARGET_USER_ID)).thenReturn(0L);
        when(followMapper.exists(CURRENT_USER_ID, TARGET_USER_ID)).thenReturn(false);

        FollowResponse result = followService.unfollow(TARGET_USER_ID, CURRENT_USER_ID);

        assertThat(result.isFollowing()).isFalse();
        assertThat(result.getFollowerCount()).isEqualTo(0L);
        verify(followMapper).delete(CURRENT_USER_ID, TARGET_USER_ID);
    }
}
