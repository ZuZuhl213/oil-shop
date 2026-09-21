package com.shop;

import com.shop.support.PostgresIntegrationTest;
import java.math.BigDecimal;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.UUID;
import java.util.stream.Stream;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;

@SpringBootTest
@ActiveProfiles("test")
class SchemaIT extends PostgresIntegrationTest {

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private Flyway flyway;

    @BeforeEach
    void cleanBusinessTables() {
        jdbc.execute("""
                TRUNCATE TABLE order_items, orders, product_variants, products,
                    categories, vouchers, admins RESTART IDENTITY CASCADE
                """);
    }

    @Test
    void migratesSevenTablesAndAcceptsValidRowsIdempotently() {
        long categoryId = createCategory("dau-thuc-vat");
        long productId = createProduct(categoryId, "dau-lac", "FIXED_PRICE");
        long variantId = createVariant(productId, "L1", 170_000L, "1.00", "1.00");
        long voucherId = createVoucher("WELCOME", "PERCENT", 10, 50_000L, 10, 0);
        long orderId = createOrder(
                "DH-20260920-1", "ORDER", 170_000L, 0L, 170_000L, voucherId, "WELCOME");
        createOrderItem(orderId, productId, variantId, "1.00", 170_000L, 170_000L);
        createAdmin("admin@example.com");

        Integer tableCount = jdbc.queryForObject("""
                SELECT COUNT(*)
                FROM information_schema.tables
                WHERE table_schema = 'public'
                  AND table_name IN (
                    'categories', 'products', 'product_variants', 'vouchers',
                    'orders', 'order_items', 'admins')
                """, Integer.class);
        assertThat(tableCount).isEqualTo(7);

        assertThat(flyway.migrate().migrationsExecuted).isZero();
        assertThat(jdbc.queryForObject(
                "SELECT COUNT(*) FROM categories WHERE id = ?", Integer.class, categoryId))
                .isEqualTo(1);
    }

    @ParameterizedTest(name = "rejects product sale_type {0}")
    @MethodSource("invalidSaleTypes")
    void rejectsUnknownProductEnums(String saleType) {
        long categoryId = createCategory("category-" + UUID.randomUUID());
        assertConstraint("ck_products_sale_type", () -> jdbc.update("""
                INSERT INTO products (category_id, name, slug, sale_type, status)
                VALUES (?, 'Product', ?, ?, 'ACTIVE')
                """, categoryId, "product-" + UUID.randomUUID(), saleType));
    }

    static Stream<Arguments> invalidSaleTypes() {
        return Stream.of(Arguments.of("fixed_price"), Arguments.of("UNKNOWN"));
    }

    @Test
    void rejectsUnknownStatusAndDiscountEnums() {
        long categoryId = createCategory("enum-category");
        long productId = createProduct(categoryId, "enum-product", "FIXED_PRICE");
        long orderId = createOrder("DH-20260920-9", "ORDER", 100L, 0L, 100L, null, null);

        assertConstraint("ck_products_status", () -> jdbc.update(
                "UPDATE products SET status = 'ARCHIVED' WHERE id = ?", productId));
        assertConstraint("ck_vouchers_discount_type", () -> createVoucher(
                "BADTYPE", "UNKNOWN", 10, null, 1, 0));
        assertConstraint("ck_orders_status", () -> jdbc.update(
                "UPDATE orders SET status = 'PAID' WHERE id = ?", orderId));
    }

    @Test
    void rejectsNegativeMoneyAndInvalidVoucherRules() {
        long categoryId = createCategory("category-money");
        long productId = createProduct(categoryId, "product-money", "FIXED_PRICE");

        assertConstraint("ck_product_variants_price", () -> createVariant(
                productId, "NEGATIVE", -1L, "1.00", "1.00"));
        assertConstraint("ck_vouchers_usage", () -> createVoucher(
                "OVERUSED", "FIXED", 10_000, null, 1, 2));
        assertConstraint("ck_vouchers_time_window", () -> jdbc.update("""
                INSERT INTO vouchers (
                    code, discount_type, discount_value, min_order_value,
                    quantity, used_count, start_at, end_at)
                VALUES ('BADTIME', 'FIXED', 1000, 0, 1, 0, ?, ?)
                """, OffsetDateTime.parse("2026-09-21T00:00:00Z"),
                OffsetDateTime.parse("2026-09-20T00:00:00Z")));
        assertConstraint("ck_vouchers_discount", () -> createVoucher(
                "PERCENT101", "PERCENT", 101, null, 1, 0));
        assertConstraint("ck_vouchers_max_discount", () -> createVoucher(
                "ZEROMAX", "PERCENT", 10, 0L, 1, 0));
    }

