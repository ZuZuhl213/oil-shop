package com.shop.repository;

import com.shop.entity.Order;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderCode(String orderCode);

    Optional<Order> findByIdempotencyKey(UUID idempotencyKey);

    @Query(value = "select nextval(pg_get_serial_sequence('orders', 'id'))", nativeQuery = true)
    long reserveId();

    @Modifying(flushAutomatically = true)
    @Query(value = """
            insert into orders (
                id, order_code, order_type, customer_name, phone, address,
                subtotal, discount_amount, total_amount, voucher_id,
                voucher_code_snapshot, status, customer_note, admin_note,
                idempotency_key, request_hash, created_at)
            values (
                :id, :orderCode, :orderType, :customerName, :phone, :address,
                :subtotal, :discountAmount, :totalAmount, :voucherId,
                :voucherCodeSnapshot, :status, :customerNote, :adminNote,
                :idempotencyKey, :requestHash, :createdAt)
            """, nativeQuery = true)
    void insertWithId(
            @Param("id") long id,
            @Param("orderCode") String orderCode,
            @Param("orderType") String orderType,
            @Param("customerName") String customerName,
            @Param("phone") String phone,
            @Param("address") String address,
            @Param("subtotal") Long subtotal,
            @Param("discountAmount") long discountAmount,
            @Param("totalAmount") Long totalAmount,
            @Param("voucherId") Long voucherId,
            @Param("voucherCodeSnapshot") String voucherCodeSnapshot,
            @Param("status") String status,
            @Param("customerNote") String customerNote,
            @Param("adminNote") String adminNote,
            @Param("idempotencyKey") UUID idempotencyKey,
            @Param("requestHash") String requestHash,
            @Param("createdAt") Instant createdAt);

    @Modifying(flushAutomatically = true)
    @Query(value = """
            update orders
            set discount_amount = :discountAmount,
                total_amount = :totalAmount,
                voucher_id = :voucherId,
                voucher_code_snapshot = :voucherCodeSnapshot
            where id = :id
            """, nativeQuery = true)
    void updatePricingAndVoucher(
            @Param("id") long id,
            @Param("discountAmount") long discountAmount,
            @Param("totalAmount") Long totalAmount,
            @Param("voucherId") Long voucherId,
            @Param("voucherCodeSnapshot") String voucherCodeSnapshot);
}
