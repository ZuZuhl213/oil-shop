package com.shop.service;

import com.shop.dto.CatalogLine;
import com.shop.dto.CatalogDtos.CategoryDto;
import com.shop.dto.CatalogDtos.ProductDto;
import com.shop.dto.CatalogDtos.PageDto;
import com.shop.entity.ProductVariant;
import com.shop.exception.BusinessException;
import com.shop.mapper.CatalogMapper;
import com.shop.repository.CategoryRepository;
import com.shop.repository.ProductRepository;
import com.shop.repository.ProductVariantRepository;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CatalogQueryService {
    private final CategoryRepository categories; private final ProductRepository products; private final ProductVariantRepository variants; private final CatalogMapper mapper;
    public CatalogQueryService(CategoryRepository categories, ProductRepository products, ProductVariantRepository variants, CatalogMapper mapper) { this.categories=categories;this.products=products;this.variants=variants;this.mapper=mapper; }
    @Transactional(readOnly = true) public List<CategoryDto> publicCategories() { return categories.findAllByOrderBySortOrderAscIdAsc().stream().filter(c -> c.isActive()).map(mapper::category).toList(); }
    @Transactional(readOnly = true) public PageDto<ProductDto> publicProducts(int page, int size, String category, String keyword) {
        PageRequest request = PageRequest.of(page, size, Sort.by(Sort.Order.asc("sortOrder"), Sort.Order.asc("id")));
        String normalizedCategory = blank(category);
        String normalizedKeyword = blank(keyword);
        Page<com.shop.entity.Product> values;
        if (normalizedCategory == null && normalizedKeyword == null) {
            values = products.findPublic(request);
        } else if (normalizedCategory == null) {
            values = products.findPublicByKeyword(normalizedKeyword, request);
        } else if (normalizedKeyword == null) {
            values = products.findPublicByCategory(normalizedCategory, request);
        } else {
            values = products.findPublicByCategoryAndKeyword(normalizedCategory, normalizedKeyword, request);
        }
        List<com.shop.entity.Product> pageProducts = values.getContent();
        List<ProductVariant> pageVariants = pageProducts.isEmpty()
                ? List.of()
                : variants.findAllByProductIdInOrderBySortOrderAscIdAsc(
                        pageProducts.stream().map(com.shop.entity.Product::getId).toList());
        Map<Long, List<ProductVariant>> variantsByProduct = pageVariants.stream()
                .filter(ProductVariant::isActive)
                .collect(Collectors.groupingBy(v -> v.getProduct().getId(), Collectors.toList()));
        Page<ProductDto> mapped = values.map(p -> mapper.product(p, variantsByProduct.getOrDefault(p.getId(), List.of())));
        return new PageDto<>(mapped.getContent(), mapped.getNumber(), mapped.getSize(), mapped.getTotalElements(), mapped.getTotalPages());
    }
    @Transactional(readOnly = true) public ProductDto publicProduct(String slug) {
        var product = products.findPublicBySlug(slug).orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND,"NOT_FOUND","Product not found"));
        var active = variants.findByProductIdOrderBySortOrderAscIdAsc(product.getId()).stream().filter(ProductVariant::isActive).toList();
        return mapper.product(product, active);
    }
    @Transactional(readOnly = true) public List<CatalogLine> loadSellable(List<Long> ids) {
        if (ids.isEmpty()) {
            return List.of();
        }
        Map<Long, ProductVariant> byId = new HashMap<>();
        List<Long> lookupIds = ids.stream().filter(Objects::nonNull).distinct().toList();
        if (!lookupIds.isEmpty()) {
            variants.findAllByIdInWithProductAndCategory(lookupIds)
                    .forEach(variant -> byId.put(variant.getId(), variant));
        }
        return ids.stream().map(id -> {
            ProductVariant variant = byId.get(id);
            if (variant == null || !variant.isActive()
                    || variant.getProduct().getStatus() != com.shop.entity.ProductStatus.ACTIVE
                    || !variant.getProduct().getCategory().isActive()) {
                throw new BusinessException(HttpStatus.UNPROCESSABLE_CONTENT, "ITEM_UNAVAILABLE", "Catalog item is unavailable",
                        Map.of("variantId", String.valueOf(id)));
            }
            return new CatalogLine(variant.getId(), variant.getProduct().getId(), variant.getProduct().getName(),
                    variant.getName(), variant.getProduct().getSaleType(), variant.getPrice(),
                    variant.getMinQuantity(), variant.getQuantityStep());
        }).toList();
    }
    private String blank(String v) { return v == null || v.isBlank() ? null : v.trim(); }
}
