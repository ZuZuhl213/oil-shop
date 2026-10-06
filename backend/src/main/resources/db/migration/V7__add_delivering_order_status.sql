ALTER TABLE orders DROP CONSTRAINT ck_orders_status;

ALTER TABLE orders
    ADD CONSTRAINT ck_orders_status
    CHECK (status IN ('NEW', 'CONTACTED', 'CONFIRMED', 'DELIVERING', 'COMPLETED', 'CANCELLED'));
