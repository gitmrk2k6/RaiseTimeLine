package com.raisetimeline.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PostRequest {

    @NotBlank(message = "投稿内容は必須です")
    @Size(max = 280, message = "投稿は280文字以内で入力してください")
    private String content;
}
