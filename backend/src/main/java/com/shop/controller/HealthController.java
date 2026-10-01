package com.shop.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Instant;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "01. Hệ thống & Giám sát", description = "Kiểm tra trạng thái hoạt động (Health Check)")
@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    @Operation(summary = "Kiểm tra trạng thái hoạt động", description = "Trả về trạng thái UP và thời gian hiện tại của server")
    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "timestamp", Instant.now().toString()
        ));
    }
}
