package com.raisetimeline.service;

import com.raisetimeline.dto.AuthResponse;
import com.raisetimeline.dto.LoginRequest;
import com.raisetimeline.dto.RefreshRequest;
import com.raisetimeline.dto.RegisterRequest;
import com.raisetimeline.entity.User;
import com.raisetimeline.exception.DuplicateResourceException;
import com.raisetimeline.mapper.UserMapper;
import com.raisetimeline.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userMapper.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("このメールアドレスはすでに使用されています", "email");
        }
        if (userMapper.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("このユーザー名はすでに使用されています", "username");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordDigest(passwordEncoder.encode(request.getPassword()))
                .build();
        userMapper.insert(user);

        return buildAuthResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userMapper.findByEmail(request.getEmail()).orElseThrow();
        return buildAuthResponse(user);
    }

    public AuthResponse refresh(RefreshRequest request) {
        String refreshToken = request.getRefreshToken();
        if (!jwtUtil.isRefreshToken(refreshToken)) {
            throw new IllegalArgumentException("無効なリフレッシュトークンです");
        }

        Long userId = jwtUtil.extractUserId(refreshToken);
        User user = userMapper.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("ユーザーが見つかりません"));

        return buildAuthResponse(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getEmail());
        String refreshToken = jwtUtil.generateRefreshToken(user.getId(), user.getEmail());
        return new AuthResponse(accessToken, refreshToken, user.getId(), user.getUsername(), user.getEmail());
    }
}