    @ParameterizedTest(name = "rejects variant {0}={1}")
    @MethodSource("invalidVariantQuantities")
    void rejectsInvalidVariantQuantityRules(String column, String value) {
        long categoryId = createCategory("category-" + UUID.randomUUID());
        long productId = createProduct(categoryId, "product-" + UUID.randomUUID(), "FIXED_PRICE");
        String minQuantity = column.equals("min_quantity") ? value : "1.00";
        String quantityStep = column.equals("quantity_step") ? value : "1.00";

        assertConstraint("ck_product_variants_" + column, () -> createVariant(
                productId, "SKU-" + UUID.randomUUID(), 100L, minQuantity, quantityStep));
    }

    static Stream<Arguments> invalidVariantQuantities() {
        return Stream.of(
                Arguments.of("min_quantity", "0"),
                Arguments.of("min_quantity", "1.001"),
                Arguments.of("min_quantity", "100000000.00"),
                Arguments.of("quantity_step", "0"),
                Arguments.of("quantity_step", "0.001"),
                Arguments.of("quantity_step", "100000000.00"));
    }

    @ParameterizedTest(name = "rejects item quantity {0}")
    @MethodSource("invalidItemQuantities")
    void rejectsInvalidOrderItemQuantity(String quantity) {
        long categoryId = createCategory("category-quantity");
        long productId = createProduct(categoryId, "product-quantity", "FIXED_PRICE");
        long variantId = createVariant(productId, "QTY", 100L, "0.01", "0.01");
        long orderId = createOrder("DH-20260920-2", "ORDER", 100L, 0L, 100L, null, null);

        assertConstraint("ck_order_items_quantity", () -> createOrderItem(
                orderId, productId, variantId, quantity, 100L, 100L));
    }

    static Stream<Arguments> invalidItemQuantities() {
        return Stream.of(
                Arguments.of("0"),
                Arguments.of("0.001"),
                Arguments.of("100000000.00"));
    }

    @Test
    void rejectsPartiallyNullOrderItemAmounts() {
        long categoryId = createCategory("category-null-money");
        long productId = createProduct(categoryId, "product-null-money", "FIXED_PRICE");
        long variantId = createVariant(productId, "NULL-MONEY", 100L, "1.00", "1.00");
        long orderId = createOrder("DH-20260920-10", "ORDER", 100L, 0L, 100L, null, null);

        assertConstraint("ck_order_items_amounts", () -> createOrderItem(
                orderId, productId, variantId, "1.00", null, 100L));
        assertConstraint("ck_order_items_amounts", () -> createOrderItem(
                orderId, productId, variantId, "1.00", 100L, null));
    }

    @Test
    void enforcesOrderTypeMoneyAndVoucherConsistency() {
        long voucherId = createVoucher("ORDERONLY", "FIXED", 1_000, null, 10, 0);

        assertConstraint("ck_orders_amounts_by_type", () -> createOrder(
                "DH-20260920-3", "ORDER", null, 0L, null, null, null));
        assertConstraint("ck_orders_amounts_by_type", () -> createOrder(
                "BG-20260920-4", "QUOTE_REQUEST", 1L, 0L, 1L, null, null));
        assertConstraint("ck_orders_amounts_by_type", () -> createOrder(
                "BG-20260920-5", "QUOTE_REQUEST", null, 0L, null, voucherId, "ORDERONLY"));
        assertConstraint("ck_orders_amounts_by_type", () -> createOrder(
                "DH-20260920-6", "ORDER", 100L, 101L, -1L, null, null));
        assertConstraint("ck_orders_order_type", () -> createOrder(
                "DH-20260920-7", "UNKNOWN", 100L, 0L, 100L, null, null));
    }

    @Test
    void enforcesNormalizedAndUniqueBusinessKeys() {
        createCategory("unique-slug");
        assertConstraint("uq_categories_slug", () -> createCategory("unique-slug"));
        assertConstraint("ck_categories_slug_normalized", () -> createCategory("Unique-Slug"));

        createVoucher("UNIQUECODE", "FIXED", 1_000, null, 1, 0);
        assertConstraint("uq_vouchers_code", () -> createVoucher(
                "UNIQUECODE", "FIXED", 1_000, null, 1, 0));
        assertConstraint("ck_vouchers_code_normalized", () -> createVoucher(
                "uniquecode", "FIXED", 1_000, null, 1, 0));

        createAdmin("unique@example.com");
        assertConstraint("uq_admins_email", () -> createAdmin("unique@example.com"));
        assertConstraint("ck_admins_email_normalized", () -> createAdmin("Unique@Example.com"));
    }

