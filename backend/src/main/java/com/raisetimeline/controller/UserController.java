package com.raisetimeline.controller;

import com.raisetimeline.dto.PostResponse;
import com.raisetimeline.dto.UserResponse;
import com.raisetimeline.entity.User;
import com.raisetimeline.service.FollowService;
import com.raisetimeline.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User", description = "ユーザー API")
public class UserController {

    private final UserService userService;
    private final FollowService followService;

    @Operation(summary = "Search users", description = "ユーザー名の部分一致でユーザーを検索します")
    @ApiResponse(responseCode = "200", description = "検索成功")
    @GetMapping
    public ResponseEntity<List<UserResponse>> search(
            @Parameter(description = "検索するユーザー名 (部分一致)", required = true)
            @RequestParam String username,
            Authentication auth) {
        User user = (User) auth.getPrincipal();
        return ResponseEntity.ok(userService.search(username, user.getId()));
    }

    @Operation(summary = "Get user profile", description = "指定ユーザーのプロフィールを取得します")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "取得成功",
                    content = @Content(schema = @Schema(implementation = UserResponse.class))),
            @ApiResponse(responseCode = "404", description = "ユーザーが見つからない", content = @Content)
    })
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getProfile(
            @Parameter(description = "ユーザー ID") @PathVariable Long id,
            Authentication auth) {
        User user = (User) auth.getPrincipal();
        return ResponseEntity.ok(userService.getProfile(id, user.getId()));
    }

    @Operation(summary = "Get user posts", description = "指定ユーザーの投稿一覧を取得します")
    @ApiResponse(responseCode = "200", description = "取得成功")
    @GetMapping("/{id}/posts")
    public ResponseEntity<List<PostResponse>> getUserPosts(
            @Parameter(description = "ユーザー ID") @PathVariable Long id,
            @Parameter(description = "カーソルページング用の基準日時 (ISO 8601)")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime before,
            @Parameter(description = "取得件数 (デフォルト: 20)")
            @RequestParam(defaultValue = "20") int limit,
            Authentication auth) {
        User user = (User) auth.getPrincipal();
        return ResponseEntity.ok(userService.getUserPosts(id, user.getId(), before, limit));
    }

    @Operation(summary = "Get followers", description = "指定ユーザーのフォロワー一覧を取得します")
    @ApiResponse(responseCode = "200", description = "取得成功")
    @GetMapping("/{id}/followers")
    public ResponseEntity<List<UserResponse>> getFollowers(
            @Parameter(description = "ユーザー ID") @PathVariable Long id,
            Authentication auth) {
        User user = (User) auth.getPrincipal();
        return ResponseEntity.ok(followService.getFollowers(id, user.getId()));
    }

    @Operation(summary = "Get following", description = "指定ユーザーがフォロー中のユーザー一覧を取得します")
    @ApiResponse(responseCode = "200", description = "取得成功")
    @GetMapping("/{id}/following")
    public ResponseEntity<List<UserResponse>> getFollowing(
            @Parameter(description = "ユーザー ID") @PathVariable Long id,
            Authentication auth) {
        User user = (User) auth.getPrincipal();
        return ResponseEntity.ok(followService.getFollowing(id, user.getId()));
    }

    @Operation(summary = "Update my profile", description = "自分のプロフィール (ユーザー名・自己紹介・アイコン画像) を更新します")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "更新成功",
                    content = @Content(schema = @Schema(implementation = UserResponse.class))),
            @ApiResponse(responseCode = "400", description = "入力値エラー", content = @Content)
    })
    @PutMapping(value = "/me", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserResponse> updateProfile(
            @Parameter(description = "新しいユーザー名 (1〜50 文字)", required = true)
            @RequestParam String username,
            @Parameter(description = "自己紹介文 (任意)")
            @RequestParam(required = false) String bio,
            @Parameter(description = "プロフィール画像ファイル (JPEG/PNG、任意)")
            @RequestPart(value = "image", required = false) MultipartFile image,
            Authentication auth) {
        User user = (User) auth.getPrincipal();
        return ResponseEntity.ok(userService.updateProfile(user.getId(), username, bio, image));
    }
}
