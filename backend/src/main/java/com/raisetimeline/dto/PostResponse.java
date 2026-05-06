package com.raisetimeline.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "投稿レスポンス")
public class PostResponse {

    @Schema(description = "投稿 ID", example = "42")
    private Long id;

    @Schema(description = "投稿テキスト", example = "今日も頑張ります！")
    private String content;

    @Schema(description = "添付画像 URL (なしの場合は null)", nullable = true, example = "https://example.com/image.jpg")
    private String imageUrl;

    @Schema(description = "作成日時 (ISO 8601)", example = "2026-05-06T12:00:00")
    private LocalDateTime createdAt;

    @Schema(description = "更新日時 (ISO 8601)", example = "2026-05-06T12:30:00")
    private LocalDateTime updatedAt;

    @Schema(description = "投稿者のユーザー ID", example = "1")
    private Long userId;

    @Schema(description = "投稿者のユーザー名", example = "yamada_taro")
    private String username;

    @Schema(description = "投稿者のプロフィール画像 URL (なしの場合は null)", nullable = true)
    private String profileImageUrl;

    @Schema(description = "いいね数", example = "5")
    private long likeCount;

    @Schema(description = "コメント数", example = "3")
    private long commentCount;

    @Schema(description = "現在ログイン中のユーザーがいいね済みか", example = "false")
    private boolean likedByCurrentUser;
}
