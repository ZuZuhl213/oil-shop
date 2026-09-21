package com.shop;

import com.shop.dto.VoucherDtos.VoucherWrite;
import com.shop.entity.Admin;
import com.shop.entity.DiscountType;
import com.shop.entity.Voucher;
import com.shop.repository.AdminRepository;
import com.shop.repository.VoucherRepository;
import com.shop.service.VoucherService;
import com.shop.support.PostgresIntegrationTest;
import java.time.Instant;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
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
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "app.security.allowed-origins=http://localhost:3000")
@AutoConfigureMockMvc
@ActiveProfiles("test")
class VoucherAdminIT extends PostgresIntegrationTest {
    private static final String ORIGIN = "http://localhost:3000";

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper mapper;
    @Autowired AdminRepository admins;
    @Autowired VoucherRepository vouchers;
    @Autowired PasswordEncoder encoder;
    @Autowired VoucherService voucherService;
    @Autowired PlatformTransactionManager transactionManager;

    @BeforeEach
    void reset() {
        vouchers.deleteAll();
        admins.deleteAll();
    }

    @AfterEach
    void cleanup() { reset(); }

    @Test
    void createsNormalizedVoucherReadsItAndRejectsDuplicateCode() throws Exception {
        MockHttpSession session = login();
        String body = """
                {"code":" welcome ","discountType":"PERCENT","discountValue":10,
                 "maxDiscount":50000,"minOrderValue":0,"quantity":100,
                 "startAt":null,"endAt":null,"isActive":true}
                """;

        String id = id(mockMvc.perform(post("/api/v1/admin/vouchers")
                        .session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value("WELCOME"))
                .andExpect(jsonPath("$.usedCount").value(0))
                .andReturn());
        mockMvc.perform(get("/api/v1/admin/vouchers/" + id).session(session))
                .andExpect(status().isOk()).andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.discountType").value("PERCENT"));
        mockMvc.perform(get("/api/v1/admin/vouchers").session(session))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].code").value("WELCOME"));

        mockMvc.perform(post("/api/v1/admin/vouchers")
                        .session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body.replace("welcome", "WELCOME")))
                .andExpect(status().isConflict());
    }

    @Test
    void validatesDiscountTypeTimeQuantityAndReadOnlyFields() throws Exception {
        MockHttpSession session = login();
        assertInvalid(session, "{\"code\":\"P0\",\"discountType\":\"PERCENT\",\"discountValue\":0,\"quantity\":1}");
        assertInvalid(session, "{\"code\":\"P101\",\"discountType\":\"PERCENT\",\"discountValue\":101,\"quantity\":1}");
        assertInvalid(session, "{\"code\":\"FMAX\",\"discountType\":\"FIXED\",\"discountValue\":10,\"maxDiscount\":1,\"quantity\":1}");
        assertInvalid(session, "{\"code\":\"TIME\",\"discountType\":\"FIXED\",\"discountValue\":10,\"quantity\":1,\"startAt\":\"2026-09-21T02:00:00Z\",\"endAt\":\"2026-09-21T01:00:00Z\"}");
        mockMvc.perform(post("/api/v1/admin/vouchers")
                        .session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"READONLY\",\"discountType\":\"FIXED\",\"discountValue\":10,\"quantity\":1,\"usedCount\":1}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateLocksLatestUsedCountAndStatusDoesNotConsume() throws Exception {
        Voucher voucher = vouchers.save(new Voucher("LOCKED", DiscountType.FIXED, 10, null, 0, 5, 3, null, null, true));
        MockHttpSession session = login();
        String invalidUpdate = "{\"code\":\"LOCKED\",\"discountType\":\"FIXED\",\"discountValue\":10,\"quantity\":2,\"isActive\":true}";
        mockMvc.perform(put("/api/v1/admin/vouchers/" + voucher.getId())
                        .session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session))
                        .contentType(MediaType.APPLICATION_JSON).content(invalidUpdate))
                .andExpect(status().isUnprocessableContent());
        assertThat(vouchers.findById(voucher.getId()).orElseThrow().getQuantity()).isEqualTo(5);

        mockMvc.perform(patch("/api/v1/admin/vouchers/" + voucher.getId() + "/status")
                        .session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"isActive\":false}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.isActive").value(false))
                .andExpect(jsonPath("$.usedCount").value(3));
    }

    @Test
    void concurrentUsedCountUpdateWinsBeforeAdminQuantityDecrease() throws Exception {
        Voucher voucher = vouchers.save(new Voucher("RACE", DiscountType.FIXED, 10, null, 0, 2, 1, null, null, true));
        CountDownLatch consumerLocked = new CountDownLatch(1);
        CountDownLatch allowConsumerCommit = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            TransactionTemplate template = new TransactionTemplate(transactionManager);
            Future<?> consumer = executor.submit(() -> template.execute(status -> {
                Voucher locked = vouchers.findByIdForUpdate(voucher.getId()).orElseThrow();
                locked.setUsedCount(2);
                consumerLocked.countDown();
                await(allowConsumerCommit);
                return null;
            }));
            assertThat(consumerLocked.await(5, TimeUnit.SECONDS)).isTrue();
            Future<?> admin = executor.submit(() -> voucherService.update(voucher.getId(),
                    new VoucherWrite("RACE", DiscountType.FIXED, 10L, null, 0L, 1, null, null, true)));
            allowConsumerCommit.countDown();
            consumer.get(5, TimeUnit.SECONDS);
            ExecutionException error = assertThrows(ExecutionException.class, () -> admin.get(5, TimeUnit.SECONDS));
            assertThat(error.getCause()).isInstanceOf(com.shop.exception.BusinessException.class);
        } finally {
            executor.shutdownNow();
        }
        Voucher result = vouchers.findById(voucher.getId()).orElseThrow();
        assertThat(result.getUsedCount()).isEqualTo(2);
        assertThat(result.getQuantity()).isEqualTo(2);
    }

    private void assertInvalid(MockHttpSession session, String body) throws Exception {
        mockMvc.perform(post("/api/v1/admin/vouchers")
                        .session(session).header("Origin", ORIGIN).header("X-CSRF-TOKEN", csrf(session))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnprocessableContent());
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

    private String id(MvcResult result) throws Exception {
        return mapper.readTree(result.getResponse().getContentAsByteArray()).get("id").asText();
    }

    private static void await(CountDownLatch latch) {
        try {
            latch.await(5, TimeUnit.SECONDS);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(exception);
        }
    }
}
