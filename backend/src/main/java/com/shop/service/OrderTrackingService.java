package com.shop.service;

import com.shop.dto.OrderDtos.OrderTracking;
import com.shop.dto.OrderDtos.OrderTrackingRequest;
import com.shop.dto.OrderDtos.TrackingItem;
import com.shop.entity.Order;
import com.shop.exception.BusinessException;
import com.shop.repository.OrderItemRepository;
import com.shop.repository.OrderRepository;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderTrackingService {
    private final OrderRepository orders;
    private final OrderItemRepository orderItems;

    public OrderTrackingService(OrderRepository orders, OrderItemRepository orderItems) {
        this.orders = orders;
        this.orderItems = orderItems;
    }

    @Transactional(readOnly = true)
    public OrderTracking find(OrderTrackingRequest request) {
        String code = request.orderCode().trim().toUpperCase(Locale.ROOT);
        String phone = normalizePhone(request.phone());
        Order order = orders.findByOrderCode(code)
                .filter(value -> normalizePhone(value.getPhone()).equals(phone))
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND",
                        "Không tìm thấy đơn hàng"));
        return new OrderTracking(order.getOrderCode(), order.getOrderType(), order.getStatus(), order.getSubtotal(),
                order.getDiscountAmount(), order.getTotalAmount(), order.getCreatedAt(),
                orderItems.findAllByOrder_IdOrderByIdAsc(order.getId()).stream()
                        .map(item -> new TrackingItem(item.getProductNameSnapshot(), item.getVariantNameSnapshot(),
                                item.getQuantity(), item.getUnitPrice(), item.getLineTotal()))
                        .toList());
    }

    static String normalizePhone(String value) {
        String normalized = value == null ? "" : value.replaceAll("[\\s().-]", "");
        return normalized.startsWith("+84") ? "0" + normalized.substring(3) : normalized;
    }
}
