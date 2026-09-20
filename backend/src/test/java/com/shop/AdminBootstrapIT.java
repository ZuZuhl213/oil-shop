package com.shop;

import com.shop.config.AdminBootstrapCommand;
import com.shop.repository.AdminRepository;
import com.shop.support.PostgresIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.SpringApplication;
import org.springframework.core.env.Environment;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class AdminBootstrapIT extends PostgresIntegrationTest {

    @Autowired AdminRepository admins;
    @Autowired PasswordEncoder passwordEncoder;

    @BeforeEach
    void clearAdmins() {
        admins.deleteAll();
    }

    @Test
    void createsActiveAdminWithNormalizedEmailAndBcryptHash() throws Exception {
        command(environment(" Owner@Example.COM ", "strong-password")).run(null);

        var admin = admins.findByEmail("owner@example.com").orElseThrow();
        assertThat(admin.isActive()).isTrue();
        assertThat(admin.getPasswordHash()).isNotEqualTo("strong-password");
        assertThat(passwordEncoder.matches("strong-password", admin.getPasswordHash())).isTrue();
    }

    @Test
    void failsWhenRequiredEnvironmentIsMissing() {
        assertThatThrownBy(() -> command(new MockEnvironment()).run(null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD are required");
    }

    @Test
    void rerunDoesNotResetExistingPassword() throws Exception {
        command(environment("owner@example.com", "original-password")).run(null);
        String originalHash = admins.findByEmail("owner@example.com").orElseThrow().getPasswordHash();

        assertThatThrownBy(() -> command(environment("OWNER@example.com", "replacement-password")).run(null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Admin email already exists");

        assertThat(admins.findByEmail("owner@example.com").orElseThrow().getPasswordHash()).isEqualTo(originalHash);
        assertThat(passwordEncoder.matches("replacement-password", originalHash)).isFalse();
    }

    @Test
    void bootstrapProfileStartsWithoutWebSecurityAndCreatesAdmin() {
        var running = SpringApplication.from(ShopApplication::main)
                .withAdditionalProfiles("test", "bootstrap-admin")
                .run(
                        "--spring.main.web-application-type=none",
                        "--DB_CONNECTION=postgresql",
                        "--DB_HOST=" + POSTGRES.getHost(),
                        "--DB_PORT=" + POSTGRES.getMappedPort(5432),
                        "--DB_DATABASE=" + POSTGRES.getDatabaseName(),
                        "--DB_USERNAME=" + POSTGRES.getUsername(),
                        "--DB_PASSWORD=" + POSTGRES.getPassword(),
                        "--BOOTSTRAP_ADMIN_EMAIL=bootstrap@example.com",
                        "--BOOTSTRAP_ADMIN_PASSWORD=bootstrap-password");

        try (var context = running.getApplicationContext()) {
            assertThat(admins.findByEmail("bootstrap@example.com")).isPresent();
        }
    }

    private AdminBootstrapCommand command(Environment environment) {
        return new AdminBootstrapCommand(admins, passwordEncoder, environment);
    }

    private MockEnvironment environment(String email, String password) {
        return new MockEnvironment()
                .withProperty("BOOTSTRAP_ADMIN_EMAIL", email)
                .withProperty("BOOTSTRAP_ADMIN_PASSWORD", password);
    }
}
