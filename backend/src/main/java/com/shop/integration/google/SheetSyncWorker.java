package com.shop.integration.google;

import com.shop.repository.SheetSyncJobRepository;
import java.time.Clock;
import java.time.Duration;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Component
public class SheetSyncWorker {
    private static final Duration LEASE=Duration.ofMinutes(5);
    private final SheetSyncJobRepository jobs;
    private final GoogleSheetRowMapper rows;
    private final GoogleSheetClient client;
    private final Clock clock;
    public SheetSyncWorker(SheetSyncJobRepository jobs, GoogleSheetRowMapper rows, GoogleSheetClient client, Clock clock) {
        this.jobs=jobs;this.rows=rows;this.client=client;this.clock=clock;
    }

    /** V1 has one backend instance. Serialize manual/scheduled runs so expired leases cannot overlap an active send. */
    public synchronized void runOnce() {
        if(TransactionSynchronizationManager.isActualTransactionActive())
            throw new IllegalStateException("Sheets worker must run outside a database transaction");
        for(int i=0;i<20;i++) {
            // Claim just in time: a queued batch must not expire while preceding network calls run.
            var claimed=jobs.claim(1,UUID.randomUUID().toString(),clock.instant(),LEASE);
            if(claimed.isEmpty()) return;
            var job=claimed.get(0);
            try {
                var snapshot=rows.snapshot(job.orderId(),job.id());
                client.writeOrder(Math.addExact(job.orderId(),1),snapshot);
                jobs.succeed(job);
            } catch(Exception failure) {
                String code=failure instanceof GoogleSheetsException sheets ? sheets.getMessage() : "SHEETS_UNAVAILABLE";
                jobs.retry(job,clock.instant(),code);
                if(failure instanceof InterruptedException || Thread.currentThread().isInterrupted()) {
                    Thread.currentThread().interrupt(); return;
                }
            }
        }
    }
}
