package com.shop;

import com.shop.entity.Admin;
import com.shop.repository.AdminRepository;
import com.shop.support.PostgresIntegrationTest;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.context.ActiveProfiles;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "app.security.allowed-origins=http://localhost:3000")
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminAuthIT extends PostgresIntegrationTest {

    private static final String TRUSTED_ORIGIN = "http://localhost:3000";

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired AdminRepository adminRepository;
    @Autowired PasswordEncoder passwordEncoder;

    @BeforeEach
    void resetAdmins() {
        adminRepository.deleteAll();
    }

    @Test
    void csrfLoginMeLogoutFlowRotatesAndInvalidatesSession() throws Exception {
        Admin admin = adminRepository.save(new Admin(
                "owner@example.com", passwordEncoder.encode("correct-password"), "Owner", true));
        MvcResult csrf = mockMvc.perform(get("/api/v1/csrf"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.headerName").value("X-CSRF-TOKEN"))
                .andReturn();
        HttpSession session = csrf.getRequest().getSession(false);
        String oldSessionId = session.getId();
        String token = json(csrf).get("token").asText();

        MvcResult login = mockMvc.perform(post("/api/v1/admin/auth/login")
                        .session((org.springframework.mock.web.MockHttpSession) session)
                        .header("Origin", TRUSTED_ORIGIN)
                        .header("X-CSRF-TOKEN", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":" OWNER@EXAMPLE.COM ","password":"correct-password"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(admin.getId().toString()))
                .andExpect(jsonPath("$.email").value("owner@example.com"))
                .andExpect(jsonPath("$.name").value("Owner"))
                .andReturn();
        var authenticatedSession = (org.springframework.mock.web.MockHttpSession)
                login.getRequest().getSession(false);
        assertThat(authenticatedSession.getId()).isNotEqualTo(oldSessionId);

        mockMvc.perform(get("/api/v1/admin/auth/me").session(authenticatedSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("owner@example.com"));

        MvcResult refreshedCsrf = mockMvc.perform(get("/api/v1/csrf").session(authenticatedSession))
                .andExpect(status().isOk()).andReturn();
        String logoutToken = json(refreshedCsrf).get("token").asText();
        mockMvc.perform(post("/api/v1/admin/auth/logout")
                        .session(authenticatedSession)
                        .header("Origin", TRUSTED_ORIGIN)
                        .header("X-CSRF-TOKEN", logoutToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/admin/auth/me").session(authenticatedSession))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
    }

    @Test
    void rejectsUnknownWrongPasswordAndInactiveWithSameUnauthorizedResponse() throws Exception {
        adminRepository.save(new Admin(
                "active@example.com", passwordEncoder.encode("correct-password"), "Active", true));
        adminRepository.save(new Admin(
                "inactive@example.com", passwordEncoder.encode("correct-password"), "Inactive", false));

        assertLoginUnauthorized("missing@example.com", "correct-password");
        assertLoginUnauthorized("active@example.com", "wrong-password");
        assertLoginUnauthorized("inactive@example.com", "correct-password");
    }

    @Test
    void rejectsMissingCsrfAndUntrustedOrigin() throws Exception {
        adminRepository.save(new Admin(
                "owner@example.com", passwordEncoder.encode("correct-password"), "Owner", true));

        mockMvc.perform(post("/api/v1/admin/auth/login")
                        .header("Origin", TRUSTED_ORIGIN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"owner@example.com\",\"password\":\"correct-password\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));

        MvcResult csrf = mockMvc.perform(get("/api/v1/csrf")).andReturn();
        mockMvc.perform(post("/api/v1/admin/auth/login")
                        .session((org.springframework.mock.web.MockHttpSession) csrf.getRequest().getSession(false))
                        .header("Origin", "https://evil.example")
                        .header("X-CSRF-TOKEN", json(csrf).get("token").asText())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"owner@example.com\",\"password\":\"correct-password\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void inactiveAdminLosesAccessFromExistingSession() throws Exception {
        Admin admin = adminRepository.save(new Admin(
                "owner@example.com", passwordEncoder.encode("correct-password"), "Owner", true));
        var session = login("owner@example.com", "correct-password");
        adminRepository.delete(admin);

        mockMvc.perform(get("/api/v1/admin/auth/me").session(session))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
    }

    private void assertLoginUnauthorized(String email, String password) throws Exception {
        MvcResult csrf = mockMvc.perform(get("/api/v1/csrf")).andReturn();
        mockMvc.perform(post("/api/v1/admin/auth/login")
                        .session((org.springframework.mock.web.MockHttpSession) csrf.getRequest().getSession(false))
                        .header("Origin", TRUSTED_ORIGIN)
                        .header("X-CSRF-TOKEN", json(csrf).get("token").asText())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new Credentials(email, password))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
    }

    private org.springframework.mock.web.MockHttpSession login(String email, String password) throws Exception {
        MvcResult csrf = mockMvc.perform(get("/api/v1/csrf")).andReturn();
        MvcResult login = mockMvc.perform(post("/api/v1/admin/auth/login")
                        .session((org.springframework.mock.web.MockHttpSession) csrf.getRequest().getSession(false))
                        .header("Origin", TRUSTED_ORIGIN)
                        .header("X-CSRF-TOKEN", json(csrf).get("token").asText())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new Credentials(email, password))))
                .andExpect(status().isOk()).andReturn();
        return (org.springframework.mock.web.MockHttpSession) login.getRequest().getSession(false);
    }

    private JsonNode json(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsByteArray());
    }

    private record Credentials(String email, String password) {}
}
