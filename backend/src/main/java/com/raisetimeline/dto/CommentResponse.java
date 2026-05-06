package com.raisetimeline.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "コメントレスポンス")
public class CommentResponse {

    @Schema(description = "コメント ID", example = "10")
    private Long id;

    @Schema(description = "投稿 ID", example = "42")
    private Long postId;

    @Schema(description = "コメント投稿者のユーザー ID", example = "1")
    private Long userId;

    @Schema(description = "コメント投稿者のユーザー名", example = "yamada_taro")
    private String username;

    @Schema(description = "コメント投稿者のプロフィール画像 URL (なしの場合は null)", nullable = true)
    private String profileImageUrl;

    @Schema(description = "コメントテキスト", example = "素晴らしい投稿ですね！")
    private String content;

    @Schema(description = "コメント作成日時 (ISO 8601)", example = "2026-05-06T12:05:00")
    private LocalDateTime createdAt;
}
