package com.raisetimeline.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RefreshRequest {
    @NotBlank(message = "リフレッシュトークンを入力してください")
    private String refreshToken;
}
