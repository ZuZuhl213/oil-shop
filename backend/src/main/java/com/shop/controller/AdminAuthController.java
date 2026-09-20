package com.shop.controller;

import com.shop.dto.AdminProfile;
import com.shop.dto.LoginRequest;
import com.shop.security.AdminPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Cookie;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/auth")
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
public class AdminAuthController {
    private final AuthenticationManager authenticationManager;
    private final SessionAuthenticationStrategy sessionStrategy;
    private final SecurityContextRepository contextRepository;
    public AdminAuthController(AuthenticationManager authenticationManager, SessionAuthenticationStrategy sessionStrategy,
                               SecurityContextRepository contextRepository) {
        this.authenticationManager = authenticationManager;
        this.sessionStrategy = sessionStrategy;
        this.contextRepository = contextRepository;
    }
    @PostMapping("/login")
    AdminProfile login(@Valid @RequestBody LoginRequest body, HttpServletRequest request, HttpServletResponse response) {
        var authentication = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(body.email(), body.password()));
        sessionStrategy.onAuthentication(authentication, request, response);
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        contextRepository.saveContext(context, request, response);
        return AdminProfile.from((AdminPrincipal) authentication.getPrincipal());
    }
    @GetMapping("/me")
    AdminProfile me(@AuthenticationPrincipal AdminPrincipal principal) { return AdminProfile.from(principal); }
    @PostMapping("/logout")
    ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        new SecurityContextLogoutHandler().logout(request, response, SecurityContextHolder.getContext().getAuthentication());
        Cookie sessionCookie = new Cookie("JSESSIONID", "");
        sessionCookie.setHttpOnly(true);
        sessionCookie.setPath("/api");
        sessionCookie.setMaxAge(0);
        sessionCookie.setSecure(request.isSecure());
        sessionCookie.setAttribute("SameSite", "Lax");
        response.addCookie(sessionCookie);
        return ResponseEntity.noContent().build();
    }
}
