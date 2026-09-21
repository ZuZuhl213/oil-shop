package com.shop.dto;

import com.shop.entity.SaleType;
import java.util.List;

public record CalculatedCart(List<PricedLine> lines, Long subtotal, SaleType saleType) {
}
