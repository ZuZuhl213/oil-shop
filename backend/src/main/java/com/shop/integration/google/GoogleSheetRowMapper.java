package com.shop.integration.google;

import com.shop.service.AdminOrderQueryService;
import java.util.Arrays;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

@Component
public class GoogleSheetRowMapper {
    private final AdminOrderQueryService orders;
    private final ObjectMapper json;
    public GoogleSheetRowMapper(AdminOrderQueryService orders, ObjectMapper json) { this.orders=orders; this.json=json; }

    @Transactional(readOnly=true)
    public GoogleSheetRow snapshot(long orderId, long jobId) {
        var o=orders.get(orderId);
        String items=o.items().stream().map(i->i.productNameSnapshot()+" / "+text(i.variantNameSnapshot())+" × "+i.quantity().toPlainString())
            .collect(Collectors.joining("; "));
        return new GoogleSheetRow(Arrays.asList(o.id(),o.orderCode(),o.createdAt().toString(),o.customerName(),
            normalizePhone(o.phone()),text(o.address()),items,text(o.subtotal()),text(o.voucherCodeSnapshot()),
            o.discountAmount(),text(o.totalAmount()),o.status().name(),o.orderType().name(),text(o.customerNote()),
            text(o.adminNote()),json.writeValueAsString(o.items()),Long.toString(jobId),o.updatedAt().toString()));
    }
    private static Object text(Object value) { return value==null ? "" : value; }
    public static String normalizePhone(String value) { return value.startsWith("+84") ? "0"+value.substring(3) : value; }
}
