package com.shop.service;

import com.shop.dto.CatalogDtos.PageDto;
import com.shop.dto.OrderDtos.AdminOrder;
import com.shop.entity.Order;
import com.shop.entity.OrderStatus;
import com.shop.entity.OrderType;
import com.shop.exception.BusinessException;
import com.shop.mapper.OrderMapper;
import com.shop.repository.OrderItemRepository;
import com.shop.repository.OrderRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Locale;
import java.util.stream.Collectors;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminOrderQueryService {
    private static final char LIKE_ESCAPE = '\\';
    private final OrderRepository orders;
    private final OrderItemRepository orderItems;
    private final OrderMapper mapper;

    public AdminOrderQueryService(OrderRepository orders, OrderItemRepository orderItems, OrderMapper mapper) {
        this.orders = orders;
        this.orderItems = orderItems;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public PageDto<AdminOrder> list(OrderStatus status, OrderType orderType, String keyword,
            Instant from, Instant to, int page, int size) {
        if (from != null && to != null && !from.isBefore(to)) {
            throw new BusinessException(HttpStatus.UNPROCESSABLE_CONTENT, "VALIDATION_ERROR",
                    "from must be before to", Map.of("from", "from must be before to"));
        }
        String normalizedKeyword = keyword == null || keyword.isBlank() ? null : keyword.trim();
        PageRequest request = PageRequest.of(page, size,
                Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")));
        Page<Order> values = orders.findAll((root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(builder.equal(root.get("status"), status));
            }
            if (orderType != null) {
                predicates.add(builder.equal(root.get("orderType"), orderType));
            }
            if (normalizedKeyword != null) {
                String escapedKeyword = escapeLike(normalizedKeyword);
                String pattern = "%" + escapedKeyword.toLowerCase(Locale.ROOT) + "%";
                predicates.add(builder.or(
                        builder.like(builder.lower(root.get("orderCode")), pattern, LIKE_ESCAPE),
                        builder.like(root.get("phone"), "%" + escapedKeyword + "%", LIKE_ESCAPE)));
            }
            if (from != null) {
                predicates.add(builder.greaterThanOrEqualTo(root.get("createdAt"), from));
            }
            if (to != null) {
                predicates.add(builder.lessThan(root.get("createdAt"), to));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        }, request);
        Map<Long, List<com.shop.entity.OrderItem>> itemsByOrder = itemsByOrder(values.getContent());
        Page<AdminOrder> mapped = values.map(order -> mapper.adminOrder(order,
                itemsByOrder.getOrDefault(order.getId(), List.of())));
        return new PageDto<>(mapped.getContent(), mapped.getNumber(), mapped.getSize(),
                mapped.getTotalElements(), mapped.getTotalPages());
    }

    @Transactional(readOnly = true)
    public AdminOrder get(long id) {
        Order order = orders.findById(id).orElseThrow(() -> notFound(id));
        return mapper.adminOrder(order, orderItems.findAllByOrder_IdOrderByIdAsc(id));
    }

    Map<Long, List<com.shop.entity.OrderItem>> itemsByOrder(List<Order> values) {
        List<Long> ids = values.stream().map(Order::getId).toList();
        if (ids.isEmpty()) {
            return Map.of();
        }
        return orderItems.findAllByOrderIds(ids).stream()
                .collect(Collectors.groupingBy(item -> item.getOrder().getId()));
    }

    static BusinessException notFound(long id) {
        return new BusinessException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Order not found");
    }

    private String escapeLike(String value) {
        return value.replace(String.valueOf(LIKE_ESCAPE), String.valueOf(LIKE_ESCAPE) + LIKE_ESCAPE)
                .replace("%", String.valueOf(LIKE_ESCAPE) + "%")
                .replace("_", String.valueOf(LIKE_ESCAPE) + "_");
    }
}
