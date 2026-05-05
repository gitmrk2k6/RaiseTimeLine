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
public class Follow {
    private Long id;
    private Long followerId;
    private Long followingId;
    private LocalDateTime createdAt;
}
