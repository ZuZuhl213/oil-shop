package com.shop.controller;

import com.shop.service.CatalogQueryService;
import com.shop.dto.CatalogDtos.ProductDto;
import com.shop.dto.CatalogDtos.PageDto;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/v1/products")
public class ProductController {
    private final CatalogQueryService service;
    public ProductController(CatalogQueryService service) { this.service=service; }
    @GetMapping public PageDto<ProductDto> list(@RequestParam(defaultValue="0") @Min(0) int page,
                                   @RequestParam(defaultValue="12") @Min(1) @Max(100) int size,
                                   @RequestParam(required=false) String category,
                                   @RequestParam(required=false) @Size(max=100) String keyword) {
        return service.publicProducts(page,size,category,keyword);
    }
    @GetMapping("/{slug}") public ProductDto get(@PathVariable String slug) { return service.publicProduct(slug); }
}
