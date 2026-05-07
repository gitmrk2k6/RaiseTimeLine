package com.raisetimeline.unit.service;

import com.raisetimeline.dto.AuthResponse;
import com.raisetimeline.dto.LoginRequest;
import com.raisetimeline.dto.RefreshRequest;
import com.raisetimeline.dto.RegisterRequest;
import com.raisetimeline.entity.User;
import com.raisetimeline.exception.DuplicateResourceException;
import com.raisetimeline.mapper.UserMapper;
import com.raisetimeline.security.JwtUtil;
import com.raisetimeline.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * AuthService ユニットテスト
 *
 * テスト技法:
 *   register(): 同値分割（有効クラス/無効クラス）、ホワイトボックス（パスワードエンコード確認）
 *   login():    同値分割（有効/無効認証情報）
 *   refresh():  分岐網羅（isRefreshToken の true/false 分岐、findById の存在/不在）
 *
 * 依存はすべて @Mock で差し替え。外部 DB・JWT ライブラリに依存しない純粋な単体テスト。
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService ユニットテスト")
class AuthServiceTest {

    @Mock private UserMapper userMapper;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtUtil jwtUtil;
    @Mock private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthService authService;

    // テストデータ
    private User savedUser;

    @BeforeEach
    void setUp() {
        savedUser = User.builder()
                .id(1L)
                .username("testuser")
                .email("test@example.com")
                .passwordDigest("encoded-password")
                .build();

        // JwtUtil のデフォルトスタブ（全テストで共通）
        // lenient: 例外を投げる異常系テストでは呼ばれないため、厳格モードの未使用スタブ検出を回避する
        lenient().when(jwtUtil.generateAccessToken(anyLong(), anyString())).thenReturn("mock-access-token");
        lenient().when(jwtUtil.generateRefreshToken(anyLong(), anyString())).thenReturn("mock-refresh-token");
    }

    // ─────────────────────────────────────────────
    // register()
    // ─────────────────────────────────────────────
    @Nested
    @DisplayName("register()")
    class Register {

        @Test
        @DisplayName("AUTH-U-01: 新規ユーザー登録（正常系） → AuthResponse を返す")
        void registerSuccess() {
            // テスト技法: 同値分割（有効クラス）
            RegisterRequest req = buildRegisterRequest("testuser", "test@example.com", "Password1");
            when(userMapper.existsByEmail("test@example.com")).thenReturn(false);
            when(userMapper.existsByUsername("testuser")).thenReturn(false);
            when(passwordEncoder.encode("Password1")).thenReturn("encoded-password");

            // insert() は void なので実行後にユーザーIDをセットするスタブが必要
            doAnswer(invocation -> {
                User u = invocation.getArgument(0);
                u.setId(1L);
                return null;
            }).when(userMapper).insert(any(User.class));

            AuthResponse response = authService.register(req);

            assertThat(response.getAccessToken()).isEqualTo("mock-access-token");
            assertThat(response.getRefreshToken()).isEqualTo("mock-refresh-token");
        }

        @Test
        @DisplayName("AUTH-U-02: 既存メールで登録 → DuplicateResourceException(field=email)（同値分割・無効クラス）")
        void registerDuplicateEmail() {
            RegisterRequest req = buildRegisterRequest("newuser", "duplicate@example.com", "Password1");
            when(userMapper.existsByEmail("duplicate@example.com")).thenReturn(true);

            assertThatThrownBy(() -> authService.register(req))
                    .isInstanceOf(DuplicateResourceException.class)
                    .satisfies(ex -> {
                        DuplicateResourceException dre = (DuplicateResourceException) ex;
                        assertThat(dre.getField()).isEqualTo("email");
                    });

            // insert が呼ばれないことを確認（ホワイトボックス）
            verify(userMapper, never()).insert(any());
        }

        @Test
        @DisplayName("AUTH-U-03: 既存ユーザー名で登録 → DuplicateResourceException(field=username)（同値分割・無効クラス）")
        void registerDuplicateUsername() {
            RegisterRequest req = buildRegisterRequest("duplicate", "new@example.com", "Password1");
            when(userMapper.existsByEmail("new@example.com")).thenReturn(false);
            when(userMapper.existsByUsername("duplicate")).thenReturn(true);

            assertThatThrownBy(() -> authService.register(req))
                    .isInstanceOf(DuplicateResourceException.class)
                    .satisfies(ex -> {
                        DuplicateResourceException dre = (DuplicateResourceException) ex;
                        assertThat(dre.getField()).isEqualTo("username");
                    });

            verify(userMapper, never()).insert(any());
        }

