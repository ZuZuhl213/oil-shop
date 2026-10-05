package com.shop;

import com.shop.entity.*;
import com.shop.repository.*;
import com.shop.support.PostgresIntegrationTest;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.*;
import tools.jackson.databind.ObjectMapper;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {"app.security.allowed-origins=http://localhost:3000", "app.media.r2.public-base-url=https://media.test", "app.media.supabase-url=https://legacy.test", "app.media.bucket=catalog"})
@AutoConfigureMockMvc @ActiveProfiles("test")
class ProductImagesIT extends PostgresIntegrationTest {
    @Autowired MockMvc mvc; @Autowired ObjectMapper mapper; @Autowired AdminRepository admins;
    @Autowired CategoryRepository categories; @Autowired ProductRepository products;
    @Autowired ProductVariantRepository variants; @Autowired PasswordEncoder encoder;
    MockHttpSession session; String token; long categoryId;
    final String a = "https://media.test/products/12345678-1234-1234-1234-123456789abc.png";
    final String b = "https://media.test/products/22345678-1234-1234-1234-123456789abc.webp";
    @BeforeEach void setup() throws Exception {
        variants.deleteAll(); products.deleteAll(); categories.deleteAll(); admins.deleteAll();
        categoryId = categories.save(new Category("Oils", "oils", null, 0, true)).getId();
        admins.save(new Admin("gallery@test.com", encoder.encode("password"), "Admin", true));
        var start = mvc.perform(get("/api/v1/csrf")).andReturn();
        session = (MockHttpSession)start.getRequest().getSession();
        mvc.perform(post("/api/v1/admin/auth/login").session(session).header("Origin", "http://localhost:3000")
            .header("X-CSRF-TOKEN", mapper.readTree(start.getResponse().getContentAsString()).get("token").asText())
            .contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"gallery@test.com\",\"password\":\"password\"}")).andExpect(status().isOk());
        token = mapper.readTree(mvc.perform(get("/api/v1/csrf").session(session)).andReturn().getResponse().getContentAsString()).get("token").asText();
    }
    @AfterEach void cleanup() { variants.deleteAll(); products.deleteAll(); categories.deleteAll(); admins.deleteAll(); }
    Map<String,Object> body(List<String> urls, String cover, Long revision) {
        var value = new LinkedHashMap<String,Object>();
        value.put("categoryId", Long.toString(categoryId)); value.put("name", "Oil"); value.put("slug", "oil"); value.put("saleType", "FIXED_PRICE");
        value.put("thumbnailUrl", cover);
        if (urls != null) value.put("imageUrls", urls);
        if (revision != null) value.put("expectedImagesRevision", revision);
        return value;
    }
    ResultActions create(Map<String,Object> value) throws Exception {
        return mvc.perform(post("/api/v1/admin/products").session(session).header("Origin", "http://localhost:3000").header("X-CSRF-TOKEN", token)
            .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(value)));
    }
    ResultActions update(String id, Map<String,Object> value) throws Exception {
        return mvc.perform(put("/api/v1/admin/products/" + id).session(session).header("Origin", "http://localhost:3000").header("X-CSRF-TOKEN", token)
            .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(value)));
    }
    String createProduct() throws Exception {
        return mapper.readTree(create(body(List.of(a,b), b, null)).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).get("id").asText();
    }
    @Test void savesOrderAndCoverAtomicallyAndReturnsImagesInPublicDetailAndList() throws Exception {
        String id = createProduct();
        update(id, body(List.of(b,a), a, 0L)).andExpect(status().isOk()).andExpect(jsonPath("$.images[0].url").value(b))
            .andExpect(jsonPath("$.images[1].sortOrder").value(1)).andExpect(jsonPath("$.imagesRevision").value(1)).andExpect(jsonPath("$.thumbnailUrl").value(a));
        variants.save(new ProductVariant(products.findById(Long.parseLong(id)).orElseThrow(), "Bottle", "GAL-1", 100L, java.math.BigDecimal.ONE, java.math.BigDecimal.ONE, true, 0));
        mvc.perform(get("/api/v1/products/oil")).andExpect(status().isOk()).andExpect(jsonPath("$.images[0].url").value(b));
        mvc.perform(get("/api/v1/products")).andExpect(status().isOk()).andExpect(jsonPath("$.content[0].images.length()").value(2));
        update(id, body(List.of(b,a), a, 1L)).andExpect(status().isOk()).andExpect(jsonPath("$.imagesRevision").value(1));
        update(id, body(List.of(), null, 1L)).andExpect(status().isOk()).andExpect(jsonPath("$.images.length()").value(0)).andExpect(jsonPath("$.thumbnailUrl").doesNotExist());
    }
    @Test void rejectsStaleRevisionWithoutChangingOtherFields() throws Exception {
        String id = createProduct();
        update(id, body(List.of(a), a, 0L)).andExpect(status().isOk());
        var stale = body(List.of(b), b, 0L); stale.put("name", "Wrong stale name");
        update(id, stale).andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("IMAGE_CONFLICT"));
        mvc.perform(get("/api/v1/admin/products/"+id).session(session)).andExpect(jsonPath("$.name").value("Oil")).andExpect(jsonPath("$.images[0].url").value(a));
    }
    @Test void validatesBeforeCommitAndRejectsMissingRevisionDuplicateForeignCoverAndTooMany() throws Exception {
        String id = createProduct();
        for (var value : List.of(body(List.of(a,a), a, 0L), body(List.of(a), b, 0L), body(List.of("https://foreign.test/a.png"), "https://foreign.test/a.png", 0L), body(List.of(a), a, null), body(Collections.nCopies(11,a), a, 0L))) {
            value.put("name", "Must roll back"); update(id,value).andExpect(status().isUnprocessableContent());
        }
        mvc.perform(get("/api/v1/admin/products/"+id).session(session)).andExpect(jsonPath("$.name").value("Oil")).andExpect(jsonPath("$.images.length()").value(2));
    }
    @Test void legacyWriteKeepsGalleryAndCannotChangeItsCover() throws Exception {
        String id = createProduct();
        update(id,body(null,b,null)).andExpect(status().isOk()).andExpect(jsonPath("$.images.length()").value(2));
        update(id,body(null,a,null)).andExpect(status().isUnprocessableContent());
    }
    @Test void legacyCreateProducesOneImage() throws Exception {
        create(body(null,a,null)).andExpect(status().isCreated()).andExpect(jsonPath("$.images.length()").value(1)).andExpect(jsonPath("$.imagesRevision").value(0));
    }
    @Test void rejectsUnauthenticatedAndForeignOriginBeforeMutation() throws Exception {
        String id = createProduct();
        mvc.perform(put("/api/v1/admin/products/"+id).contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(body(List.of(),null,0L)))).andExpect(status().isUnauthorized());
        mvc.perform(put("/api/v1/admin/products/"+id).session(session).header("Origin","https://evil.test").header("X-CSRF-TOKEN",token).contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(body(List.of(),null,0L)))).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/admin/products/"+id).session(session)).andExpect(jsonPath("$.images.length()").value(2));
    }
    @Autowired jakarta.persistence.EntityManagerFactory entityManagers;
    @Test void adminPageBatchesImageReadsAsProductCountGrows() throws Exception {
        createProduct();
        var statistics = entityManagers.unwrap(org.hibernate.SessionFactory.class).getStatistics();
        statistics.setStatisticsEnabled(true);
        try {
            statistics.clear();
            mvc.perform(get("/api/v1/admin/products?size=100").session(session)).andExpect(status().isOk());
            long oneProductReads = statistics.getPrepareStatementCount();
            for (int i=1;i<6;i++) {
                var next = body(List.of(a,b),a,null); next.put("slug","oil-"+i);
                create(next).andExpect(status().isCreated());
            }
            statistics.clear();
            mvc.perform(get("/api/v1/admin/products?size=100").session(session)).andExpect(status().isOk()).andExpect(jsonPath("$.content.length()").value(6));
            assertThat(statistics.getPrepareStatementCount()).isLessThanOrEqualTo(oneProductReads + 1);
        } finally { statistics.setStatisticsEnabled(false); }
    }
    @Autowired org.springframework.transaction.PlatformTransactionManager transactions;
    @Autowired org.springframework.jdbc.core.JdbcTemplate jdbc;
    @Test void statusWriteMustNotOverwriteCommittedMediaRevision() throws Exception {
        String id = createProduct();
        var gallerySaved = new CountDownLatch(1); var releaseGallery = new CountDownLatch(1);
        var tx = new org.springframework.transaction.support.TransactionTemplate(transactions);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var galleryResult = executor.submit(() -> tx.execute(transaction -> {
                try {
                    int code = update(id,body(List.of(a),a,0L)).andReturn().getResponse().getStatus();
                    gallerySaved.countDown();
                    if (!releaseGallery.await(10,TimeUnit.SECONDS)) throw new IllegalStateException("Gallery latch timeout");
                    return code;
                } catch (Exception failure) { throw new RuntimeException(failure); }
            }));
            try {
                assertThat(gallerySaved.await(5,TimeUnit.SECONDS)).isTrue();
                var statusResult = executor.submit(() -> tx.execute(transaction -> {
                    jdbc.execute("SET LOCAL application_name='hm_gallery_status_test'");
                    try {
                        return mvc.perform(patch("/api/v1/admin/products/"+id+"/status").session(session)
                            .header("Origin","http://localhost:3000").header("X-CSRF-TOKEN",token)
                            .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"INACTIVE\"}")).andReturn().getResponse().getStatus();
                    } catch (Exception failure) { throw new RuntimeException(failure); }
                }));
                long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(5);
                boolean blocked = false;
                while (System.nanoTime() < deadline && !blocked) {
                    blocked = jdbc.queryForObject("SELECT count(*) > 0 FROM pg_stat_activity WHERE application_name='hm_gallery_status_test' AND wait_event_type='Lock'",Boolean.class);
                    if (!blocked) Thread.sleep(10);
                }
                assertThat(blocked).as("status transaction overlaps uncommitted gallery write").isTrue();
                releaseGallery.countDown();
                assertThat(galleryResult.get(5,TimeUnit.SECONDS)).isEqualTo(200);
                assertThat(statusResult.get(5,TimeUnit.SECONDS)).isEqualTo(200);
            } finally { releaseGallery.countDown(); }
        }
        mvc.perform(get("/api/v1/admin/products/"+id).session(session)).andExpect(jsonPath("$.imagesRevision").value(1)).andExpect(jsonPath("$.thumbnailUrl").value(a)).andExpect(jsonPath("$.images[0].url").value(a));
    }
    @Test void concurrentUpdatesAllowOnlyOneRevisionWinner() throws Exception {
        String id = createProduct(); var start = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            Callable<Integer> first = () -> { start.await(); return update(id,body(List.of(a),a,0L)).andReturn().getResponse().getStatus(); };
            Callable<Integer> second = () -> { start.await(); return update(id,body(List.of(b),b,0L)).andReturn().getResponse().getStatus(); };
            var f1 = executor.submit(first); var f2 = executor.submit(second); start.countDown();
            assertThat(List.of(f1.get(15,TimeUnit.SECONDS),f2.get(15,TimeUnit.SECONDS))).containsExactlyInAnyOrder(200,409);
        }
    }
}
