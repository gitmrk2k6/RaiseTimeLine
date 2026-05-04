package com.raisetimeline.service;

import com.raisetimeline.dto.AuthResponse;
import com.raisetimeline.dto.LoginRequest;
import com.raisetimeline.dto.RegisterRequest;
import com.raisetimeline.entity.User;
import com.raisetimeline.exception.DuplicateResourceException;
import com.raisetimeline.repository.UserRepository;
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

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException(
                    "このメールアドレスはすでに使用されています", "email");
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException(
                    "このユーザー名はすでに使用されています", "username");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordDigest(passwordEncoder.encode(request.getPassword()))
                .build();
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getId(), user.getEmail());
        return new AuthResponse(token, user.getId(), user.getUsername(), user.getEmail());
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow();

        String token = jwtUtil.generateToken(user.getId(), user.getEmail());
        return new AuthResponse(token, user.getId(), user.getUsername(), user.getEmail());
    }
}
