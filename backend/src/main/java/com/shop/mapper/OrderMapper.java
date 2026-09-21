package com.shop.mapper;

import com.shop.dto.OrderDtos.OrderReceipt;
import com.shop.dto.OrderDtos.AdminOrder;
import com.shop.dto.OrderDtos.AdminOrderItem;
import com.shop.entity.Order;
import com.shop.entity.OrderItem;
import com.shop.entity.OrderStatus;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class OrderMapper {
    public OrderReceipt receipt(Order value) {
        return map(value, value.getStatus());
    }

    public OrderReceipt createReceipt(Order value) {
        return map(value, OrderStatus.NEW);
    }

    public AdminOrder adminOrder(Order value, List<OrderItem> items) {
        return new AdminOrder(
                String.valueOf(value.getId()), value.getOrderCode(), value.getOrderType(), value.getStatus(),
                value.getSubtotal(), value.getDiscountAmount(), value.getTotalAmount(), value.getCreatedAt(),
                value.getUpdatedAt(), value.getCustomerName(), value.getPhone(), value.getAddress(),
                value.getCustomerNote(), value.getAdminNote(), value.getVoucherCodeSnapshot(),
                items.stream().map(this::adminItem).toList());
    }

    private AdminOrderItem adminItem(OrderItem item) {
        return new AdminOrderItem(
                item.getProduct() == null ? null : String.valueOf(item.getProduct().getId()),
                item.getVariant() == null ? null : String.valueOf(item.getVariant().getId()),
                item.getProductNameSnapshot(), item.getVariantNameSnapshot(), item.getQuantity(),
                item.getUnitPrice(), item.getLineTotal());
    }

    private OrderReceipt map(Order value, OrderStatus status) {
        return new OrderReceipt(value.getOrderCode(), value.getOrderType(), status, value.getSubtotal(),
                value.getDiscountAmount(), value.getTotalAmount(), value.getCreatedAt());
    }
}
