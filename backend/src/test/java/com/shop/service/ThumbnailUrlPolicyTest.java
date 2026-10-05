package com.shop.service;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

class ThumbnailUrlPolicyTest {
    @Test void acceptsConfiguredR2OnlyWithGeneratedKeysAndRetainsLegacyBucket() {
        var policy = new ThumbnailUrlPolicy("https://project.supabase.co", "catalog", "https://media.example.test/");
        String valid = "https://media.example.test/products/12345678-1234-1234-1234-123456789abc.webp";
        assertThat(policy.validate(valid)).isEqualTo(valid);
        assertThat(policy.validate("https://project.supabase.co/storage/v1/object/public/catalog/products/image.png")).contains("image.png");
        for (String value : new String[]{valid + "?q=1", valid + "#x", valid.replace("media.example.test", "foreign.test"), valid.replace("products/", "other/"), valid.replace("12345678-1234-1234-1234-123456789abc", "image"), valid.replace("products/", "products/../"), valid.replace("products/", "products/%2e%2e/"), valid.replace(".webp", ".svg")}) {
            assertThatThrownBy(() -> policy.validate(value)).hasMessageContaining("configured media");
        }
    }

    @Test void acceptsOnlyConfiguredPublicBucketAndKeepsNullableThumbnail() {
        var policy = new ThumbnailUrlPolicy("https://project.supabase.co/", "catalog");
        assertThat(policy.validate(null)).isNull();
        assertThat(policy.validate("  ")).isNull();
        String valid = "https://project.supabase.co/storage/v1/object/public/catalog/products/image.png";
        assertThat(policy.validate(valid)).isEqualTo(valid);
        for (String value : new String[]{"https://evil.test/image.png", "https://project.supabase.co.evil.test/storage/v1/object/public/catalog/image.png", "https://project.supabase.co/storage/v1/object/public/other/image.png", "https://project.supabase.co/storage/v1/object/public/catalog/../other/image.png", "https://project.supabase.co/storage/v1/object/public/catalog/%2e%2e/other/image.png", valid + "?secret=test"}) {
            assertThatThrownBy(() -> policy.validate(value)).hasMessageContaining("configured media bucket");
        }
        assertThatThrownBy(() -> new ThumbnailUrlPolicy("", "").validate(valid)).hasMessageContaining("configured media bucket");
    }
}
