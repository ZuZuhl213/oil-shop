package com.shop.dto;

import com.shop.entity.OrderStatus;
import com.shop.entity.OrderType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

public final class OrderDtos {
    private OrderDtos() {}

    public record CreateOrder(
            @NotNull OrderType orderType,
            @NotBlank @Size(max = 100) String customerName,
            @NotBlank @Size(max = 20) String phone,
            @Size(max = 1000) String address,
            @Size(max = 2000) String note,
            @Size(max = 50) String voucherCode,
            @NotEmpty @Size(max = 50) List<@Valid ItemInput> items) {
    }

    public record OrderReceipt(
            String orderCode,
            OrderType orderType,
            OrderStatus status,
            Long subtotal,
            long discountAmount,
            Long totalAmount,
            Instant createdAt) {
    }

    public record CreateResult(OrderReceipt receipt, boolean replayed) {
    }
}
