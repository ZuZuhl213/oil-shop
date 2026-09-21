package com.shop.service;

import com.shop.dto.CatalogDtos.ProductDto;
import com.shop.dto.CatalogDtos.ProductWrite;
import com.shop.entity.Category;
import com.shop.entity.Product;
import com.shop.entity.ProductStatus;
import com.shop.exception.BusinessException;
import com.shop.mapper.CatalogMapper;
import com.shop.repository.CategoryRepository;
import com.shop.repository.ProductRepository;
import com.shop.repository.ProductVariantRepository;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductService {
    private final ProductRepository products; private final CategoryRepository categories; private final ProductVariantRepository variants; private final CatalogMapper mapper;
    public ProductService(ProductRepository products, CategoryRepository categories, ProductVariantRepository variants, CatalogMapper mapper) { this.products=products; this.categories=categories; this.variants=variants; this.mapper=mapper; }
    @Transactional(readOnly = true) public Page<ProductDto> list(int page, int size) { return products.findAllByOrderBySortOrderAscIdAsc(PageRequest.of(page, size, Sort.by(Sort.Order.asc("sortOrder"), Sort.Order.asc("id")))).map(p -> mapper.product(p, variants.findByProductIdOrderBySortOrderAscIdAsc(p.getId()))); }
    @Transactional(readOnly = true) public ProductDto getAdmin(long id) { Product p=get(id); return mapper.product(p, variants.findByProductIdOrderBySortOrderAscIdAsc(id)); }
    @Transactional public ProductDto create(ProductWrite b) { Category c=category(b.categoryId()); String slug=CategoryService.slug(b.slug()); unique(slug,null); Product p=new Product(c,b.name().trim(),slug,CategoryService.trim(b.shortDescription()),CategoryService.trim(b.description()),thumbnail(b.thumbnailUrl()),b.saleType(),status(b.status()),CategoryService.value(b.sortOrder())); return mapper.product(products.save(p), java.util.List.of()); }
    @Transactional public ProductDto update(long id, ProductWrite b) { Product p=get(id); Category c=category(b.categoryId()); String slug=CategoryService.slug(b.slug()); unique(slug,id); if (b.saleType()!=p.getSaleType()) throw new BusinessException(HttpStatus.UNPROCESSABLE_CONTENT,"VALIDATION_ERROR","saleType cannot be changed"); p.setCategory(c);p.setSlug(slug);p.setName(b.name().trim());p.setShortDescription(CategoryService.trim(b.shortDescription()));p.setDescription(CategoryService.trim(b.description()));p.setThumbnailUrl(thumbnail(b.thumbnailUrl()));p.setStatus(status(b.status()));p.setSortOrder(CategoryService.value(b.sortOrder())); return mapper.product(products.save(p),variants.findByProductIdOrderBySortOrderAscIdAsc(id)); }
    @Transactional public ProductDto status(long id, ProductStatus value) { Product p=get(id);p.setStatus(value);return mapper.product(products.save(p),variants.findByProductIdOrderBySortOrderAscIdAsc(id)); }
    Product get(long id) { return products.findById(id).orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND,"NOT_FOUND","Product not found")); }
    Category category(String id) { try { return categories.findById(Long.parseLong(id)).orElseThrow(); } catch(Exception e) { throw new BusinessException(HttpStatus.NOT_FOUND,"NOT_FOUND","Category not found"); } }
    private void unique(String slug, Long id) { products.findBySlug(slug).filter(p -> id==null || !p.getId().equals(id)).ifPresent(p->{throw new BusinessException(HttpStatus.CONFLICT,"CONFLICT","Product slug already exists");}); }
    private ProductStatus status(String value) { try { return value==null?ProductStatus.ACTIVE:ProductStatus.valueOf(value); } catch(Exception e) { throw new BusinessException(HttpStatus.UNPROCESSABLE_CONTENT,"VALIDATION_ERROR","Invalid product status"); } }
    private String thumbnail(String value) {
        String normalized = CategoryService.trim(value);
        if (normalized != null && !normalized.startsWith("https://")) {
            throw new BusinessException(HttpStatus.UNPROCESSABLE_CONTENT, "VALIDATION_ERROR", "Thumbnail URL must use HTTPS");
        }
        return normalized;
    }
}
