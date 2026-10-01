package com.shop.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import java.util.List;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("HM Naturals — Oil Shop API")
                        .description("Tài liệu API Backend hệ thống Web Dầu Lạc & Nông Sản Tự Nhiên (HM Naturals).\n\n"
                                + "Bao gồm:\n"
                                + "- **Storefront APIs**: Xem danh mục, tra cứu sản phẩm, kiểm tra voucher, đặt hàng & gửi yêu cầu báo giá.\n"
                                + "- **Admin APIs**: Đăng nhập, quản lý danh mục, sản phẩm, biến thể, voucher, đơn hàng và ghi chú nội bộ.")
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("HM Naturals Team")
                                .email("contact@hmnaturals.vn"))
                        .license(new License()
                                .name("Bản quyền thuộc về HM Naturals")
                                .url("https://hmnaturals.vn")))
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("Local Backend Server"),
                        new Server().url("http://localhost:3000").description("Next.js Proxy Server")))
                .components(new Components()
                        .addSecuritySchemes("cookieAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.APIKEY)
                                .in(SecurityScheme.In.COOKIE)
                                .name("JSESSIONID")
                                .description("Session cookie dành cho phiên đăng nhập Admin"))
                        .addSecuritySchemes("csrfToken", new SecurityScheme()
                                .type(SecurityScheme.Type.APIKEY)
                                .in(SecurityScheme.In.HEADER)
                                .name("X-CSRF-TOKEN")
                                .description("CSRF Token bảo vệ các thao tác thay đổi dữ liệu (lấy từ GET /api/v1/csrf)")));
    }

    @Bean
    public GroupedOpenApi storefrontApi() {
        return GroupedOpenApi.builder()
                .group("1. Storefront (Khách hàng)")
                .pathsToMatch(
                        "/api/v1/categories/**",
                        "/api/v1/products/**",
                        "/api/v1/vouchers/validate",
                        "/api/v1/orders/**",
                        "/api/v1/csrf",
                        "/api/v1/health")
                .build();
    }

    @Bean
    public GroupedOpenApi adminApi() {
        return GroupedOpenApi.builder()
                .group("2. Admin (Quản trị)")
                .pathsToMatch("/api/v1/admin/**")
                .build();
    }

    @Bean
    public GroupedOpenApi allApi() {
        return GroupedOpenApi.builder()
                .group("3. Tất cả APIs")
                .pathsToMatch("/api/v1/**")
                .build();
    }
}
