package com.shop.controller;

import com.shop.dto.CatalogDtos.ProductWrite;
import com.shop.dto.CatalogDtos.StatusWrite;
import com.shop.entity.ProductStatus;
import com.shop.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.net.URI;

@RestController
@RequestMapping("/api/v1/admin/products")
public class AdminProductController {
    private final ProductService service;
    public AdminProductController(ProductService service){this.service=service;}
    @GetMapping public Object list(){return service.list();}
    @GetMapping("/{id}") public Object get(@PathVariable long id){return service.getAdmin(id);}
    @PostMapping public ResponseEntity<?> create(@Valid @RequestBody ProductWrite body){var v=service.create(body);return ResponseEntity.created(URI.create("/api/v1/admin/products/"+v.id())).body(v);}
    @PutMapping("/{id}") public Object update(@PathVariable long id,@Valid @RequestBody ProductWrite body){return service.update(id,body);}
    @PatchMapping("/{id}/status") public Object status(@PathVariable long id,@RequestBody StatusWrite body){return service.status(id,ProductStatus.valueOf(body.isActive()?"ACTIVE":"INACTIVE"));}
}
