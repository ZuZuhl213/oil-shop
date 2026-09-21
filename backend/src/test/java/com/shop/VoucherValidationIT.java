package com.shop;

import com.shop.entity.DiscountType;
import com.shop.entity.Voucher;
import com.shop.repository.CategoryRepository;
import com.shop.repository.ProductRepository;
import com.shop.repository.ProductVariantRepository;
import com.shop.repository.VoucherRepository;
import com.shop.support.CatalogFixture;
import com.shop.support.PostgresIntegrationTest;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
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
class VoucherValidationIT extends PostgresIntegrationTest {
    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper mapper;
    @Autowired CatalogFixture fixture;
    @Autowired CategoryRepository categories;
    @Autowired ProductRepository products;
    @Autowired ProductVariantRepository variants;
    @Autowired VoucherRepository vouchers;

    @BeforeEach
    void reset() {
        variants.deleteAll();
        products.deleteAll();
        categories.deleteAll();
        vouchers.deleteAll();
    }

    @AfterEach
    void cleanup() { reset(); }

    @Test
    void previewCanBeRepeatedWithoutConsumingVoucher() throws Exception {
        var data = fixture.create();
        MockHttpSession session = csrfSession();
        String body = """
                {"code":" welcome ","items":[
                  {"variantId":"%s","quantity":2},
                  {"variantId":"%s","quantity":1}
                ]}
                """.formatted(data.bottleOneLiter().getId(), data.bottleHalfLiter().getId());

        for (int i = 0; i < 20; i++) {
            mockMvc.perform(post("/api/v1/vouchers/validate")
                            .session(session)
                            .header("X-CSRF-TOKEN", csrf(session))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.subtotal").value(430_000))
                    .andExpect(jsonPath("$.discountAmount").value(43_000))
                    .andExpect(jsonPath("$.totalAmount").value(387_000))
                    .andExpect(jsonPath("$.voucherCode").value("WELCOME"));
        }

        assertThat(vouchers.findById(data.welcome().getId()).orElseThrow().getUsedCount()).isZero();
    }

    @Test
    void rejectsUnavailableVouchersAndInvalidQuantities() throws Exception {
        var data = fixture.create();
        Instant now = Instant.now();
        Voucher exhausted = vouchers.save(new Voucher("EXHAUSTED", DiscountType.FIXED, 10, null, 0, 1, 1, null, null, true));
        Voucher inactive = vouchers.save(new Voucher("INACTIVE", DiscountType.FIXED, 10, null, 0, 1, 0, null, null, false));
        Voucher notStarted = vouchers.save(new Voucher("NOTSTARTED", DiscountType.FIXED, 10, null, 0, 1, 0, now.plusSeconds(3600), null, true));
        Voucher expired = vouchers.save(new Voucher("EXPIRED", DiscountType.FIXED, 10, null, 0, 1, 0, null, now.minusSeconds(3600), true));
        MockHttpSession session = csrfSession();
        String item = "{\"variantId\":\"%s\",\"quantity\":1}".formatted(data.bottleOneLiter().getId());

        assertCode(session, "EXHAUSTED", item, "VOUCHER_EXHAUSTED");
        assertCode(session, "INACTIVE", item, "VOUCHER_INVALID");
        assertCode(session, "NOTSTARTED", item, "VOUCHER_INVALID");
        assertCode(session, "EXPIRED", item, "VOUCHER_INVALID");
        assertCode(session, "WELCOME", "{\"variantId\":\"%s\",\"quantity\":1.5}".formatted(data.bottleOneLiter().getId()), "VALIDATION_ERROR");
    }

    @Test
    void rejectsQuoteAndMixedSaleTypesForVoucherPreview() throws Exception {
        var data = fixture.create();
        MockHttpSession session = csrfSession();
        assertCode(session, "WELCOME", "{\"variantId\":\"%s\",\"quantity\":0.5}".formatted(data.weighted().getId()), "VOUCHER_INVALID");
        assertCode(session, "WELCOME", "[{\"variantId\":\"%s\",\"quantity\":1},{\"variantId\":\"%s\",\"quantity\":0.5}]"
                .formatted(data.bottleOneLiter().getId(), data.weighted().getId()), "MIXED_SALE_TYPES");
    }

    private void assertCode(MockHttpSession session, String code, String items, String expectedCode) throws Exception {
        String itemArray = items.startsWith("[") ? items : "[" + items + "]";
        mockMvc.perform(post("/api/v1/vouchers/validate")
                        .session(session)
                        .header("X-CSRF-TOKEN", csrf(session))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"%s\",\"items\":%s}".formatted(code, itemArray)))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value(expectedCode));
    }

    private MockHttpSession csrfSession() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/csrf")).andReturn();
        return (MockHttpSession) result.getRequest().getSession(false);
    }

    private String csrf(MockHttpSession session) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/csrf").session(session)).andReturn();
        JsonNode body = mapper.readTree(result.getResponse().getContentAsByteArray());
        return body.get("token").asText();
    }
}
