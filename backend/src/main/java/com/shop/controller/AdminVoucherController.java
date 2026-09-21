package com.shop.controller;

import com.shop.dto.CatalogDtos.StatusWrite;
import com.shop.dto.VoucherDtos.VoucherDto;
import com.shop.dto.VoucherDtos.VoucherWrite;
import com.shop.service.VoucherService;
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

@RestController
@RequestMapping("/api/v1/admin/vouchers")
public class AdminVoucherController {
    private final VoucherService service;

    public AdminVoucherController(VoucherService service) { this.service = service; }

    @GetMapping
    public List<VoucherDto> list() { return service.list(); }

    @GetMapping("/{id}")
    public VoucherDto get(@PathVariable long id) { return service.get(id); }

    @PostMapping
    public ResponseEntity<VoucherDto> create(@Valid @RequestBody VoucherWrite body) {
        VoucherDto value = service.create(body);
        return ResponseEntity.created(URI.create("/api/v1/admin/vouchers/" + value.id())).body(value);
    }

    @PutMapping("/{id}")
    public VoucherDto update(@PathVariable long id, @Valid @RequestBody VoucherWrite body) {
        return service.update(id, body);
    }

    @PatchMapping("/{id}/status")
    public VoucherDto status(@PathVariable long id, @Valid @RequestBody StatusWrite body) {
        return service.status(id, body.isActive());
    }
}
