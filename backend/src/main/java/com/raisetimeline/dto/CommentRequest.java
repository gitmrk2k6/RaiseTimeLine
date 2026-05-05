package com.raisetimeline.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CommentRequest {

    @NotBlank(message = "コメント内容は必須です")
    @Size(max = 140, message = "コメントは140文字以内で入力してください")
    private String content;
}
