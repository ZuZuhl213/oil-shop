package com.shop;

import com.shop.dto.ItemInput;
import com.shop.dto.OrderDtos.CreateOrder;
import com.shop.dto.OrderDtos.CreateResult;
import com.shop.entity.Order;
import com.shop.entity.OrderType;
import com.shop.entity.Admin;
import com.shop.repository.AdminRepository;
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
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.hamcrest.Matchers.nullValue;

@SpringBootTest(properties = "app.security.allowed-origins=http://localhost:3000")
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(CatalogFixture.class)
class AdminOrderQueryIT extends PostgresIntegrationTest {
    private static final String ORIGIN = "http://localhost:3000";

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper mapper;
    @Autowired CatalogFixture fixture;
    @Autowired IdempotentOrderService ordersService;
    @Autowired OrderRepository orders;
    @Autowired OrderItemRepository orderItems;
    @Autowired ProductRepository products;
    @Autowired ProductVariantRepository variants;
    @Autowired CategoryRepository categories;
    @Autowired VoucherRepository vouchers;
    @Autowired AdminRepository admins;
    @Autowired PasswordEncoder encoder;
    @Autowired JdbcTemplate jdbc;

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
    void listsFiltersAndDetailsOrdersUsingSnapshots() throws Exception {
        Data data = fixture.create();
        CreateResult first = create(data, "A", "0912345678", OrderType.ORDER, "Customer note");
        CreateResult second = create(data, "B", "0912345679", OrderType.ORDER, null);
        CreateResult quote = create(data, "C", "0912345680", OrderType.QUOTE_REQUEST, null);
        Order firstOrder = orders.findByOrderCode(first.receipt().orderCode()).orElseThrow();
        Order secondOrder = orders.findByOrderCode(second.receipt().orderCode()).orElseThrow();
        Order quoteOrder = orders.findByOrderCode(quote.receipt().orderCode()).orElseThrow();
        jdbc.update("UPDATE orders SET created_at = ? WHERE id = ?", OffsetDateTime.parse("2026-09-20T10:30:00Z"), firstOrder.getId());
        jdbc.update("UPDATE orders SET created_at = ? WHERE id = ?", OffsetDateTime.parse("2026-09-20T11:00:00Z"), secondOrder.getId());
        jdbc.update("UPDATE orders SET created_at = ? WHERE id = ?", OffsetDateTime.parse("2026-09-20T12:00:00Z"), quoteOrder.getId());

        Data changed = data;
        changed.fixedProduct().setName("Catalog name changed");
        changed.bottleOneLiter().setName("Catalog variant changed");
        changed.bottleOneLiter().setPrice(999_000L);
        products.saveAndFlush(changed.fixedProduct());
        variants.saveAndFlush(changed.bottleOneLiter());

        MockHttpSession session = login();
        mockMvc.perform(get("/api/v1/admin/orders?page=0&size=2").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(2))
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.content[0].orderCode").value(quote.receipt().orderCode()))
                .andExpect(jsonPath("$.content[1].orderCode").value(second.receipt().orderCode()));
        mockMvc.perform(get("/api/v1/admin/orders?orderType=QUOTE_REQUEST").session(session))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1));
        mockMvc.perform(get("/api/v1/admin/orders?status=NEW&keyword=%s".formatted(first.receipt().orderCode())).session(session))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1));
        mockMvc.perform(get("/api/v1/admin/orders?keyword=0912345679").session(session))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1));
        mockMvc.perform(get("/api/v1/admin/orders?from=2026-09-20T10:30:00Z&to=2026-09-20T11:00:00Z").session(session))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1));
        mockMvc.perform(get("/api/v1/admin/orders?keyword=%s".formatted("x".repeat(101))).session(session))
                .andExpect(status().isUnprocessableContent());

        mockMvc.perform(get("/api/v1/admin/orders/" + firstOrder.getId()).session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.customerName").value("A"))
                .andExpect(jsonPath("$.customerNote").value("Customer note"))
                .andExpect(jsonPath("$.items[0].productNameSnapshot").value("Dầu lạc ép lạnh"))
                .andExpect(jsonPath("$.items[0].variantNameSnapshot").value("Chai 1L"))
                .andExpect(jsonPath("$.items[0].unitPrice").value(170_000));
    }

    @Test
    void updatesNullableAdminNoteWithoutChangingCustomerData() throws Exception {
        Data data = fixture.create();
        CreateResult created = create(data, "A", "0912345678", OrderType.ORDER, "Customer note");
        Order order = orders.findByOrderCode(created.receipt().orderCode()).orElseThrow();
        Instant before = order.getUpdatedAt();
        MockHttpSession session = login();

        mockMvc.perform(patch("/api/v1/admin/orders/%d/note".formatted(order.getId()))
                        .session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"adminNote\":\"Called customer\",\"expectedAdminNote\":null}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.adminNote").value("Called customer"))
                .andExpect(jsonPath("$.customerNote").value("Customer note"))
                .andExpect(jsonPath("$.customerName").value("A"))
                .andExpect(jsonPath("$.phone").value("0912345678"));

        Order updated = orders.findById(order.getId()).orElseThrow();
        assertThat(updated.getUpdatedAt()).isAfter(before);
        assertThat(updated.getSubtotal()).isEqualTo(order.getSubtotal());
        mockMvc.perform(patch("/api/v1/admin/orders/%d/note".formatted(order.getId()))
                        .session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"adminNote\":null,\"expectedAdminNote\":\"Called customer\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.adminNote").value(nullValue()));
        mockMvc.perform(patch("/api/v1/admin/orders/%d/note".formatted(order.getId()))
                        .session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"adminNote\":\"%s\",\"expectedAdminNote\":null}".formatted("x".repeat(2001))))
                .andExpect(status().isUnprocessableContent());
        mockMvc.perform(patch("/api/v1/admin/orders/%d/note".formatted(order.getId()))
                        .session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"adminNote\":\"x\",\"expectedAdminNote\":null,\"phone\":\"0900000000\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsStaleNoteAndAllowsExplicitReviewedSaveWithoutStatusConflicts() throws Exception {
        Order order = newOrder();
        MockHttpSession adminA = login("a@example.com"), adminB = login("b@example.com");
        saveNote(adminB, order.getId(), "B latest", null).andExpect(status().isOk());
        saveNote(adminA, order.getId(), "A draft", null)
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("NOTE_CONFLICT"));
        assertThat(orders.findById(order.getId()).orElseThrow().getAdminNote()).isEqualTo("B latest");
        mockMvc.perform(get("/api/v1/admin/orders/" + order.getId()).session(adminA))
                .andExpect(jsonPath("$.adminNote").value("B latest"));
        // Status changes update updatedAt but must not invalidate the note comparison.
        mockMvc.perform(patch("/api/v1/admin/orders/%d/status".formatted(order.getId()))
                .session(adminB).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(adminB))
                .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"CONTACTED\"}"))
                .andExpect(status().isOk());
        saveNote(adminA, order.getId(), "A reviewed draft", "B latest")
                .andExpect(status().isOk()).andExpect(jsonPath("$.adminNote").value("A reviewed draft"));
    }

    @Test
    void requiresExpectedNoteButAcceptsNullBlankAndNormalizedValues() throws Exception {
        Order order = newOrder(); MockHttpSession session = login();
        mockMvc.perform(patch("/api/v1/admin/orders/%d/note".formatted(order.getId()))
                .session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session))
                .contentType(MediaType.APPLICATION_JSON).content("{\"adminNote\":\"unsafe\"}"))
                .andExpect(status().isBadRequest());
        saveNote(session, order.getId(), "  First  ", "   ").andExpect(status().isOk())
                .andExpect(jsonPath("$.adminNote").value("First"));
        saveNote(session, order.getId(), "   ", " First ").andExpect(status().isOk())
                .andExpect(jsonPath("$.adminNote").value(nullValue()));
        saveNote(session, order.getId(), null, "").andExpect(status().isOk());
        saveNote(session, order.getId(), "new", null).andExpect(status().isOk());
        saveNote(session, order.getId(), null, null).andExpect(status().isConflict());
        assertThat(orders.findById(order.getId()).orElseThrow().getAdminNote()).isEqualTo("new");
    }

    @Test
    void twoConcurrentAdminsCannotOverwriteTheWinningNoteInPostgres() throws Exception {
        Order order = newOrder();
        MockHttpSession adminA = login("a@example.com"), adminB = login("b@example.com");
        String tokenA = csrf(adminA), tokenB = csrf(adminB);
        CountDownLatch ready = new CountDownLatch(2), start = new CountDownLatch(1);
        try (var pool = Executors.newFixedThreadPool(2)) {
            var first = pool.submit(() -> concurrentNote(adminA, tokenA, order.getId(), "A", ready, start));
            var second = pool.submit(() -> concurrentNote(adminB, tokenB, order.getId(), "B", ready, start));
            assertThat(ready.await(10, TimeUnit.SECONDS)).isTrue(); start.countDown();
            MvcResult a = first.get(10, TimeUnit.SECONDS), b = second.get(10, TimeUnit.SECONDS);
            assertThat(List.of(a.getResponse().getStatus(), b.getResponse().getStatus()))
                    .containsExactlyInAnyOrder(200, 409);
            MvcResult winner = a.getResponse().getStatus() == 200 ? a : b;
            MvcResult loser = winner == a ? b : a;
            assertThat(mapper.readTree(loser.getResponse().getContentAsByteArray()).get("code").asText())
                    .isEqualTo("NOTE_CONFLICT");
            assertThat(orders.findById(order.getId()).orElseThrow().getAdminNote())
                    .isEqualTo(mapper.readTree(winner.getResponse().getContentAsByteArray()).get("adminNote").asText());
        } finally { start.countDown(); }
    }

    private Order newOrder() {
        CreateResult created = create(fixture.create(), "A", "0912345678", OrderType.ORDER, "Customer note");
        return orders.findByOrderCode(created.receipt().orderCode()).orElseThrow();
    }

    private org.springframework.test.web.servlet.ResultActions saveNote(MockHttpSession session, long id,
            String note, String expected) throws Exception {
        var body = new LinkedHashMap<String, Object>();
        body.put("adminNote", note); body.put("expectedAdminNote", expected);
        return mockMvc.perform(patch("/api/v1/admin/orders/%d/note".formatted(id))
                .session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session))
                .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(body)));
    }

    private MvcResult concurrentNote(MockHttpSession session, String token, long id, String note,
            CountDownLatch ready, CountDownLatch start) throws Exception {
        ready.countDown();
        if (!start.await(10, TimeUnit.SECONDS)) throw new IllegalStateException("Start timed out");
        return mockMvc.perform(patch("/api/v1/admin/orders/%d/note".formatted(id))
                .session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"adminNote\":\"%s\",\"expectedAdminNote\":null}".formatted(note))).andReturn();
    }

    @Test
    void treatsKeywordWildcardsAsLiteralCharacters() throws Exception {
        Data data = fixture.create();
        create(data, "Percent", "0912345678", OrderType.ORDER, null);
        create(data, "Underscore", "0912345679", OrderType.ORDER, null);

        MockHttpSession session = login();
        mockMvc.perform(get("/api/v1/admin/orders").param("keyword", "%").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));
        mockMvc.perform(get("/api/v1/admin/orders").param("keyword", "_").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void hidesPrivateDataWhenUnauthenticatedAndReturnsNotFoundForUnknownOrder() throws Exception {
        mockMvc.perform(get("/api/v1/admin/orders/999999999"))
                .andExpect(status().isUnauthorized())
                .andExpect(result -> {
                    String body = result.getResponse().getContentAsString();
                    assertThat(body).doesNotContain("customerName").doesNotContain("phone");
                });
        MockHttpSession session = login();
        mockMvc.perform(get("/api/v1/admin/orders/999999999").session(session))
                .andExpect(status().isNotFound());
    }

    private CreateResult create(Data data, String customerName, String phone, OrderType type, String note) {
        List<ItemInput> items = type == OrderType.ORDER
                ? List.of(new ItemInput(data.bottleOneLiter().getId().toString(), BigDecimal.ONE))
                : List.of(new ItemInput(data.weighted().getId().toString(), new BigDecimal("0.50")));
        return ordersService.create(new CreateOrder(type, customerName, phone, null, note, null, items),
                "00000000-0000-4000-8000-%012d".formatted(Math.abs(System.nanoTime()) % 1_000_000_000_000L));
    }

    private MockHttpSession login() throws Exception { return login("admin@example.com"); }

    private MockHttpSession login(String email) throws Exception {
        admins.save(new Admin(email, encoder.encode("password"), "Admin", true));
        MvcResult csrf = mockMvc.perform(get("/api/v1/csrf")).andReturn();
        MockHttpSession session = (MockHttpSession) csrf.getRequest().getSession(false);
        mockMvc.perform(post("/api/v1/admin/auth/login").session(session).header("Origin", ORIGIN)
                        .header("X-CSRF-TOKEN", token(csrf)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"%s\",\"password\":\"password\"}".formatted(email)))
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
