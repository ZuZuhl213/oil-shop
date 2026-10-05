package com.shop.service;

import com.shop.dto.CatalogDtos.ProductWrite;
import com.shop.entity.Product;
import com.shop.entity.ProductImage;
import com.shop.exception.BusinessException;
import com.shop.repository.ProductImageRepository;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/** Owns ordered image references. Object storage lifecycle is deliberately separate. */
@Service
public class ProductImagesService {
    private final ProductImageRepository images;
    private final ThumbnailUrlPolicy urls;
    public ProductImagesService(ProductImageRepository images, ThumbnailUrlPolicy urls) { this.images=images; this.urls=urls; }
    public List<ProductImage> get(long productId) { return images.findByProductIdOrderBySortOrderAsc(productId); }
    public Map<Long,List<ProductImage>> forProducts(List<Product> products) {
        if (products.isEmpty()) return Map.of();
        return images.findByProductIdInOrderBySortOrderAsc(products.stream().map(Product::getId).toList()).stream()
            .collect(Collectors.groupingBy(image -> image.getProduct().getId()));
    }
    public void initialize(Product product, ProductWrite body) {
        List<String> desired = desired(body);
        write(product, desired);
    }
    /** Caller must hold the product row lock for the entire surrounding transaction. */
    public void update(Product product, ProductWrite body) {
        var current = get(product.getId());
        String cover = urls.validate(body.thumbnailUrl());
        final List<String> desired;
        if (body.imageUrls() == null) {
            if (Objects.equals(cover, product.getThumbnailUrl())) return;
            if (!current.isEmpty()) throw invalid("thumbnailUrl", "Send imageUrls and expectedImagesRevision to change the gallery cover");
            desired = cover == null ? List.of() : List.of(cover);
        } else {
            if (body.expectedImagesRevision() == null) throw invalid("expectedImagesRevision", "Image revision is required");
            if (body.expectedImagesRevision() != product.getImagesRevision()) throw new BusinessException(HttpStatus.CONFLICT,
                "IMAGE_CONFLICT", "Product images have changed; reload and review before saving");
            desired = desired(body);
        }
        if (current.stream().map(ProductImage::getUrl).toList().equals(desired) && Objects.equals(product.getThumbnailUrl(),cover)) return;
        images.deleteAll(current);
        images.flush(); // Remove old unique positions before inserting the new order.
        write(product,desired);
        product.setThumbnailUrl(cover);
        product.incrementImagesRevision();
    }
    private List<String> desired(ProductWrite body) {
        String cover = urls.validate(body.thumbnailUrl());
        if (body.imageUrls() == null) return cover == null ? List.of() : List.of(cover);
        if (body.imageUrls().size() > 10) throw invalid("imageUrls", "Maximum 10 images per product");
        List<String> values = new ArrayList<>();
        for (String value : body.imageUrls()) {
            String valid;
            try { valid = urls.validate(value); }
            catch (BusinessException invalidUrl) { throw invalid("imageUrls", "Use URLs from the configured media origin"); }
            if (valid == null || values.contains(valid)) throw invalid("imageUrls", "Image URLs must be non-empty and unique");
            values.add(valid);
        }
        if (values.isEmpty() ? cover != null : cover == null || !values.contains(cover)) throw invalid("thumbnailUrl", "Choose a cover from the product images");
        return List.copyOf(values);
    }
    private void write(Product product,List<String> values) {
        for (int i=0;i<values.size();i++) images.save(new ProductImage(product,values.get(i),i));
    }
    private BusinessException invalid(String field,String message) {
        return new BusinessException(HttpStatus.UNPROCESSABLE_CONTENT,"VALIDATION_ERROR",message,Map.of(field,message));
    }
}
