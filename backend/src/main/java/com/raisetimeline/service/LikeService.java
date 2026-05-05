package com.raisetimeline.service;

import com.raisetimeline.dto.LikeResponse;
import com.raisetimeline.entity.Like;
import com.raisetimeline.entity.User;
import com.raisetimeline.mapper.LikeMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LikeService {

    private final LikeMapper likeMapper;

    @Transactional
    public LikeResponse like(Long postId) {
        Long currentUserId = getCurrentUserId();
        try {
            likeMapper.insert(Like.builder().postId(postId).userId(currentUserId).build());
        } catch (DuplicateKeyException e) {
            // 既にいいね済み — 冪等に処理
        }
        return buildResponse(postId, currentUserId);
    }

    @Transactional
    public LikeResponse unlike(Long postId) {
        Long currentUserId = getCurrentUserId();
        likeMapper.delete(postId, currentUserId);
        return buildResponse(postId, currentUserId);
    }

    private LikeResponse buildResponse(Long postId, Long userId) {
        long count = likeMapper.countByPostId(postId);
        boolean liked = likeMapper.existsByPostIdAndUserId(postId, userId);
        return new LikeResponse(postId, count, liked);
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = (User) auth.getPrincipal();
        return user.getId();
    }
}
