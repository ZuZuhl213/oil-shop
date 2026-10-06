-- Keep historical item snapshots when their catalog entries are deleted.
ALTER TABLE order_items DROP CONSTRAINT fk_order_items_product;
ALTER TABLE order_items ADD CONSTRAINT fk_order_items_product
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

ALTER TABLE order_items DROP CONSTRAINT fk_order_items_variant;
ALTER TABLE order_items ADD CONSTRAINT fk_order_items_variant
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL;

ALTER TABLE product_variants DROP CONSTRAINT fk_product_variants_product;
ALTER TABLE product_variants ADD CONSTRAINT fk_product_variants_product
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
