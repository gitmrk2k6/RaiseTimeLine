package com.raisetimeline.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(description = "ログインリクエスト")
public class LoginRequest {

    @Schema(description = "メールアドレス", example = "yamada@example.com")
    @NotBlank(message = "メールアドレスは必須です")
    @Email(message = "メールアドレスの形式が正しくありません")
    private String email;

    @Schema(description = "パスワード", example = "Password1")
    @NotBlank(message = "パスワードは必須です")
    private String password;
}