    @Test
    void updateTriggerCoversAllSixMutableTables() {
        long categoryId = createCategory("trigger-category");
        long productId = createProduct(categoryId, "trigger-product", "FIXED_PRICE");
        long variantId = createVariant(productId, "TRIGGER", 100L, "1.00", "1.00");
        long voucherId = createVoucher("TRIGGER", "FIXED", 10, null, 1, 0);
        long orderId = createOrder("DH-20260920-8", "ORDER", 100L, 0L, 100L, null, null);
        long adminId = createAdmin("trigger@example.com");

        assertUpdatedAtChanges("categories", categoryId, "sort_order = sort_order + 1");
        assertUpdatedAtChanges("products", productId, "sort_order = sort_order + 1");
        assertUpdatedAtChanges("product_variants", variantId, "sort_order = sort_order + 1");
        assertUpdatedAtChanges("vouchers", voucherId, "is_active = NOT is_active");
        assertUpdatedAtChanges("orders", orderId, "admin_note = 'called'");
        assertUpdatedAtChanges("admins", adminId, "is_active = NOT is_active");
    }

    private long createCategory(String slug) {
        return jdbc.queryForObject("""
                INSERT INTO categories (name, slug) VALUES ('Category', ?) RETURNING id
                """, Long.class, slug);
    }

    private long createProduct(long categoryId, String slug, String saleType) {
        return jdbc.queryForObject("""
                INSERT INTO products (category_id, name, slug, sale_type, status)
                VALUES (?, 'Product', ?, ?, 'ACTIVE') RETURNING id
                """, Long.class, categoryId, slug, saleType);
    }

    private long createVariant(
            long productId,
            String sku,
            Long price,
            String minQuantity,
            String quantityStep) {
        return jdbc.queryForObject("""
                INSERT INTO product_variants (
                    product_id, name, sku, price, min_quantity, quantity_step)
                VALUES (?, 'Variant', ?, ?, ?::numeric, ?::numeric) RETURNING id
                """, Long.class, productId, sku, price, minQuantity, quantityStep);
    }

    private long createVoucher(
            String code,
            String discountType,
            long discountValue,
            Long maxDiscount,
            int quantity,
            int usedCount) {
        return jdbc.queryForObject("""
                INSERT INTO vouchers (
                    code, discount_type, discount_value, max_discount,
                    min_order_value, quantity, used_count)
                VALUES (?, ?, ?, ?, 0, ?, ?) RETURNING id
                """, Long.class, code, discountType, discountValue, maxDiscount, quantity, usedCount);
    }

    private long createOrder(
            String orderCode,
            String orderType,
            Long subtotal,
            long discountAmount,
            Long totalAmount,
            Long voucherId,
            String voucherCode) {
        return jdbc.queryForObject("""
                INSERT INTO orders (
                    order_code, order_type, customer_name, phone, subtotal,
                    discount_amount, total_amount, voucher_id, voucher_code_snapshot,
                    idempotency_key, request_hash)
                VALUES (?, ?, 'Nguyễn Văn An', '0912345678', ?, ?, ?, ?, ?, ?, ?) RETURNING id
                """, Long.class, orderCode, orderType, subtotal, discountAmount,
                totalAmount, voucherId, voucherCode, UUID.randomUUID(), "0".repeat(64));
    }

    private long createOrderItem(
            long orderId,
            long productId,
            long variantId,
            String quantity,
            Long unitPrice,
            Long lineTotal) {
        return jdbc.queryForObject("""
                INSERT INTO order_items (
                    order_id, product_id, variant_id, product_name_snapshot,
                    variant_name_snapshot, quantity, unit_price, line_total)
                VALUES (?, ?, ?, 'Dầu lạc', '1L', ?::numeric, ?, ?) RETURNING id
                """, Long.class, orderId, productId, variantId, quantity, unitPrice, lineTotal);
    }

    private long createAdmin(String email) {
        return jdbc.queryForObject("""
                INSERT INTO admins (email, password_hash, name)
                VALUES (?, '$2a$10$test.hash.value', 'Admin') RETURNING id
                """, Long.class, email);
    }

    private void assertUpdatedAtChanges(String table, long id, String updateExpression) {
        jdbc.update("UPDATE " + table + " SET updated_at = TIMESTAMPTZ '2000-01-01T00:00:00Z' WHERE id = ?", id);
        jdbc.update("UPDATE " + table + " SET " + updateExpression + " WHERE id = ?", id);
        OffsetDateTime updatedAt = jdbc.queryForObject(
                "SELECT updated_at FROM " + table + " WHERE id = ?", OffsetDateTime.class, id);
        assertThat(updatedAt).isAfter(OffsetDateTime.parse("2000-01-01T00:00:00Z"));
    }

    private void assertConstraint(String constraint, Runnable operation) {
        Throwable thrown = catchThrowable(operation::run);
        assertThat(thrown).isInstanceOf(DataIntegrityViolationException.class);
        Throwable root = rootCause(thrown);
        assertThat(root).isInstanceOf(SQLException.class);
        assertThat(root.getMessage()).contains(constraint);
    }

    private Throwable rootCause(Throwable throwable) {
        Throwable current = throwable;
        while (current.getCause() != null) {
            current = current.getCause();
        }
        return current;
    }
}
