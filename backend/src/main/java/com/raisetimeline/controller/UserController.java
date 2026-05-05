package com.raisetimeline.controller;

import com.raisetimeline.dto.PostResponse;
import com.raisetimeline.dto.UserResponse;
import com.raisetimeline.entity.User;
import com.raisetimeline.service.FollowService;
import com.raisetimeline.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final FollowService followService;

    @GetMapping
    public ResponseEntity<List<UserResponse>> search(
            @RequestParam String username,
            Authentication auth) {
        User user = (User) auth.getPrincipal();
        return ResponseEntity.ok(userService.search(username, user.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getProfile(
            @PathVariable Long id,
            Authentication auth) {
        User user = (User) auth.getPrincipal();
        return ResponseEntity.ok(userService.getProfile(id, user.getId()));
    }

    @GetMapping("/{id}/posts")
    public ResponseEntity<List<PostResponse>> getUserPosts(
            @PathVariable Long id,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime before,
            @RequestParam(defaultValue = "20") int limit,
            Authentication auth) {
        User user = (User) auth.getPrincipal();
        return ResponseEntity.ok(userService.getUserPosts(id, user.getId(), before, limit));
    }

    @GetMapping("/{id}/followers")
    public ResponseEntity<List<UserResponse>> getFollowers(
            @PathVariable Long id,
            Authentication auth) {
        User user = (User) auth.getPrincipal();
        return ResponseEntity.ok(followService.getFollowers(id, user.getId()));
    }

    @GetMapping("/{id}/following")
    public ResponseEntity<List<UserResponse>> getFollowing(
            @PathVariable Long id,
            Authentication auth) {
        User user = (User) auth.getPrincipal();
        return ResponseEntity.ok(followService.getFollowing(id, user.getId()));
    }
}
