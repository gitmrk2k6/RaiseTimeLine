package com.raisetimeline.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * ローカル開発専用。S3_BUCKET 未設定時にアップロードした画像を配信する。
 * 本番（S3_BUCKET が設定済み）では実際には使用されない。
 */
@RestController
@RequestMapping("/api/files")
public class FileController {

    private static final Path LOCAL_UPLOAD_DIR =
            Paths.get(System.getProperty("java.io.tmpdir"), "raisetimeline-uploads");

    @Value("${app.s3.bucket}")
    private String bucket;

    @GetMapping("/{filename}")
    public ResponseEntity<Resource> serve(@PathVariable String filename) {
        if (!bucket.isBlank()) {
            return ResponseEntity.notFound().build();
        }

        // パストラバーサル対策
        Path filePath = LOCAL_UPLOAD_DIR.resolve(filename).normalize();
        if (!filePath.startsWith(LOCAL_UPLOAD_DIR)) {
            return ResponseEntity.badRequest().build();
        }

        Resource resource = new FileSystemResource(filePath);
        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }

        String contentType;
        try {
            contentType = Files.probeContentType(filePath);
        } catch (IOException e) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(
                        contentType != null ? contentType : "application/octet-stream"))
                .body(resource);
    }
}
