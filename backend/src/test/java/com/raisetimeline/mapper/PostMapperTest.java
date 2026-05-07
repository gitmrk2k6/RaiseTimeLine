package com.raisetimeline.mapper;

import com.raisetimeline.dto.PostResponse;
import com.raisetimeline.entity.Follow;
import com.raisetimeline.entity.Like;
import com.raisetimeline.entity.Post;
import com.raisetimeline.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * PostMapper テスト（グレーボックス）
 *
 * テスト技法: グレーボックス（SQLの内部構造を知った上でテストを設計）
 *
 * 重点テスト対象:
 *   1. カーソルページング (findAll): before パラメータによる日時ベース絞り込み
 *   2. 集計クエリ (findByIdWithUser): いいね数・コメント数・いいね済みフラグの正確性
 *   3. フォロー中タイムライン (findFollowingTimeline): フォロー関係の絞り込み
 *
 * これらのSQLは複雑なサブクエリを含むため、ユニットテストでは検証できない。
 * 実DBを使って「SQLが仕様通り動くこと」を確認することが目的。
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("PostMapper テスト（Testcontainers）")
class PostMapperTest {

    @Autowired private UserMapper userMapper;
    @Autowired private PostMapper postMapper;
    @Autowired private LikeMapper likeMapper;
    @Autowired private FollowMapper followMapper;
    @Autowired private JdbcTemplate jdbcTemplate;

    private User userA;
    private User userB;

    @BeforeEach
    void setUpUsers() {
        userA = buildUser("userA", "a@example.com");
        userMapper.insert(userA);
        userB = buildUser("userB", "b@example.com");
        userMapper.insert(userB);
    }

    // ─────────────────────────────────────────────
    // findAll（カーソルページング）
    // ─────────────────────────────────────────────
    @Nested
    @DisplayName("findAll() カーソルページング")
    class FindAll {

        @Test
        @DisplayName("PMAP-01: before=null, limit=1 → 最新1件のみ返る（境界値: limit=1）")
        void findAllWithLimit1() {
            // CURRENT_TIMESTAMP はトランザクション開始時刻で固定されるため
            // JdbcTemplate で明示的なタイムスタンプを指定する
            LocalDateTime now = LocalDateTime.now();
            insertPostAt(userA, "投稿1", now.minusSeconds(2));
            insertPostAt(userA, "投稿2", now.minusSeconds(1));

            List<PostResponse> result = postMapper.findAll(null, 1, userA.getId());

            assertThat(result).hasSize(1);
            // 最新順なので「投稿2」が返る
            assertThat(result.get(0).getContent()).isEqualTo("投稿2");
        }

        @Test
        @DisplayName("PMAP-02: before=T → T より古い投稿のみ返る（境界値: カーソル位置）")
        void findAllWithBeforeCursor() {
            // CURRENT_TIMESTAMP はトランザクション開始時刻で固定されるため
            // JdbcTemplate で明示的なタイムスタンプを指定する
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime cursor = now.minusSeconds(1);
            insertPostAt(userA, "古い投稿",  now.minusSeconds(2));
            insertPostAt(userA, "新しい投稿", now);

            List<PostResponse> result = postMapper.findAll(cursor, 10, userA.getId());

            // cursor より古い「古い投稿」のみ返ること
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getContent()).isEqualTo("古い投稿");
        }

