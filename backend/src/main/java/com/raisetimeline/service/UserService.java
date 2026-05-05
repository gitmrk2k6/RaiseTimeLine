package com.raisetimeline.service;

import com.raisetimeline.dto.PostResponse;
import com.raisetimeline.dto.UserResponse;
import com.raisetimeline.mapper.PostMapper;
import com.raisetimeline.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserMapper userMapper;
    private final PostMapper postMapper;

    public List<UserResponse> search(String query, Long currentUserId) {
        return userMapper.searchByUsername(query, currentUserId);
    }

    public UserResponse getProfile(Long userId, Long currentUserId) {
        UserResponse profile = userMapper.findProfileById(userId, currentUserId);
        if (profile == null) {
            throw new IllegalArgumentException("ユーザーが見つかりません");
        }
        return profile;
    }

    public List<PostResponse> getUserPosts(Long userId, Long currentUserId,
                                           LocalDateTime before, int limit) {
        return postMapper.findByUserId(userId, before, limit, currentUserId);
    }
}
