package com.shop;

import com.shop.entity.DiscountType;
import com.shop.entity.Voucher;
import com.shop.exception.BusinessException;
import com.shop.service.VoucherPolicy;
import java.time.Instant;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class VoucherPolicyTest {
    private static final Instant NOW = Instant.parse("2026-09-21T00:00:00Z");

    @Test
    void roundsPercentDiscountDownAndDoesNotConsumeVoucher() {
        Voucher voucher = voucher(DiscountType.PERCENT, 15, null, 0, 20, 3, null, null, true);

        long discount = new VoucherPolicy().evaluate(voucher, 999, NOW);

        assertThat(discount).isEqualTo(149L);
        assertThat(voucher.getUsedCount()).isEqualTo(3);
    }

    @Test
    void capsFixedDiscountAtSubtotal() {
        Voucher voucher = voucher(DiscountType.FIXED, 1_000, null, 0, 20, 0, null, null, true);

        assertThat(new VoucherPolicy().evaluate(voucher, 430, NOW)).isEqualTo(430L);
    }

    @Test
    void floorsPercentDiscountAndAppliesMaximum() {
        Voucher voucher = voucher(DiscountType.PERCENT, 100, 50L, 0, 20, 0, null, null, true);

        assertThat(new VoucherPolicy().evaluate(voucher, 999, NOW)).isEqualTo(50L);
    }

    @Test
    void acceptsSubtotalExactlyAtMinimum() {
        Voucher voucher = voucher(DiscountType.FIXED, 100, null, 500, 20, 0, null, null, true);

        assertThat(new VoucherPolicy().evaluate(voucher, 500, NOW)).isEqualTo(100L);
    }

    @Test
    void rejectsSubtotalBelowMinimum() {
        Voucher voucher = voucher(DiscountType.FIXED, 100, null, 500, 20, 0, null, null, true);

        assertThatThrownBy(() -> new VoucherPolicy().evaluate(voucher, 499, NOW))
                .isInstanceOf(BusinessException.class)
                .satisfies(error -> assertThat(((BusinessException) error).code()).isEqualTo("VOUCHER_INVALID"));
    }

    @Test
    void startIsInclusiveAndEndIsExclusive() {
        Instant start = NOW;
        Instant end = NOW.plusSeconds(60);
        VoucherPolicy policy = new VoucherPolicy();

        assertThat(policy.evaluate(voucher(DiscountType.FIXED, 10, null, 0, 20, 0, start, end, true), 100, start))
                .isEqualTo(10L);
        assertThatThrownBy(() -> policy.evaluate(
                voucher(DiscountType.FIXED, 10, null, 0, 20, 0, start, end, true), 100, end))
                .isInstanceOf(BusinessException.class)
                .satisfies(error -> assertThat(((BusinessException) error).code()).isEqualTo("VOUCHER_INVALID"));
    }

    @Test
    void rejectsInactiveExhaustedAndInvalidPercentVouchers() {
        VoucherPolicy policy = new VoucherPolicy();
        assertCode(policy, voucher(DiscountType.FIXED, 10, null, 0, 20, 0, null, null, false), "VOUCHER_INVALID");
        assertCode(policy, voucher(DiscountType.FIXED, 10, null, 0, 20, 20, null, null, true), "VOUCHER_EXHAUSTED");
        assertCode(policy, voucher(DiscountType.PERCENT, 0, null, 0, 20, 0, null, null, true), "VOUCHER_INVALID");
        assertCode(policy, voucher(DiscountType.PERCENT, 101, null, 0, 20, 0, null, null, true), "VOUCHER_INVALID");
        assertCode(policy, voucher(DiscountType.PERCENT, 10, 0L, 0, 20, 0, null, null, true), "VOUCHER_INVALID");
        assertCode(policy, voucher(DiscountType.PERCENT, 10, -1L, 0, 20, 0, null, null, true), "VOUCHER_INVALID");
    }

    @Test
    void keepsOversoldVoucherInvalidInsteadOfTreatingItAsExhausted() {
        assertCode(new VoucherPolicy(), voucher(DiscountType.FIXED, 10, null, 0, 1, 2, null, null, true), "VOUCHER_INVALID");
    }

    private void assertCode(VoucherPolicy policy, Voucher voucher, String code) {
        assertThatThrownBy(() -> policy.evaluate(voucher, 100, NOW))
                .isInstanceOf(BusinessException.class)
                .satisfies(error -> assertThat(((BusinessException) error).code()).isEqualTo(code));
    }

    private Voucher voucher(DiscountType type, long value, Long max, long min, int quantity, int used,
                            Instant start, Instant end, boolean active) {
        return new Voucher("TEST", type, value, max, min, quantity, used, start, end, active);
    }
}
