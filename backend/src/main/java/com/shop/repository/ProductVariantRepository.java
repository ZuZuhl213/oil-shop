package com.shop.repository;

import com.shop.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Collection;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {
    List<ProductVariant> findByProductIdOrderBySortOrderAscIdAsc(Long productId);
    List<ProductVariant> findAllByProductIdInOrderBySortOrderAscIdAsc(Collection<Long> productIds);
    @Query("select v from ProductVariant v join fetch v.product p join fetch p.category c where v.id in :ids")
    List<ProductVariant> findAllByIdInWithProductAndCategory(@Param("ids") Collection<Long> ids);
    Optional<ProductVariant> findBySku(String sku);
}
