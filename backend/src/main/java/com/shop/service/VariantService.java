package com.shop.service;

import com.shop.dto.CatalogDtos.VariantDto;
import com.shop.dto.CatalogDtos.VariantWrite;
import com.shop.entity.ProductVariant;
import com.shop.entity.SaleType;
import com.shop.exception.BusinessException;
import com.shop.mapper.CatalogMapper;
import com.shop.repository.ProductRepository;
import com.shop.repository.ProductVariantRepository;
import java.math.BigDecimal;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VariantService {
    private final ProductVariantRepository variants; private final ProductRepository products; private final CatalogMapper mapper;
    public VariantService(ProductVariantRepository variants, ProductRepository products, CatalogMapper mapper) { this.variants=variants;this.products=products;this.mapper=mapper; }
    @Transactional public VariantDto create(long productId, VariantWrite b) { var p=products.findById(productId).orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND,"NOT_FOUND","Product not found")); validate(p.getSaleType(),b); String sku=sku(b.sku()); unique(sku,null); return mapper.variant(variants.save(new ProductVariant(p,b.name().trim(),sku,b.price(),b.minQuantity(),b.quantityStep(),bool(b.isActive()),intv(b.sortOrder())))); }
    @Transactional public VariantDto update(long id, VariantWrite b) { ProductVariant v=get(id); validate(v.getProduct().getSaleType(),b); String sku=sku(b.sku()); unique(sku,id); v.setName(b.name().trim());v.setSku(sku);v.setPrice(b.price());v.setMinQuantity(b.minQuantity());v.setQuantityStep(b.quantityStep());v.setActive(bool(b.isActive(),v.isActive()));v.setSortOrder(intv(b.sortOrder()));return mapper.variant(variants.save(v)); }
    @Transactional public VariantDto status(long id, boolean active) { ProductVariant v=get(id);v.setActive(active);return mapper.variant(variants.save(v)); }
    private ProductVariant get(long id) { return variants.findById(id).orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND,"NOT_FOUND","Variant not found")); }
    private void unique(String sku, Long id) { if(sku!=null) variants.findBySku(sku).filter(v->id==null||!v.getId().equals(id)).ifPresent(v->{throw new BusinessException(HttpStatus.CONFLICT,"CONFLICT","Variant SKU already exists");}); }
    private void validate(SaleType type, VariantWrite b) { if(b.minQuantity().scale()>2||b.quantityStep().scale()>2||b.minQuantity().signum()<=0||b.quantityStep().signum()<=0) throw new BusinessException(HttpStatus.UNPROCESSABLE_CONTENT,"VALIDATION_ERROR","Invalid quantity rule"); if(type==SaleType.FIXED_PRICE && b.price()==null || type==SaleType.QUOTE && b.price()!=null) throw new BusinessException(HttpStatus.UNPROCESSABLE_CONTENT,"VALIDATION_ERROR","Price is incompatible with sale type"); if(type==SaleType.FIXED_PRICE && (notInteger(b.price(),b.minQuantity())||notInteger(b.price(),b.quantityStep()))) throw new BusinessException(HttpStatus.UNPROCESSABLE_CONTENT,"VALIDATION_ERROR","Price must produce whole VND"); }
    private boolean notInteger(Long price, BigDecimal quantity) { return BigDecimal.valueOf(price).multiply(quantity).stripTrailingZeros().scale()>0; }
    private String sku(String s) { return s==null||s.trim().isEmpty()?null:s.trim(); }
    private boolean bool(Boolean b) { return b==null||b; } private boolean bool(Boolean b,boolean f){return b==null?f:b;} private int intv(Integer i){return i==null?0:i;}
}
