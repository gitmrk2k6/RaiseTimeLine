package com.raisetimeline.mapper;

import com.raisetimeline.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * UserMapper テスト（グレーボックス）
 *
 * テスト技法: グレーボックス（DB スキーマの UNIQUE 制約を知った上でテストを設計）
 *
 * 使用技術:
 *   @SpringBootTest: 全アプリケーションコンテキストを起動
 *   Testcontainers JDBC URL (jdbc:tc:postgresql:17:///): 自動的に PostgreSQL コンテナを起動
 *   Flyway: テーブルスキーマを自動マイグレーション
 *   @Transactional: テストごとにロールバックしてデータを分離
 *
 * 確認するポイント:
 *   - INSERT → SELECT が正しく動くこと（SQL の正確性）
 *   - UNIQUE 制約が機能すること（スキーマの正確性）
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("UserMapper テスト（Testcontainers）")
class UserMapperTest {

    @Autowired
    private UserMapper userMapper;

    // ─────────────────────────────────────────────
    // insert / findByEmail / findById
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("UMAP-01: insert → findByEmail でレコードを取得できる（正常系）")
    void insertAndFindByEmail() {
        User user = buildUser("testuser", "test@example.com");
        userMapper.insert(user);

        Optional<User> found = userMapper.findByEmail("test@example.com");

        assertThat(found).isPresent();
        assertThat(found.get().getUsername()).isEqualTo("testuser");
        assertThat(found.get().getId()).isNotNull();
    }

    @Test
    @DisplayName("UMAP-02: insert → findById でレコードを取得できる（正常系）")
    void insertAndFindById() {
        User user = buildUser("testuser2", "test2@example.com");
        userMapper.insert(user);

        Optional<User> found = userMapper.findById(user.getId());

        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("test2@example.com");
    }

    // ─────────────────────────────────────────────
    // existsByEmail / existsByUsername
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("UMAP-03: existsByEmail: 存在するメール → true（正常系）")
    void existsByEmailTrue() {
        userMapper.insert(buildUser("user3", "exists@example.com"));

        assertThat(userMapper.existsByEmail("exists@example.com")).isTrue();
    }

    @Test
    @DisplayName("UMAP-04: existsByEmail: 存在しないメール → false（正常系）")
    void existsByEmailFalse() {
        assertThat(userMapper.existsByEmail("notexists@example.com")).isFalse();
    }

    @Test
    @DisplayName("UMAP-05: existsByUsername: 存在するユーザー名 → true（正常系）")
    void existsByUsernameTrue() {
        userMapper.insert(buildUser("existinguser", "any@example.com"));

        assertThat(userMapper.existsByUsername("existinguser")).isTrue();
    }

    // ─────────────────────────────────────────────
    // UNIQUE 制約（グレーボックス: スキーマ知識を使用）
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("UMAP-06: 同一メールで2回 insert → DataIntegrityViolationException（UNIQUE 制約）")
    void insertDuplicateEmailThrows() {
        userMapper.insert(buildUser("user_a", "duplicate@example.com"));

        assertThatThrownBy(() ->
                userMapper.insert(buildUser("user_b", "duplicate@example.com"))
        ).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("UMAP-07: 同一ユーザー名で2回 insert → DataIntegrityViolationException（UNIQUE 制約）")
    void insertDuplicateUsernameThrows() {
        userMapper.insert(buildUser("dupname", "a@example.com"));

        assertThatThrownBy(() ->
                userMapper.insert(buildUser("dupname", "b@example.com"))
        ).isInstanceOf(DataIntegrityViolationException.class);
    }

    // ─────────────────────────────────────────────
    // ヘルパー
    // ─────────────────────────────────────────────
    private User buildUser(String username, String email) {
        return User.builder()
                .username(username)
                .email(email)
                .passwordDigest("encoded-password")
                .build();
    }
}
