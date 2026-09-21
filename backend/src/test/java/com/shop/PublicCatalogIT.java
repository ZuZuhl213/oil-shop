package com.shop;

import com.shop.repository.CategoryRepository;
import com.shop.repository.ProductRepository;
import com.shop.repository.ProductVariantRepository;
import com.shop.repository.VoucherRepository;
import com.shop.exception.BusinessException;
import com.shop.support.CatalogFixture;
import com.shop.support.PostgresIntegrationTest;
import com.shop.service.CatalogQueryService;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(CatalogFixture.class)
class PublicCatalogIT extends PostgresIntegrationTest {
    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper mapper;
    @Autowired CatalogFixture fixture;
    @Autowired CategoryRepository categories;
    @Autowired ProductRepository products;
    @Autowired ProductVariantRepository variants;
    @Autowired VoucherRepository vouchers;
    @Autowired CatalogQueryService query;

    @BeforeEach
    void reset() { variants.deleteAll(); products.deleteAll(); categories.deleteAll(); vouchers.deleteAll(); }

    @AfterEach
    void cleanup() { reset(); }

    @Test
    void listsOnlyProductsInActiveCategoryWithActiveVariant() throws Exception {
        var data = fixture.create();
        mockMvc.perform(get("/api/v1/products")).andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.content[0].slug").value("dau-lac-ep-lanh"));

        data.oils().setActive(false); categories.save(data.oils());
        mockMvc.perform(get("/api/v1/products")).andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].slug").value("lac-nhan"));
    }

    @Test
    void inactiveOnlyVariantHidesProductAndUnknownSlugIs404() throws Exception {
        var data = fixture.create();
        data.bottleOneLiter().setActive(false); variants.save(data.bottleOneLiter());
        data.bottleHalfLiter().setActive(false); variants.save(data.bottleHalfLiter());
        mockMvc.perform(get("/api/v1/products")).andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1));
        mockMvc.perform(get("/api/v1/products/dau-lac-ep-lanh")).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/products/no-such-product")).andExpect(status().isNotFound());
    }

    @Test
    void supportsCategoryKeywordPaginationAndRejectsInvalidPageSize() throws Exception {
        fixture.create();
        mockMvc.perform(get("/api/v1/categories")).andExpect(status().isOk())
                .andExpect(jsonPath("$[0].slug").value("dau-thuc-vat"));
        mockMvc.perform(get("/api/v1/products").param("category", "dau-thuc-vat").param("keyword", "lạc").param("page", "0").param("size", "1"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.page").value(0)).andExpect(jsonPath("$.size").value(1))
                .andExpect(jsonPath("$.totalElements").value(1)).andExpect(jsonPath("$.totalPages").value(1));
        mockMvc.perform(get("/api/v1/products").param("size", "0"))
                .andExpect(status().isUnprocessableContent());
    }

    @Test
    void loadSellableRejectsInactiveCatalogChain() {
        var data = fixture.create();
        assertThat(query.loadSellable(List.of(data.bottleOneLiter().getId()))).hasSize(1);

        data.oils().setActive(false);
        categories.save(data.oils());
        assertThatThrownBy(() -> query.loadSellable(List.of(data.bottleOneLiter().getId())))
                .isInstanceOf(BusinessException.class)
                .satisfies(error -> assertThat(((BusinessException) error).code()).isEqualTo("ITEM_UNAVAILABLE"));
    }
}
