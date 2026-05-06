package com.raisetimeline.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "フォローレスポンス")
public class FollowResponse {

    @Schema(description = "対象ユーザーの ID", example = "2")
    private Long userId;

    @Schema(description = "対象ユーザーの現在のフォロワー数", example = "100")
    private long followerCount;

    @Schema(description = "現在ログイン中のユーザーがフォロー済みか", example = "true")
    @JsonProperty("isFollowing")
    private boolean isFollowing;
}
