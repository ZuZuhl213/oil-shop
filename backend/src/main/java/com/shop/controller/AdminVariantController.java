package com.shop.controller;

import com.shop.dto.CatalogDtos.StatusWrite;
import com.shop.dto.CatalogDtos.VariantWrite;
import com.shop.dto.CatalogDtos.VariantDto;
import com.shop.service.VariantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "14. Admin - Quản lý Biến thể", description = "Thêm biến thể dung tích/quy cách vào sản phẩm, cập nhật giá và ẩn/hiện")
@RestController
@RequestMapping("/api/v1/admin")
public class AdminVariantController {
    private final VariantService service;

    public AdminVariantController(VariantService service) {
        this.service = service;
    }

    @Operation(summary = "Tạo biến thể mới cho một sản phẩm")
    @PostMapping("/products/{productId}/variants")
    public ResponseEntity<VariantDto> create(@PathVariable long productId, @Valid @RequestBody VariantWrite body) {
        var v = service.create(productId, body);
        return ResponseEntity.created(URI.create("/api/v1/admin/variants/" + v.id())).body(v);
    }

    @Operation(summary = "Cập nhật biến thể sản phẩm")
    @PutMapping("/variants/{id}")
    public VariantDto update(@PathVariable long id, @Valid @RequestBody VariantWrite body) {
        return service.update(id, body);
    }

    @Operation(summary = "Bật/Tắt trạng thái hoạt động của biến thể")
    @PatchMapping("/variants/{id}/status")
    public VariantDto status(@PathVariable long id, @Valid @RequestBody StatusWrite body) {
        return service.status(id, body.isActive());
    }
}
