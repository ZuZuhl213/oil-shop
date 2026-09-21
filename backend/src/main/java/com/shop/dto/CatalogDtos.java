package com.shop.dto;

import com.shop.entity.SaleType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

public final class CatalogDtos {
    private CatalogDtos() {}
    public record CategoryWrite(@NotBlank @Size(max = 100) String name, @NotBlank @Size(max = 120) String slug,
                                @Size(max = 10000) String description, Integer sortOrder, Boolean isActive) {}
    public record ProductWrite(@NotBlank String categoryId, @NotBlank @Size(max = 150) String name,
                               @NotBlank @Size(max = 180) String slug, String shortDescription, String description,
                               String thumbnailUrl, @NotNull SaleType saleType, String status, Integer sortOrder) {}
    public record VariantWrite(@NotBlank @Size(max = 100) String name, @Size(max = 50) String sku, Long price,
                               @NotNull @DecimalMin("0.01") BigDecimal minQuantity,
                               @NotNull @DecimalMin("0.01") BigDecimal quantityStep, Boolean isActive, Integer sortOrder) {}
    public record StatusWrite(@NotNull Boolean isActive) {}
    public record CategoryDto(String id, String name, String slug, String description, int sortOrder, boolean isActive) {}
    public record VariantDto(String id, String productId, String name, String sku, Long price, BigDecimal minQuantity,
                             BigDecimal quantityStep, boolean isActive, int sortOrder) {}
    public record ProductDto(String id, String categoryId, String name, String slug, String shortDescription,
                             String description, String thumbnailUrl, SaleType saleType, String status, int sortOrder,
                             List<VariantDto> variants) {}
}
