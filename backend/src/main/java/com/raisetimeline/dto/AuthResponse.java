package com.raisetimeline.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
@Schema(description = "認証レスポンス")
public class AuthResponse {

    @Schema(description = "JWT アクセストークン (有効期限 15 分)", example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
    private String accessToken;

    @Schema(description = "リフレッシュトークン (有効期限 7 日)", example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
    private String refreshToken;

    @Schema(description = "ユーザー ID", example = "1")
    private Long userId;

    @Schema(description = "ユーザー名", example = "yamada_taro")
    private String username;

    @Schema(description = "メールアドレス", example = "yamada@example.com")
    private String email;
}
