package com.shop;

import com.shop.repository.CategoryRepository;
import com.shop.repository.OrderItemRepository;
import com.shop.repository.OrderRepository;
import com.shop.repository.ProductRepository;
import com.shop.repository.ProductVariantRepository;
import com.shop.repository.VoucherRepository;
import com.shop.support.CatalogFixture;
import com.shop.support.CatalogFixture.Data;
import com.shop.support.PostgresIntegrationTest;
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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(CatalogFixture.class)
class OrderIdempotencyIT extends PostgresIntegrationTest {
    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper mapper;
    @Autowired CatalogFixture fixture;
    @Autowired CategoryRepository categories;
    @Autowired ProductRepository products;
    @Autowired ProductVariantRepository variants;
    @Autowired VoucherRepository vouchers;
    @Autowired OrderRepository orders;
    @Autowired OrderItemRepository orderItems;
    @Autowired JdbcTemplate jdbc;

    @BeforeEach
    void reset() {
        orderItems.deleteAll();
        orders.deleteAll();
        variants.deleteAll();
        products.deleteAll();
        categories.deleteAll();
        vouchers.deleteAll();
    }

    @AfterEach
    void cleanup() { reset(); }

    @Test
    void replaysCommittedReceiptBeforeCatalogOrVoucherValidation() throws Exception {
        Data data = fixture.create();
        String body = fixedBody(data, "Nguyễn Văn A");
        MockHttpSession session = csrfSession();
        String key = "00000000-0000-4000-8000-000000000101";

        String first = responseBody(mockMvc.perform(post("/api/v1/orders")
                        .session(session).header("X-CSRF-TOKEN", csrf(session)).header("Idempotency-Key", key)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated()).andReturn());
        long usedCount = vouchers.findById(data.welcome().getId()).orElseThrow().getUsedCount();

        data.fixedProduct().setStatus(com.shop.entity.ProductStatus.INACTIVE);
        products.saveAndFlush(data.fixedProduct());
        data.welcome().setQuantity(1);
        data.welcome().setUsedCount(1);
        vouchers.saveAndFlush(data.welcome());
        jdbc.update("UPDATE orders SET status = 'CONTACTED'");

        String replay = responseBody(mockMvc.perform(post("/api/v1/orders")
                        .session(session).header("X-CSRF-TOKEN", csrf(session)).header("Idempotency-Key", key)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk()).andReturn());

        assertThat(replay).isEqualTo(first);
        assertThat(vouchers.findById(data.welcome().getId()).orElseThrow().getUsedCount()).isEqualTo(usedCount);
        assertThat(orders.count()).isEqualTo(1);
    }

    @Test
    void rejectsSameKeyWithDifferentPayload() throws Exception {
        Data data = fixture.create();
        MockHttpSession session = csrfSession();
        String key = "00000000-0000-4000-8000-000000000102";
        mockMvc.perform(post("/api/v1/orders")
                        .session(session).header("X-CSRF-TOKEN", csrf(session)).header("Idempotency-Key", key)
                        .contentType(MediaType.APPLICATION_JSON).content(fixedBody(data, "A")))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/orders")
                        .session(session).header("X-CSRF-TOKEN", csrf(session)).header("Idempotency-Key", key)
                        .contentType(MediaType.APPLICATION_JSON).content(fixedBody(data, "B")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("IDEMPOTENCY_CONFLICT"));
        assertThat(orders.count()).isEqualTo(1);
    }

    @Test
    void malformedRetryPayloadCannotReplayAValidReceipt() throws Exception {
        Data data = fixture.create();
        MockHttpSession session = csrfSession();
        String key = "00000000-0000-4000-8000-000000000105";
        mockMvc.perform(post("/api/v1/orders")
                        .session(session).header("X-CSRF-TOKEN", csrf(session)).header("Idempotency-Key", key)
                        .contentType(MediaType.APPLICATION_JSON).content(fixedBody(data, "A")))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/orders")
                        .session(session).header("X-CSRF-TOKEN", csrf(session)).header("Idempotency-Key", key)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(fixedBody(data, "A").replace("\"items\":", "\"address\":\"   \",\"items\":")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("IDEMPOTENCY_CONFLICT"));
        assertThat(orders.count()).isEqualTo(1);
    }

    @Test
    void rejectsMissingOrMalformedIdempotencyKey() throws Exception {
        Data data = fixture.create();
        MockHttpSession session = csrfSession();
        String body = fixedBody(data, "A");
        mockMvc.perform(post("/api/v1/orders")
                        .session(session).header("X-CSRF-TOKEN", csrf(session))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/v1/orders")
                        .session(session).header("X-CSRF-TOKEN", csrf(session)).header("Idempotency-Key", "bad-key")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
        mockMvc.perform(post("/api/v1/orders")
                        .session(session).header("X-CSRF-TOKEN", csrf(session)).header("Idempotency-Key", "0-0-0-0-0")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
        assertThat(orders.count()).isZero();
    }

    private String fixedBody(Data data, String customerName) {
        return """
                {"orderType":"ORDER","customerName":"%s","phone":"0912345678","voucherCode":"WELCOME","items":[
                  {"variantId":"%s","quantity":2},{"variantId":"%s","quantity":1}]}
                """.formatted(customerName, data.bottleOneLiter().getId(), data.bottleHalfLiter().getId());
    }

    private MockHttpSession csrfSession() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/csrf")).andExpect(status().isOk()).andReturn();
        return (MockHttpSession) result.getRequest().getSession(false);
    }

    private String csrf(MockHttpSession session) throws Exception {
        return mapper.readTree(mockMvc.perform(get("/api/v1/csrf").session(session))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsByteArray()).get("token").asText();
    }

    private String responseBody(MvcResult result) throws Exception {
        JsonNode value = mapper.readTree(result.getResponse().getContentAsByteArray());
        return mapper.writeValueAsString(value);
    }
}
