package com.raisetimeline.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class S3UploadService {

    private static final List<String> ALLOWED_TYPES = List.of("image/jpeg", "image/png", "image/gif");
    private static final long MAX_SIZE = 5 * 1024 * 1024; // 5MB

    private static final Path LOCAL_UPLOAD_DIR =
            Paths.get(System.getProperty("java.io.tmpdir"), "raisetimeline-uploads");

    @Value("${app.s3.bucket}")
    private String bucket;

    @Value("${app.s3.region}")
    private String region;

    @Value("${app.s3.local-base-url}")
    private String localBaseUrl;

    @Value("${app.s3.cloudfront-url:}")
    private String cloudfrontUrl;

    public String upload(MultipartFile file) {
        validate(file);
        if (bucket.isBlank()) {
            return saveLocally(file);
        }
        return uploadToS3(file);
    }

    private void validate(MultipartFile file) {
        if (file.getSize() > MAX_SIZE) {
            throw new IllegalArgumentException("画像は5MB以下にしてください");
        }
        String mime = file.getContentType();
        if (mime == null || !ALLOWED_TYPES.contains(mime)) {
            throw new IllegalArgumentException("JPEG・PNG・GIFのみ対応しています");
        }
    }

    private String saveLocally(MultipartFile file) {
        String ext = getExtension(file.getContentType());
        String filename = UUID.randomUUID() + "." + ext;
        try {
            Files.createDirectories(LOCAL_UPLOAD_DIR);
            Files.copy(file.getInputStream(), LOCAL_UPLOAD_DIR.resolve(filename));
            log.info("File saved locally: filename={}, size={}bytes", filename, file.getSize());
        } catch (IOException e) {
            log.error("Failed to save file locally: filename={}", filename, e);
            throw new RuntimeException("ローカルへの画像保存に失敗しました", e);
        }
        return localBaseUrl + "/api/files/" + filename;
    }

    private String uploadToS3(MultipartFile file) {
        String ext = getExtension(file.getContentType());
        String key = "uploads/" + UUID.randomUUID() + "." + ext;
        try {
            S3Client s3 = S3Client.builder().region(Region.of(region)).build();
            s3.putObject(
                PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType(file.getContentType())
                    .build(),
                RequestBody.fromBytes(file.getBytes())
            );
            log.info("Uploaded to S3: bucket={}, key={}, size={}bytes", bucket, key, file.getSize());
        } catch (IOException e) {
            log.error("Failed to upload to S3: bucket={}, key={}", bucket, key, e);
            throw new RuntimeException("画像のアップロードに失敗しました", e);
        }
        if (!cloudfrontUrl.isBlank()) {
            return cloudfrontUrl + "/" + key;
        }
        return "https://" + bucket + ".s3." + region + ".amazonaws.com/" + key;
    }

    private String getExtension(String mimeType) {
        return switch (mimeType) {
            case "image/png" -> "png";
            case "image/gif" -> "gif";
            default -> "jpg";
        };
    }
}
