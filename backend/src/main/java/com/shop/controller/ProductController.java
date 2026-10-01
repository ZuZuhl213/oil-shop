package com.shop.controller;

import com.shop.service.CatalogQueryService;
import com.shop.dto.CatalogDtos.ProductDto;
import com.shop.dto.CatalogDtos.PageDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "04. Sản phẩm (Storefront)", description = "Các API tìm kiếm, lọc và xem chi tiết sản phẩm cho khách hàng")
@RestController
@Validated
@RequestMapping("/api/v1/products")
public class ProductController {
    private final CatalogQueryService service;

    public ProductController(CatalogQueryService service) {
        this.service = service;
    }

    @Operation(summary = "Lấy danh sách sản phẩm (có lọc và phân trang)",
            description = "Lọc sản phẩm theo slug danh mục hoặc từ khóa tìm kiếm. Hỗ trợ phân trang.")
    @GetMapping
    public PageDto<ProductDto> list(
            @Parameter(description = "Số trang (bắt đầu từ 0)") @RequestParam(defaultValue = "0") @Min(0) int page,
            @Parameter(description = "Số lượng sản phẩm mỗi trang (1-100)") @RequestParam(defaultValue = "12") @Min(1) @Max(100) int size,
            @Parameter(description = "Slug danh mục cần lọc (tùy chọn)") @RequestParam(required = false) String category,
            @Parameter(description = "Từ khóa tìm kiếm theo tên/mô tả") @RequestParam(required = false) @Size(max = 100) String keyword) {
        return service.publicProducts(page, size, category, keyword);
    }

    @Operation(summary = "Lấy thông tin chi tiết một sản phẩm",
            description = "Tra cứu sản phẩm theo slug. Trả về thông tin chi tiết và danh sách biến thể đang hoạt động.")
    @GetMapping("/{slug}")
    public ProductDto get(@Parameter(description = "Slug của sản phẩm", example = "dau-lac-nguyen-chat-1l") @PathVariable String slug) {
        return service.publicProduct(slug);
    }
}
