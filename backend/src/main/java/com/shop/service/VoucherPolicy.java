package com.shop.service;

import com.shop.entity.DiscountType;
import com.shop.entity.Voucher;
import com.shop.exception.BusinessException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class VoucherPolicy {
    private static final long MONEY_LIMIT = 9_000_000_000_000L;

    public long evaluate(Voucher voucher, long subtotal, Instant now) {
        if (voucher == null || now == null || subtotal < 0 || subtotal > MONEY_LIMIT) {
            throw invalid();
        }
        if (!voucher.isActive() || voucher.getQuantity() < 0 || voucher.getUsedCount() < 0
                || voucher.getUsedCount() > voucher.getQuantity() || voucher.getMinOrderValue() < 0
                || voucher.getMinOrderValue() > MONEY_LIMIT || voucher.getDiscountValue() <= 0
                || voucher.getDiscountValue() > MONEY_LIMIT
                || (voucher.getMaxDiscount() != null
                    && (voucher.getMaxDiscount() < 0 || voucher.getMaxDiscount() > MONEY_LIMIT))) {
            throw invalid();
        }
        if (voucher.getUsedCount() >= voucher.getQuantity()) {
            throw new BusinessException(HttpStatus.UNPROCESSABLE_CONTENT, "VOUCHER_EXHAUSTED", "Voucher is exhausted");
        }
        if (voucher.getStartAt() != null && now.isBefore(voucher.getStartAt())
                || voucher.getEndAt() != null && !now.isBefore(voucher.getEndAt())
                || voucher.getStartAt() != null && voucher.getEndAt() != null
                    && !voucher.getStartAt().isBefore(voucher.getEndAt())
                || subtotal < voucher.getMinOrderValue()) {
            throw invalid();
        }
        if (voucher.getDiscountType() == DiscountType.FIXED) {
            if (voucher.getMaxDiscount() != null) {
                throw invalid();
            }
            return Math.min(voucher.getDiscountValue(), subtotal);
        }
        if (voucher.getDiscountType() != DiscountType.PERCENT || voucher.getDiscountValue() > 100) {
            throw invalid();
        }
        long discount = BigDecimal.valueOf(subtotal)
                .multiply(BigDecimal.valueOf(voucher.getDiscountValue()))
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.DOWN)
                .longValueExact();
        if (voucher.getMaxDiscount() != null) {
            discount = Math.min(discount, voucher.getMaxDiscount());
        }
        return Math.min(discount, subtotal);
    }

    private BusinessException invalid() {
        return new BusinessException(HttpStatus.UNPROCESSABLE_CONTENT, "VOUCHER_INVALID", "Voucher is not valid");
    }
}
