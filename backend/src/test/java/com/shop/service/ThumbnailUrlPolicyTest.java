package com.shop.service;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

class ThumbnailUrlPolicyTest {
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
