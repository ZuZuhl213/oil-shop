package com.shop.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "vouchers")
public class Voucher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false, length = 20)
    private DiscountType discountType;

    @Column(name = "discount_value", nullable = false)
    private long discountValue;

    @Column(name = "max_discount")
    private Long maxDiscount;

    @Column(name = "min_order_value", nullable = false)
    private long minOrderValue;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "used_count", nullable = false)
    private int usedCount;

    @Column(name = "start_at")
    private Instant startAt;

    @Column(name = "end_at")
    private Instant endAt;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private Instant updatedAt;

    protected Voucher() {
    }

    public Voucher(
            String code,
            DiscountType discountType,
            long discountValue,
            Long maxDiscount,
            long minOrderValue,
            int quantity,
            int usedCount,
            Instant startAt,
            Instant endAt,
            boolean active) {
        this.code = code;
        this.discountType = discountType;
        this.discountValue = discountValue;
        this.maxDiscount = maxDiscount;
        this.minOrderValue = minOrderValue;
        this.quantity = quantity;
        this.usedCount = usedCount;
        this.startAt = startAt;
        this.endAt = endAt;
        this.active = active;
    }

    public Long getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public DiscountType getDiscountType() {
        return discountType;
    }

    public long getDiscountValue() {
        return discountValue;
    }

    public Long getMaxDiscount() {
        return maxDiscount;
    }

    public long getMinOrderValue() {
        return minOrderValue;
    }

    public int getQuantity() {
        return quantity;
    }

    public int getUsedCount() {
        return usedCount;
    }

    public Instant getStartAt() {
        return startAt;
    }

    public Instant getEndAt() {
        return endAt;
    }

    public boolean isActive() {
        return active;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
