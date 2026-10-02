package com.shop;

import com.shop.entity.Admin;
import com.shop.integration.storage.MediaStorage;
import com.shop.repository.AdminRepository;
import com.shop.support.PostgresIntegrationTest;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

/** Opt-in disposable backend for the browser/proxy tests; never uses backend/.env. */
@EnabledIfEnvironmentVariable(named = "PLAN10_BROWSER_FIXTURE", matches = "1")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "app.security.allowed-origins=${PLAN10_FRONTEND_ORIGIN:http://127.0.0.1:3200}",
        "app.media.supabase-url=https://media.example.test", "app.media.bucket=catalog",
        "logging.level.org.springframework=WARN", "logging.level.com.shop=WARN" })
@ActiveProfiles("test")
class AdminBrowserFixtureIT extends PostgresIntegrationTest {
    @LocalServerPort int port;
    @Autowired AdminRepository admins;
    @Autowired PasswordEncoder encoder;
    @MockitoBean MediaStorage storage;

    @Test void serveUntilBrowserTestsComplete() throws Exception {
        String email = "owner.e2e@example.test", password = "plan10-disposable-test-password";
        admins.save(new Admin(email, encoder.encode(password), "Admin kiểm thử", true));
        when(storage.upload(anyString(), any(byte[].class), anyString())).thenAnswer(invocation ->
                "https://media.example.test/storage/v1/object/public/catalog/" + invocation.getArgument(0));
        Path ready = Path.of(System.getenv("PLAN10_BROWSER_READY_FILE"));
        Files.writeString(ready, "{\"port\":" + port + ",\"email\":\"" + email + "\",\"password\":\"" + password + "\"}");
        long deadline = System.nanoTime() + Duration.ofMinutes(10).toNanos();
        while (!Files.exists(Path.of(ready + ".stop"))) {
            if (System.nanoTime() > deadline) throw new IllegalStateException("Browser fixture timed out");
            Thread.sleep(200);
        }
    }
}
