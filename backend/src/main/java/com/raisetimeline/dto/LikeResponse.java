package com.raisetimeline.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "いいねレスポンス")
public class LikeResponse {

    @Schema(description = "投稿 ID", example = "42")
    private Long postId;

    @Schema(description = "現在のいいね数", example = "5")
    private long likeCount;

    @Schema(description = "現在ログイン中のユーザーがいいね済みか", example = "true")
    private boolean likedByCurrentUser;
}
