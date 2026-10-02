package com.shop;

import com.shop.integration.google.*;
import com.shop.repository.SheetSyncJobRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.Duration;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.Map;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import com.shop.dto.ItemInput;
import com.shop.dto.OrderDtos.CreateOrder;
import com.shop.entity.OrderStatus;
import com.shop.entity.OrderType;
import com.shop.repository.OrderRepository;
import com.shop.service.IdempotentOrderService;
import com.shop.service.OrderNoteService;
import com.shop.service.OrderStatusService;
import com.shop.support.CatalogFixture;
import com.shop.support.PostgresIntegrationTest;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Import(CatalogFixture.class)
class SheetSyncIT extends PostgresIntegrationTest {
    @Autowired JdbcTemplate jdbc;
    @Autowired CatalogFixture fixture;
    @Autowired IdempotentOrderService create;
    @Autowired OrderRepository orders;
    @Autowired OrderStatusService statuses;
    @Autowired OrderNoteService notes;
    @Autowired PlatformTransactionManager transactions;
    @Autowired SheetSyncJobRepository jobs;
    @Autowired GoogleSheetRowMapper rowMapper;

    private CatalogFixture.Data data;
    @BeforeEach void clean() {
        data = null;
        jdbc.execute("TRUNCATE order_items, orders, product_variants, products, categories, vouchers RESTART IDENTITY CASCADE");
    }
    @AfterEach void cleanup() { clean(); }
    CreateOrder request() {
        if (data == null) data = fixture.create();
        return new CreateOrder(OrderType.ORDER, "=Customer", "0912345678", null, "+Note", null,
            List.of(new ItemInput(data.bottleOneLiter().getId().toString(), BigDecimal.ONE)));
    }
    long createOrder() {
        var receipt = create.create(request(), UUID.randomUUID().toString()).receipt();
        return orders.findByOrderCode(receipt.orderCode()).orElseThrow().getId();
    }
    int jobCount() { return jdbc.queryForObject("SELECT count(*) FROM sheet_sync_jobs", Integer.class); }

    @Test void commitAndReplayProduceOneJobAndRealMutationsOnlyEnqueue() {
        var request = request(); var key = UUID.randomUUID().toString();
        var receipt = create.create(request, key).receipt();
        long id = orders.findByOrderCode(receipt.orderCode()).orElseThrow().getId();
        assertThat(jobCount()).isEqualTo(1);
        create.create(request, key);
        statuses.change(id, OrderStatus.NEW);
        notes.update(id, "  ", null);
        assertThat(jobCount()).isEqualTo(1);
        statuses.change(id, OrderStatus.CONTACTED);
        notes.update(id, "admin", null);
        notes.update(id, " admin ", "admin");
        assertThat(jobCount()).isEqualTo(3);
        assertThatThrownBy(() -> notes.update(id, "overwrite", null)).hasMessageContaining("changed");
        assertThat(jobCount()).isEqualTo(3);
    }

    @Test void rollbackRemovesOrderAndJobTogether() {
        var request = request();
        new TransactionTemplate(transactions).executeWithoutResult(tx -> {
            create.create(request, UUID.randomUUID().toString());
            tx.setRollbackOnly();
        });
        assertThat(orders.count()).isZero(); assertThat(jobCount()).isZero();
        long id = createOrder();
        new TransactionTemplate(transactions).executeWithoutResult(tx -> {
            statuses.change(id, OrderStatus.CONTACTED); notes.update(id, "admin", null);
            tx.setRollbackOnly();
        });
        assertThat(orders.findById(id).orElseThrow().getStatus()).isEqualTo(OrderStatus.NEW);
        assertThat(jobCount()).isEqualTo(1);
    }
    SheetSyncWorker worker(GoogleSheetClient client) {
        return new SheetSyncWorker(jobs, rowMapper, client, Clock.systemUTC());
    }
    void due() { jdbc.update("UPDATE sheet_sync_jobs SET next_retry_at = now() - interval '1 second' WHERE status='RETRY'"); }

