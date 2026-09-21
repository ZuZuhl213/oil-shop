package com.shop;

import com.shop.dto.ItemInput;
import com.shop.dto.OrderDtos.CreateOrder;
import com.shop.entity.OrderType;
import com.shop.entity.Voucher;
import com.shop.repository.CategoryRepository;
import com.shop.repository.OrderItemRepository;
import com.shop.repository.OrderRepository;
import com.shop.repository.ProductRepository;
import com.shop.repository.ProductVariantRepository;
import com.shop.repository.VoucherRepository;
import com.shop.service.IdempotentOrderService;
import com.shop.support.CatalogFixture;
import com.shop.support.CatalogFixture.Data;
import com.shop.support.PostgresIntegrationTest;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;

@SpringBootTest
@ActiveProfiles("test")
@Import(CatalogFixture.class)
class OrderConsumeRollbackIT extends PostgresIntegrationTest {
    @Autowired CatalogFixture fixture;
    @Autowired IdempotentOrderService service;
    @Autowired OrderRepository orders;
    @Autowired OrderItemRepository orderItems;
    @Autowired CategoryRepository categories;
    @Autowired ProductRepository products;
    @Autowired ProductVariantRepository variants;
    @Autowired JdbcTemplate jdbc;

    @MockitoSpyBean VoucherRepository vouchers;

    @BeforeEach
    void reset() {
        jdbc.execute("TRUNCATE TABLE order_items, orders, product_variants, products, categories, vouchers RESTART IDENTITY CASCADE");
    }

    @Test
    void rollsBackOrderItemsAndVoucherWhenConsumeFailsAfterItemInsert() {
        Data data = fixture.create();
        doAnswer(invocation -> {
            Voucher value = invocation.getArgument(0);
            if (value.getUsedCount() == 1) {
                throw new IllegalStateException("injected consume failure");
            }
            return invocation.callRealMethod();
        }).when(vouchers).save(any(Voucher.class));

        CreateOrder request = new CreateOrder(OrderType.ORDER, "A", "0912345678", null, null, "WELCOME",
                List.of(new ItemInput(data.bottleOneLiter().getId().toString(), new BigDecimal("1"))));

        assertThatThrownBy(() -> service.create(request, "00000000-0000-4000-8000-000000000301"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("injected consume failure");
        assertThat(orders.count()).isZero();
        assertThat(orderItems.count()).isZero();
        assertThat(vouchers.findById(data.welcome().getId()).orElseThrow().getUsedCount()).isZero();
    }
}
