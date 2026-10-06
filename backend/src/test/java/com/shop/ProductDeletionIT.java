package com.shop;

import com.shop.entity.*;
import com.shop.repository.*;
import com.shop.support.CatalogFixture;
import com.shop.support.PostgresIntegrationTest;
import java.math.BigDecimal;
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
import tools.jackson.databind.ObjectMapper;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = "app.security.allowed-origins=http://localhost:3000")
@AutoConfigureMockMvc @ActiveProfiles("test") @Import(CatalogFixture.class)
class ProductDeletionIT extends PostgresIntegrationTest {
    private static final String ORIGIN = "http://localhost:3000";
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired CatalogFixture fixture;
    @Autowired AdminRepository admins;
    @Autowired PasswordEncoder encoder;
    @Autowired OrderRepository orders;
    @Autowired OrderItemRepository items;
    @Autowired ProductRepository products;
    @Autowired ProductVariantRepository variants;
    @Autowired CategoryRepository categories;
    @Autowired VoucherRepository vouchers;
    @Autowired JdbcTemplate jdbc;
    @org.springframework.test.context.bean.override.mockito.MockitoSpyBean com.shop.service.PricingService pricing;
    @Autowired com.shop.service.ProductService productService;

    @BeforeEach @AfterEach
    void reset() {
        jdbc.update("delete from sheet_sync_jobs");
        items.deleteAll(); orders.deleteAll(); variants.deleteAll(); products.deleteAll();
        categories.deleteAll(); vouchers.deleteAll(); admins.deleteAll();
    }

