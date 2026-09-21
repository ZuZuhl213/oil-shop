package com.shop.controller;

import com.shop.dto.CatalogDtos.PageDto;
import com.shop.dto.OrderDtos.AdminNoteWrite;
import com.shop.dto.OrderDtos.AdminOrder;
import com.shop.entity.OrderStatus;
import com.shop.entity.OrderType;
import com.shop.service.AdminOrderQueryService;
import com.shop.service.OrderNoteService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.time.Instant;

@RestController
@RequestMapping("/api/v1/admin/orders")
@Validated
public class AdminOrderController {
    private final AdminOrderQueryService queries;
    private final OrderNoteService notes;

    public AdminOrderController(AdminOrderQueryService queries, OrderNoteService notes) {
        this.queries = queries;
        this.notes = notes;
    }

    @GetMapping
    public PageDto<AdminOrder> list(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) OrderType orderType,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return queries.list(status, orderType, keyword, from, to, page, size);
    }

    @GetMapping("/{id}")
    public AdminOrder get(@PathVariable long id) {
        return queries.get(id);
    }

    @PatchMapping("/{id}/note")
    public AdminOrder note(@PathVariable long id, @Valid @RequestBody AdminNoteWrite body) {
        return notes.update(id, body.adminNote());
    }
}
