package com.shop.dto;

import java.math.BigDecimal;

public record PricedLine(CatalogLine catalog, BigDecimal quantity, Long unitPrice, Long lineTotal) {
}
