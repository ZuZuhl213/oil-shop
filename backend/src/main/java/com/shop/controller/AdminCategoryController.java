package com.shop.controller;

import com.shop.dto.CatalogDtos.CategoryWrite;
import com.shop.dto.CatalogDtos.CategoryDto;
import com.shop.dto.CatalogDtos.StatusWrite;
import com.shop.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "12. Admin - Quản lý Danh mục", description = "CRUD và kích hoạt/vô hiệu hóa danh mục sản phẩm")
@RestController
@RequestMapping("/api/v1/admin/categories")
public class AdminCategoryController {
    private final CategoryService service;

    public AdminCategoryController(CategoryService service) {
        this.service = service;
    }

    @Operation(summary = "Lấy tất cả danh mục (bao gồm cả danh mục ẩn)")
    @GetMapping
    public List<CategoryDto> list() {
        return service.list();
    }

    @Operation(summary = "Tạo danh mục mới")
    @PostMapping
    public ResponseEntity<CategoryDto> create(@Valid @RequestBody CategoryWrite body) {
        var v = service.create(body);
        return ResponseEntity.created(URI.create("/api/v1/admin/categories/" + v.id())).body(v);
    }

    @Operation(summary = "Cập nhật thông tin danh mục")
    @PutMapping("/{id}")
    public CategoryDto update(@PathVariable long id, @Valid @RequestBody CategoryWrite body) {
        return service.update(id, body);
    }

    @Operation(summary = "Bật/Tắt trạng thái hoạt động danh mục")
    @PatchMapping("/{id}/status")
    public CategoryDto status(@PathVariable long id, @Valid @RequestBody StatusWrite body) {
        return service.status(id, body.isActive());
    }
}
