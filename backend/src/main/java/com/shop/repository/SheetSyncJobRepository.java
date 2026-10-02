package com.shop.repository;

import com.shop.entity.SheetSyncJob;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class SheetSyncJobRepository {
    private final JdbcTemplate jdbc;
    public SheetSyncJobRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public List<SheetSyncJob> claim(int limit, String token, Instant now, Duration lease) {
        if (limit <= 0 || lease.isNegative() || lease.isZero()) throw new IllegalArgumentException("Invalid claim");
        return jdbc.query("""
            WITH candidates AS (
                SELECT j.id FROM sheet_sync_jobs j
                WHERE ((j.status IN ('PENDING','RETRY') AND j.next_retry_at <= ?)
                    OR (j.status='PROCESSING' AND j.locked_at <= ?))
                  AND NOT EXISTS (SELECT 1 FROM sheet_sync_jobs earlier
                      WHERE earlier.order_id=j.order_id AND earlier.id<j.id AND earlier.status<>'SUCCEEDED')
                ORDER BY j.id LIMIT ? FOR UPDATE OF j SKIP LOCKED
            )
            UPDATE sheet_sync_jobs j SET status='PROCESSING', locked_at=?, locked_by=?
            FROM candidates c WHERE j.id=c.id
            RETURNING j.id,j.order_id,j.retry_count,j.locked_at,j.locked_by
            """, (rs,n) -> new SheetSyncJob(rs.getLong("id"),rs.getLong("order_id"),rs.getInt("retry_count"),
                rs.getTimestamp("locked_at").toInstant(),rs.getString("locked_by")),
            Timestamp.from(now),Timestamp.from(now.minus(lease)),Math.min(limit,20),Timestamp.from(now),token);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean succeed(SheetSyncJob job) {
        return jdbc.update("""
            UPDATE sheet_sync_jobs SET status='SUCCEEDED',last_error=NULL,locked_at=NULL,locked_by=NULL
            WHERE id=? AND status='PROCESSING' AND locked_by=? AND locked_at=?
            """,job.id(),job.lockedBy(),Timestamp.from(job.lockedAt())) == 1;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean retry(SheetSyncJob job, Instant now, String safeError) {
        // Store only controlled diagnostic codes, never exception messages or remote bodies.
        String error = safeError.matches("SHEETS_[A-Z0-9_]{1,100}") ? safeError : "SHEETS_UNAVAILABLE";
        return jdbc.update("""
            UPDATE sheet_sync_jobs SET status='RETRY',retry_count=retry_count+1,last_error=?,
                next_retry_at=?,locked_at=NULL,locked_by=NULL
            WHERE id=? AND status='PROCESSING' AND locked_by=? AND locked_at=?
            """, error,Timestamp.from(now.plus(retryDelay(job.retryCount()))),
            job.id(),job.lockedBy(),Timestamp.from(job.lockedAt())) == 1;
    }

    public static Duration retryDelay(int previousFailures) {
        return Duration.ofSeconds(switch(previousFailures) {
            case 0 -> 5; case 1 -> 30; case 2 -> 120; case 3 -> 600; default -> 3600;
        });
    }
}
