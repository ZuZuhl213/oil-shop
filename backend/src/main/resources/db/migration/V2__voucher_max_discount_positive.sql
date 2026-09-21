ALTER TABLE vouchers
    DROP CONSTRAINT ck_vouchers_max_discount;

ALTER TABLE vouchers
    ADD CONSTRAINT ck_vouchers_max_discount
    CHECK (max_discount IS NULL OR max_discount BETWEEN 1 AND 9000000000000);
