package com.shop.controller;

import com.shop.dto.CatalogDtos.ProductWrite;
import com.shop.dto.CatalogDtos.ProductStatusWrite;
import com.shop.service.ProductService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.validation.annotation.Validated;
import java.net.URI;

@RestController
@Validated
@RequestMapping("/api/v1/admin/products")
public class AdminProductController {
    private final ProductService service;
    public AdminProductController(ProductService service){this.service=service;}
    @GetMapping public Object list(@RequestParam(defaultValue="0") @Min(0) int page,
                                   @RequestParam(defaultValue="12") @Min(1) @Max(100) int size){return service.list(page,size);}
    @GetMapping("/{id}") public Object get(@PathVariable long id){return service.getAdmin(id);}
    @PostMapping public ResponseEntity<?> create(@Valid @RequestBody ProductWrite body){var v=service.create(body);return ResponseEntity.created(URI.create("/api/v1/admin/products/"+v.id())).body(v);}
    @PutMapping("/{id}") public Object update(@PathVariable long id,@Valid @RequestBody ProductWrite body){return service.update(id,body);}
    @PatchMapping("/{id}/status") public Object status(@PathVariable long id,@Valid @RequestBody ProductStatusWrite body){return service.status(id,body.status());}
}
