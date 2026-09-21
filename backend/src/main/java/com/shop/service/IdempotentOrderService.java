package com.shop.service;

import com.shop.dto.OrderDtos.CreateOrder;
import com.shop.dto.OrderDtos.CreateResult;
import com.shop.entity.Order;
import com.shop.exception.BusinessException;
import com.shop.mapper.OrderMapper;
import com.shop.repository.OrderRepository;
import java.util.UUID;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class IdempotentOrderService {
    private final OrderRepository orders;
    private final OrderService orderService;
    private final OrderMapper mapper;
    private final OrderRequestFingerprint fingerprint;

    public IdempotentOrderService(
            OrderRepository orders,
            OrderService orderService,
            OrderMapper mapper,
            OrderRequestFingerprint fingerprint) {
        this.orders = orders;
        this.orderService = orderService;
        this.mapper = mapper;
        this.fingerprint = fingerprint;
    }

    public CreateResult create(CreateOrder request, String rawKey) {
        UUID key = parseKey(rawKey);
        String hash = fingerprint.hash(request);
        Order existing = orders.findByIdempotencyKey(key).orElse(null);
        if (existing != null) {
            return replayOrConflict(existing, hash);
        }
        try {
            return orderService.create(request, key.toString(), hash);
        } catch (DataIntegrityViolationException exception) {
            if (!isIdempotencyConflict(exception)) {
                throw exception;
            }
            Order committed = orders.findByIdempotencyKey(key).orElseThrow(() -> exception);
            return replayOrConflict(committed, hash);
        }
    }

    private CreateResult replayOrConflict(Order existing, String hash) {
        if (!existing.getRequestHash().equals(hash)) {
            throw new BusinessException(HttpStatus.CONFLICT, "IDEMPOTENCY_CONFLICT",
                    "Idempotency-Key was already used with a different request");
        }
        return new CreateResult(mapper.receipt(existing), true);
    }

    private UUID parseKey(String rawKey) {
        try {
            String normalized = rawKey == null ? "" : rawKey.trim();
            UUID value = UUID.fromString(normalized);
            if (!value.toString().equalsIgnoreCase(normalized)) {
                throw new IllegalArgumentException();
            }
            return value;
        } catch (IllegalArgumentException exception) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
                    "Idempotency-Key must be a UUID");
        }
    }

    private boolean isIdempotencyConflict(DataIntegrityViolationException exception) {
        Throwable cause = exception;
        while (cause != null) {
            if (cause instanceof ConstraintViolationException violation) {
                return "uq_orders_idempotency_key".equals(violation.getConstraintName());
            }
            cause = cause.getCause();
        }
        return false;
    }
}
