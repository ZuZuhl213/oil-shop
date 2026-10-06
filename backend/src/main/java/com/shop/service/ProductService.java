package com.shop.service;

import com.shop.dto.CatalogDtos.ProductDto;
import com.shop.dto.CatalogDtos.ProductWrite;
import com.shop.dto.CatalogDtos.PageDto;
import com.shop.entity.Category;
import com.shop.entity.Product;
import com.shop.entity.ProductStatus;
import com.shop.exception.BusinessException;
import com.shop.mapper.CatalogMapper;
import com.shop.repository.CategoryRepository;
import com.shop.repository.ProductRepository;
import com.shop.repository.ProductVariantRepository;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductService {
    private final ProductRepository products; private final CategoryRepository categories; private final ProductVariantRepository variants; private final CatalogMapper mapper; private final ThumbnailUrlPolicy thumbnailUrls; private final ProductImagesService images;
    public ProductService(ProductRepository products, CategoryRepository categories, ProductVariantRepository variants, CatalogMapper mapper, ThumbnailUrlPolicy thumbnailUrls, ProductImagesService images) { this.products=products; this.categories=categories; this.variants=variants; this.mapper=mapper; this.thumbnailUrls=thumbnailUrls; this.images=images; }
    @Transactional(readOnly = true) public PageDto<ProductDto> list(int page, int size) {
        Page<Product> values = products.findAllByOrderBySortOrderAscIdAsc(PageRequest.of(page, size, Sort.by(Sort.Order.asc("sortOrder"), Sort.Order.asc("id"))));
        List<Product> pageProducts = values.getContent();
        Map<Long, List<com.shop.entity.ProductVariant>> variantsByProduct = pageProducts.isEmpty()
                ? Map.of()
                : variants.findAllByProductIdInOrderBySortOrderAscIdAsc(pageProducts.stream().map(Product::getId).toList())
                        .stream().collect(Collectors.groupingBy(v -> v.getProduct().getId(), Collectors.toList()));
        var imagesByProduct = images.forProducts(pageProducts);
        Page<ProductDto> mapped = values.map(p -> mapper.product(p, variantsByProduct.getOrDefault(p.getId(), List.of()), imagesByProduct.getOrDefault(p.getId(), List.of())));
        return new PageDto<>(mapped.getContent(), mapped.getNumber(), mapped.getSize(), mapped.getTotalElements(), mapped.getTotalPages());
    }
    @Transactional(readOnly = true) public ProductDto getAdmin(long id) { Product p=get(id); return mapper.product(p, variants.findByProductIdOrderBySortOrderAscIdAsc(id), images.get(id)); }
    @Transactional public ProductDto create(ProductWrite b) { Category c=category(b.categoryId()); String slug=CategoryService.normalizeSlug(b.slug(), 180); unique(slug,null); Product p=new Product(c,b.name().trim(),slug,CategoryService.trim(b.shortDescription()),CategoryService.trim(b.description()),thumbnailUrls.validate(b.thumbnailUrl()),b.saleType(),status(b.status()),CategoryService.value(b.sortOrder())); products.save(p); images.initialize(p,b); return mapper.product(p, java.util.List.of(), images.get(p.getId())); }
    @Transactional public ProductDto update(long id, ProductWrite b) { Product p=getForUpdate(id); Category c=category(b.categoryId()); String slug=CategoryService.normalizeSlug(b.slug(), 180); unique(slug,id); if (b.saleType()!=p.getSaleType()) throw new BusinessException(HttpStatus.UNPROCESSABLE_CONTENT,"VALIDATION_ERROR","saleType cannot be changed"); images.update(p,b); p.setCategory(c);p.setSlug(slug);p.setName(b.name().trim());p.setShortDescription(CategoryService.trim(b.shortDescription()));p.setDescription(CategoryService.trim(b.description()));p.setStatus(status(b.status()));p.setSortOrder(CategoryService.value(b.sortOrder())); return mapper.product(products.save(p),variants.findByProductIdOrderBySortOrderAscIdAsc(id),images.get(id)); }
    @Transactional public ProductDto status(long id, ProductStatus value) { Product p=getForUpdate(id);p.setStatus(value);return mapper.product(products.save(p),variants.findByProductIdOrderBySortOrderAscIdAsc(id),images.get(id)); }
    @Transactional
    public void delete(long id) {
        // FK actions delete variants/images and detach historical items atomically.
        // Storage objects may be shared, so this does not delete media from R2.
        Product product = getForUpdate(id);
        products.delete(product);
        products.flush();
    }
    private Product getForUpdate(long id) { return products.findByIdForUpdate(id).orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND,"NOT_FOUND","Product not found")); }
    Product get(long id) { return products.findById(id).orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND,"NOT_FOUND","Product not found")); }
    Category category(String id) {
        final long categoryId;
        try {
            categoryId = Long.parseLong(id);
        } catch (NumberFormatException exception) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Category not found");
        }
        return categories.findById(categoryId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Category not found"));
    }
    private void unique(String slug, Long id) { products.findBySlug(slug).filter(p -> id==null || !p.getId().equals(id)).ifPresent(p->{throw new BusinessException(HttpStatus.CONFLICT,"CONFLICT","Product slug already exists");}); }
    private ProductStatus status(String value) { try { return value==null?ProductStatus.ACTIVE:ProductStatus.valueOf(value); } catch(Exception e) { throw new BusinessException(HttpStatus.UNPROCESSABLE_CONTENT,"VALIDATION_ERROR","Invalid product status"); } }
}
