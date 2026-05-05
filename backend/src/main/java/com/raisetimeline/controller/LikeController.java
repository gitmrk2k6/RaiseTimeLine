package com.raisetimeline.controller;

import com.raisetimeline.dto.LikeResponse;
import com.raisetimeline.service.LikeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts/{postId}/likes")
@RequiredArgsConstructor
public class LikeController {

    private final LikeService likeService;

    @PostMapping
    public ResponseEntity<LikeResponse> like(@PathVariable Long postId) {
        return ResponseEntity.ok(likeService.like(postId));
    }

    @DeleteMapping
    public ResponseEntity<LikeResponse> unlike(@PathVariable Long postId) {
        return ResponseEntity.ok(likeService.unlike(postId));
    }
}
