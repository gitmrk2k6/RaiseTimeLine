package com.raisetimeline.service;

import com.raisetimeline.dto.PostResponse;
import com.raisetimeline.dto.UserResponse;
import com.raisetimeline.mapper.PostMapper;
import com.raisetimeline.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserMapper userMapper;
    private final PostMapper postMapper;
    private final S3UploadService s3UploadService;

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

    public UserResponse updateProfile(Long userId, String username, MultipartFile image) {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("ユーザー名を入力してください");
        }
        if (username.length() > 50) {
            throw new IllegalArgumentException("ユーザー名は50文字以内で入力してください");
        }

        String currentImageUrl = userMapper.findProfileById(userId, userId).getProfileImageUrl();
        String imageUrl = (image != null && !image.isEmpty())
                ? s3UploadService.upload(image)
                : currentImageUrl;

        userMapper.updateProfile(userId, username.trim(), imageUrl);
        return userMapper.findProfileById(userId, userId);
    }
}
