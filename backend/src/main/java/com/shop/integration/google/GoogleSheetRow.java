package com.shop.integration.google;

import java.util.List;

public record GoogleSheetRow(List<Object> cells) {
    public static final List<String> HEADERS = List.of("order_id","order_code","created_at","customer_name",
        "phone","address","items","subtotal","voucher","discount","total","status","order_type",
        "customer_note","admin_note","items_json","last_sync_job_id","updated_at");
    public GoogleSheetRow {
        cells = List.copyOf(cells);
        if(cells.size()!=HEADERS.size()) throw new IllegalArgumentException("Invalid Sheets column count");
    }
}
