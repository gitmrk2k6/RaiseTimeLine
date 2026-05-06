package com.raisetimeline.controller;

import com.raisetimeline.dto.FollowResponse;
import com.raisetimeline.entity.User;
import com.raisetimeline.service.FollowService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users/{id}/follow")
@RequiredArgsConstructor
@Tag(name = "Follow", description = "フォロー API")
public class FollowController {

    private final FollowService followService;

    @Operation(summary = "Follow user", description = "指定ユーザーをフォローします")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "フォロー成功",
                    content = @Content(schema = @Schema(implementation = FollowResponse.class))),
            @ApiResponse(responseCode = "404", description = "ユーザーが見つからない", content = @Content)
    })
    @PostMapping
    public ResponseEntity<FollowResponse> follow(
            @Parameter(description = "フォローするユーザーの ID") @PathVariable Long id,
            Authentication auth) {
        User user = (User) auth.getPrincipal();
        return ResponseEntity.ok(followService.follow(id, user.getId()));
    }

    @Operation(summary = "Unfollow user", description = "指定ユーザーのフォローを解除します")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "フォロー解除成功",
                    content = @Content(schema = @Schema(implementation = FollowResponse.class))),
            @ApiResponse(responseCode = "404", description = "ユーザーが見つからない", content = @Content)
    })
    @DeleteMapping
    public ResponseEntity<FollowResponse> unfollow(
            @Parameter(description = "フォロー解除するユーザーの ID") @PathVariable Long id,
            Authentication auth) {
        User user = (User) auth.getPrincipal();
        return ResponseEntity.ok(followService.unfollow(id, user.getId()));
    }
}