    @Test
    void deletesCatalogRowsWhileKeepingOrderAndQuoteSnapshots() throws Exception {
        var data = fixture.create();
        var order = orders.save(new Order("DH-20261006-1", OrderType.ORDER, "Khách", "0912345678", null,
                170000L, 0, 170000L, null, null, OrderStatus.NEW, null, "Giữ ghi chú"));
        var quote = orders.save(new Order("BG-20261006-2", OrderType.QUOTE_REQUEST, "Khách", "0912345678", null,
                null, 0, null, null, null, OrderStatus.NEW, null, null));
        jdbc.update("insert into order_items(order_id,product_id,variant_id,product_name_snapshot,variant_name_snapshot,quantity,unit_price,line_total) values (?,?,?,?,?,?,?,?)",
                order.getId(), data.fixedProduct().getId(), data.bottleOneLiter().getId(), "Dầu lịch sử", "1L lịch sử", BigDecimal.ONE, 170000L, 170000L);
        jdbc.update("insert into order_items(order_id,product_id,variant_id,product_name_snapshot,variant_name_snapshot,quantity,unit_price,line_total) values (?,?,?,?,?,?,?,?)",
                quote.getId(), data.quoteProduct().getId(), data.weighted().getId(), "Lạc lịch sử", "Theo cân", BigDecimal.ONE, null, null);
        jdbc.update("insert into product_images(product_id,url,sort_order) values (?,?,0)", data.fixedProduct().getId(), "https://img.test/shared.jpg");
        var session = login();
        for (var p : java.util.List.of(data.fixedProduct(), data.quoteProduct())) {
            mvc.perform(delete("/api/v1/admin/products/" + p.getId()).session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session)))
                    .andExpect(status().isNoContent());
            assertThat(products.existsById(p.getId())).isFalse();
            assertThat(variants.findByProductIdOrderBySortOrderAscIdAsc(p.getId())).isEmpty();
            mvc.perform(get("/api/v1/admin/products/" + p.getId()).session(session)).andExpect(status().isNotFound());
            mvc.perform(get("/api/v1/products/" + p.getSlug())).andExpect(status().isNotFound());
        }
        assertThat(jdbc.queryForObject("select count(*) from product_images", Long.class)).isZero();
        assertThat(items.count()).isEqualTo(2);
        assertThat(jdbc.queryForObject("select count(*) from order_items where product_id is null and variant_id is null", Long.class)).isEqualTo(2);
        mvc.perform(get("/api/v1/admin/orders/" + order.getId()).session(session))
                .andExpect(status().isOk()).andExpect(jsonPath("$.items[0].productNameSnapshot").value("Dầu lịch sử"))
                .andExpect(jsonPath("$.items[0].variantNameSnapshot").value("1L lịch sử"))
                .andExpect(jsonPath("$.totalAmount").value(170000)).andExpect(jsonPath("$.adminNote").value("Giữ ghi chú"));
        mvc.perform(get("/api/v1/admin/orders/" + quote.getId()).session(session))
                .andExpect(status().isOk()).andExpect(jsonPath("$.items[0].productNameSnapshot").value("Lạc lịch sử"))
                .andExpect(jsonPath("$.items[0].unitPrice").isEmpty());
        assertThat(categories.existsById(data.oils().getId())).isTrue();
        mvc.perform(delete("/api/v1/admin/products/" + data.fixedProduct().getId()).session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session)))
                .andExpect(status().isNotFound());
    }

    @Test
    void requiresAdminAndCsrfAndDeletesProductsWithoutVariants() throws Exception {
        var data = fixture.create();
        String path = "/api/v1/admin/products/" + data.fixedProduct().getId();
        mvc.perform(delete(path)).andExpect(status().isUnauthorized());
        var session = login();
        mvc.perform(delete(path).session(session).header("Origin", ORIGIN)).andExpect(status().isForbidden());
        assertThat(products.existsById(data.fixedProduct().getId())).isTrue();
        variants.deleteAll();
        mvc.perform(delete(path).session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session)))
                .andExpect(status().isNoContent());
    }

    @Test
    void rollsBackAnOrderWhenTheProductIsDeletedAfterPricing() throws Exception {
        var data = fixture.create();
        var priced = new java.util.concurrent.CountDownLatch(1);
        var resume = new java.util.concurrent.CountDownLatch(1);
        org.mockito.Mockito.doAnswer(invocation -> {
            var result = invocation.callRealMethod();
            priced.countDown();
            if (!resume.await(10, java.util.concurrent.TimeUnit.SECONDS)) throw new IllegalStateException("Test timeout");
            return result;
        }).when(pricing).calculate(org.mockito.ArgumentMatchers.any());
        var session = login();
        var csrf = csrf(session);
        var pending = java.util.concurrent.CompletableFuture.supplyAsync(() -> {
            try {
                return mvc.perform(post("/api/v1/orders").session(session).header("X-CSRF-TOKEN", csrf)
                    .header("Idempotency-Key", java.util.UUID.randomUUID().toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"orderType\":\"ORDER\",\"customerName\":\"Khách\",\"phone\":\"0912345678\",\"items\":[{\"variantId\":\"%s\",\"quantity\":1}]}".formatted(data.bottleOneLiter().getId())))
                    .andReturn().getResponse();
            } catch (Exception error) { throw new java.util.concurrent.CompletionException(error); }
        });
        try {
            assertThat(priced.await(10, java.util.concurrent.TimeUnit.SECONDS)).isTrue();
            productService.delete(data.fixedProduct().getId());
        } finally { resume.countDown(); }
        var response = pending.get(10, java.util.concurrent.TimeUnit.SECONDS);
        assertThat(response.getStatus()).isEqualTo(422);
        assertThat(mapper.readTree(response.getContentAsByteArray()).get("code").asText()).isEqualTo("ITEM_UNAVAILABLE");
        assertThat(orders.count()).isZero();
        assertThat(items.count()).isZero();
    }

    private MockHttpSession login() throws Exception {
        admins.save(new Admin("admin@test.local", encoder.encode("password"), "Admin", true));
        var result = mvc.perform(get("/api/v1/csrf")).andReturn();
        var session = (MockHttpSession) result.getRequest().getSession(false);
        var token = mapper.readTree(result.getResponse().getContentAsByteArray()).get("token").asText();
        mvc.perform(post("/api/v1/admin/auth/login").session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", token)
                .contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"admin@test.local\",\"password\":\"password\"}"))
                .andExpect(status().isOk());
        return session;
    }
    private String csrf(MockHttpSession session) throws Exception {
        return mapper.readTree(mvc.perform(get("/api/v1/csrf").session(session)).andReturn().getResponse().getContentAsByteArray()).get("token").asText();
    }
}
