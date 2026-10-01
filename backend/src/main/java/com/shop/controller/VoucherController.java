package com.shop.controller;

import com.shop.dto.ItemInput;
import com.shop.dto.PricePreview;
import com.shop.entity.SaleType;
import com.shop.exception.BusinessException;
import com.shop.repository.VoucherRepository;
import com.shop.service.PricingService;
import com.shop.service.VoucherPolicy;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.time.Clock;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "05. Mã giảm giá (Storefront)", description = "Kiểm tra và tính toán giảm giá voucher mà không làm tiêu hao lượt dùng")
@RestController
@RequestMapping("/api/v1/vouchers")
public class VoucherController {
    private final VoucherRepository vouchers;
    private final PricingService pricing;
    private final VoucherPolicy policy;
    private final Clock clock;

    public VoucherController(VoucherRepository vouchers, PricingService pricing, VoucherPolicy policy, Clock clock) {
        this.vouchers = vouchers;
        this.pricing = pricing;
        this.policy = policy;
        this.clock = clock;
    }

    @Operation(summary = "Kiểm tra mã giảm giá với giỏ hàng",
            description = "Tính trước mức chiết khấu cho giỏ hàng FIXED_PRICE mà không làm giảm số lượt dùng của voucher")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Mã hợp lệ, trả về số tiền giảm và tổng tiền sau giảm",
                    content = @Content(schema = @Schema(implementation = PricePreview.class))),
            @ApiResponse(responseCode = "422", description = "Mã không hợp lệ, hết hạn, hoặc giỏ hàng không đủ điều kiện")
    })
    @PostMapping("/validate")
    @Transactional(readOnly = true)
    public PricePreview validate(@Valid @RequestBody ValidateRequest request) {
        String code = request.code().trim().toUpperCase(Locale.ROOT);
        var voucher = vouchers.findByCode(code)
                .orElseThrow(() -> new BusinessException(HttpStatus.UNPROCESSABLE_CONTENT, "VOUCHER_INVALID", "Voucher is not valid"));
        var cart = pricing.calculate(request.items());
        if (cart.saleType() != SaleType.FIXED_PRICE || cart.subtotal() == null) {
            throw new BusinessException(HttpStatus.UNPROCESSABLE_CONTENT, "VOUCHER_INVALID", "Voucher only applies to fixed-price items");
        }
        long discount = policy.evaluate(voucher, cart.subtotal(), clock.instant());
        return new PricePreview(cart.subtotal(), discount, cart.subtotal() - discount, code);
    }

    public record ValidateRequest(
            @Schema(description = "Mã voucher cần áp dụng", example = "GIAM10K")
            @NotBlank @Size(max = 50) String code,

            @Schema(description = "Danh sách các món hàng trong giỏ")
            @NotEmpty @Size(max = 50) List<@Valid ItemInput> items) {
    }
}
