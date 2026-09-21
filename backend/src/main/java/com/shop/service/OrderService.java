package com.shop.service;

import com.shop.dto.CalculatedCart;
import com.shop.dto.ItemInput;
import com.shop.dto.OrderDtos.CreateOrder;
import com.shop.dto.OrderDtos.CreateResult;
import com.shop.dto.PricedLine;
import com.shop.entity.OrderType;
import com.shop.entity.SaleType;
import com.shop.entity.Voucher;
import com.shop.exception.BusinessException;
import com.shop.mapper.OrderMapper;
import com.shop.repository.OrderItemRepository;
import com.shop.repository.OrderRepository;
import com.shop.repository.VoucherRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {
    private static final Pattern PHONE = Pattern.compile("(?:0\\d{9}|\\+84\\d{9})");
    private final PricingService pricing;
    private final VoucherRepository vouchers;
    private final VoucherPolicy voucherPolicy;
    private final OrderRepository orders;
    private final OrderItemRepository orderItems;
    private final OrderCodeGenerator codes;
    private final OrderMapper mapper;
    private final Clock clock;

    public OrderService(
            PricingService pricing,
            VoucherRepository vouchers,
            VoucherPolicy voucherPolicy,
            OrderRepository orders,
            OrderItemRepository orderItems,
            OrderCodeGenerator codes,
            OrderMapper mapper,
            Clock clock) {
        this.pricing = pricing;
        this.vouchers = vouchers;
        this.voucherPolicy = voucherPolicy;
        this.orders = orders;
        this.orderItems = orderItems;
        this.codes = codes;
        this.mapper = mapper;
        this.clock = clock;
    }

    @Transactional
    CreateResult create(CreateOrder request, String idempotencyKey, String requestHash) {
        if (request == null) {
            throw validation("request", "Request is required");
        }
        String customerName = required(request.customerName(), "customerName", 100);
        String phone = required(request.phone(), "phone", 20);
        if (!PHONE.matcher(phone).matches()) {
            throw validation("phone", "Phone must be a valid Vietnam phone number");
        }
        String address = optionalText(request.address(), "address", 1000, true);
        String note = optionalText(request.note(), "note", 2000, false);
        String voucherCode = normalizeVoucherCode(request.voucherCode());
        CalculatedCart cart = pricing.calculate(request.items());
        validateOrderType(request.orderType(), cart.saleType());

        Instant createdAt = clock.instant();
        long id = orders.reserveId();
        String orderCode = codes.from(id, createdAt, request.orderType());
        UUID key = UUID.fromString(idempotencyKey);
        Long subtotal = request.orderType() == OrderType.ORDER ? cart.subtotal() : null;
        Long total = subtotal;
        orders.insertWithId(id, orderCode, request.orderType().name(), customerName, phone, address, subtotal,
                0, total, null, null, "NEW", note, null, key, requestHash, createdAt);

        Voucher voucher = null;
        long discount = 0;
        if (voucherCode != null) {
            if (request.orderType() != OrderType.ORDER) {
                throw new BusinessException(HttpStatus.UNPROCESSABLE_CONTENT, "VOUCHER_INVALID", "Voucher is not valid");
            }
            voucher = vouchers.findByCodeForUpdate(voucherCode)
                    .orElseThrow(() -> new BusinessException(HttpStatus.UNPROCESSABLE_CONTENT, "VOUCHER_INVALID", "Voucher is not valid"));
            discount = voucherPolicy.evaluate(voucher, cart.subtotal(), clock.instant());
            orders.updatePricingAndVoucher(id, discount, subtotal - discount, voucher.getId(), voucherCode);
        }
        for (PricedLine line : cart.lines()) {
            orderItems.insert(id, line.catalog().productId(), line.catalog().variantId(), line.catalog().productName(),
                    line.catalog().variantName(), line.quantity(), line.unitPrice(), line.lineTotal());
        }
        if (voucher != null) {
            voucher.setUsedCount(voucher.getUsedCount() + 1);
            vouchers.save(voucher);
        }
        return new CreateResult(mapper.receipt(orders.findById(id).orElseThrow()), false);
    }

    private void validateOrderType(OrderType orderType, SaleType saleType) {
        if (orderType == null) {
            throw validation("orderType", "orderType is required");
        }
        boolean matches = orderType == OrderType.ORDER
                ? saleType == SaleType.FIXED_PRICE
                : saleType == SaleType.QUOTE;
        if (!matches) {
            throw new BusinessException(HttpStatus.UNPROCESSABLE_CONTENT, "MIXED_SALE_TYPES",
                    "Order type does not match the catalog sale type");
        }
    }

    private String required(String value, String field, int max) {
        if (value == null) {
            throw validation(field, field + " is required");
        }
        String normalized = value.trim();
        if (normalized.isEmpty() || normalized.length() > max) {
            throw validation(field, field + " is invalid");
        }
        return normalized;
    }

    private String optionalText(String value, String field, int max, boolean rejectBlank) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        if (normalized.isEmpty()) {
            if (rejectBlank) {
                throw validation(field, field + " must not be blank");
            }
            return null;
        }
        if (normalized.length() > max) {
            throw validation(field, field + " is too long");
        }
        return normalized;
    }

    private String normalizeVoucherCode(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim().toUpperCase(Locale.ROOT);
        return normalized.isEmpty() ? null : normalized;
    }

    private BusinessException validation(String field, String message) {
        return new BusinessException(HttpStatus.UNPROCESSABLE_CONTENT, "VALIDATION_ERROR", message,
                Map.of(field, message));
    }
}
