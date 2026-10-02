package com.shop;

import com.shop.support.PostgresIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "DB_HOST=unused", "DB_DATABASE=unused", "DB_USERNAME=oil_shop",
        "spring.datasource.password=oil_shop_test",
        "APP_SECURITY_ALLOWED_ORIGINS=https://rehearsal.example.test" })
@AutoConfigureMockMvc
@ActiveProfiles("prod")
class ReleaseConfigIT extends PostgresIntegrationTest {
    @Autowired MockMvc mvc;

    @Test void disabledProductionDocsReturnNotFoundRatherThanServerErrors() throws Exception {
        for (String path : new String[] { "/v3/api-docs", "/swagger-ui/index.html" }) {
            mvc.perform(get(path))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.code").value("NOT_FOUND"));
        }
    }
}
