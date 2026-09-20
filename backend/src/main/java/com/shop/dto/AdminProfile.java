package com.shop.dto;

import com.shop.security.AdminPrincipal;

public record AdminProfile(String id, String email, String name) {
    public static AdminProfile from(AdminPrincipal principal) {
        return new AdminProfile(principal.id().toString(), principal.email(), principal.displayName());
    }
}
