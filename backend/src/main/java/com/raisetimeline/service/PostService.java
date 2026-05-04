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

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostMapper postMapper;
    private final PostSseService postSseService;

    public List<PostResponse> getTimeline(LocalDateTime before, int limit) {
        return postMapper.findAll(before, limit);
    }

    @Transactional
    public PostResponse createPost(PostRequest request) {
        Long currentUserId = getCurrentUserId();
        Post post = Post.builder()
                .userId(currentUserId)
                .content(request.getContent())
                .build();
        postMapper.insert(post);
        PostResponse response = postMapper.findByIdWithUser(post.getId());
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
        return postMapper.findByIdWithUser(id);
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
