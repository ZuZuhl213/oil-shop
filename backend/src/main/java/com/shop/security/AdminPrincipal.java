package com.shop.security;

import com.shop.entity.Admin;
import java.util.Collection;
import java.util.List;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public record AdminPrincipal(Long id, String email, String displayName, String password, boolean enabled)
        implements UserDetails {
    public static AdminPrincipal from(Admin admin) {
        return new AdminPrincipal(admin.getId(), admin.getEmail(), admin.getName(), admin.getPasswordHash(), admin.isActive());
    }
    @Override public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_ADMIN"));
    }
    @Override public String getPassword() { return password; }
    @Override public String getUsername() { return email; }
    @Override public boolean isEnabled() { return enabled; }
}
