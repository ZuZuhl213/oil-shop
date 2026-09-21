package com.shop.service;

import com.shop.dto.CalculatedCart;
import com.shop.dto.CatalogLine;
import com.shop.dto.ItemInput;
import com.shop.dto.PricedLine;
import com.shop.entity.SaleType;
import com.shop.exception.BusinessException;
import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PricingService {
    private static final long MONEY_LIMIT = 9_000_000_000_000L;
    private static final BigDecimal MAX_QUANTITY = new BigDecimal("99999999.99");
    private final CatalogQueryService catalog;

    public PricingService(CatalogQueryService catalog) {
        this.catalog = catalog;
    }

    @Transactional(readOnly = true)
    public CalculatedCart calculate(List<ItemInput> items) {
        if (items == null || items.isEmpty() || items.size() > 50 || items.stream().anyMatch(java.util.Objects::isNull)) {
            throw validation("items", "Cart must contain 1 to 50 items");
        }
        Set<Long> ids = new HashSet<>();
        List<Long> variantIds = items.stream().map(item -> parseVariantId(item.variantId())).toList();
        for (Long id : variantIds) {
            if (!ids.add(id)) {
                throw validation("items", "Duplicate variantId is not allowed");
            }
        }
        List<CatalogLine> catalogLines = catalog.loadSellable(variantIds);
        if (catalogLines.size() != items.size() || catalogLines.stream().anyMatch(java.util.Objects::isNull)) {
            throw new BusinessException(HttpStatus.UNPROCESSABLE_CONTENT, "ITEM_UNAVAILABLE", "Catalog item is unavailable");
        }
        SaleType saleType = catalogLines.get(0).saleType();
        List<PricedLine> lines = new java.util.ArrayList<>(items.size());
        long subtotal = 0;
        for (int i = 0; i < items.size(); i++) {
            ItemInput item = items.get(i);
            CatalogLine line = catalogLines.get(i);
            if (line.saleType() != saleType) {
                throw new BusinessException(HttpStatus.UNPROCESSABLE_CONTENT, "MIXED_SALE_TYPES", "Mixed sale types are not allowed");
            }
            validateQuantity(item.quantity(), line);
            if (saleType == SaleType.QUOTE) {
                lines.add(new PricedLine(line, item.quantity(), null, null));
                continue;
            }
            if (line.price() == null || line.price() < 0 || line.price() > MONEY_LIMIT) {
                throw new BusinessException(HttpStatus.UNPROCESSABLE_CONTENT, "ITEM_UNAVAILABLE", "Catalog item is unavailable");
            }
            long lineTotal = wholeVnd(line.price(), item.quantity());
            subtotal = checkedAdd(subtotal, lineTotal);
            lines.add(new PricedLine(line, item.quantity(), line.price(), lineTotal));
        }
        return new CalculatedCart(List.copyOf(lines), saleType == SaleType.FIXED_PRICE ? subtotal : null, saleType);
    }

    private Long parseVariantId(String value) {
        if (value == null || value.isBlank()) {
            throw validation("variantId", "variantId is required");
        }
        try {
            long id = Long.parseLong(value.trim());
            if (id <= 0) {
                throw new NumberFormatException();
            }
            return id;
        } catch (NumberFormatException exception) {
            throw validation("variantId", "variantId must be a positive decimal id");
        }
    }

    private void validateQuantity(BigDecimal quantity, CatalogLine line) {
        if (quantity == null || quantity.signum() <= 0 || quantity.scale() > 2
                || quantity.compareTo(MAX_QUANTITY) > 0 || line.minQuantity() == null
                || line.quantityStep() == null || line.minQuantity().signum() <= 0
                || line.quantityStep().signum() <= 0
                || quantity.compareTo(line.minQuantity()) < 0
                || quantity.subtract(line.minQuantity()).remainder(line.quantityStep()).compareTo(BigDecimal.ZERO) != 0) {
            throw validation("quantity", "Quantity does not match the variant rule");
        }
    }

    private long wholeVnd(long price, BigDecimal quantity) {
        try {
            BigDecimal value = BigDecimal.valueOf(price).multiply(quantity);
            long amount = value.longValueExact();
            if (amount < 0 || amount > MONEY_LIMIT) {
                throw new ArithmeticException();
            }
            return amount;
        } catch (ArithmeticException exception) {
            throw validation("quantity", "Price multiplied by quantity must be whole VND within the limit");
        }
    }

    private long checkedAdd(long left, long right) {
        try {
            long total = Math.addExact(left, right);
            if (total > MONEY_LIMIT) {
                throw new ArithmeticException();
            }
            return total;
        } catch (ArithmeticException exception) {
            throw validation("items", "Cart total exceeds the money limit");
        }
    }

    private BusinessException validation(String field, String message) {
        return new BusinessException(HttpStatus.UNPROCESSABLE_CONTENT, "VALIDATION_ERROR", message,
                java.util.Map.of(field, message));
    }
}
