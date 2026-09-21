package com.shop.mapper;

import com.shop.dto.CatalogDtos.CategoryDto;
import com.shop.dto.CatalogDtos.ProductDto;
import com.shop.dto.CatalogDtos.VariantDto;
import com.shop.entity.Category;
import com.shop.entity.Product;
import com.shop.entity.ProductVariant;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class CatalogMapper {
    public CategoryDto category(Category value) {
        return new CategoryDto(value.getId().toString(), value.getName(), value.getSlug(), value.getDescription(),
                value.getSortOrder(), value.isActive());
    }
    public VariantDto variant(ProductVariant value) {
        return new VariantDto(value.getId().toString(), value.getProduct().getId().toString(), value.getName(),
                value.getSku(), value.getPrice(), value.getMinQuantity(), value.getQuantityStep(), value.isActive(),
                value.getSortOrder());
    }
    public ProductDto product(Product value, List<ProductVariant> variants) {
        return new ProductDto(value.getId().toString(), value.getCategory().getId().toString(), value.getName(),
                value.getSlug(), value.getShortDescription(), value.getDescription(), value.getThumbnailUrl(),
                value.getSaleType(), value.getStatus().name(), value.getSortOrder(), variants.stream().map(this::variant).toList());
    }
}
