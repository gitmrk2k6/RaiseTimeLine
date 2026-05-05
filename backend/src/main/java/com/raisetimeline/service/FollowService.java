package com.raisetimeline.service;

import com.raisetimeline.dto.FollowResponse;
import com.raisetimeline.dto.UserResponse;
import com.raisetimeline.entity.Follow;
import com.raisetimeline.mapper.FollowMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class FollowService {

    private final FollowMapper followMapper;

    public FollowResponse follow(Long targetId, Long currentUserId) {
        if (targetId.equals(currentUserId)) {
            throw new IllegalArgumentException("自分自身をフォローできません");
        }
        try {
            followMapper.insert(Follow.builder()
                    .followerId(currentUserId)
                    .followingId(targetId)
                    .build());
        } catch (DuplicateKeyException ignored) {
            // すでにフォロー済み — 冪等に成功扱い
        }
        return buildResponse(targetId, currentUserId);
    }

    public FollowResponse unfollow(Long targetId, Long currentUserId) {
        followMapper.delete(currentUserId, targetId);
        return buildResponse(targetId, currentUserId);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getFollowers(Long userId, Long currentUserId) {
        return followMapper.findFollowers(userId, currentUserId);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getFollowing(Long userId, Long currentUserId) {
        return followMapper.findFollowing(userId, currentUserId);
    }

    private FollowResponse buildResponse(Long targetId, Long currentUserId) {
        long count = followMapper.countFollowers(targetId);
        boolean isFollowing = followMapper.exists(currentUserId, targetId);
        return new FollowResponse(targetId, count, isFollowing);
    }
}
