package com.shop.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.ObjectMapper;

@Component
public class AdminAuthenticationPrecheckFilter extends OncePerRequestFilter {
    private final ObjectMapper mapper;
    public AdminAuthenticationPrecheckFilter(ObjectMapper mapper) { this.mapper = mapper; }
    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String path = request.getRequestURI();
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean adminMutation = path.startsWith(request.getContextPath() + "/api/v1/admin/")
                && !path.endsWith("/auth/login")
                && !"GET".equals(request.getMethod()) && !"HEAD".equals(request.getMethod())
                && !"OPTIONS".equals(request.getMethod());
        if (adminMutation && (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken)) {
            SecurityConfig.writeError(response, mapper, 401, "UNAUTHENTICATED", "Authentication is required");
            return;
        }
        chain.doFilter(request, response);
    }
}
