package com.raisetimeline.controller;

import com.raisetimeline.dto.LikeResponse;
import com.raisetimeline.service.LikeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts/{postId}/likes")
@RequiredArgsConstructor
@Tag(name = "Like", description = "いいね API")
public class LikeController {

    private final LikeService likeService;

    @Operation(summary = "Like a post", description = "指定投稿にいいねを追加します")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "いいね成功",
                    content = @Content(schema = @Schema(implementation = LikeResponse.class))),
            @ApiResponse(responseCode = "404", description = "投稿が見つからない", content = @Content)
    })
    @PostMapping
    public ResponseEntity<LikeResponse> like(
            @Parameter(description = "投稿 ID") @PathVariable Long postId) {
        return ResponseEntity.ok(likeService.like(postId));
    }

    @Operation(summary = "Unlike a post", description = "指定投稿のいいねを取り消します")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "いいね取り消し成功",
                    content = @Content(schema = @Schema(implementation = LikeResponse.class))),
            @ApiResponse(responseCode = "404", description = "投稿が見つからない", content = @Content)
    })
    @DeleteMapping
    public ResponseEntity<LikeResponse> unlike(
            @Parameter(description = "投稿 ID") @PathVariable Long postId) {
        return ResponseEntity.ok(likeService.unlike(postId));
    }
}
