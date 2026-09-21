package com.shop.service;

import com.shop.dto.OrderDtos.AdminOrder;
import com.shop.entity.Order;
import com.shop.mapper.OrderMapper;
import com.shop.repository.OrderItemRepository;
import com.shop.repository.OrderRepository;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderNoteService {
    private final OrderRepository orders;
    private final OrderItemRepository orderItems;
    private final OrderMapper mapper;
    private final EntityManager entityManager;

    public OrderNoteService(OrderRepository orders, OrderItemRepository orderItems, OrderMapper mapper,
            EntityManager entityManager) {
        this.orders = orders;
        this.orderItems = orderItems;
        this.mapper = mapper;
        this.entityManager = entityManager;
    }

    @Transactional
    public AdminOrder update(long id, String adminNote) {
        Order order = orders.findByIdForUpdate(id).orElseThrow(() -> AdminOrderQueryService.notFound(id));
        String normalized = adminNote == null || adminNote.isBlank() ? null : adminNote.trim();
        order.setAdminNote(normalized);
        orders.saveAndFlush(order);
        entityManager.refresh(order);
        return mapper.adminOrder(order, orderItems.findAllByOrder_IdOrderByIdAsc(id));
    }
}
