package com.shop;

import com.shop.entity.*;
import com.shop.repository.*;
import com.shop.integration.storage.MediaStorage;
import com.shop.integration.storage.R2MediaClient;
import com.shop.support.PostgresIntegrationTest;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.net.http.*;
import java.nio.file.*;
import java.time.Duration;
import java.util.*;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.*;
import org.springframework.test.web.servlet.*;
import tools.jackson.databind.ObjectMapper;
import software.amazon.awssdk.auth.credentials.*;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.*;
import software.amazon.awssdk.services.s3.model.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Explicit opt-in. Only R2 settings are read from .env; DB is always a disposable container. */
@EnabledIfEnvironmentVariable(named="HM_R2_LIVE_SMOKE", matches="1")
@SpringBootTest(properties={"app.security.allowed-origins=http://localhost:3000", "logging.level.org.springframework=WARN", "logging.level.software.amazon.awssdk=WARN", "spring.test.mockmvc.print=none"})
@AutoConfigureMockMvc(print=org.springframework.boot.webmvc.test.autoconfigure.MockMvcPrint.NONE)
@ActiveProfiles("test")
class R2LiveSmokeIT extends PostgresIntegrationTest {
    private static final Map<String,String> CONFIG = settings();
    private static Map<String,String> settings() {
        Map<String,String> values = new HashMap<>();
        try {
            Path file = Path.of(".env");
            if (!Files.exists(file)) file = Path.of("backend/.env");
            if (Files.exists(file)) for (String line : Files.readAllLines(file)) {
                line = line.trim();
                if (line.startsWith("#") || !line.contains("=")) continue;
                String[] pair = line.split("=",2);
                if (pair[0].startsWith("R2_") || pair[0].equals("MEDIA_PROVIDER")) values.put(pair[0].trim(),pair[1].trim());
            }
            for (String key : List.of("MEDIA_PROVIDER","R2_ENDPOINT","R2_BUCKET","R2_ACCESS_KEY_ID","R2_SECRET_ACCESS_KEY","R2_PUBLIC_BASE_URL")) {
                if (System.getenv(key) != null) values.put(key,System.getenv(key));
                if (values.getOrDefault(key,"").isBlank()) throw new IllegalStateException("Missing R2 smoke configuration: "+key);
            }
            if (!"r2".equals(values.get("MEDIA_PROVIDER"))) throw new IllegalStateException("Set MEDIA_PROVIDER=r2 before live smoke");
            return Map.copyOf(values);
        } catch (java.io.IOException failure) { throw new IllegalStateException("Cannot read local R2 configuration"); }
    }
    @DynamicPropertySource static void configure(DynamicPropertyRegistry registry) {
        registry.add("app.media.provider", () -> "r2");
        Map.of("endpoint","R2_ENDPOINT","bucket","R2_BUCKET","access-key-id","R2_ACCESS_KEY_ID","secret-access-key","R2_SECRET_ACCESS_KEY","public-base-url","R2_PUBLIC_BASE_URL")
            .forEach((property,key) -> registry.add("app.media.r2."+property,() -> CONFIG.get(key)));
    }
    @Autowired MockMvc mvc; @Autowired ObjectMapper mapper; @Autowired MediaStorage storage;
    @Autowired AdminRepository admins; @Autowired CategoryRepository categories; @Autowired ProductRepository products;
    @Autowired ProductVariantRepository variants; @Autowired PasswordEncoder encoder;
    private final List<String> createdKeys = new ArrayList<>();
    private final List<String> publicUrls = new ArrayList<>();
    private String csrf; private MockHttpSession session;

