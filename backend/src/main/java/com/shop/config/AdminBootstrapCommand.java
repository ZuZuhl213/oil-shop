package com.shop.config;

import com.shop.entity.Admin;
import com.shop.repository.AdminRepository;
import java.util.Locale;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Component
@Profile("bootstrap-admin")
public class AdminBootstrapCommand implements ApplicationRunner {
    private final AdminRepository admins;
    private final PasswordEncoder passwordEncoder;
    private final Environment environment;

    public AdminBootstrapCommand(AdminRepository admins, PasswordEncoder passwordEncoder, Environment environment) {
        this.admins = admins;
        this.passwordEncoder = passwordEncoder;
        this.environment = environment;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments arguments) {
        String email = environment.getProperty("BOOTSTRAP_ADMIN_EMAIL");
        String password = environment.getProperty("BOOTSTRAP_ADMIN_PASSWORD");
        if (!StringUtils.hasText(email) || !StringUtils.hasText(password)) {
            throw new IllegalStateException("BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD are required");
        }
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        if (normalizedEmail.length() > 150) {
            throw new IllegalStateException("BOOTSTRAP_ADMIN_EMAIL is too long");
        }
        if (admins.findByEmail(normalizedEmail).isPresent()) {
            throw new IllegalStateException("Admin email already exists");
        }
        admins.save(new Admin(normalizedEmail, passwordEncoder.encode(password), null, true));
    }
}
