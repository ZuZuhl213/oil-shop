package com.shop;

import com.shop.support.PostgresIntegrationTest;
import java.sql.DriverManager;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

class ProductImagesMigrationIT extends PostgresIntegrationTest {
    @Test void backfillsExistingThumbnailWithoutChangingUrlAndCascadesOnlyDbRows() throws Exception {
        String schema = "gallery_migration_" + java.util.UUID.randomUUID().toString().replace("-", "");
        var config = Flyway.configure().dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword()).schemas(schema).defaultSchema(schema);
        try (var connection = DriverManager.getConnection(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword()); var sql = connection.createStatement()) {
            config.target("4").load().migrate();
            sql.execute("SET search_path TO " + schema);
            sql.execute("INSERT INTO categories(id,name,slug) VALUES(1,'Oil','oil')");
            sql.execute("INSERT INTO products(id,category_id,name,slug,thumbnail_url,sale_type) VALUES(1,1,'Old','old','https://legacy.test/original.jpg','FIXED_PRICE'),(2,1,'Empty','empty',NULL,'QUOTE')");
            Flyway.configure().dataSource(POSTGRES.getJdbcUrl(),POSTGRES.getUsername(),POSTGRES.getPassword()).schemas(schema).defaultSchema(schema).load().migrate();
            try (var rows = sql.executeQuery("SELECT p.thumbnail_url,i.url,i.sort_order,p.images_revision FROM products p JOIN product_images i ON i.product_id=p.id")) {
                assertThat(rows.next()).isTrue(); assertThat(rows.getString(1)).isEqualTo("https://legacy.test/original.jpg");
                assertThat(rows.getString(2)).isEqualTo(rows.getString(1)); assertThat(rows.getInt(3)).isZero(); assertThat(rows.getLong(4)).isZero(); assertThat(rows.next()).isFalse();
            }
            sql.execute("DELETE FROM products WHERE id=1");
            try (var rows = sql.executeQuery("SELECT count(*) FROM product_images")) { rows.next(); assertThat(rows.getInt(1)).isZero(); }
        } finally {
            try (var connection = DriverManager.getConnection(POSTGRES.getJdbcUrl(),POSTGRES.getUsername(),POSTGRES.getPassword()); var sql=connection.createStatement()) { sql.execute("DROP SCHEMA IF EXISTS " + schema + " CASCADE"); }
        }
    }
}
