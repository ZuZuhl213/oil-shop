package com.shop.service;

import com.shop.dto.OrderDtos.AdminOrder;
import com.shop.entity.Order;
import com.shop.exception.BusinessException;
import com.shop.mapper.OrderMapper;
import com.shop.repository.OrderItemRepository;
import com.shop.repository.OrderRepository;
import jakarta.persistence.EntityManager;
import java.util.Objects;
import org.springframework.http.HttpStatus;
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
    public AdminOrder update(long id, String adminNote, String expectedAdminNote) {
        Order order = orders.findByIdForUpdate(id).orElseThrow(() -> AdminOrderQueryService.notFound(id));
        // Compare and write under the same row lock; status changes do not invalidate notes.
        if (!Objects.equals(normalize(order.getAdminNote()), normalize(expectedAdminNote))) {
            throw new BusinessException(HttpStatus.CONFLICT, "NOTE_CONFLICT",
                    "Admin note has changed; reload and review before saving");
        }
        order.setAdminNote(normalize(adminNote));
        orders.saveAndFlush(order);
        entityManager.refresh(order);
        return mapper.adminOrder(order, orderItems.findAllByOrder_IdOrderByIdAsc(id));
    }

    private static String normalize(String note) {
        return note == null || note.isBlank() ? null : note.trim();
    }
}
