package com.shop.integration.storage;

import com.shop.exception.BusinessException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;

public class SupabaseMediaClient implements MediaStorage {
    private final String url;
    private final String bucket;
    private final String serviceKey;
    private final HttpClient http;

    @Autowired
    public SupabaseMediaClient(@Value("${app.media.supabase-url:}") String url,
            @Value("${app.media.bucket:}") String bucket, @Value("${app.media.service-role-key:}") String serviceKey) {
        this(url, bucket, serviceKey, HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5))
                .followRedirects(HttpClient.Redirect.NEVER).build());
    }
    public SupabaseMediaClient(String url, String bucket, String serviceKey, HttpClient http) {
        this.url = url.replaceAll("/+$", ""); this.bucket = bucket; this.serviceKey = serviceKey; this.http = http;
    }

    @Override public String upload(String objectKey, byte[] bytes, String contentType) {
        try {
            URI origin = URI.create(url);
            if (!"https".equals(origin.getScheme()) || origin.getHost() == null || origin.getUserInfo() != null
                    || origin.getQuery() != null || origin.getFragment() != null || !origin.getPath().isEmpty()
                    || !bucket.matches("[A-Za-z0-9_-]+") || serviceKey.isBlank()
                    || !objectKey.matches("products/[a-f0-9-]{36}\\.(png|jpg|webp)")) throw unavailable();
            var request = HttpRequest.newBuilder(URI.create(url + "/storage/v1/object/" + bucket + "/" + objectKey))
                    .timeout(Duration.ofSeconds(15)).header("Authorization", "Bearer " + serviceKey)
                    .header("apikey", serviceKey).header("Content-Type", contentType).header("x-upsert", "false")
                    .POST(HttpRequest.BodyPublishers.ofByteArray(bytes)).build();
            var response = http.send(request, HttpResponse.BodyHandlers.discarding());
            if (response.statusCode() < 200 || response.statusCode() >= 300) throw unavailable();
            return url + "/storage/v1/object/public/" + bucket + "/" + objectKey;
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt(); throw unavailable();
        } catch (Exception failure) { throw unavailable(); }
    }
    private BusinessException unavailable() {
        return new BusinessException(HttpStatus.SERVICE_UNAVAILABLE, "SERVICE_UNAVAILABLE", "Media storage is unavailable");
    }
}
