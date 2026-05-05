package com.raisetimeline.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LikeResponse {
    private Long postId;
    private long likeCount;
    private boolean likedByCurrentUser;
}
