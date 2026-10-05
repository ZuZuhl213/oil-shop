package com.shop.integration.storage;

import java.net.URI;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.checksums.RequestChecksumCalculation;
import software.amazon.awssdk.core.checksums.ResponseChecksumValidation;
import software.amazon.awssdk.core.retry.RetryPolicy;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;

@Configuration
public class MediaStorageConfiguration {
    @Bean public MediaStorage mediaStorage(
            @Value("${app.media.provider:supabase}") String provider,
            @Value("${app.media.supabase-url:}") String supabaseUrl,
            @Value("${app.media.bucket:}") String supabaseBucket,
            @Value("${app.media.service-role-key:}") String serviceKey,
            @Value("${app.media.r2.endpoint:}") String endpoint,
            @Value("${app.media.r2.bucket:}") String bucket,
            @Value("${app.media.r2.access-key-id:}") String accessKey,
            @Value("${app.media.r2.secret-access-key:}") String secretKey,
            @Value("${app.media.r2.public-base-url:}") String publicUrl) {
        if ("supabase".equals(provider)) return new SupabaseMediaClient(supabaseUrl, supabaseBucket, serviceKey);
        if (!"r2".equals(provider)) throw new IllegalArgumentException("Invalid media provider configuration");
        String origin = R2MediaClient.httpsOrigin(endpoint);
        if (!URI.create(origin).getHost().matches("[a-f0-9]{32}(\\.(eu|fedramp))?\\.r2\\.cloudflarestorage\\.com")
                || accessKey.isBlank() || secretKey.isBlank()) throw new IllegalArgumentException("Invalid R2 endpoint or credentials configuration");
        R2MediaClient.httpsOrigin(publicUrl);
        if (!bucket.matches("[a-z0-9][a-z0-9-]{1,61}[a-z0-9]")) throw new IllegalArgumentException("Invalid R2 bucket configuration");
        var s3 = S3Client.builder().endpointOverride(URI.create(origin)).region(Region.of("auto"))
                .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey)))
                .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).chunkedEncodingEnabled(false).build())
                .requestChecksumCalculation(RequestChecksumCalculation.WHEN_REQUIRED)
                .responseChecksumValidation(ResponseChecksumValidation.WHEN_REQUIRED)
                .httpClientBuilder(UrlConnectionHttpClient.builder().connectionTimeout(Duration.ofSeconds(5)).socketTimeout(Duration.ofSeconds(10)))
                .overrideConfiguration(c -> c.apiCallTimeout(Duration.ofSeconds(15)).apiCallAttemptTimeout(Duration.ofSeconds(10))
                        .retryPolicy(RetryPolicy.builder().numRetries(1).build()))
                .build();
        return new R2MediaClient(bucket, publicUrl, s3);
    }
}
