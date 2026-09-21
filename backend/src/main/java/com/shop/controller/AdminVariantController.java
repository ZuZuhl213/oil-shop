package com.shop.controller;

import com.shop.dto.CatalogDtos.StatusWrite;
import com.shop.dto.CatalogDtos.VariantWrite;
import com.shop.service.VariantService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.net.URI;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminVariantController {
    private final VariantService service;
    public AdminVariantController(VariantService service){this.service=service;}
    @PostMapping("/products/{productId}/variants") public ResponseEntity<?> create(@PathVariable long productId,@Valid @RequestBody VariantWrite body){var v=service.create(productId,body);return ResponseEntity.created(URI.create("/api/v1/admin/variants/"+v.id())).body(v);}
    @PutMapping("/variants/{id}") public Object update(@PathVariable long id,@Valid @RequestBody VariantWrite body){return service.update(id,body);}
    @PatchMapping("/variants/{id}/status") public Object status(@PathVariable long id,@Valid @RequestBody StatusWrite body){return service.status(id,body.isActive());}
}
