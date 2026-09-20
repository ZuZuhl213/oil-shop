package com.shop.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_code", nullable = false, length = 30)
    private String orderCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "order_type", nullable = false, length = 20)
    private OrderType orderType;

    @Column(name = "customer_name", nullable = false, length = 100)
    private String customerName;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(columnDefinition = "text")
    private String address;

    private Long subtotal;

    @Column(name = "discount_amount", nullable = false)
    private long discountAmount;

    @Column(name = "total_amount")
    private Long totalAmount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voucher_id")
    private Voucher voucher;

    @Column(name = "voucher_code_snapshot", length = 50)
    private String voucherCodeSnapshot;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrderStatus status;

    @Column(name = "customer_note", columnDefinition = "text")
    private String customerNote;

    @Column(name = "admin_note", columnDefinition = "text")
    private String adminNote;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private Instant updatedAt;

    protected Order() {
    }

    public Order(
            String orderCode,
            OrderType orderType,
            String customerName,
            String phone,
            String address,
            Long subtotal,
            long discountAmount,
            Long totalAmount,
            Voucher voucher,
            String voucherCodeSnapshot,
            OrderStatus status,
            String customerNote,
            String adminNote) {
        this.orderCode = orderCode;
        this.orderType = orderType;
        this.customerName = customerName;
        this.phone = phone;
        this.address = address;
        this.subtotal = subtotal;
        this.discountAmount = discountAmount;
        this.totalAmount = totalAmount;
        this.voucher = voucher;
        this.voucherCodeSnapshot = voucherCodeSnapshot;
        this.status = status;
        this.customerNote = customerNote;
        this.adminNote = adminNote;
    }

    public Long getId() {
        return id;
    }

    public String getOrderCode() {
        return orderCode;
    }

    public OrderType getOrderType() {
        return orderType;
    }

    public String getCustomerName() {
        return customerName;
    }

    public String getPhone() {
        return phone;
    }

    public String getAddress() {
        return address;
    }

    public Long getSubtotal() {
        return subtotal;
    }

    public long getDiscountAmount() {
        return discountAmount;
    }

    public Long getTotalAmount() {
        return totalAmount;
    }

    public Voucher getVoucher() {
        return voucher;
    }

    public String getVoucherCodeSnapshot() {
        return voucherCodeSnapshot;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public String getCustomerNote() {
        return customerNote;
    }

    public String getAdminNote() {
        return adminNote;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
