package com.shop.repository;

import com.shop.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;

public interface ProductRepository extends JpaRepository<Product, Long> {
    String PUBLIC_VISIBILITY = "p.status = com.shop.entity.ProductStatus.ACTIVE and p.category.active = true "
            + "and exists (select v.id from ProductVariant v where v.product = p and v.active = true)";

    Optional<Product> findBySlug(String slug);
    List<Product> findAllByOrderBySortOrderAscIdAsc();
    Page<Product> findAllByOrderBySortOrderAscIdAsc(Pageable pageable);
    @Query("select p from Product p where " + PUBLIC_VISIBILITY)
    Page<Product> findPublic(Pageable pageable);
    @Query("select p from Product p where " + PUBLIC_VISIBILITY + " "
            + "and p.category.slug = :category")
    Page<Product> findPublicByCategory(String category, Pageable pageable);
    @Query("select p from Product p where " + PUBLIC_VISIBILITY + " "
            + "and (lower(p.name) like lower(concat('%', :keyword, '%')) "
            + "or lower(coalesce(p.shortDescription, '')) like lower(concat('%', :keyword, '%')))")
    Page<Product> findPublicByKeyword(String keyword, Pageable pageable);
    @Query("select p from Product p where " + PUBLIC_VISIBILITY + " "
            + "and p.category.slug = :category "
            + "and (lower(p.name) like lower(concat('%', :keyword, '%')) "
            + "or lower(coalesce(p.shortDescription, '')) like lower(concat('%', :keyword, '%')))")
    Page<Product> findPublicByCategoryAndKeyword(String category, String keyword, Pageable pageable);
    @Query("select p from Product p where " + PUBLIC_VISIBILITY + " "
            + "and p.slug = :slug")
    Optional<Product> findPublicBySlug(String slug);
}
