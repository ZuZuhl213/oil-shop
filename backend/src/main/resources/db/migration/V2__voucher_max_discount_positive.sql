-- V1 allowed zero for percent vouchers. Treat the legacy value as an unset
-- cap before enforcing the new positive-only rule.
UPDATE vouchers
SET max_discount = NULL
WHERE discount_type = 'PERCENT'
  AND max_discount = 0;

ALTER TABLE vouchers
    DROP CONSTRAINT ck_vouchers_max_discount;

ALTER TABLE vouchers
    ADD CONSTRAINT ck_vouchers_max_discount
    CHECK (max_discount IS NULL OR max_discount BETWEEN 1 AND 9000000000000);
