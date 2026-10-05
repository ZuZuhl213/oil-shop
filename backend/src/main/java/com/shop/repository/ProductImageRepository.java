package com.shop.repository;

import com.shop.entity.ProductImage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {
    List<ProductImage> findByProductIdOrderBySortOrderAsc(long productId);
    List<ProductImage> findByProductIdInOrderBySortOrderAsc(List<Long> productIds);
}
