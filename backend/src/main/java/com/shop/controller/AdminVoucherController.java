package com.shop.controller;

import com.shop.dto.CatalogDtos.StatusWrite;
import com.shop.dto.VoucherDtos.VoucherDto;
import com.shop.dto.VoucherDtos.VoucherWrite;
import com.shop.service.VoucherService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.net.URI;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "15. Admin - Quản lý Voucher", description = "Xem danh sách, tạo mới, chỉnh sửa và kích hoạt/vô hiệu hóa mã giảm giá")
@RestController
@RequestMapping("/api/v1/admin/vouchers")
@Validated
public class AdminVoucherController {
    private final VoucherService service;

    public AdminVoucherController(VoucherService service) {
        this.service = service;
    }

    @Operation(summary = "Lấy danh sách mã giảm giá (quản trị)")
    @GetMapping
    public com.shop.dto.CatalogDtos.PageDto<VoucherDto> list(
            @Parameter(description = "Số trang (bắt đầu từ 0)") @RequestParam(defaultValue = "0") @Min(0) int page,
            @Parameter(description = "Số lượng mã mỗi trang (1-100)") @RequestParam(defaultValue = "12") @Min(1) @Max(100) int size) {
        return service.list(page, size);
    }

    @Operation(summary = "Lấy thông tin chi tiết một voucher theo ID")
    @GetMapping("/{id}")
    public VoucherDto get(@PathVariable long id) {
        return service.get(id);
    }

    @Operation(summary = "Tạo mới voucher")
    @PostMapping
    public ResponseEntity<VoucherDto> create(@Valid @RequestBody VoucherWrite body) {
        VoucherDto value = service.create(body);
        return ResponseEntity.created(URI.create("/api/v1/admin/vouchers/" + value.id())).body(value);
    }

    @Operation(summary = "Cập nhật voucher")
    @PutMapping("/{id}")
    public VoucherDto update(@PathVariable long id, @Valid @RequestBody VoucherWrite body) {
        return service.update(id, body);
    }

    @Operation(summary = "Bật/Tắt trạng thái hoạt động của voucher")
    @PatchMapping("/{id}/status")
    public VoucherDto status(@PathVariable long id, @Valid @RequestBody StatusWrite body) {
        return service.status(id, body.isActive());
    }
}
