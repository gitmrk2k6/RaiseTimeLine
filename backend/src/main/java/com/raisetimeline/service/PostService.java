package com.raisetimeline.service;

import com.raisetimeline.dto.PostRequest;
import com.raisetimeline.dto.PostResponse;
import com.raisetimeline.entity.Post;
import com.raisetimeline.entity.User;
import com.raisetimeline.exception.ForbiddenException;
import com.raisetimeline.mapper.PostMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostMapper postMapper;
    private final PostSseService postSseService;
    private final S3UploadService s3UploadService;

    public List<PostResponse> getTimeline(LocalDateTime before, int limit, Long currentUserId) {
        return postMapper.findAll(before, limit, currentUserId);
    }

    @Transactional
    public PostResponse createPost(String content, MultipartFile image) {
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("投稿内容は必須です");
        }
        if (content.length() > 280) {
            throw new IllegalArgumentException("投稿は280文字以内で入力してください");
        }
        Long currentUserId = getCurrentUserId();
        String imageUrl = (image != null && !image.isEmpty()) ? s3UploadService.upload(image) : null;
        Post post = Post.builder()
                .userId(currentUserId)
                .content(content)
                .imageUrl(imageUrl)
                .build();
        postMapper.insert(post);
        PostResponse response = postMapper.findByIdWithUser(post.getId(), currentUserId);
        postSseService.broadcast(response);
        return response;
    }

    @Transactional
    public PostResponse updatePost(Long id, PostRequest request) {
        Long currentUserId = getCurrentUserId();
        Post post = postMapper.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("投稿が見つかりません"));
        if (!post.getUserId().equals(currentUserId)) {
            throw new ForbiddenException("この投稿を編集する権限がありません");
        }
        post.setContent(request.getContent());
        postMapper.update(post);
        return postMapper.findByIdWithUser(id, currentUserId);
    }

    @Transactional
    public void deletePost(Long id) {
        Long currentUserId = getCurrentUserId();
        Post post = postMapper.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("投稿が見つかりません"));
        if (!post.getUserId().equals(currentUserId)) {
            throw new ForbiddenException("この投稿を削除する権限がありません");
        }
        postMapper.delete(id);
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = (User) auth.getPrincipal();
        return user.getId();
    }
}
