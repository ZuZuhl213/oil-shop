package com.shop.integration.google;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Component
public class SheetSyncOutbox {
    private final JdbcTemplate jdbc;
    public SheetSyncOutbox(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @Transactional(propagation = Propagation.MANDATORY)
    public void enqueue(long orderId) {
        jdbc.update("INSERT INTO sheet_sync_jobs(order_id) VALUES (?)", orderId);
    }
}
