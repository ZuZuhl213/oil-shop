package com.shop.mapper;

import com.shop.dto.OrderDtos.OrderReceipt;
import com.shop.entity.Order;
import org.springframework.stereotype.Component;

@Component
public class OrderMapper {
    public OrderReceipt receipt(Order value) {
        return new OrderReceipt(value.getOrderCode(), value.getOrderType(), value.getStatus(), value.getSubtotal(),
                value.getDiscountAmount(), value.getTotalAmount(), value.getCreatedAt());
    }
}
