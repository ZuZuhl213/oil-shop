package com.shop.controller;

import com.shop.dto.CatalogDtos.ProductWrite;
import com.shop.dto.CatalogDtos.ProductStatusWrite;
import com.shop.dto.CatalogDtos.ProductDto;
import com.shop.dto.CatalogDtos.PageDto;
import com.shop.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.net.URI;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "13. Admin - Quản lý Sản phẩm", description = "CRUD sản phẩm, cập nhật trạng thái ACTIVE/INACTIVE/ARCHIVED")
@RestController
@Validated
@RequestMapping("/api/v1/admin/products")
public class AdminProductController {
    private final ProductService service;

    public AdminProductController(ProductService service) {
        this.service = service;
    }

    @Operation(summary = "Lấy danh sách tất cả sản phẩm (quản trị)", description = "Bao gồm cả sản phẩm nháp hoặc ẩn")
    @GetMapping
    public PageDto<ProductDto> list(
            @Parameter(description = "Số trang (bắt đầu từ 0)") @RequestParam(defaultValue = "0") @Min(0) int page,
            @Parameter(description = "Số lượng sản phẩm mỗi trang (1-100)") @RequestParam(defaultValue = "12") @Min(1) @Max(100) int size) {
        return service.list(page, size);
    }

    @Operation(summary = "Lấy chi tiết sản phẩm theo ID (quản trị)")
    @GetMapping("/{id}")
    public ProductDto get(@PathVariable long id) {
        return service.getAdmin(id);
    }

    @Operation(summary = "Tạo mới sản phẩm")
    @PostMapping
    public ResponseEntity<ProductDto> create(@Valid @RequestBody ProductWrite body) {
        var v = service.create(body);
        return ResponseEntity.created(URI.create("/api/v1/admin/products/" + v.id())).body(v);
    }

    @Operation(summary = "Cập nhật thông tin sản phẩm")
    @PutMapping("/{id}")
    public ProductDto update(@PathVariable long id, @Valid @RequestBody ProductWrite body) {
        return service.update(id, body);
    }

    @Operation(summary = "Thay đổi trạng thái sản phẩm (ACTIVE / INACTIVE / ARCHIVED)")
    @PatchMapping("/{id}/status")
    public ProductDto status(@PathVariable long id, @Valid @RequestBody ProductStatusWrite body) {
        return service.status(id, body.status());
    }
}
