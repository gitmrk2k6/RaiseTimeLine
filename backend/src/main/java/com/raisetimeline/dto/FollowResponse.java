package com.raisetimeline.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FollowResponse {
    private Long userId;
    private long followerCount;
    @JsonProperty("isFollowing")
    private boolean isFollowing;
}
