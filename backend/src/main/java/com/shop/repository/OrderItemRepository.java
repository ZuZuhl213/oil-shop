package com.shop.repository;

import com.shop.entity.OrderItem;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findAllByOrder_IdOrderByIdAsc(Long orderId);

    @Query("select i from OrderItem i where i.order.id in :orderIds order by i.order.id asc, i.id asc")
    List<OrderItem> findAllByOrderIds(@Param("orderIds") List<Long> orderIds);

    @Modifying(flushAutomatically = true)
    @Query(value = """
            insert into order_items (
                order_id, product_id, variant_id, product_name_snapshot,
                variant_name_snapshot, quantity, unit_price, line_total)
            values (
                :orderId, :productId, :variantId, :productNameSnapshot,
                :variantNameSnapshot, :quantity, :unitPrice, :lineTotal)
            """, nativeQuery = true)
    void insert(
            @Param("orderId") long orderId,
            @Param("productId") Long productId,
            @Param("variantId") Long variantId,
            @Param("productNameSnapshot") String productNameSnapshot,
            @Param("variantNameSnapshot") String variantNameSnapshot,
            @Param("quantity") BigDecimal quantity,
            @Param("unitPrice") Long unitPrice,
            @Param("lineTotal") Long lineTotal);
}
