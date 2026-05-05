package com.raisetimeline.controller;

import com.raisetimeline.dto.FollowResponse;
import com.raisetimeline.entity.User;
import com.raisetimeline.service.FollowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users/{id}/follow")
@RequiredArgsConstructor
public class FollowController {

    private final FollowService followService;

    @PostMapping
    public ResponseEntity<FollowResponse> follow(
            @PathVariable Long id,
            Authentication auth) {
        User user = (User) auth.getPrincipal();
        return ResponseEntity.ok(followService.follow(id, user.getId()));
    }

    @DeleteMapping
    public ResponseEntity<FollowResponse> unfollow(
            @PathVariable Long id,
            Authentication auth) {
        User user = (User) auth.getPrincipal();
        return ResponseEntity.ok(followService.unfollow(id, user.getId()));
    }
}
