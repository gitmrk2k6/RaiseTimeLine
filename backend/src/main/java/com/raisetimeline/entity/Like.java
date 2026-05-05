package com.raisetimeline.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Like {
    private Long id;
    private Long postId;
    private Long userId;
    private LocalDateTime createdAt;
}