        @Test
        @DisplayName("PMAP-03: 投稿なし → 空配列を返す（境界値: 0件）")
        void findAllEmpty() {
            List<PostResponse> result = postMapper.findAll(null, 20, userA.getId());

            assertThat(result).isEmpty();
        }
    }

    // ─────────────────────────────────────────────
    // findByIdWithUser（集計クエリ）
    // ─────────────────────────────────────────────
    @Nested
    @DisplayName("findByIdWithUser() 集計クエリ")
    class FindByIdWithUser {

        @Test
        @DisplayName("PMAP-04: いいね3件 → likeCount=3 が返る（集計の正確性）")
        void likeCountIsCorrect() {
            Post post = insertPost(userA, "いいね集計テスト");
            likeMapper.insert(Like.builder().postId(post.getId()).userId(userA.getId()).build());
            likeMapper.insert(Like.builder().postId(post.getId()).userId(userB.getId()).build());

            PostResponse result = postMapper.findByIdWithUser(post.getId(), userA.getId());

            assertThat(result.getLikeCount()).isEqualTo(2L);
        }

        @Test
        @DisplayName("PMAP-05: 自分がいいね済み → likedByCurrentUser=true（集計の正確性）")
        void likedByCurrentUserIsTrue() {
            Post post = insertPost(userA, "いいね済みテスト");
            likeMapper.insert(Like.builder().postId(post.getId()).userId(userA.getId()).build());

            PostResponse result = postMapper.findByIdWithUser(post.getId(), userA.getId());

            assertThat(result.isLikedByCurrentUser()).isTrue();
        }

        @Test
        @DisplayName("PMAP-06: 自分がいいね未 → likedByCurrentUser=false（集計の正確性）")
        void likedByCurrentUserIsFalse() {
            Post post = insertPost(userA, "未いいねテスト");
            // userB がいいねしているが userA はしていない
            likeMapper.insert(Like.builder().postId(post.getId()).userId(userB.getId()).build());

            PostResponse result = postMapper.findByIdWithUser(post.getId(), userA.getId());

            assertThat(result.isLikedByCurrentUser()).isFalse();
            assertThat(result.getLikeCount()).isEqualTo(1L);
        }

        @Test
        @DisplayName("PMAP-07: いいねなし → likeCount=0, likedByCurrentUser=false（境界値: 0件）")
        void noLikesReturnsZero() {
            Post post = insertPost(userA, "いいねなし投稿");

            PostResponse result = postMapper.findByIdWithUser(post.getId(), userA.getId());

            assertThat(result.getLikeCount()).isEqualTo(0L);
            assertThat(result.isLikedByCurrentUser()).isFalse();
        }
    }

    // ─────────────────────────────────────────────
    // findFollowingTimeline
    // ─────────────────────────────────────────────
    @Nested
    @DisplayName("findFollowingTimeline() フォロー中タイムライン")
    class FindFollowingTimeline {

        @Test
        @DisplayName("PMAP-08: フォローなし → 自分の投稿のみ返る（境界値: フォロー0人）")
        void followingTimelineWithNoFollows() {
            insertPost(userA, "自分の投稿");
            insertPost(userB, "他人の投稿");

            // userA はフォロー中ゼロ
            List<PostResponse> result = postMapper.findFollowingTimeline(null, 20, userA.getId());

            // 自分の投稿のみ返ること（UNION で自分自身の投稿を含む設計）
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getContent()).isEqualTo("自分の投稿");
        }

        @Test
        @DisplayName("PMAP-09: userB をフォロー → userA + userB の投稿が返る（正常系）")
        void followingTimelineIncludesFollowedUser() {
            insertPost(userA, "自分の投稿");
            insertPost(userB, "フォロー中の投稿");

            // userA が userB をフォロー
            followMapper.insert(Follow.builder()
                    .followerId(userA.getId()).followingId(userB.getId()).build());

            List<PostResponse> result = postMapper.findFollowingTimeline(null, 20, userA.getId());

            assertThat(result).hasSize(2);
            assertThat(result).extracting(PostResponse::getContent)
                    .containsExactlyInAnyOrder("自分の投稿", "フォロー中の投稿");
        }

        @Test
        @DisplayName("PMAP-10: フォロー中でないユーザーの投稿は含まれない（デシジョンテーブル）")
        void followingTimelineExcludesUnfollowedUser() {
            User userC = buildUser("userC", "c@example.com");
            userMapper.insert(userC);

            insertPost(userA, "自分の投稿");
            insertPost(userC, "フォローしていないユーザーの投稿");

            // userA は userC をフォローしていない

            List<PostResponse> result = postMapper.findFollowingTimeline(null, 20, userA.getId());

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getContent()).isEqualTo("自分の投稿");
        }
    }

    // ─────────────────────────────────────────────
    // ヘルパー
    // ─────────────────────────────────────────────
    private Post insertPost(User user, String content) {
        Post post = Post.builder().userId(user.getId()).content(content).build();
        postMapper.insert(post);
        return post;
    }

    /**
     * 明示的なタイムスタンプで投稿を挿入する。
     *
     * PostgreSQL の CURRENT_TIMESTAMP はトランザクション開始時刻を返すため、
     * 同一 @Transactional 内では全 INSERT が同じ created_at になってしまう。
     * カーソルページングのような時刻ベーステストでは JdbcTemplate で
     * 明示的に created_at を指定する必要がある。
     */
    private void insertPostAt(User user, String content, LocalDateTime createdAt) {
        jdbcTemplate.update(
                "INSERT INTO posts (user_id, content, image_url, created_at, updated_at) VALUES (?, ?, NULL, ?, ?)",
                user.getId(), content, createdAt, createdAt
        );
    }

    private User buildUser(String username, String email) {
        return User.builder()
                .username(username)
                .email(email)
                .passwordDigest("encoded-password")
                .build();
    }
}
