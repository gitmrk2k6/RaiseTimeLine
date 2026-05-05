package com.raisetimeline.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String username;
    private String profileImageUrl;
    private long followerCount;
    private long followingCount;
    @JsonProperty("isFollowing")
    private boolean isFollowing;
}
