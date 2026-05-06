package com.raisetimeline.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
@Schema(description = "ユーザー登録リクエスト")
public class RegisterRequest {

    @Schema(description = "ユーザー名 (1〜50 文字)", example = "yamada_taro")
    @NotBlank(message = "ユーザー名は必須です")
    @Size(min = 1, max = 50, message = "ユーザー名は1〜50文字で入力してください")
    private String username;

    @Schema(description = "メールアドレス", example = "yamada@example.com")
    @NotBlank(message = "メールアドレスは必須です")
    @Email(message = "メールアドレスの形式が正しくありません")
    @Size(max = 255)
    private String email;

    @Schema(description = "パスワード (8 文字以上、英字と数字を両方含む)", example = "Password1")
    @NotBlank(message = "パスワードは必須です")
    @Size(min = 8, message = "パスワードは8文字以上で入力してください")
    @Pattern(
        regexp = "^(?=.*[a-zA-Z])(?=.*\\d).+$",
        message = "パスワードは英字と数字を両方含む必要があります"
    )
    private String password;
}