    @Test void timeoutAfterWriteRetriesTheSameRowAndNoDatabaseTransactionSpansNetwork() {
        long id = createOrder(); Map<Long, GoogleSheetRow> raw = new HashMap<>(); int[] calls={0};
        var worker=worker((row, snapshot)->{
            assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
            raw.put(row, snapshot);
            if (calls[0]++ == 0) throw new IllegalStateException("secret + PII remote timeout");
        });
        worker.runOnce();
        assertThat(jdbc.queryForObject("SELECT status FROM sheet_sync_jobs", String.class)).isEqualTo("RETRY");
        assertThat(jdbc.queryForObject("SELECT retry_count FROM sheet_sync_jobs", Integer.class)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT last_error FROM sheet_sync_jobs", String.class)).doesNotContain("secret", "PII");
        Instant retry=jdbc.queryForObject("SELECT next_retry_at FROM sheet_sync_jobs", (rs,n)->rs.getTimestamp(1).toInstant());
        assertThat(retry).isAfter(Instant.now());
        due(); worker((row,snapshot)->raw.put(row,snapshot)).runOnce(); // new worker simulates process restart
        assertThat(raw.keySet()).containsExactly(id+1);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM sheet_sync_jobs WHERE status <> 'SUCCEEDED'",Integer.class)).isZero();
    }

    @Test void leasesRecoverAndStaleOwnerCannotAcknowledgeAnotherClaim() {
        createOrder();
        Instant now=Instant.now();
        var first=jobs.claim(20,"old-owner",now,Duration.ofMinutes(5));
        assertThat(first).hasSize(1);
        assertThat(jobs.claim(20,"new-owner",now,Duration.ofMinutes(5))).isEmpty();
        var reclaimed=jobs.claim(20,"new-owner",now.plusSeconds(301),Duration.ofMinutes(5));
        assertThat(reclaimed).hasSize(1);
        assertThat(jobs.succeed(first.get(0))).isFalse();
        assertThat(jobs.retry(first.get(0),now,"safe failure")).isFalse();
        assertThat(jobs.succeed(reclaimed.get(0))).isTrue();
    }

    @Test void predecessorBlocksLaterJobsAndMutationDuringSendSurvivesOldAcknowledgement() {
        long id=createOrder(); int[] calls={0};
        var worker=worker((row,snapshot)->{
            if(calls[0]++==0) {
                assertThat(snapshot.cells()).contains("NEW");
                notes.update(id,"new note",null); statuses.change(id,OrderStatus.CONTACTED);
                assertThat(jobs.claim(20,"competitor",Instant.now(),Duration.ofMinutes(5))).isEmpty();
            } else assertThat(snapshot.cells()).contains("new note","CONTACTED");
        });
        worker.runOnce();
        assertThat(calls[0]).isEqualTo(3);
        assertThat(jdbc.queryForList("SELECT status FROM sheet_sync_jobs ORDER BY id",String.class))
            .containsExactly("SUCCEEDED","SUCCEEDED","SUCCEEDED");
    }

    @Test void retryPredecessorCannotBeOvertakenAndClaimCapsAtTwenty() {
        long id=createOrder(); notes.update(id,"note",null);
        worker((row,snapshot)->{throw new IllegalStateException("outage");}).runOnce();
        assertThat(jdbc.queryForList("SELECT status FROM sheet_sync_jobs ORDER BY id",String.class))
            .containsExactly("RETRY","PENDING");
        assertThat(jobs.claim(20,"other",Instant.now(),Duration.ofMinutes(5))).isEmpty();
        due(); int[] writes={0};worker((row,snapshot)->writes[0]++).runOnce();
        assertThat(writes[0]).isEqualTo(2);
        for(int i=0;i<25;i++) createOrder();
        assertThat(jobs.claim(100,"batch",Instant.now(),Duration.ofMinutes(5))).hasSize(20);
    }

    @Test void quoteMapsMoneyToEmptyCellsAndSnapshotsPreserveTextAndItems() {
        var data=fixture.create();
        var receipt=create.create(new CreateOrder(OrderType.QUOTE_REQUEST,"@Customer","+84912345678",null,"=note",null,
            List.of(new ItemInput(data.weighted().getId().toString(),new BigDecimal("0.5")))),UUID.randomUUID().toString()).receipt();
        long id=orders.findByOrderCode(receipt.orderCode()).orElseThrow().getId();
        var row=rowMapper.snapshot(id,7);
        assertThat(row.cells().get(GoogleSheetRow.HEADERS.indexOf("total"))).isEqualTo("");
        assertThat(row.cells()).contains("@Customer","0912345678","=note","QUOTE_REQUEST","7");
        assertThat(row.cells().get(GoogleSheetRow.HEADERS.indexOf("items_json")).toString()).contains("0.5","productNameSnapshot");
    }

}
