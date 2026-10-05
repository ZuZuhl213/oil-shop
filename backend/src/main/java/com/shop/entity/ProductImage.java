package com.shop.entity;

import jakarta.persistence.*;

@Entity @Table(name = "product_images")
public class ProductImage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "product_id", nullable = false) private Product product;
    @Column(nullable = false, columnDefinition = "text") private String url;
    @Column(name = "sort_order", nullable = false) private int sortOrder;
    protected ProductImage() {}
    public ProductImage(Product product, String url, int sortOrder) { this.product=product; this.url=url; this.sortOrder=sortOrder; }
    public Long getId() { return id; }
    public Product getProduct() { return product; }
    public String getUrl() { return url; }
    public int getSortOrder() { return sortOrder; }
}
