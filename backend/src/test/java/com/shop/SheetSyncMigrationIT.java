package com.shop;

import com.shop.support.PostgresIntegrationTest;
import java.util.UUID;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import static org.assertj.core.api.Assertions.*;

class SheetSyncMigrationIT extends PostgresIntegrationTest {
    @Test void backfillsEachExistingOrderOnceAndRejectsInvalidInfrastructureState() {
        String schema="sheet_backfill_"+UUID.randomUUID().toString().replace('-','_');
        var ds=new DriverManagerDataSource(POSTGRES.getJdbcUrl(),POSTGRES.getUsername(),POSTGRES.getPassword());
        var jdbc=new JdbcTemplate(ds);
        try {
            Flyway.configure().dataSource(ds).schemas(schema).defaultSchema(schema)
                .locations("classpath:db/migration").target("3").load().migrate();
            jdbc.update("""
                INSERT INTO "%s".orders(order_code,order_type,customer_name,phone,subtotal,discount_amount,total_amount,
                    status,idempotency_key,request_hash) VALUES
                ('DH-20261002-1','ORDER','Old','0912345678',100,0,100,'NEW',?::uuid,?),
                ('BG-20261002-2','QUOTE_REQUEST','Old','0912345678',NULL,0,NULL,'NEW',?::uuid,?)
                """.formatted(schema),UUID.randomUUID().toString(),"a".repeat(64),UUID.randomUUID().toString(),"b".repeat(64));
            var flyway=Flyway.configure().dataSource(ds).schemas(schema).defaultSchema(schema)
                .locations("classpath:db/migration").load();
            flyway.migrate();flyway.migrate();
            assertThat(jdbc.queryForObject("SELECT count(*) FROM \"%s\".sheet_sync_jobs WHERE status='PENDING' AND retry_count=0".formatted(schema),Integer.class)).isEqualTo(2);
            assertThat(jdbc.queryForObject("SELECT count(DISTINCT order_id) FROM \"%s\".sheet_sync_jobs".formatted(schema),Integer.class)).isEqualTo(2);
            for(String assignment:new String[]{"status='BAD'","retry_count=-1","status='PROCESSING'","order_id=999999"}) {
                assertThatThrownBy(()->jdbc.update("UPDATE \"%s\".sheet_sync_jobs SET %s".formatted(schema,assignment)))
                    .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
            }
        } finally {jdbc.execute("DROP SCHEMA IF EXISTS \"%s\" CASCADE".formatted(schema));}
    }
}
