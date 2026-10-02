package com.shop.controller;

import com.shop.dto.CatalogDtos.PageDto;
import com.shop.dto.OrderDtos.AdminNoteWrite;
import com.shop.dto.OrderDtos.AdminOrder;
import com.shop.dto.OrderDtos.OrderStatusWrite;
import com.shop.entity.OrderStatus;
import com.shop.entity.OrderType;
import com.shop.service.AdminOrderQueryService;
import com.shop.service.OrderNoteService;
import com.shop.service.OrderStatusService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "16. Admin - Quản lý Đơn hàng", description = "Tìm kiếm đơn hàng, xem chi tiết, cập nhật trạng thái đơn và ghi chú nội bộ")
@RestController
@RequestMapping("/api/v1/admin/orders")
@Validated
public class AdminOrderController {
    private final AdminOrderQueryService queries;
    private final OrderNoteService notes;
    private final OrderStatusService statuses;

    public AdminOrderController(AdminOrderQueryService queries, OrderNoteService notes, OrderStatusService statuses) {
        this.queries = queries;
        this.notes = notes;
        this.statuses = statuses;
    }

    @Operation(summary = "Tra cứu & lọc danh sách đơn hàng",
            description = "Lọc theo trạng thái (PENDING, CONFIRMED, COMPLETED, CANCELLED), loại đơn (ORDER / QUOTE_REQUEST), từ khóa hoặc khoảng thời gian")
    @GetMapping
    public PageDto<AdminOrder> list(
            @Parameter(description = "Trạng thái đơn") @RequestParam(required = false) OrderStatus status,
            @Parameter(description = "Loại đơn (ORDER hoặc QUOTE_REQUEST)") @RequestParam(required = false) OrderType orderType,
            @Parameter(description = "Từ khóa (mã đơn, tên khách, số điện thoại)") @RequestParam(required = false) @Size(max = 100) String keyword,
            @Parameter(description = "Từ ngày (ISO Instant)") @RequestParam(required = false) Instant from,
            @Parameter(description = "Đến ngày (ISO Instant)") @RequestParam(required = false) Instant to,
            @Parameter(description = "Số trang (bắt đầu từ 0)") @RequestParam(defaultValue = "0") @Min(0) int page,
            @Parameter(description = "Số lượng bản ghi mỗi trang (1-100)") @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return queries.list(status, orderType, keyword, from, to, page, size);
    }

    @Operation(summary = "Lấy thông tin chi tiết một đơn hàng theo ID")
    @GetMapping("/{id}")
    public AdminOrder get(@PathVariable long id) {
        return queries.get(id);
    }

    @Operation(summary = "Cập nhật ghi chú nội bộ cho đơn hàng")
    @PatchMapping("/{id}/note")
    public AdminOrder note(@PathVariable long id, @Valid @RequestBody AdminNoteWrite body) {
        return notes.update(id, body.adminNote(), body.expectedAdminNote());
    }

    @Operation(summary = "Chuyển trạng thái đơn hàng (tuân thủ State Machine)")
    @PatchMapping("/{id}/status")
    public AdminOrder status(@PathVariable long id, @Valid @RequestBody OrderStatusWrite body) {
        return statuses.change(id, body.status());
    }
}
