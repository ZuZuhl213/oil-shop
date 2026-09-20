package com.shop;

import com.shop.support.PostgresIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.health.actuate.endpoint.HealthEndpointGroups;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = WebEnvironment.MOCK)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class StartupIT extends PostgresIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private HealthEndpointGroups healthEndpointGroups;

    @Test
    void startsWithPostgresAndReportsDatabaseReady() throws Exception {
        org.assertj.core.api.Assertions.assertThat(healthEndpointGroups.get("readiness").isMember("db"))
                .isTrue();

        mockMvc.perform(get("/actuator/health/readiness"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.components").doesNotExist())
                .andExpect(jsonPath("$.details").doesNotExist());
    }

    @Test
    void refusesToStartWhenTheDatabaseIsUnavailable() {
        assertThatThrownBy(() -> SpringApplication.from(ShopApplication::main)
                .withAdditionalProfiles("test")
                .run(
                        "--spring.main.web-application-type=none",
                        "--spring.datasource.url=jdbc:postgresql://127.0.0.1:1/unavailable",
                        "--spring.datasource.username=unavailable",
                        "--spring.datasource.password=unavailable",
                        "--spring.datasource.hikari.connection-timeout=250",
                        "--spring.flyway.connect-retries=0"))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void refusesToStartOutsideLocalWithoutDatabasePassword() {
        assertThatThrownBy(() -> SpringApplication.from(ShopApplication::main)
                .run(
                        "--spring.main.web-application-type=none",
                        "--spring.profiles.active=production",
                        "--spring.datasource.password="))
                .hasMessage("DATABASE_PASSWORD is required outside local/test profiles");
    }
}
