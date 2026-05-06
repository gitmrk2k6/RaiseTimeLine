package com.raisetimeline.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "コメントリクエスト")
public class CommentRequest {

    @Schema(description = "コメントテキスト (最大 140 文字)", example = "素晴らしい投稿ですね！")
    @NotBlank(message = "コメント内容は必須です")
    @Size(max = 140, message = "コメントは140文字以内で入力してください")
    private String content;
}
