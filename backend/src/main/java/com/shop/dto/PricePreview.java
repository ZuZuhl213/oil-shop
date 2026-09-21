package com.shop.dto;

public record PricePreview(Long subtotal, long discountAmount, Long totalAmount, String voucherCode) {
}
