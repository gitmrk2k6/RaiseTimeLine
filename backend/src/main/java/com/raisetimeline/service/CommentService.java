package com.raisetimeline.service;

import com.raisetimeline.dto.CommentRequest;
import com.raisetimeline.dto.CommentResponse;
import com.raisetimeline.entity.Comment;
import com.raisetimeline.entity.User;
import com.raisetimeline.exception.ForbiddenException;
import com.raisetimeline.mapper.CommentMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentMapper commentMapper;

    public List<CommentResponse> getComments(Long postId) {
        return commentMapper.findByPostId(postId);
    }

    @Transactional
    public CommentResponse createComment(Long postId, CommentRequest request) {
        Long currentUserId = getCurrentUserId();
        Comment comment = Comment.builder()
                .postId(postId)
                .userId(currentUserId)
                .content(request.getContent())
                .build();
        commentMapper.insert(comment);
        return commentMapper.findResponseById(comment.getId());
    }

    @Transactional
    public void deleteComment(Long postId, Long commentId) {
        Long currentUserId = getCurrentUserId();
        Comment comment = commentMapper.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("コメントが見つかりません"));
        if (!comment.getPostId().equals(postId)) {
            throw new IllegalArgumentException("コメントが見つかりません");
        }
        if (!comment.getUserId().equals(currentUserId)) {
            throw new ForbiddenException("このコメントを削除する権限がありません");
        }
        commentMapper.delete(commentId);
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = (User) auth.getPrincipal();
        return user.getId();
    }
}
