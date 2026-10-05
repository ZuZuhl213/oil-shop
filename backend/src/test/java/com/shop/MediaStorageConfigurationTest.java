package com.shop;

import com.shop.integration.storage.*;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import static org.assertj.core.api.Assertions.*;

class MediaStorageConfigurationTest {
    final ApplicationContextRunner context = new ApplicationContextRunner().withUserConfiguration(MediaStorageConfiguration.class);
    @Test void defaultsToSupabaseAndRejectsUnknownProvider() {
        context.run(c -> assertThat(c.getBean(MediaStorage.class)).isInstanceOf(SupabaseMediaClient.class));
        context.withPropertyValues("app.media.provider=invalid").run(c -> assertThat(c).hasFailed());
    }
    @Test void r2RequiresCompleteSafeConfigurationAndCreatesExactlyOneAdapter() {
        context.withPropertyValues("app.media.provider=r2").run(c -> assertThat(c).hasFailed());
        var valid = context.withPropertyValues("app.media.provider=r2", "app.media.r2.endpoint=https://0123456789abcdef0123456789abcdef.r2.cloudflarestorage.com", "app.media.r2.bucket=catalog", "app.media.r2.access-key-id=test-access", "app.media.r2.secret-access-key=test-secret", "app.media.r2.public-base-url=https://media.test");
        valid.run(c -> { assertThat(c).hasNotFailed(); assertThat(c.getBeansOfType(MediaStorage.class)).hasSize(1); assertThat(c.getBean(MediaStorage.class)).isInstanceOf(R2MediaClient.class); });
        valid.withPropertyValues("app.media.r2.endpoint=https://foreign.test").run(c -> assertThat(c).hasFailed());
        valid.withPropertyValues("app.media.r2.endpoint=https://0123456789abcdef0123456789abcdef.eu.r2.cloudflarestorage.com").run(c -> assertThat(c).hasNotFailed());
    }
}
