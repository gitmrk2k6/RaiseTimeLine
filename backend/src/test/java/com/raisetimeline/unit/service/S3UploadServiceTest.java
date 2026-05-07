package com.raisetimeline.unit.service;

import com.raisetimeline.service.S3UploadService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * S3UploadService ユニットテスト
 *
 * テスト技法: 境界値分析 + 同値分割（ブラックボックス）
 *
 * 境界値:
 *   ファイルサイズ: 5MB (5*1024*1024 bytes) → 有効 / 5MB+1 byte → 無効
 *
 * 同値分割:
 *   有効クラス:  ContentType ∈ {"image/jpeg", "image/png", "image/gif"}
 *   無効クラス:  ContentType ∈ {"image/bmp", null, 未知の形式}
 *
 * ホワイトボックス（分岐網羅）:
 *   bucket が空文字 → ローカル保存（saveLocally()）分岐
 *   bucket が非空   → S3アップロード（uploadToS3()）分岐 ※本テストでは bucket="" のみテスト
 *
 * @Value フィールドは Spring コンテキスト不要なため ReflectionTestUtils で注入する。
 */
@DisplayName("S3UploadService ユニットテスト")
class S3UploadServiceTest {

    private static final long MAX_SIZE = 5L * 1024 * 1024; // 5MB

    private S3UploadService s3UploadService;

    @BeforeEach
    void setUp() {
        s3UploadService = new S3UploadService();
        // @Value フィールドを ReflectionTestUtils で注入（Spring コンテキスト不要）
        ReflectionTestUtils.setField(s3UploadService, "bucket", "");
        ReflectionTestUtils.setField(s3UploadService, "region", "ap-northeast-1");
        ReflectionTestUtils.setField(s3UploadService, "localBaseUrl", "http://localhost:8080");
    }

    // ─────────────────────────────────────────────
    // ファイルサイズの境界値テスト
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("S3-U-01: JPEG、5MB ちょうど → 成功（境界値: 上限ちょうど）")
    void uploadJpegExactly5MB() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.jpg", "image/jpeg", new byte[(int) MAX_SIZE]);

        String url = s3UploadService.upload(file);

        assertThat(url).contains("/api/files/");
    }

    @Test
    @DisplayName("S3-U-02: JPEG、5MB+1byte → IllegalArgumentException（境界値: 上限超過）")
    void uploadJpegOver5MB() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.jpg", "image/jpeg", new byte[(int) MAX_SIZE + 1]);

        assertThatThrownBy(() -> s3UploadService.upload(file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("5MB以下");
    }

    // ─────────────────────────────────────────────
    // ContentType の同値分割テスト
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("S3-U-03: ContentType=image/bmp → IllegalArgumentException（同値分割: 無効クラス）")
    void uploadBmpIsRejected() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.bmp", "image/bmp", new byte[100]);

        assertThatThrownBy(() -> s3UploadService.upload(file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("JPEG・PNG・GIF");
    }

    @Test
    @DisplayName("S3-U-04: ContentType=image/png → 成功（同値分割: 有効クラス）")
    void uploadPngIsAccepted() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.png", "image/png", new byte[100]);

        String url = s3UploadService.upload(file);

        assertThat(url).contains("/api/files/");
        assertThat(url).endsWith(".png");
    }

    @Test
    @DisplayName("S3-U-05: ContentType=image/gif → 成功（同値分割: 有効クラス）")
    void uploadGifIsAccepted() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.gif", "image/gif", new byte[100]);

        String url = s3UploadService.upload(file);

        assertThat(url).contains("/api/files/");
        assertThat(url).endsWith(".gif");
    }

    @Test
    @DisplayName("S3-U-06: ContentType=null → IllegalArgumentException（同値分割: 無効クラス）")
    void uploadNullContentType() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.jpg", null, new byte[100]);

        assertThatThrownBy(() -> s3UploadService.upload(file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("JPEG・PNG・GIF");
    }

    // ─────────────────────────────────────────────
    // ホワイトボックス: ローカル保存分岐
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("S3-U-07: bucket=空文字 → ローカル保存モード（分岐網羅: saveLocally() 分岐）")
    void uploadToLocalWhenBucketIsBlank() {
        // bucket="" はセットアップ済み
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.jpg", "image/jpeg", new byte[100]);

        String url = s3UploadService.upload(file);

        // ローカル保存の URL パターンを確認
        assertThat(url).startsWith("http://localhost:8080/api/files/");
        assertThat(url).endsWith(".jpg");
    }
}
