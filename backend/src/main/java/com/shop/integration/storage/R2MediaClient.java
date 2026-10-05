package com.shop.integration.storage;

import com.shop.exception.BusinessException;
import java.net.URI;
import org.springframework.http.HttpStatus;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

/** Backend-only S3 upload; public URLs use a separate, configured origin. */
public final class R2MediaClient implements MediaStorage, AutoCloseable {
    public static final String KEY_PATTERN = "products/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\\.(png|jpg|webp)";
    private final String bucket;
    private final String publicOrigin;
    private final S3Client s3;

    public R2MediaClient(String bucket, String publicUrl, S3Client s3) {
        if (bucket == null || !bucket.matches("[a-z0-9][a-z0-9-]{1,61}[a-z0-9]")) throw new IllegalArgumentException("Invalid R2 bucket configuration");
        this.bucket = bucket;
        this.publicOrigin = httpsOrigin(publicUrl);
        this.s3 = s3;
    }

    public static String httpsOrigin(String value) {
        try {
            String normalized = value.replaceAll("/+$", "");
            URI uri = URI.create(normalized);
            if (!"https".equals(uri.getScheme()) || uri.getHost() == null || uri.getUserInfo() != null
                    || uri.getQuery() != null || uri.getFragment() != null || !uri.getPath().isEmpty()
                    || uri.getPort() != -1) throw new IllegalArgumentException();
            return normalized;
        } catch (RuntimeException invalid) { throw new IllegalArgumentException("Invalid media HTTPS origin configuration"); }
    }

    @Override public String upload(String objectKey, byte[] bytes, String contentType) {
        try {
            if (objectKey == null || !objectKey.matches(KEY_PATTERN) || bytes == null || bytes.length == 0
                    || bytes.length > 5 * 1024 * 1024 || !mime(objectKey).equals(contentType)) throw unavailable();
            s3.putObject(PutObjectRequest.builder().bucket(bucket).key(objectKey)
                    .contentType(contentType).contentLength((long) bytes.length).ifNoneMatch("*").build(), RequestBody.fromBytes(bytes));
            return publicOrigin + "/" + objectKey;
        } catch (RuntimeException failure) { throw unavailable(); }
    }
    private static String mime(String key) {
        return key.endsWith(".png") ? "image/png" : key.endsWith(".jpg") ? "image/jpeg" : "image/webp";
    }
    private BusinessException unavailable() {
        return new BusinessException(HttpStatus.SERVICE_UNAVAILABLE, "SERVICE_UNAVAILABLE", "Media storage is unavailable");
    }
    @Override public void close() { s3.close(); }
}
