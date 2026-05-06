package com.raisetimeline.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "投稿リクエスト")
public class PostRequest {

    @Schema(description = "投稿テキスト (最大 280 文字)", example = "今日も頑張ります！")
    @NotBlank(message = "投稿内容は必須です")
    @Size(max = 280, message = "投稿は280文字以内で入力してください")
    private String content;
}
