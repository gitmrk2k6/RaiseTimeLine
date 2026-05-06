package com.raisetimeline.controller;

import com.raisetimeline.dto.CommentRequest;
import com.raisetimeline.dto.CommentResponse;
import com.raisetimeline.service.CommentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posts/{postId}/comments")
@RequiredArgsConstructor
@Tag(name = "Comment", description = "コメント API")
public class CommentController {

    private final CommentService commentService;

    @Operation(summary = "Get comments", description = "指定投稿のコメント一覧を取得します")
    @ApiResponse(responseCode = "200", description = "取得成功")
    @GetMapping
    public ResponseEntity<List<CommentResponse>> getComments(
            @Parameter(description = "投稿 ID") @PathVariable Long postId) {
        return ResponseEntity.ok(commentService.getComments(postId));
    }

    @Operation(summary = "Create comment", description = "指定投稿にコメントを追加します")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "コメント作成成功",
                    content = @Content(schema = @Schema(implementation = CommentResponse.class))),
            @ApiResponse(responseCode = "400", description = "入力値エラー", content = @Content),
            @ApiResponse(responseCode = "404", description = "投稿が見つからない", content = @Content)
    })
    @PostMapping
    public ResponseEntity<CommentResponse> createComment(
            @Parameter(description = "投稿 ID") @PathVariable Long postId,
            @Valid @RequestBody CommentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(commentService.createComment(postId, request));
    }

    @Operation(summary = "Delete comment", description = "自分のコメントを削除します")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "削除成功", content = @Content),
            @ApiResponse(responseCode = "403", description = "他ユーザーのコメントは削除不可", content = @Content),
            @ApiResponse(responseCode = "404", description = "コメントが見つからない", content = @Content)
    })
    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @Parameter(description = "投稿 ID") @PathVariable Long postId,
            @Parameter(description = "コメント ID") @PathVariable Long commentId) {
        commentService.deleteComment(postId, commentId);
        return ResponseEntity.noContent().build();
    }
}
