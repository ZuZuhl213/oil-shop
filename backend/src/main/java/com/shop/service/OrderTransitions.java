package com.shop.service;

import com.shop.entity.OrderStatus;
import org.springframework.stereotype.Component;

@Component
public class OrderTransitions {
    public boolean isAllowed(OrderStatus from, OrderStatus to) {
        if (from == null || to == null) {
            return false;
        }
        if (from == to) {
            return true;
        }
        return switch (from) {
            case NEW -> to == OrderStatus.CONTACTED || to == OrderStatus.CANCELLED;
            case CONTACTED -> to == OrderStatus.CONFIRMED || to == OrderStatus.CANCELLED;
            case CONFIRMED -> to == OrderStatus.COMPLETED || to == OrderStatus.CANCELLED;
            case COMPLETED, CANCELLED -> false;
        };
    }
}
