package com.shop.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.ObjectMapper;

@Component
public class OriginValidationFilter extends OncePerRequestFilter {
    private final Set<String> allowedOrigins;
    private final ObjectMapper mapper;
    public OriginValidationFilter(@Value("${app.security.allowed-origins:http://localhost:3000}") String origins,
                                  ObjectMapper mapper) {
        this.allowedOrigins = Arrays.stream(origins.split(",")).map(String::trim).filter(s -> !s.isEmpty())
                .collect(Collectors.toUnmodifiableSet());
        this.mapper = mapper;
    }
    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String origin = request.getHeader("Origin");
        if (isMutation(request.getMethod()) && origin != null && !allowedOrigins.contains(origin)) {
            SecurityConfig.writeError(response, mapper, 403, "FORBIDDEN", "Origin is not allowed");
            return;
        }
        chain.doFilter(request, response);
    }
    private boolean isMutation(String method) {
        return !(HttpMethod.GET.matches(method) || HttpMethod.HEAD.matches(method) || HttpMethod.OPTIONS.matches(method));
    }
}
