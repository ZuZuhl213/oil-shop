package com.shop.service;

import com.shop.dto.OrderDtos.AdminOrder;
import com.shop.entity.Order;
import com.shop.entity.OrderItem;
import com.shop.entity.OrderStatus;
import com.shop.entity.Voucher;
import com.shop.exception.BusinessException;
import com.shop.mapper.OrderMapper;
import com.shop.repository.OrderItemRepository;
import com.shop.repository.OrderRepository;
import com.shop.repository.VoucherRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderStatusService {
    private final OrderRepository orders;
    private final VoucherRepository vouchers;
    private final OrderItemRepository orderItems;
    private final OrderMapper mapper;
    private final OrderTransitions transitions;

    public OrderStatusService(OrderRepository orders, VoucherRepository vouchers, OrderItemRepository orderItems,
            OrderMapper mapper, OrderTransitions transitions) {
        this.orders = orders;
        this.vouchers = vouchers;
        this.orderItems = orderItems;
        this.mapper = mapper;
        this.transitions = transitions;
    }

    @Transactional
    public AdminOrder change(long orderId, OrderStatus target) {
        Order order = orders.findByIdForUpdate(orderId)
                .orElseThrow(() -> AdminOrderQueryService.notFound(orderId));
        OrderStatus current = order.getStatus();
        if (!transitions.isAllowed(current, target)) {
            throw new BusinessException(HttpStatus.CONFLICT, "INVALID_TRANSITION",
                    "Order status transition is not allowed");
        }
        if (current != target && target == OrderStatus.CANCELLED && order.getVoucher() != null) {
            Voucher voucher = vouchers.findByIdForUpdate(order.getVoucher().getId())
                    .orElseThrow(() -> new BusinessException(HttpStatus.CONFLICT, "INVALID_TRANSITION",
                            "Order voucher is unavailable"));
            voucher.setUsedCount(Math.max(0, voucher.getUsedCount() - 1));
            vouchers.save(voucher);
        }
        if (current != target) {
            order.setStatus(target);
            orders.save(order);
        }
        List<OrderItem> items = orderItems.findAllByOrder_IdOrderByIdAsc(orderId);
        return mapper.adminOrder(order, items);
    }
}