    @Test void realR2UploadPublicReadGalleryPersistenceLimitsAndCleanup() throws Exception {
        assertThat(storage).isInstanceOf(R2MediaClient.class);
        var publicHttp = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).followRedirects(HttpClient.Redirect.NEVER).build();
        try (var cleanup = S3Client.builder().endpointOverride(URI.create(CONFIG.get("R2_ENDPOINT"))).region(Region.of("auto"))
            .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(CONFIG.get("R2_ACCESS_KEY_ID"), CONFIG.get("R2_SECRET_ACCESS_KEY"))))
            .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).chunkedEncodingEnabled(false).build())
            .httpClientBuilder(UrlConnectionHttpClient.builder().connectionTimeout(Duration.ofSeconds(5)).socketTimeout(Duration.ofSeconds(10)))
            .overrideConfiguration(c -> c.apiCallTimeout(Duration.ofSeconds(15))).build()) {
            try {
                login();
                byte[] png = image("png"), jpeg = image("jpeg"), webp;
                try (var input=getClass().getResourceAsStream("/media/valid.webp")) { webp=input.readAllBytes(); }
                uploadAndRead("smoke.png","image/png",png,publicHttp);
                uploadAndRead("smoke.jpg","image/jpeg",jpeg,publicHttp);
                uploadAndRead("smoke.webp","image/webp",webp,publicHttp);
                uploadAndRead("smoke-limit.png","image/png",Arrays.copyOf(png,5*1024*1024),publicHttp);
                mvc.perform(multipart("/api/v1/admin/media").file(new MockMultipartFile("file","too-large.png","image/png",new byte[5*1024*1024+1]))
                    .session(session).header("Origin","http://localhost:3000").header("X-CSRF-TOKEN",csrf)).andExpect(status().isContentTooLarge());
                mvc.perform(multipart("/api/v1/admin/media").file(new MockMultipartFile("file","blocked.png","image/png",png))
                    .session(session).header("Origin","https://foreign.test").header("X-CSRF-TOKEN",csrf)).andExpect(status().isForbidden());
                var category = categories.save(new Category("Live smoke","live-smoke",null,0,true));
                var payload = new LinkedHashMap<String,Object>();
                payload.put("categoryId",category.getId().toString()); payload.put("name","R2 live smoke"); payload.put("slug","r2-live-smoke");
                payload.put("saleType","FIXED_PRICE"); payload.put("thumbnailUrl",publicUrls.get(1)); payload.put("imageUrls",publicUrls);
                var saved = mvc.perform(post("/api/v1/admin/products").session(session).header("Origin","http://localhost:3000").header("X-CSRF-TOKEN",csrf)
                    .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(payload))).andExpect(status().isCreated()).andExpect(jsonPath("$.images.length()").value(4)).andReturn();
                String id = mapper.readTree(saved.getResponse().getContentAsString()).get("id").asText();
                variants.save(new ProductVariant(products.findById(Long.parseLong(id)).orElseThrow(),"Smoke bottle","R2-SMOKE",100L,java.math.BigDecimal.ONE,java.math.BigDecimal.ONE,true,0));
                mvc.perform(get("/api/v1/admin/products/"+id).session(session)).andExpect(status().isOk()).andExpect(jsonPath("$.images[0].url").value(publicUrls.get(0)));
                mvc.perform(get("/api/v1/products/r2-live-smoke")).andExpect(status().isOk()).andExpect(jsonPath("$.images.length()").value(4)).andExpect(jsonPath("$.thumbnailUrl").value(publicUrls.get(1)));
                Collections.reverse(publicUrls); payload.put("imageUrls",publicUrls); payload.put("thumbnailUrl",publicUrls.get(0)); payload.put("expectedImagesRevision",0);
                mvc.perform(put("/api/v1/admin/products/"+id).session(session).header("Origin","http://localhost:3000").header("X-CSRF-TOKEN",csrf)
                    .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(payload))).andExpect(status().isOk()).andExpect(jsonPath("$.imagesRevision").value(1));
                mvc.perform(get("/api/v1/products/r2-live-smoke")).andExpect(jsonPath("$.images[0].url").value(publicUrls.get(0))).andExpect(jsonPath("$.thumbnailUrl").value(publicUrls.get(0)));
            } finally {
                List<String> failedDeletes = new ArrayList<>();
                for (String key : createdKeys) {
                    try {
                        cleanup.deleteObject(DeleteObjectRequest.builder().bucket(CONFIG.get("R2_BUCKET")).key(key).build());
                        assertThatThrownBy(() -> cleanup.headObject(HeadObjectRequest.builder().bucket(CONFIG.get("R2_BUCKET")).key(key).build()))
                            .isInstanceOfSatisfying(S3Exception.class, e -> assertThat(e.statusCode()).isEqualTo(404));
                    } catch (Exception failure) { failedDeletes.add(key); }
                }
                assertThat(failedDeletes).as("Only these newly created smoke keys need manual cleanup").isEmpty();
            }
        }
    }
    private void uploadAndRead(String name,String mime,byte[] bytes,HttpClient http) throws Exception {
        var result = mvc.perform(multipart("/api/v1/admin/media").file(new MockMultipartFile("file",name,mime,bytes)).session(session)
            .header("Origin","http://localhost:3000").header("X-CSRF-TOKEN",csrf)).andExpect(status().isCreated()).andReturn();
        var json=mapper.readTree(result.getResponse().getContentAsString());
        String key=json.get("objectKey").asText(), url=json.get("url").asText();
        createdKeys.add(key); publicUrls.add(url);
        assertThat(key).matches(R2MediaClient.KEY_PATTERN);
        var response=http.send(HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(20)).GET().build(),HttpResponse.BodyHandlers.ofByteArray());
        assertThat(response.statusCode()).as("Anonymous public image GET").isEqualTo(200);
        assertThat(response.headers().firstValue("Content-Type")).contains(mime);
        assertThat(response.body()).as("Public bytes match uploaded bytes").isEqualTo(bytes);
    }
    private byte[] image(String format) throws Exception {
        var output=new ByteArrayOutputStream(); ImageIO.write(new BufferedImage(8,8,BufferedImage.TYPE_INT_RGB),format,output); return output.toByteArray();
    }
    private void login() throws Exception {
        admins.save(new Admin("r2-smoke@example.test",encoder.encode("disposable-smoke-password"),"Smoke",true));
        var start=mvc.perform(get("/api/v1/csrf")).andReturn(); session=(MockHttpSession)start.getRequest().getSession();
        String first=mapper.readTree(start.getResponse().getContentAsString()).get("token").asText();
        mvc.perform(post("/api/v1/admin/auth/login").session(session).header("Origin","http://localhost:3000").header("X-CSRF-TOKEN",first)
            .contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"r2-smoke@example.test\",\"password\":\"disposable-smoke-password\"}")).andExpect(status().isOk());
        csrf=mapper.readTree(mvc.perform(get("/api/v1/csrf").session(session)).andReturn().getResponse().getContentAsString()).get("token").asText();
    }
}
