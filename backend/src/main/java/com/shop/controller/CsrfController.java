package com.shop.controller;

import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
public class CsrfController {
    @GetMapping("/csrf")
    CsrfResponse csrf(CsrfToken token) { return new CsrfResponse(token.getToken(), token.getHeaderName()); }
    record CsrfResponse(String token, String headerName) {}
}
