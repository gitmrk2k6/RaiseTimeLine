package com.raisetimeline.controller;

import com.raisetimeline.dto.PostRequest;
import com.raisetimeline.dto.PostResponse;
import com.raisetimeline.entity.User;
import com.raisetimeline.service.PostService;
import com.raisetimeline.service.PostSseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
@Tag(name = "Post", description = "投稿 API")
public class PostController {

    private final PostService postService;
    private final PostSseService postSseService;

    @Operation(summary = "Get timeline", description = "タイムライン投稿一覧を取得します。followingOnly=true でフォロー中ユーザーの投稿のみ絞り込み可能")
    @ApiResponse(responseCode = "200", description = "取得成功")
    @GetMapping
    public ResponseEntity<List<PostResponse>> getTimeline(
            @Parameter(description = "true にするとフォロー中ユーザーの投稿のみ返します")
            @RequestParam(defaultValue = "false") boolean followingOnly,
            @Parameter(description = "カーソルページング用の基準日時 (ISO 8601)。省略時は最新から取得")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime before,
            @Parameter(description = "取得件数 (デフォルト: 20)")
            @RequestParam(defaultValue = "20") int limit,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<PostResponse> posts = followingOnly
                ? postService.getFollowingTimeline(before, limit, user.getId())
                : postService.getTimeline(before, limit, user.getId());
        return ResponseEntity.ok(posts);
    }

    @Operation(
            summary = "Stream posts via SSE",
            description = "Server-Sent Events で新着投稿をリアルタイム配信します。Swagger UI からの直接テストはサポートされていません。",
            hidden = true
    )
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream() {
        return postSseService.addEmitter();
    }

    @Operation(summary = "Create post", description = "テキストと任意の画像を投稿します (multipart/form-data)")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "投稿作成成功",
                    content = @Content(schema = @Schema(implementation = PostResponse.class))),
            @ApiResponse(responseCode = "400", description = "入力値エラー", content = @Content)
    })
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PostResponse> createPost(
            @Parameter(description = "投稿テキスト (最大 280 文字)", required = true)
            @RequestPart("content") String content,
            @Parameter(description = "添付画像ファイル (JPEG/PNG/GIF、任意)")
            @RequestPart(value = "image", required = false) MultipartFile image) {
        return ResponseEntity.status(HttpStatus.CREATED).body(postService.createPost(content, image));
    }

    @Operation(summary = "Update post", description = "自分の投稿を編集します")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "更新成功",
                    content = @Content(schema = @Schema(implementation = PostResponse.class))),
            @ApiResponse(responseCode = "403", description = "他ユーザーの投稿は編集不可", content = @Content),
            @ApiResponse(responseCode = "404", description = "投稿が見つからない", content = @Content)
    })
    @PutMapping("/{id}")
    public ResponseEntity<PostResponse> updatePost(
            @Parameter(description = "投稿 ID") @PathVariable Long id,
            @Valid @RequestBody PostRequest request) {
        return ResponseEntity.ok(postService.updatePost(id, request));
    }

    @Operation(summary = "Delete post", description = "自分の投稿を削除します")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "削除成功", content = @Content),
            @ApiResponse(responseCode = "403", description = "他ユーザーの投稿は削除不可", content = @Content),
            @ApiResponse(responseCode = "404", description = "投稿が見つからない", content = @Content)
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(
            @Parameter(description = "投稿 ID") @PathVariable Long id) {
        postService.deletePost(id);
        return ResponseEntity.noContent().build();
    }
}
