package com.shop.repository;

import com.shop.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Collection;
import java.util.Optional;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {
    List<ProductVariant> findByProductIdOrderBySortOrderAscIdAsc(Long productId);
    List<ProductVariant> findAllByProductIdInOrderBySortOrderAscIdAsc(Collection<Long> productIds);
    Optional<ProductVariant> findBySku(String sku);
}
