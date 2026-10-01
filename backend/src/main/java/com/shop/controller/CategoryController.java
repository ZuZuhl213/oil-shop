package com.shop.controller;

import com.shop.service.CatalogQueryService;
import com.shop.dto.CatalogDtos.CategoryDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "03. Danh mục sản phẩm (Storefront)", description = "Các API tra cứu danh mục sản phẩm cho khách hàng")
@RestController
@RequestMapping("/api/v1/categories")
public class CategoryController {
    private final CatalogQueryService service;

    public CategoryController(CatalogQueryService service) {
        this.service = service;
    }

    @Operation(summary = "Lấy danh sách danh mục đang hoạt động", description = "Trả về danh sách danh mục hiển thị trên storefront kèm slug và số lượng")
    @GetMapping
    public List<CategoryDto> list() {
        return service.publicCategories();
    }
}
