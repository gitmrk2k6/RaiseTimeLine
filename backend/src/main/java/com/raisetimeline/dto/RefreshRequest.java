package com.raisetimeline.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(description = "トークン再発行リクエスト")
public class RefreshRequest {

    @Schema(description = "リフレッシュトークン", example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
    @NotBlank(message = "リフレッシュトークンを入力してください")
    private String refreshToken;
}
