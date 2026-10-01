package com.shop.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "02. Bảo mật & CSRF", description = "Lấy token CSRF cho các thao tác thay đổi dữ liệu (POST/PUT/PATCH)")
@RestController
@RequestMapping("/api/v1")
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
public class CsrfController {

    @Operation(summary = "Lấy CSRF Token", description = "Khởi tạo cookie JSESSIONID và trả về token CSRF để đính kèm vào header khi gọi mutation APIs")
    @GetMapping("/csrf")
    CsrfResponse csrf(CsrfToken token) {
        return new CsrfResponse(token.getToken(), token.getHeaderName());
    }

    record CsrfResponse(String token, String headerName) {}
}
