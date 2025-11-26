package com.mindease.controller;

import com.mindease.dto.AuthResponse;
import com.mindease.dto.ErrorResponse;
import com.mindease.model.User;
import com.mindease.repository.RefreshTokenRepository;
import com.mindease.repository.UserRepository;
import com.mindease.service.FirebaseService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

/**
 * Integration tests for AuthController endpoints.
 * Tests the complete authentication flow including registration, login, refresh, and logout.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @MockBean
    private FirebaseService firebaseService;

    private static final String TEST_EMAIL = "test@example.com";
    private static final String TEST_FIREBASE_UID = "test-firebase-uid-123";
    private static final String TEST_FIREBASE_TOKEN = "mock-firebase-token";

    @BeforeEach
    void setUp() throws Exception {
        // Clean up test data
        userRepository.deleteAll();
        refreshTokenRepository.deleteAll();

        // Mock Firebase service to return test UID
        when(firebaseService.getUidFromToken(anyString())).thenReturn(TEST_FIREBASE_UID);
    }

    @Test
    void testRegisterNewUser_Success() throws Exception {
        String requestBody = String.format(
            "{\"email\":\"%s\",\"firebaseToken\":\"%s\",\"anonymousMode\":false}",
            TEST_EMAIL, TEST_FIREBASE_TOKEN
        );

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.refreshToken").exists())
                .andExpect(jsonPath("$.user.email").value(TEST_EMAIL))
                .andExpect(jsonPath("$.user.role").value("USER"))
                .andExpect(jsonPath("$.user.anonymousMode").value(false));
    }

    @Test
    void testRegisterDuplicateUser_Failure() throws Exception {
        // First registration
        String requestBody = String.format(
            "{\"email\":\"%s\",\"firebaseToken\":\"%s\",\"anonymousMode\":false}",
            TEST_EMAIL, TEST_FIREBASE_TOKEN
        );

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isOk());

        // Second registration with same Firebase UID should fail
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value("error"))
                .andExpect(jsonPath("$.code").value("USER_ALREADY_EXISTS"));
    }

    @Test
    void testLoginExistingUser_Success() throws Exception {
        // Register user first
        String registerBody = String.format(
            "{\"email\":\"%s\",\"firebaseToken\":\"%s\",\"anonymousMode\":false}",
            TEST_EMAIL, TEST_FIREBASE_TOKEN
        );

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerBody))
                .andExpect(status().isOk());

        // Login
        String loginBody = String.format("{\"firebaseToken\":\"%s\"}", TEST_FIREBASE_TOKEN);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.refreshToken").exists())
                .andExpect(jsonPath("$.user.email").value(TEST_EMAIL));
    }

    @Test
    void testLoginNonExistentUser_Failure() throws Exception {
        String loginBody = String.format("{\"firebaseToken\":\"%s\"}", TEST_FIREBASE_TOKEN);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginBody))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value("error"))
                .andExpect(jsonPath("$.code").value("USER_NOT_FOUND"));
    }

    @Test
    void testRefreshToken_Success() throws Exception {
        // Register and get tokens
        String registerBody = String.format(
            "{\"email\":\"%s\",\"firebaseToken\":\"%s\",\"anonymousMode\":false}",
            TEST_EMAIL, TEST_FIREBASE_TOKEN
        );

        String registerResponse = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerBody))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        // Extract refresh token from response
        String refreshToken = com.fasterxml.jackson.databind.ObjectMapper()
            .readTree(registerResponse)
            .get("refreshToken")
            .asText();

        // Refresh token
        String refreshBody = String.format("{\"refreshToken\":\"%s\"}", refreshToken);

        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(refreshBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.refreshToken").exists())
                .andExpect(jsonPath("$.refreshToken").value(not(refreshToken))); // Should be rotated
    }

    @Test
    void testRefreshTokenWithInvalidToken_Failure() throws Exception {
        String refreshBody = "{\"refreshToken\":\"invalid-token\"}";

        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(refreshBody))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value("error"))
                .andExpect(jsonPath("$.code").value("INVALID_REFRESH_TOKEN"));
    }

    @Test
    void testAnonymousRegistration_Success() throws Exception {
        String anonymousEmail = "anonymous_" + TEST_FIREBASE_UID + "@mindease.com";
        String requestBody = String.format(
            "{\"email\":\"%s\",\"firebaseToken\":\"%s\",\"anonymousMode\":true}",
            anonymousEmail, TEST_FIREBASE_TOKEN
        );

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.user.anonymousMode").value(true));
    }

    @Test
    void testGetCurrentUser_Success() throws Exception {
        // Register and get token
        String registerBody = String.format(
            "{\"email\":\"%s\",\"firebaseToken\":\"%s\",\"anonymousMode\":false}",
            TEST_EMAIL, TEST_FIREBASE_TOKEN
        );

        String registerResponse = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerBody))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        // Extract JWT token
        String jwtToken = new com.fasterxml.jackson.databind.ObjectMapper()
            .readTree(registerResponse)
            .get("token")
            .asText();

        // Get current user
        mockMvc.perform(get("/api/auth/me")
                .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.email").value(TEST_EMAIL))
                .andExpect(jsonPath("$.role").value("USER"));
    }

    @Test
    void testGetCurrentUserWithoutToken_Failure() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }
}
