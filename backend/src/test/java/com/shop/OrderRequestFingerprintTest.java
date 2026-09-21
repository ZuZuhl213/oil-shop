package com.shop;

import com.shop.dto.ItemInput;
import com.shop.dto.OrderDtos.CreateOrder;
import com.shop.entity.OrderType;
import com.shop.service.OrderRequestFingerprint;
import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class OrderRequestFingerprintTest {
    private final OrderRequestFingerprint fingerprint = new OrderRequestFingerprint();

    @Test
    void normalizesPayloadAndSortsItemsWithoutIncludingCatalogPrice() {
        CreateOrder first = new CreateOrder(
                OrderType.ORDER, " Nguyễn Văn A ", " 0912345678 ", null, " Gọi trước ", " welcome ",
                List.of(new ItemInput("21", new BigDecimal("1.00")), new ItemInput("13", new BigDecimal("2.0"))));
        CreateOrder reordered = new CreateOrder(
                OrderType.ORDER, "Nguyễn Văn A", "0912345678", "", "Gọi trước", "WELCOME",
                List.of(new ItemInput("13", new BigDecimal("2.00")), new ItemInput("21", new BigDecimal("1"))));
        CreateOrder blankVoucher = new CreateOrder(
                OrderType.ORDER, "Nguyễn Văn A", "0912345678", null, "Gọi trước", "   ",
                reordered.items());
        CreateOrder noVoucher = new CreateOrder(
                OrderType.ORDER, "Nguyễn Văn A", "0912345678", null, "Gọi trước", null,
                reordered.items());

        assertThat(fingerprint.hash(first)).isEqualTo(fingerprint.hash(reordered));
        assertThat(fingerprint.hash(blankVoucher)).isEqualTo(fingerprint.hash(noVoucher));
        assertThat(fingerprint.hash(noVoucher)).isNotEqualTo(fingerprint.hash(new CreateOrder(
                OrderType.ORDER, "Nguyễn Văn A", "0912345678", "-", "Gọi trước", null, reordered.items())));
        assertThat(fingerprint.hash(first)).hasSize(64);
    }

    @Test
    void changesBusinessInputHash() {
        CreateOrder base = new CreateOrder(
                OrderType.ORDER, "A", "0912345678", null, null, null,
                List.of(new ItemInput("13", new BigDecimal("1"))));

        assertThat(fingerprint.hash(new CreateOrder(OrderType.ORDER, "A", "0912345678", null, null, null,
                List.of(new ItemInput("13", new BigDecimal("2")))))).isNotEqualTo(fingerprint.hash(base));
        assertThat(fingerprint.hash(new CreateOrder(OrderType.ORDER, "A", "+84912345678", null, null, null,
                base.items()))).isNotEqualTo(fingerprint.hash(base));
        assertThat(fingerprint.hash(new CreateOrder(OrderType.QUOTE_REQUEST, "A", "0912345678", null, null, null,
                base.items()))).isNotEqualTo(fingerprint.hash(base));
        assertThat(fingerprint.hash(new CreateOrder(OrderType.ORDER, "A", "0912345678", "Nhà", null, null,
                base.items()))).isNotEqualTo(fingerprint.hash(base));
    }

    @Test
    void hashesMalformedNullItemWithoutThrowingBeforeValidation() {
        CreateOrder malformed = new CreateOrder(
                OrderType.ORDER, "A", "0912345678", null, null, null, Collections.singletonList(null));

        assertThat(fingerprint.hash(malformed)).hasSize(64);
    }
}
