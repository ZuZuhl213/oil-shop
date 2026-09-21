package com.shop.controller;

import com.shop.service.CatalogQueryService;
import com.shop.dto.CatalogDtos.CategoryDto;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/categories")
public class CategoryController {
    private final CatalogQueryService service;
    public CategoryController(CatalogQueryService service) { this.service=service; }
    @GetMapping public List<CategoryDto> list() { return service.publicCategories(); }
}
