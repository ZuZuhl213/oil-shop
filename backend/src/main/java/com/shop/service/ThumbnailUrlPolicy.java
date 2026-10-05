package com.shop.service;

import com.shop.exception.BusinessException;
import java.net.URI;
import com.shop.integration.storage.R2MediaClient;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class ThumbnailUrlPolicy {
    private final String prefix;
    private final String r2Prefix;
    public ThumbnailUrlPolicy(String url, String bucket) { this(url, bucket, ""); }
    @Autowired
    public ThumbnailUrlPolicy(@Value("${app.media.supabase-url:}") String url, @Value("${app.media.bucket:}") String bucket, @Value("${app.media.r2.public-base-url:}") String publicUrl) {
        r2Prefix = publicUrl.isBlank() ? null : R2MediaClient.httpsOrigin(publicUrl) + "/";
        prefix = url.replaceAll("/+$", "") + "/storage/v1/object/public/" + bucket + "/";
    }
    public String validate(String value) {
        String normalized = CategoryService.trim(value);
        if (normalized == null) return null;
        try {
            URI uri = URI.create(normalized);
            if ("https".equals(uri.getScheme()) && uri.getHost() != null && uri.getUserInfo() == null
                    && uri.getQuery() == null && uri.getFragment() == null && uri.equals(uri.normalize())
                    && !uri.getRawPath().contains("%") && ((normalized.startsWith(prefix) && normalized.length() > prefix.length())
                        || (r2Prefix != null && normalized.startsWith(r2Prefix)
                            && normalized.substring(r2Prefix.length()).matches(R2MediaClient.KEY_PATTERN)))) return normalized;
        } catch (IllegalArgumentException invalid) { /* structured field error below */ }
        throw new BusinessException(HttpStatus.UNPROCESSABLE_CONTENT, "VALIDATION_ERROR",
                "Thumbnail URL must belong to the configured media bucket", Map.of("thumbnailUrl", "Use an HTTPS URL from the configured media bucket"));
    }
}
