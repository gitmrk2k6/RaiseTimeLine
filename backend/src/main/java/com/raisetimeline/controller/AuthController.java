package com.raisetimeline.controller;

import com.raisetimeline.dto.AuthResponse;
import com.raisetimeline.dto.LoginRequest;
import com.raisetimeline.dto.RefreshRequest;
import com.raisetimeline.dto.RegisterRequest;
import com.raisetimeline.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "認証・認可 API")
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "Register new user", description = "新規ユーザーを登録しアクセストークンを返します")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "登録成功",
                    content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "400", description = "入力値エラー", content = @Content),
            @ApiResponse(responseCode = "409", description = "メールアドレスまたはユーザー名が既に使用済み", content = @Content)
    })
    @SecurityRequirements
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @Operation(summary = "Login", description = "メールアドレスとパスワードでログインしトークンを返します")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "ログイン成功",
                    content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "401", description = "認証失敗", content = @Content)
    })
    @SecurityRequirements
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @Operation(summary = "Refresh token", description = "リフレッシュトークンを使ってアクセストークンを再発行します")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "トークン再発行成功",
                    content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "401", description = "リフレッシュトークンが無効または期限切れ", content = @Content)
    })
    @SecurityRequirements
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        return ResponseEntity.ok(authService.refresh(request));
    }
}
