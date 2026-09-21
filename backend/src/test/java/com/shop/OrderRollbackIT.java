package com.shop;

import com.shop.dto.OrderDtos.CreateOrder;
import com.shop.entity.OrderType;
import com.shop.repository.OrderItemRepository;
import com.shop.repository.OrderRepository;
import com.shop.repository.ProductRepository;
import com.shop.repository.ProductVariantRepository;
import com.shop.repository.VoucherRepository;
import com.shop.service.OrderService;
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
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doThrow;

@SpringBootTest
@ActiveProfiles("test")
@Import(CatalogFixture.class)
class OrderRollbackIT extends PostgresIntegrationTest {
    @Autowired CatalogFixture fixture;
    @Autowired OrderService service;
    @Autowired OrderRepository orders;
    @Autowired VoucherRepository vouchers;
    @Autowired JdbcTemplate jdbc;

    @MockitoBean OrderItemRepository orderItems;

    @BeforeEach
    void reset() {
        jdbc.execute("TRUNCATE TABLE order_items, orders, product_variants, products, categories, vouchers RESTART IDENTITY CASCADE");
    }

    @Test
    void rollsBackOrderAndVoucherWhenItemInsertFails() {
        Data data = fixture.create();
        doThrow(new IllegalStateException("injected item insert failure")).when(orderItems).insert(
                anyLong(), any(), any(), any(), any(), any(), any(), any());

        CreateOrder request = new CreateOrder(
                OrderType.ORDER,
                "Nguyễn Văn C",
                "0912345678",
                null,
                null,
                "WELCOME",
                List.of(
                        new com.shop.dto.ItemInput(data.bottleOneLiter().getId().toString(), new BigDecimal("2")),
                        new com.shop.dto.ItemInput(data.bottleHalfLiter().getId().toString(), new BigDecimal("1"))));

        assertThatThrownBy(() -> service.create(request, "00000000-0000-4000-8000-000000000003"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("injected item insert failure");
        assertThat(orders.count()).isZero();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM order_items", Integer.class)).isZero();
        assertThat(vouchers.findById(data.welcome().getId()).orElseThrow().getUsedCount()).isZero();
    }
}
