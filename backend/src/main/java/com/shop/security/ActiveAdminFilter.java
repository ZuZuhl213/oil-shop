package com.shop.security;

import com.shop.entity.Admin;
import com.shop.repository.AdminRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.ObjectMapper;

@Component
public class ActiveAdminFilter extends OncePerRequestFilter {
    private final AdminRepository admins;
    private final ObjectMapper mapper;
    public ActiveAdminFilter(AdminRepository admins, ObjectMapper mapper) { this.admins = admins; this.mapper = mapper; }
    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AdminPrincipal principal
                && admins.findById(principal.id()).filter(Admin::isActive).isEmpty()) {
            SecurityContextHolder.clearContext();
            var session = request.getSession(false);
            if (session != null) session.invalidate();
            SecurityConfig.writeError(response, mapper, 401, "UNAUTHENTICATED", "Authentication is required");
            return;
        }
        chain.doFilter(request, response);
    }
}
