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

            jdbc.update("""
                    INSERT INTO "%s".orders (
                        order_code, order_type, customer_name, phone,
                        subtotal, discount_amount, total_amount, status)
                    VALUES
                        ('DH-20260921-1', 'ORDER', 'Legacy 1', '0912345678', 100, 0, 100, 'NEW'),
                        ('DH-20260921-2', 'ORDER', 'Legacy 2', '0912345679', 200, 0, 200, 'NEW')
                    """.formatted(schema));

            Flyway.configure()
                    .dataSource(dataSource)
                    .schemas(schema)
                    .defaultSchema(schema)
                    .locations("classpath:db/migration")
                    .load()
                    .migrate();

            assertThat(jdbc.queryForObject("SELECT count(*) FROM \"%s\".orders WHERE idempotency_key IS NOT NULL"
                    .formatted(schema), Long.class)).isEqualTo(2);
            assertThat(jdbc.queryForObject("SELECT count(DISTINCT idempotency_key) FROM \"%s\".orders"
                    .formatted(schema), Long.class)).isEqualTo(2);
            assertThat(jdbc.queryForObject("SELECT count(*) FROM \"%s\".orders WHERE length(request_hash) = 64"
                    .formatted(schema), Long.class)).isEqualTo(2);
        } finally {
            jdbc.execute("DROP SCHEMA IF EXISTS \"%s\" CASCADE".formatted(schema));
        }
    }
}
