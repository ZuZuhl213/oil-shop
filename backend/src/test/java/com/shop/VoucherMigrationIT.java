package com.shop;

import com.shop.support.PostgresIntegrationTest;
import java.util.UUID;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import static org.assertj.core.api.Assertions.assertThat;

class VoucherMigrationIT extends PostgresIntegrationTest {

    @Test
    void remediatesLegacyZeroMaxDiscountBeforeAddingPositiveConstraint() {
        String schema = "legacy_voucher_" + UUID.randomUUID().toString().replace('-', '_');
        var dataSource = new DriverManagerDataSource(
                POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword());
        JdbcTemplate jdbc = new JdbcTemplate(dataSource);

        try {
            Flyway.configure()
                    .dataSource(dataSource)
                    .schemas(schema)
                    .defaultSchema(schema)
                    .locations("classpath:db/migration")
                    .target("1")
                    .load()
                    .migrate();

            jdbc.update("""
                    INSERT INTO "%s".vouchers (
                        code, discount_type, discount_value, max_discount,
                        min_order_value, quantity, used_count)
                    VALUES ('LEGACYZERO', 'PERCENT', 10, 0, 0, 1, 0)
                    """.formatted(schema));

            Flyway.configure()
                    .dataSource(dataSource)
                    .schemas(schema)
                    .defaultSchema(schema)
                    .locations("classpath:db/migration")
                    .load()
                    .migrate();

            assertThat(jdbc.queryForObject(
                    "SELECT max_discount FROM \"%s\".vouchers WHERE code = 'LEGACYZERO'"
                            .formatted(schema), Long.class)).isNull();
        } finally {
            jdbc.execute("DROP SCHEMA IF EXISTS \"%s\" CASCADE".formatted(schema));
        }
    }
}
