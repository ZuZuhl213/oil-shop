package com.shop.controller;

import com.shop.dto.CatalogDtos.CategoryWrite;
import com.shop.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.net.URI;

@RestController
@RequestMapping("/api/v1/admin/categories")
public class AdminCategoryController {
    private final CategoryService service;
    public AdminCategoryController(CategoryService service) { this.service=service; }
    @GetMapping public Object list() { return service.list(); }
    @PostMapping public ResponseEntity<?> create(@Valid @RequestBody CategoryWrite body) { var v=service.create(body); return ResponseEntity.created(URI.create("/api/v1/admin/categories/"+v.id())).body(v); }
    @PutMapping("/{id}") public Object update(@PathVariable long id,@Valid @RequestBody CategoryWrite body){return service.update(id,body);}
    @PatchMapping("/{id}/status") public Object status(@PathVariable long id,@RequestBody com.shop.dto.CatalogDtos.StatusWrite body){return service.status(id,body.isActive());}
}
