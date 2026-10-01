package com.shop.service;

import com.shop.dto.ItemInput;
import com.shop.dto.OrderDtos.CreateOrder;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Component;

@Component
public class OrderRequestFingerprint {
    public String hash(CreateOrder request) {
        if (request == null) {
            return sha256("request:-1;");
        }
        StringBuilder canonical = new StringBuilder();
        field(canonical, "orderType", request.orderType() == null ? null : request.orderType().name());
        field(canonical, "customerName", trim(request.customerName()));
        field(canonical, "phone", phone(request.phone()));
        field(canonical, "address", trim(request.address()));
        field(canonical, "note", optional(request.note()));
        String voucherCode = optional(request.voucherCode());
        field(canonical, "voucherCode", voucherCode == null ? null : voucherCode.toUpperCase(Locale.ROOT));
        List<ItemInput> items = request.items() == null ? List.of() : request.items().stream()
                .sorted(Comparator.comparing((ItemInput item) -> numeric(item == null ? null : item.variantId()))
                        .thenComparing(item -> quantity(item == null ? null : item.quantity()),
                                Comparator.nullsFirst(Comparator.naturalOrder())))
                .toList();
        field(canonical, "items", Integer.toString(items.size()));
        for (ItemInput item : items) {
            field(canonical, "variantId", item == null ? null : variantId(item.variantId()));
            field(canonical, "quantity", item == null ? null : quantity(item.quantity()));
        }
        return sha256(canonical.toString());
    }

    private String trim(String value) { return value == null ? null : value.trim(); }

    private String phone(String value) {
        String normalized = trim(value);
        if (normalized != null && normalized.startsWith("+84")) {
            return "0" + normalized.substring(3);
        }
        return normalized;
    }

    private String variantId(String value) {
        String normalized = trim(value);
        if (normalized == null) {
            return null;
        }
        Long parsed = positiveLong(normalized);
        return parsed == null ? normalized : parsed.toString();
    }

    private String optional(String value) {
        String normalized = trim(value);
        return normalized == null || normalized.isEmpty() ? null : normalized;
    }

    private String quantity(BigDecimal value) {
        return value == null ? null : value.stripTrailingZeros().toPlainString();
    }

    private long numeric(String value) {
        Long parsed = positiveLong(value);
        return parsed == null ? Long.MAX_VALUE : parsed;
    }

    private Long positiveLong(String value) {
        String normalized = trim(value);
        if (normalized == null) {
            return null;
        }
        try {
            long parsed = Long.parseLong(normalized);
            return parsed > 0 ? parsed : null;
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private void field(StringBuilder target, String name, String value) {
        target.append(name.length()).append(':').append(name);
        if (value == null) {
            target.append("-1;");
        } else {
            target.append(value.length()).append(':').append(value).append(';');
        }
    }

    private String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder result = new StringBuilder(64);
            for (byte item : digest) {
                result.append("%02x".formatted(item & 0xff));
            }
            return result.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}
