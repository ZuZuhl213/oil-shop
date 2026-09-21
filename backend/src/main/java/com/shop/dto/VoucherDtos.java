package com.shop.dto;

import com.shop.entity.DiscountType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class VoucherDtos {
    private VoucherDtos() {}

    public record VoucherWrite(
            @NotBlank @Size(max = 50) String code,
            @NotNull DiscountType discountType,
            @NotNull @Positive Long discountValue,
            @Positive Long maxDiscount,
            @NotNull @PositiveOrZero Long minOrderValue,
            @NotNull @PositiveOrZero Integer quantity,
            Instant startAt,
            Instant endAt,
            Boolean isActive) {
    }

    public record VoucherDto(
            String id,
            String code,
            DiscountType discountType,
            long discountValue,
            Long maxDiscount,
            long minOrderValue,
            int quantity,
            int usedCount,
            Instant startAt,
            Instant endAt,
            boolean isActive) {
    }
}
