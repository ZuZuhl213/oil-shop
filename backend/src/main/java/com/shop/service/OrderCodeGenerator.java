package com.shop.service;

import com.shop.entity.OrderType;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import org.springframework.stereotype.Component;

@Component
public class OrderCodeGenerator {
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("yyyyMMdd")
            .withZone(ZoneId.of("Asia/Ho_Chi_Minh"));

    public String from(long reservedId, Instant createdAt, OrderType type) {
        String prefix = type == OrderType.QUOTE_REQUEST ? "BG" : "DH";
        return "%s-%s-%d".formatted(prefix, DATE.format(createdAt), reservedId);
    }
}
