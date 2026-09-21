package com.shop.mapper;

import com.shop.dto.OrderDtos.OrderReceipt;
import com.shop.entity.Order;
import com.shop.entity.OrderStatus;
import org.springframework.stereotype.Component;

@Component
public class OrderMapper {
    public OrderReceipt receipt(Order value) {
        return map(value, value.getStatus());
    }

    public OrderReceipt createReceipt(Order value) {
        return map(value, OrderStatus.NEW);
    }

    private OrderReceipt map(Order value, OrderStatus status) {
        return new OrderReceipt(value.getOrderCode(), value.getOrderType(), status, value.getSubtotal(),
                value.getDiscountAmount(), value.getTotalAmount(), value.getCreatedAt());
    }
}
