package com.raisetimeline.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "ユーザーレスポンス")
public class UserResponse {

    @Schema(description = "ユーザー ID", example = "1")
    private Long id;

    @Schema(description = "ユーザー名", example = "yamada_taro")
    private String username;

    @Schema(description = "プロフィール画像 URL (未設定の場合は null)", nullable = true, example = "https://example.com/image.jpg")
    private String profileImageUrl;

    @Schema(description = "自己紹介文 (未設定の場合は null)", nullable = true, example = "よろしくお願いします！")
    private String bio;

    @Schema(description = "フォロワー数", example = "42")
    private long followerCount;

    @Schema(description = "フォロー中のユーザー数", example = "10")
    private long followingCount;

    @Schema(description = "現在ログイン中のユーザーがフォロー済みか", example = "false")
    @JsonProperty("isFollowing")
    private boolean isFollowing;
}
