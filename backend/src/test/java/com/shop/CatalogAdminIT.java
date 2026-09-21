package com.shop;

import com.shop.entity.Admin;
import com.shop.repository.AdminRepository;
import com.shop.repository.CategoryRepository;
import com.shop.repository.ProductRepository;
import com.shop.repository.ProductVariantRepository;
import com.shop.support.PostgresIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.mock.web.MockHttpSession;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "app.security.allowed-origins=http://localhost:3000")
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CatalogAdminIT extends PostgresIntegrationTest {
    private static final String ORIGIN = "http://localhost:3000";
    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper mapper;
    @Autowired AdminRepository admins;
    @Autowired CategoryRepository categories;
    @Autowired ProductRepository products;
    @Autowired ProductVariantRepository variants;
    @Autowired PasswordEncoder encoder;

    @BeforeEach
    void reset() { variants.deleteAll(); products.deleteAll(); categories.deleteAll(); admins.deleteAll(); }

    @AfterEach
    void cleanup() { reset(); }

    @Test
    void adminCreatesCatalogUpdatesVariantAndKeepsInactiveRows() throws Exception {
        MockHttpSession session = login();
        String categoryId = id(mockMvc.perform(post("/api/v1/admin/categories")
                        .session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Dầu\",\"slug\":\"dau\",\"description\":\"Ép lạnh\",\"sortOrder\":1,\"isActive\":true}"))
                .andExpect(status().isCreated()).andReturn());

        String productId = id(mockMvc.perform(post("/api/v1/admin/products")
                        .session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"categoryId\":\"%s\",\"name\":\"Dầu lạc\",\"slug\":\"dau-lac\",\"shortDescription\":\"Chai\",\"description\":\"Plain text\",\"thumbnailUrl\":\"https://img.test/oil.jpg\",\"saleType\":\"FIXED_PRICE\",\"status\":\"ACTIVE\",\"sortOrder\":1}".formatted(categoryId)))
                .andExpect(status().isCreated()).andReturn());

        String bottleId = id(mockMvc.perform(post("/api/v1/admin/products/%s/variants".formatted(productId))
                        .session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Chai 1L\",\"sku\":\"DL-1L\",\"price\":170000,\"minQuantity\":1,\"quantityStep\":1,\"isActive\":true,\"sortOrder\":0}"))
                .andExpect(status().isCreated()).andReturn());
        mockMvc.perform(post("/api/v1/admin/products/%s/variants".formatted(productId))
                        .session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Thiếu giá\",\"sku\":\"NULL-PRICE\",\"minQuantity\":1,\"quantityStep\":1}"))
                .andExpect(status().isUnprocessableContent());
        String quoteProductId = id(mockMvc.perform(post("/api/v1/admin/products")
                        .session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"categoryId\":\"%s\",\"name\":\"Lạc\",\"slug\":\"lac-nhan\",\"saleType\":\"QUOTE\"}".formatted(categoryId)))
                .andExpect(status().isCreated()).andReturn());
        mockMvc.perform(post("/api/v1/admin/products/%s/variants".formatted(quoteProductId))
                        .session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Quote có giá\",\"sku\":\"QUOTE-PRICE\",\"price\":100,\"minQuantity\":1,\"quantityStep\":1}"))
                .andExpect(status().isUnprocessableContent());
        mockMvc.perform(post("/api/v1/admin/products/999999/variants")
                        .session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Không có product\",\"sku\":\"MISSING\",\"minQuantity\":1,\"quantityStep\":1}"))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/api/v1/admin/products/%s/variants".formatted(productId))
                        .session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Read-only\",\"sku\":\"RO\",\"productId\":\"999\",\"price\":100,\"minQuantity\":1,\"quantityStep\":1}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/v1/admin/products/%s/variants".formatted(productId))
                        .session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Decimal price\",\"sku\":\"DECIMAL\",\"price\":1.9,\"minQuantity\":1,\"quantityStep\":1}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/v1/admin/products/%s/variants".formatted(productId))
                        .session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Theo cân\",\"sku\":\"DL-KG\",\"price\":1000,\"minQuantity\":0.5,\"quantityStep\":0.5,\"isActive\":true,\"sortOrder\":3}"))
                .andExpect(status().isCreated());

        mockMvc.perform(put("/api/v1/admin/variants/%s".formatted(bottleId))
                        .session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Chai 1L mới\",\"sku\":\"DL-1L\",\"price\":180000,\"minQuantity\":1,\"quantityStep\":1,\"isActive\":true,\"sortOrder\":2}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Chai 1L mới"));
        mockMvc.perform(patch("/api/v1/admin/variants/%s/status".formatted(bottleId))
                        .session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"isActive\":false}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/admin/products/%s".formatted(productId)).session(session))
                .andExpect(status().isOk()).andExpect(jsonPath("$.variants.length()").value(2))
                .andExpect(jsonPath("$.variants[0].isActive").value(false));
    }

    @Test
    void rejectsInvalidPriceDuplicateSlugAndReparentWithoutChangingExistingVariant() throws Exception {
        MockHttpSession session = login();
        String categoryId = id(mockMvc.perform(post("/api/v1/admin/categories")
                        .session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Dầu\",\"slug\":\"dau\"}"))
                .andExpect(status().isCreated()).andReturn());
        mockMvc.perform(post("/api/v1/admin/categories")
                        .session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Trùng slug\",\"slug\":\"dau\"}"))
                .andExpect(status().isConflict());
        mockMvc.perform(post("/api/v1/admin/categories")
                        .session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Slash slug\",\"slug\":\"dau/lac\"}"))
                .andExpect(status().isUnprocessableContent());
        String productId = id(mockMvc.perform(post("/api/v1/admin/products")
                        .session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"categoryId\":\"%s\",\"name\":\"Dầu\",\"slug\":\"dau-lac\",\"saleType\":\"FIXED_PRICE\",\"status\":\"ACTIVE\"}".formatted(categoryId)))
                .andExpect(status().isCreated()).andReturn());
        mockMvc.perform(post("/api/v1/admin/products")
                        .session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"categoryId\":\"%s\",\"name\":\"Trùng slug\",\"slug\":\"dau-lac\",\"saleType\":\"FIXED_PRICE\"}".formatted(categoryId)))
                .andExpect(status().isConflict());
        mockMvc.perform(post("/api/v1/admin/products")
                        .session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"categoryId\":\"%s\",\"name\":\"Slash slug\",\"slug\":\"dau/lac\",\"saleType\":\"FIXED_PRICE\"}".formatted(categoryId)))
                .andExpect(status().isUnprocessableContent());
        mockMvc.perform(post("/api/v1/admin/products")
                        .session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"categoryId\":\"%s\",\"name\":\"Unicode slug\",\"slug\":\"İ\",\"saleType\":\"FIXED_PRICE\"}".formatted(categoryId)))
                .andExpect(status().isUnprocessableContent());
        mockMvc.perform(post("/api/v1/admin/products/%s/variants".formatted(productId))
                        .session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Sai\",\"sku\":\"BAD\",\"price\":1,\"minQuantity\":0.3,\"quantityStep\":0.2}"))
                .andExpect(status().isUnprocessableContent());
        mockMvc.perform(post("/api/v1/admin/products/%s/variants".formatted(productId))
                        .session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Đúng\",\"sku\":\"SKU\",\"price\":100,\"minQuantity\":1,\"quantityStep\":1}"))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/v1/admin/products/%s/variants".formatted(productId))
                        .session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Trùng\",\"sku\":\"SKU\",\"price\":100,\"minQuantity\":1,\"quantityStep\":1}"))
                .andExpect(status().isConflict());
    }

    @Test
    void coversAdminUpdatesStatusesListsAndSaleTypeValidation() throws Exception {
        MockHttpSession session = login();
        String categoryId = id(mockMvc.perform(post("/api/v1/admin/categories")
                        .session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Dầu\",\"slug\":\"dau\"}"))
                .andExpect(status().isCreated()).andReturn());
        String productId = id(mockMvc.perform(post("/api/v1/admin/products")
                        .session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"categoryId\":\"%s\",\"name\":\"Dầu\",\"slug\":\"dau-lac\",\"saleType\":\"FIXED_PRICE\"}".formatted(categoryId)))
                .andExpect(status().isCreated()).andReturn());
        String variantId = id(mockMvc.perform(post("/api/v1/admin/products/%s/variants".formatted(productId))
                        .session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Chai\",\"sku\":\"SKU-1\",\"price\":100,\"minQuantity\":1,\"quantityStep\":1}"))
                .andExpect(status().isCreated()).andReturn());

        mockMvc.perform(put("/api/v1/admin/categories/%s".formatted(categoryId))
                        .session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Dầu mới\",\"slug\":\"dau-moi\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.slug").value("dau-moi"));
        mockMvc.perform(patch("/api/v1/admin/categories/%s/status".formatted(categoryId))
                        .session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"isActive\":false}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.isActive").value(false));
        mockMvc.perform(get("/api/v1/admin/categories").session(session))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].slug").value("dau-moi"));

        mockMvc.perform(put("/api/v1/admin/products/%s".formatted(productId))
                        .session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"categoryId\":\"%s\",\"name\":\"Dầu mới\",\"slug\":\"dau-lac-moi\",\"saleType\":\"QUOTE\"}".formatted(categoryId)))
                .andExpect(status().isUnprocessableContent());
        mockMvc.perform(patch("/api/v1/admin/products/%s/status".formatted(productId))
                        .session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"INACTIVE\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("INACTIVE"));
        mockMvc.perform(get("/api/v1/admin/products").session(session))
                .andExpect(status().isOk()).andExpect(jsonPath("$.page").value(0)).andExpect(jsonPath("$.content[0].status").value("INACTIVE"));

        mockMvc.perform(put("/api/v1/admin/variants/%s".formatted(variantId))
                        .session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Sai\",\"sku\":\"SKU-1\",\"price\":1,\"minQuantity\":0.3,\"quantityStep\":0.2}"))
                .andExpect(status().isUnprocessableContent());
        mockMvc.perform(get("/api/v1/admin/products/%s".formatted(productId)).session(session))
                .andExpect(status().isOk()).andExpect(jsonPath("$.variants[0].minQuantity").value(1.0));
    }

    @Test
    void adminMutationRequiresAuthenticationAndCsrf() throws Exception {
        mockMvc.perform(post("/api/v1/admin/categories").contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Dầu\",\"slug\":\"dau\"}"))
                .andExpect(status().isUnauthorized());
        MockHttpSession session = login();
        mockMvc.perform(post("/api/v1/admin/categories").session(session).header("Origin", ORIGIN)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Dầu\",\"slug\":\"dau\"}"))
                .andExpect(status().isForbidden());
    }

    private MockHttpSession login() throws Exception {
        admins.save(new Admin("admin@example.com", encoder.encode("password"), "Admin", true));
        MvcResult csrf = mockMvc.perform(get("/api/v1/csrf")).andReturn();
        MockHttpSession initial = (MockHttpSession) csrf.getRequest().getSession(false);
        mockMvc.perform(post("/api/v1/admin/auth/login").session(initial).header("Origin", ORIGIN)
                        .header("X-CSRF-TOKEN", token(csrf)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@example.com\",\"password\":\"password\"}"))
                .andExpect(status().isOk());
        return initial;
    }

    private String csrf(MockHttpSession session) throws Exception {
        return token(mockMvc.perform(get("/api/v1/csrf").session(session)).andReturn());
    }
    private String token(MvcResult result) throws Exception {
        JsonNode body = mapper.readTree(result.getResponse().getContentAsByteArray());
        return body.get("token").asText();
    }
    private String id(MvcResult result) throws Exception {
        return mapper.readTree(result.getResponse().getContentAsByteArray()).get("id").asText();
    }
}
