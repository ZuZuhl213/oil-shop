package com.shop.dto;

import com.shop.entity.SaleType;
import java.math.BigDecimal;

public record CatalogLine(Long variantId, Long productId, String productName, String variantName, SaleType saleType,
                          Long price, BigDecimal minQuantity, BigDecimal quantityStep) {}