        @Test
        @DisplayName("AUTH-U-04: 登録時にパスワードがエンコードされる（ホワイトボックス）")
        void passwordIsEncoded() {
            RegisterRequest req = buildRegisterRequest("testuser", "test@example.com", "Password1");
            when(userMapper.existsByEmail(anyString())).thenReturn(false);
            when(userMapper.existsByUsername(anyString())).thenReturn(false);
            when(passwordEncoder.encode("Password1")).thenReturn("encoded-password");
            doAnswer(invocation -> {
                User u = invocation.getArgument(0);
                u.setId(1L);
                return null;
            }).when(userMapper).insert(any(User.class));

            authService.register(req);

            // passwordEncoder.encode() が平文パスワードで呼ばれたことを確認
            verify(passwordEncoder).encode("Password1");
        }
    }

    // ─────────────────────────────────────────────
    // login()
    // ─────────────────────────────────────────────
    @Nested
    @DisplayName("login()")
    class Login {

        @Test
        @DisplayName("AUTH-U-05: 正しい認証情報でログイン → AuthResponse を返す（正常系）")
        void loginSuccess() {
            // テスト技法: 同値分割（有効クラス）
            LoginRequest req = buildLoginRequest("test@example.com", "Password1");
            when(userMapper.findByEmail("test@example.com")).thenReturn(Optional.of(savedUser));

            AuthResponse response = authService.login(req);

            assertThat(response.getAccessToken()).isEqualTo("mock-access-token");
            assertThat(response.getUserId()).isEqualTo(1L);
            verify(authenticationManager).authenticate(
                    new UsernamePasswordAuthenticationToken("test@example.com", "Password1")
            );
        }

        @Test
        @DisplayName("AUTH-U-06: 誤パスワードでログイン → BadCredentialsException が伝播（同値分割・無効クラス）")
        void loginBadCredentials() {
            LoginRequest req = buildLoginRequest("test@example.com", "WrongPassword");
            when(authenticationManager.authenticate(any()))
                    .thenThrow(new BadCredentialsException("Bad credentials"));

            assertThatThrownBy(() -> authService.login(req))
                    .isInstanceOf(BadCredentialsException.class);

            // findByEmail は呼ばれない（認証失敗で早期リターン）
            verify(userMapper, never()).findByEmail(anyString());
        }
    }

    // ─────────────────────────────────────────────
    // refresh()
    // ─────────────────────────────────────────────
    @Nested
    @DisplayName("refresh()")
    class Refresh {

        @Test
        @DisplayName("AUTH-U-07: 有効なリフレッシュトークン → 新しい AuthResponse を返す（分岐網羅: isRefreshToken=true）")
        void refreshSuccess() {
            RefreshRequest req = buildRefreshRequest("valid-refresh-token");
            when(jwtUtil.isRefreshToken("valid-refresh-token")).thenReturn(true);
            when(jwtUtil.extractUserId("valid-refresh-token")).thenReturn(1L);
            when(userMapper.findById(1L)).thenReturn(Optional.of(savedUser));

            AuthResponse response = authService.refresh(req);

            assertThat(response.getAccessToken()).isEqualTo("mock-access-token");
            assertThat(response.getRefreshToken()).isEqualTo("mock-refresh-token");
        }

        @Test
        @DisplayName("AUTH-U-08: アクセストークンをリフレッシュとして送る → IllegalArgumentException（分岐網羅: isRefreshToken=false）")
        void refreshWithAccessToken() {
            // テスト技法: 分岐網羅（isRefreshToken が false の分岐）
            RefreshRequest req = buildRefreshRequest("some-access-token");
            when(jwtUtil.isRefreshToken("some-access-token")).thenReturn(false);

            assertThatThrownBy(() -> authService.refresh(req))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("無効なリフレッシュトークン");
        }

        @Test
        @DisplayName("AUTH-U-09: 存在しない userId のトークン → IllegalArgumentException（分岐網羅: findById empty）")
        void refreshUserNotFound() {
            RefreshRequest req = buildRefreshRequest("valid-refresh-token");
            when(jwtUtil.isRefreshToken("valid-refresh-token")).thenReturn(true);
            when(jwtUtil.extractUserId("valid-refresh-token")).thenReturn(999L);
            when(userMapper.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.refresh(req))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("ユーザーが見つかりません");
        }
    }

    // ─────────────────────────────────────────────
    // ヘルパーメソッド
    // ─────────────────────────────────────────────
    private RegisterRequest buildRegisterRequest(String username, String email, String password) {
        RegisterRequest req = new RegisterRequest();
        req.setUsername(username);
        req.setEmail(email);
        req.setPassword(password);
        return req;
    }

    private LoginRequest buildLoginRequest(String email, String password) {
        LoginRequest req = new LoginRequest();
        req.setEmail(email);
        req.setPassword(password);
        return req;
    }

    private RefreshRequest buildRefreshRequest(String token) {
        RefreshRequest req = new RefreshRequest();
        req.setRefreshToken(token);
        return req;
    }
}
