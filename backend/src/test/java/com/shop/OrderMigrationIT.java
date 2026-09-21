package com.shop;

import com.shop.support.PostgresIntegrationTest;
import java.util.UUID;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import static org.assertj.core.api.Assertions.assertThat;

class OrderMigrationIT extends PostgresIntegrationTest {

    @Test
    void backfillsLegacyOrdersWithDistinctIdempotencyValues() {
        String schema = "legacy_order_" + UUID.randomUUID().toString().replace('-', '_');
        var dataSource = new DriverManagerDataSource(
                POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword());
        JdbcTemplate jdbc = new JdbcTemplate(dataSource);

        try {
            Flyway.configure()
                    .dataSource(dataSource)
                    .schemas(schema)
                    .defaultSchema(schema)
                    .locations("classpath:db/migration")
                    .target("2")
                    .load()
                    .migrate();

            long id = jdbc.queryForObject("""
                    INSERT INTO "%s".orders (
                        order_code, order_type, customer_name, phone,
                        subtotal, discount_amount, total_amount, status)
                    VALUES ('DH-20260921-1', 'ORDER', 'Legacy', '0912345678', 100, 0, 100, 'NEW')
                    RETURNING id
                    """.formatted(schema), Long.class);

            Flyway.configure()
                    .dataSource(dataSource)
                    .schemas(schema)
                    .defaultSchema(schema)
                    .locations("classpath:db/migration")
                    .load()
                    .migrate();

            assertThat(jdbc.queryForObject("SELECT idempotency_key IS NOT NULL FROM \"%s\".orders WHERE id = ?"
                    .formatted(schema), Boolean.class, id)).isTrue();
            assertThat(jdbc.queryForObject("SELECT length(request_hash) FROM \"%s\".orders WHERE id = ?"
                    .formatted(schema), Integer.class, id)).isEqualTo(64);
        } finally {
            jdbc.execute("DROP SCHEMA IF EXISTS \"%s\" CASCADE".formatted(schema));
        }
    }
}
