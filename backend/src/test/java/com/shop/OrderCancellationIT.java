package com.shop;

import com.shop.dto.ItemInput;
import com.shop.dto.OrderDtos.CreateOrder;
import com.shop.dto.OrderDtos.CreateResult;
import com.shop.entity.Admin;
import com.shop.entity.Order;
import com.shop.entity.OrderStatus;
import com.shop.entity.OrderType;
import com.shop.entity.Voucher;
import com.shop.repository.AdminRepository;
import com.shop.repository.CategoryRepository;
import com.shop.repository.OrderItemRepository;
import com.shop.repository.OrderRepository;
import com.shop.repository.ProductRepository;
import com.shop.repository.ProductVariantRepository;
import com.shop.repository.VoucherRepository;
import com.shop.service.IdempotentOrderService;
import com.shop.service.OrderStatusService;
import com.shop.support.CatalogFixture;
import com.shop.support.CatalogFixture.Data;
import com.shop.support.PostgresIntegrationTest;
import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "app.security.allowed-origins=http://localhost:3000")
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(CatalogFixture.class)
class OrderCancellationIT extends PostgresIntegrationTest {
    private static final String ORIGIN = "http://localhost:3000";

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper mapper;
    @Autowired CatalogFixture fixture;
    @Autowired IdempotentOrderService ordersService;
    @Autowired OrderStatusService statuses;
    @Autowired OrderRepository orders;
    @Autowired OrderItemRepository orderItems;
    @Autowired ProductRepository products;
    @Autowired ProductVariantRepository variants;
    @Autowired CategoryRepository categories;
    @Autowired VoucherRepository vouchers;
    @Autowired AdminRepository admins;
    @Autowired PasswordEncoder encoder;
    @Autowired JdbcTemplate jdbc;
    @MockitoSpyBean VoucherRepository voucherSpy;

    @BeforeEach
    void reset() {
        orderItems.deleteAll();
        orders.deleteAll();
        variants.deleteAll();
        products.deleteAll();
        categories.deleteAll();
        vouchers.deleteAll();
        admins.deleteAll();
    }

    @AfterEach
    void cleanup() { reset(); }

