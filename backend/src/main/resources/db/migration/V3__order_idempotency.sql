ALTER TABLE orders
    ADD COLUMN idempotency_key UUID,
    ADD COLUMN request_hash VARCHAR(64);

-- Orders created before idempotency was introduced cannot be replayed because
-- their original request is unavailable. Give each row its own deterministic
-- key and sentinel hash so the new NOT NULL/UNIQUE contract is safe to apply.
UPDATE orders
SET idempotency_key = md5('legacy-order:' || id::text)::uuid,
    request_hash = md5('legacy-request:' || id::text)
                 || md5('legacy-request-hash:' || id::text)
WHERE idempotency_key IS NULL;

ALTER TABLE orders
    ALTER COLUMN idempotency_key SET NOT NULL,
    ALTER COLUMN request_hash SET NOT NULL;

ALTER TABLE orders
    ADD CONSTRAINT uq_orders_idempotency_key UNIQUE (idempotency_key),
    ADD CONSTRAINT ck_orders_request_hash CHECK (length(request_hash) = 64);
