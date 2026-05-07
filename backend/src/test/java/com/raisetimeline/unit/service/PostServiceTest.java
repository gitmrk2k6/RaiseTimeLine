package com.raisetimeline.unit.service;

import com.raisetimeline.dto.PostRequest;
import com.raisetimeline.dto.PostResponse;
import com.raisetimeline.entity.Post;
import com.raisetimeline.entity.User;
import com.raisetimeline.exception.ForbiddenException;
import com.raisetimeline.mapper.PostMapper;
import com.raisetimeline.service.PostService;
import com.raisetimeline.service.PostSseService;
import com.raisetimeline.service.S3UploadService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

/**
 * PostService ユニットテスト
 *
 * テスト技法:
 *   createPost: 境界値分析（280文字/281文字）、同値分割（null・空白）、ホワイトボックス（分岐網羅）
 *   updatePost: デシジョンテーブル（自分/他人/存在しない）、権限チェック
 *   deletePost: 同上
 *
 * SecurityContextHolder に User を直接セットして getCurrentUserId() を動作させる。
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PostService ユニットテスト")
class PostServiceTest {

    @Mock private PostMapper postMapper;
    @Mock private PostSseService postSseService;
    @Mock private S3UploadService s3UploadService;

    @InjectMocks
    private PostService postService;

    private static final Long CURRENT_USER_ID = 1L;
    private static final Long OTHER_USER_ID = 2L;

    @BeforeEach
    void setUpSecurityContext() {
        User user = User.builder().id(CURRENT_USER_ID).email("test@example.com").build();
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(user, null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    // ─────────────────────────────────────────────
    // createPost()
    // ─────────────────────────────────────────────
    @Nested
    @DisplayName("createPost()")
    class CreatePost {

        @Test
        @DisplayName("POST-U-01: テキストのみ投稿 → imageUrl=null で insert が呼ばれる（分岐: image=null）")
        void createTextOnlyPost() {
            PostResponse expected = mockPostResponse(1L, CURRENT_USER_ID, "テキスト投稿");
            doAnswer(inv -> { ((Post) inv.getArgument(0)).setId(1L); return null; })
                    .when(postMapper).insert(any(Post.class));
            when(postMapper.findByIdWithUser(1L, CURRENT_USER_ID)).thenReturn(expected);

            PostResponse result = postService.createPost("テキスト投稿", null);

            // imageUrl=null のまま insert されること（ホワイトボックス）
            verify(postMapper).insert(argThat(p -> p.getImageUrl() == null));
            verify(s3UploadService, never()).upload(any());
            assertThat(result.getContent()).isEqualTo("テキスト投稿");
        }

        @Test
        @DisplayName("POST-U-02: テキスト+画像投稿 → S3アップロードが呼ばれ imageUrl がセットされる（分岐: image!=null）")
        void createPostWithImage() {
            MockMultipartFile image = new MockMultipartFile(
                    "image", "test.jpg", "image/jpeg", new byte[100]);
            when(s3UploadService.upload(any(MultipartFile.class))).thenReturn("https://s3.example.com/test.jpg");
            PostResponse expected = mockPostResponse(1L, CURRENT_USER_ID, "画像付き投稿");
            expected.setImageUrl("https://s3.example.com/test.jpg");
            doAnswer(inv -> { ((Post) inv.getArgument(0)).setId(1L); return null; })
                    .when(postMapper).insert(any(Post.class));
            when(postMapper.findByIdWithUser(1L, CURRENT_USER_ID)).thenReturn(expected);

            PostResponse result = postService.createPost("画像付き投稿", image);

            verify(s3UploadService).upload(image);
            verify(postMapper).insert(argThat(p -> p.getImageUrl() != null));
            assertThat(result.getImageUrl()).isEqualTo("https://s3.example.com/test.jpg");
        }

        @Test
        @DisplayName("POST-U-03: content=280文字 → 正常に作成（境界値: 上限ちょうど）")
        void createPostWithExactly280Chars() {
            String content = "あ".repeat(280); // 280文字ちょうど
            PostResponse expected = mockPostResponse(1L, CURRENT_USER_ID, content);
            doAnswer(inv -> { ((Post) inv.getArgument(0)).setId(1L); return null; })
                    .when(postMapper).insert(any(Post.class));
            when(postMapper.findByIdWithUser(1L, CURRENT_USER_ID)).thenReturn(expected);

            PostResponse result = postService.createPost(content, null);

            assertThat(result).isNotNull();
            verify(postMapper).insert(any(Post.class));
        }

        @Test
        @DisplayName("POST-U-04: content=281文字 → IllegalArgumentException（境界値: 上限+1）")
        void createPostWith281Chars() {
            String content = "あ".repeat(281); // 281文字

            assertThatThrownBy(() -> postService.createPost(content, null))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("280文字以内");

            // insert が呼ばれないことを確認（ホワイトボックス）
            verify(postMapper, never()).insert(any());
        }

        @Test
        @DisplayName("POST-U-05: content=null → IllegalArgumentException（同値分割: 無効クラス）")
        void createPostWithNullContent() {
            assertThatThrownBy(() -> postService.createPost(null, null))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("必須");

            verify(postMapper, never()).insert(any());
        }

        @Test
        @DisplayName("POST-U-06: content=空白のみ → IllegalArgumentException（同値分割: 無効クラス）")
        void createPostWithBlankContent() {
            assertThatThrownBy(() -> postService.createPost("   ", null))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("必須");

            verify(postMapper, never()).insert(any());
        }

        @Test
        @DisplayName("POST-U-07: 作成後に SSE 配信される（ホワイトボックス: broadcast の呼出確認）")
        void broadcastAfterCreate() {
            PostResponse expected = mockPostResponse(1L, CURRENT_USER_ID, "SSEテスト");
            doAnswer(inv -> { ((Post) inv.getArgument(0)).setId(1L); return null; })
                    .when(postMapper).insert(any(Post.class));
            when(postMapper.findByIdWithUser(1L, CURRENT_USER_ID)).thenReturn(expected);

            postService.createPost("SSEテスト", null);

            verify(postSseService).broadcast(expected);
        }
    }

    // ─────────────────────────────────────────────
    // updatePost()
    // ─────────────────────────────────────────────
    @Nested
    @DisplayName("updatePost()")
    class UpdatePost {

        @Test
        @DisplayName("POST-U-08: 自分の投稿を編集 → PostResponse を返す（正常系）")
        void updateOwnPost() {
            Post existing = Post.builder().id(1L).userId(CURRENT_USER_ID).content("旧テキスト").build();
            PostRequest request = new PostRequest();
            request.setContent("新テキスト");
            PostResponse expected = mockPostResponse(1L, CURRENT_USER_ID, "新テキスト");

            when(postMapper.findById(1L)).thenReturn(Optional.of(existing));
            when(postMapper.findByIdWithUser(1L, CURRENT_USER_ID)).thenReturn(expected);

            PostResponse result = postService.updatePost(1L, request);

            verify(postMapper).update(argThat(p -> "新テキスト".equals(p.getContent())));
            assertThat(result.getContent()).isEqualTo("新テキスト");
        }

        @Test
        @DisplayName("POST-U-09: 他ユーザーの投稿を編集 → ForbiddenException（権限チェック）")
        void updateOtherUsersPost() {
            Post existing = Post.builder().id(1L).userId(OTHER_USER_ID).content("他人の投稿").build();
            PostRequest request = new PostRequest();
            request.setContent("編集しようとする");

            when(postMapper.findById(1L)).thenReturn(Optional.of(existing));

            assertThatThrownBy(() -> postService.updatePost(1L, request))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("権限");

            verify(postMapper, never()).update(any());
        }

        @Test
        @DisplayName("POST-U-10: 存在しない投稿ID で編集 → IllegalArgumentException（異常系）")
        void updateNonExistentPost() {
            when(postMapper.findById(999L)).thenReturn(Optional.empty());
            PostRequest request = new PostRequest();
            request.setContent("更新内容");

            assertThatThrownBy(() -> postService.updatePost(999L, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("見つかりません");
        }
    }

    // ─────────────────────────────────────────────
    // deletePost()
    // ─────────────────────────────────────────────
    @Nested
    @DisplayName("deletePost()")
    class DeletePost {

        @Test
        @DisplayName("POST-U-11: 自分の投稿を削除 → delete() が呼ばれる（正常系）")
        void deleteOwnPost() {
            Post existing = Post.builder().id(1L).userId(CURRENT_USER_ID).content("削除対象").build();
            when(postMapper.findById(1L)).thenReturn(Optional.of(existing));

            postService.deletePost(1L);

            verify(postMapper).delete(1L);
        }

        @Test
        @DisplayName("POST-U-12: 他ユーザーの投稿を削除 → ForbiddenException（権限チェック）")
        void deleteOtherUsersPost() {
            Post existing = Post.builder().id(1L).userId(OTHER_USER_ID).content("他人の投稿").build();
            when(postMapper.findById(1L)).thenReturn(Optional.of(existing));

            assertThatThrownBy(() -> postService.deletePost(1L))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("権限");

            verify(postMapper, never()).delete(anyLong());
        }

        @Test
        @DisplayName("POST-U-13: 存在しない投稿ID で削除 → IllegalArgumentException（異常系）")
        void deleteNonExistentPost() {
            when(postMapper.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> postService.deletePost(999L))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("見つかりません");

            verify(postMapper, never()).delete(anyLong());
        }
    }

    // ─────────────────────────────────────────────
    // ヘルパー
    // ─────────────────────────────────────────────
    private PostResponse mockPostResponse(Long id, Long userId, String content) {
        PostResponse r = new PostResponse();
        r.setId(id);
        r.setUserId(userId);
        r.setContent(content);
        return r;
    }
}