    @Test
    void cancelsAndReleasesVoucherOnceAndRejectsReopen() throws Exception {
        Data data = fixture.create();
        CreateResult created = createWithVoucher(data, "WELCOME");
        Order order = orders.findByOrderCode(created.receipt().orderCode()).orElseThrow();
        Voucher voucher = vouchers.findByCode("WELCOME").orElseThrow();
        assertThat(voucher.getUsedCount()).isEqualTo(1);
        MockHttpSession session = login();

        patchStatus(session, order.getId(), OrderStatus.CANCELLED)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
        assertThat(vouchers.findById(voucher.getId()).orElseThrow().getUsedCount()).isZero();

        patchStatus(session, order.getId(), OrderStatus.CANCELLED)
                .andExpect(status().isOk());
        assertThat(vouchers.findById(voucher.getId()).orElseThrow().getUsedCount()).isZero();

        patchStatus(session, order.getId(), OrderStatus.NEW)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("INVALID_TRANSITION"));
        assertThat(vouchers.findById(voucher.getId()).orElseThrow().getUsedCount()).isZero();
    }

    @Test
    void completedOrderCannotBeCancelledOrRefunded() throws Exception {
        Data data = fixture.create();
        CreateResult created = createWithVoucher(data, "WELCOME");
        Order order = orders.findByOrderCode(created.receipt().orderCode()).orElseThrow();
        Voucher voucher = vouchers.findByCode("WELCOME").orElseThrow();
        jdbc.update("update orders set status = 'COMPLETED' where id = ?", order.getId());

        patchStatus(login(), order.getId(), OrderStatus.CANCELLED)
                .andExpect(status().isConflict());
        assertThat(vouchers.findById(voucher.getId()).orElseThrow().getUsedCount()).isEqualTo(1);
    }

    @Test
    void inactiveOrExpiredVoucherStillGetsReleasedOnValidCancellation() {
        Data data = fixture.create();
        CreateResult created = createWithVoucher(data, "WELCOME");
        Order order = orders.findByOrderCode(created.receipt().orderCode()).orElseThrow();
        Voucher voucher = vouchers.findByCode("WELCOME").orElseThrow();
        voucher.setActive(false);
        vouchers.saveAndFlush(voucher);

        statuses.change(order.getId(), OrderStatus.CANCELLED);

        assertThat(vouchers.findById(voucher.getId()).orElseThrow().getUsedCount()).isZero();
    }

    @Test
    void twoConcurrentCancellationsRefundOnlyOnce() throws Exception {
        Data data = fixture.create();
        CreateResult created = createWithVoucher(data, "WELCOME");
        long orderId = orders.findByOrderCode(created.receipt().orderCode()).orElseThrow().getId();
        Voucher voucher = vouchers.findByCode("WELCOME").orElseThrow();
        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch start = new CountDownLatch(1);
        try {
            Future<?> one = pool.submit(() -> awaitAndCancel(start, orderId));
            Future<?> two = pool.submit(() -> awaitAndCancel(start, orderId));
            start.countDown();
            one.get(10, TimeUnit.SECONDS);
            two.get(10, TimeUnit.SECONDS);
        } finally {
            pool.shutdownNow();
        }
        assertThat(orders.findById(orderId).orElseThrow().getStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(vouchers.findById(voucher.getId()).orElseThrow().getUsedCount()).isZero();
    }

    @Test
    void statusAndVoucherRollbackTogetherWhenVoucherSaveFails() {
        Data data = fixture.create();
        CreateResult created = createWithVoucher(data, "WELCOME");
        Order order = orders.findByOrderCode(created.receipt().orderCode()).orElseThrow();
        Voucher voucher = vouchers.findByCode("WELCOME").orElseThrow();
        doThrow(new IllegalStateException("simulated failure")).when(voucherSpy).save(org.mockito.ArgumentMatchers.any(Voucher.class));

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> statuses.change(order.getId(), OrderStatus.CANCELLED))
                .isInstanceOf(IllegalStateException.class);

        assertThat(orders.findById(order.getId()).orElseThrow().getStatus()).isEqualTo(OrderStatus.NEW);
        assertThat(vouchers.findById(voucher.getId()).orElseThrow().getUsedCount()).isEqualTo(1);
    }

    private void awaitAndCancel(CountDownLatch start, long orderId) {
        try {
            start.await();
            statuses.change(orderId, OrderStatus.CANCELLED);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new RuntimeException(exception);
        }
    }

    private CreateResult createWithVoucher(Data data, String voucherCode) {
        return ordersService.create(new CreateOrder(OrderType.ORDER, "A", "0912345678", null, null, voucherCode,
                List.of(new ItemInput(data.bottleOneLiter().getId().toString(), BigDecimal.ONE))),
                "00000000-0000-4000-8000-%012d".formatted(Math.abs(System.nanoTime()) % 1_000_000_000_000L));
    }

    private org.springframework.test.web.servlet.ResultActions patchStatus(MockHttpSession session, long id,
            OrderStatus status) throws Exception {
        return mockMvc.perform(patch("/api/v1/admin/orders/%d/status".formatted(id)).session(session)
                .header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session))
                .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"%s\"}".formatted(status)));
    }

    private MockHttpSession login() throws Exception {
        admins.save(new Admin("admin@example.com", encoder.encode("password"), "Admin", true));
        MvcResult csrf = mockMvc.perform(get("/api/v1/csrf")).andReturn();
        MockHttpSession session = (MockHttpSession) csrf.getRequest().getSession(false);
        mockMvc.perform(post("/api/v1/admin/auth/login").session(session).header("Origin", ORIGIN)
                        .header("X-CSRF-TOKEN", token(csrf)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@example.com\",\"password\":\"password\"}"))
                .andExpect(status().isOk());
        return session;
    }

    private String csrf(MockHttpSession session) throws Exception {
        return token(mockMvc.perform(get("/api/v1/csrf").session(session)).andReturn());
    }

    private String token(MvcResult result) throws Exception {
        JsonNode body = mapper.readTree(result.getResponse().getContentAsByteArray());
        return body.get("token").asText();
    }

}
