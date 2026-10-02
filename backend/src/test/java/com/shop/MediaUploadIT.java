package com.shop;

import com.shop.entity.Admin;
import com.shop.integration.storage.MediaStorage;
import com.shop.repository.AdminRepository;
import com.shop.repository.ProductRepository;
import com.shop.support.PostgresIntegrationTest;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = "app.security.allowed-origins=http://localhost:3000")
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MediaUploadIT extends PostgresIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired AdminRepository admins;
    @Autowired ProductRepository products;
    @Autowired PasswordEncoder encoder;
    @MockitoBean MediaStorage storage;

    @BeforeEach void resetState() {
        admins.deleteAll();
        admins.save(new Admin("media@example.com", encoder.encode("media-test-password"), "Media", true));
        reset(storage);
    }

    @Test void requiresAuthenticationAndCsrf() throws Exception {
        mvc.perform(multipart("/api/v1/admin/media").file(image("oil.png", "image/png")))
                .andExpect(status().isUnauthorized());
        mvc.perform(multipart("/api/v1/admin/media").file(image("oil.png", "image/png")).session(login()).header("Origin", "http://localhost:3000"))
                .andExpect(status().isForbidden());
        verifyNoInteractions(storage);
    }

    @Test void validatesSizeMimeDecodeAndTraversalWithoutTouchingStorage() throws Exception {
        var session = login();
        upload(session, new MockMultipartFile("file", "large.png", "image/png", new byte[5 * 1024 * 1024 + 1]), 413);
        upload(session, image("oil.jpg", "image/jpeg"), 422);
        upload(session, new MockMultipartFile("file", "broken.png", "image/png", new byte[]{(byte)137,80,78,71,13,10,26,10}), 422);
        upload(session, new MockMultipartFile("file", "image.svg", "image/svg+xml", "<svg/>".getBytes()), 422);
        upload(session, image("../../oil.png", "image/png"), 422);
        upload(session, image("..\\oil.png", "image/png"), 422);
        mvc.perform(multipart("/api/v1/admin/media").session(session).header("Origin", "http://localhost:3000").header("X-CSRF-TOKEN", csrf(session)))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
        verifyNoInteractions(storage);
    }

    @Test void uploadsDecodedImageWithRandomKeyAndDoesNotWriteProducts() throws Exception {
        long before = products.count();
        when(storage.upload(anyString(), any(), anyString())).thenAnswer(invocation -> "https://media.example.test/" + invocation.getArgument(0));
        var session = login();
        var response = mvc.perform(multipart("/api/v1/admin/media").file(image("CLIENT-NAME.png", "image/png"))
                        .session(session).header("Origin", "http://localhost:3000").header("X-CSRF-TOKEN", csrf(session)))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.url").isString())
                .andExpect(jsonPath("$.objectKey").value(org.hamcrest.Matchers.matchesPattern("products/[a-f0-9-]{36}\\.png"))).andReturn();
        assertThat(response.getResponse().getContentAsString()).doesNotContain("CLIENT-NAME");
        assertThat(products.count()).isEqualTo(before);
        verify(storage).upload(matches("products/[a-f0-9-]{36}\\.png"), any(byte[].class), eq("image/png"));
    }

    @Test void storageFailureIs503AndKeepsProductsUnchanged() throws Exception {
        long before = products.count();
        when(storage.upload(anyString(), any(), anyString())).thenThrow(new IllegalStateException("secret-upstream-detail"));
        var session = login();
        var result = upload(session, image("oil.png", "image/png"), 503);
        assertThat(result.getResponse().getContentAsString()).doesNotContain("secret-upstream-detail");
        assertThat(products.count()).isEqualTo(before);
    }

    @Test void decodesJpegAndWebpAndRejectsHostileOrigin() throws Exception {
        when(storage.upload(anyString(), any(), anyString())).thenAnswer(invocation -> "https://media.example.test/" + invocation.getArgument(0));
        var session = login();
        var jpeg = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB), "jpeg", jpeg);
        upload(session, new MockMultipartFile("file", "oil.jpg", "image/jpeg", jpeg.toByteArray()), 201);
        try (var input = getClass().getResourceAsStream("/media/valid.webp")) {
            upload(session, new MockMultipartFile("file", "oil.webp", "image/webp", input.readAllBytes()), 201);
        }
        verify(storage).upload(matches("products/[a-f0-9-]{36}\\.jpg"), any(byte[].class), eq("image/jpeg"));
        verify(storage).upload(matches("products/[a-f0-9-]{36}\\.webp"), any(byte[].class), eq("image/webp"));
        reset(storage);
        mvc.perform(multipart("/api/v1/admin/media").file(image("oil.png", "image/png"))
                .session(session).header("Origin", "https://evil.example").header("X-CSRF-TOKEN", csrf(session)))
                .andExpect(status().isForbidden());
        verifyNoInteractions(storage);
    }

    private org.springframework.test.web.servlet.MvcResult upload(MockHttpSession session, MockMultipartFile file, int expected) throws Exception {
        return mvc.perform(multipart("/api/v1/admin/media").file(file).session(session)
                .header("Origin", "http://localhost:3000").header("X-CSRF-TOKEN", csrf(session)))
                .andExpect(status().is(expected)).andReturn();
    }
    private MockMultipartFile image(String name, String mime) throws Exception {
        var bytes = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB), "png", bytes);
        return new MockMultipartFile("file", name, mime, bytes.toByteArray());
    }
    private MockHttpSession login() throws Exception {
        var start = mvc.perform(get("/api/v1/csrf")).andReturn();
        var session = (MockHttpSession) start.getRequest().getSession();
        mvc.perform(post("/api/v1/admin/auth/login").session(session).header("Origin", "http://localhost:3000")
                .header("X-CSRF-TOKEN", mapper.readTree(start.getResponse().getContentAsString()).get("token").asText())
                .contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"media@example.com\",\"password\":\"media-test-password\"}"))
                .andExpect(status().isOk());
        return session;
    }
    private String csrf(MockHttpSession session) throws Exception {
        return mapper.readTree(mvc.perform(get("/api/v1/csrf").session(session)).andReturn().getResponse().getContentAsString()).get("token").asText();
    }
}
