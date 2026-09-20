package com.shop.security;

import com.shop.entity.Admin;
import com.shop.repository.AdminRepository;
import java.util.Locale;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class AdminUserDetailsService implements UserDetailsService {
    private final AdminRepository admins;
    public AdminUserDetailsService(AdminRepository admins) { this.admins = admins; }
    @Override public UserDetails loadUserByUsername(String email) {
        String normalized = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        return admins.findByEmail(normalized).filter(Admin::isActive).map(AdminPrincipal::from)
                .orElseThrow(() -> new UsernameNotFoundException("Invalid credentials"));
    }
}
