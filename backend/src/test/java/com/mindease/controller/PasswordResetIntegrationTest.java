package com.mindease.controller;

import com.mindease.model.PasswordResetRequest;
import com.mindease.repository.PasswordResetRequestRepository;
import com.mindease.repository.RefreshTokenRepository;
import com.mindease.service.PasswordResetService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for password reset functionality.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class PasswordResetIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PasswordResetRequestRepository passwordResetRequestRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private PasswordResetService passwordResetService;

    @BeforeEach
    public void setup() {
        passwordResetRequestRepository.deleteAll();
    }

    @Test
    public void testRequestPasswordReset_Success() throws Exception {
        String email = "test@example.com";
        String requestBody = String.format("{\"email\":\"%s\"}", email);

        mockMvc.perform(post("/api/auth/request-password-reset")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody)
                .header("X-Forwarded-For", "192.168.1.1")
                .header("User-Agent", "Mozilla/5.0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("If an account exists")));

        // Verify request was recorded
        assertEquals(1, passwordResetRequestRepository.count());
        PasswordResetRequest savedRequest = passwordResetRequestRepository.findAll().get(0);
        assertEquals(email, savedRequest.getEmail());
        assertEquals("192.168.1.1", savedRequest.getIpAddress());
        assertEquals("Mozilla/5.0", savedRequest.getUserAgent());
        assertFalse(savedRequest.isCompleted());
    }

    @Test
    public void testRequestPasswordReset_RateLimitByEmail() throws Exception {
        String email = "test@example.com";
        String requestBody = String.format("{\"email\":\"%s\"}", email);

        // Make 3 requests (should succeed)
        for (int i = 0; i < 3; i++) {
            mockMvc.perform(post("/api/auth/request-password-reset")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(requestBody)
                    .header("X-Forwarded-For", "192.168.1." + i)
                    .header("User-Agent", "Mozilla/5.0"))
                    .andExpect(status().isOk());
        }

        // 4th request should be rate limited
        mockMvc.perform(post("/api/auth/request-password-reset")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody)
                .header("X-Forwarded-For", "192.168.1.99")
                .header("User-Agent", "Mozilla/5.0"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code", is("RATE_LIMIT_EXCEEDED")));
    }

    @Test
    public void testRequestPasswordReset_RateLimitByIP() throws Exception {
        String ipAddress = "192.168.1.1";

        // Make 5 requests with different emails (should succeed)
        for (int i = 0; i < 5; i++) {
            String email = "test" + i + "@example.com";
            String requestBody = String.format("{\"email\":\"%s\"}", email);

            mockMvc.perform(post("/api/auth/request-password-reset")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(requestBody)
                    .header("X-Forwarded-For", ipAddress)
                    .header("User-Agent", "Mozilla/5.0"))
                    .andExpect(status().isOk());
        }

        // 6th request should be rate limited
        String requestBody = "{\"email\":\"test99@example.com\"}";
        mockMvc.perform(post("/api/auth/request-password-reset")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody)
                .header("X-Forwarded-For", ipAddress)
                .header("User-Agent", "Mozilla/5.0"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code", is("RATE_LIMIT_EXCEEDED")));
    }

    @Test
    public void testConfirmPasswordReset_Success() throws Exception {
        String email = "test@example.com";

        // Create a password reset request
        PasswordResetRequest request = new PasswordResetRequest(email, "192.168.1.1", "Mozilla/5.0");
        passwordResetRequestRepository.save(request);

        String requestBody = String.format("{\"email\":\"%s\"}", email);

        mockMvc.perform(post("/api/auth/confirm-password-reset")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("confirmed successfully")));

        // Verify request was marked as completed
        PasswordResetRequest updatedRequest = passwordResetRequestRepository.findAll().get(0);
        assertTrue(updatedRequest.isCompleted());
        assertNotNull(updatedRequest.getCompletedAt());
    }

    @Test
    public void testConfirmPasswordReset_WithoutEmail() throws Exception {
        String requestBody = "{\"email\":\"\"}";

        mockMvc.perform(post("/api/auth/confirm-password-reset")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("confirmed successfully")));
    }

    @Test
    public void testPasswordResetService_RateLimitChecking() {
        String email = "test@example.com";
        String ipAddress = "192.168.1.1";

        // Create 3 requests within the window
        for (int i = 0; i < 3; i++) {
            passwordResetService.recordResetRequest(email, ipAddress, "Mozilla/5.0");
        }

        // Should be rate limited
        assertTrue(passwordResetService.isRateLimitExceeded(email, ipAddress));
    }

    @Test
    public void testPasswordResetService_RateLimitNotExceeded() {
        String email = "test@example.com";
        String ipAddress = "192.168.1.1";

        // Create 2 requests within the window
        for (int i = 0; i < 2; i++) {
            passwordResetService.recordResetRequest(email, ipAddress, "Mozilla/5.0");
        }

        // Should not be rate limited
        assertFalse(passwordResetService.isRateLimitExceeded(email, ipAddress));
    }

    @Test
    public void testPasswordResetService_RecordCompletion() {
        String email = "test@example.com";

        // Create a password reset request
        PasswordResetRequest request = new PasswordResetRequest(email, "192.168.1.1", "Mozilla/5.0");
        passwordResetRequestRepository.save(request);

        // Record completion
        passwordResetService.recordResetCompletion(email);

        // Verify request was marked as completed
        PasswordResetRequest updatedRequest = passwordResetRequestRepository.findAll().get(0);
        assertTrue(updatedRequest.isCompleted());
        assertNotNull(updatedRequest.getCompletedAt());
    }

    @Test
    public void testPasswordResetService_CleanupOldRequests() {
        // Create an old request (31 days ago)
        PasswordResetRequest oldRequest = new PasswordResetRequest("old@example.com", "192.168.1.1", "Mozilla/5.0");
        oldRequest.setRequestedAt(LocalDateTime.now().minusDays(31));
        passwordResetRequestRepository.save(oldRequest);

        // Create a recent request
        PasswordResetRequest recentRequest = new PasswordResetRequest("recent@example.com", "192.168.1.2", "Mozilla/5.0");
        passwordResetRequestRepository.save(recentRequest);

        assertEquals(2, passwordResetRequestRepository.count());

        // Run cleanup
        passwordResetService.cleanupOldRequests();

        // Verify only old request was deleted
        assertEquals(1, passwordResetRequestRepository.count());
        PasswordResetRequest remaining = passwordResetRequestRepository.findAll().get(0);
        assertEquals("recent@example.com", remaining.getEmail());
    }

    @Test
    public void testRequestPasswordReset_InvalidEmail() throws Exception {
        String requestBody = "{\"email\":\"invalid-email\"}";

        // Note: The backend doesn't validate email format strictly,
        // it relies on Firebase to handle this. This test verifies
        // that the request is still recorded for tracking purposes.
        mockMvc.perform(post("/api/auth/request-password-reset")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody)
                .header("X-Forwarded-For", "192.168.1.1")
                .header("User-Agent", "Mozilla/5.0"))
                .andExpect(status().isOk());

        // Request should still be recorded
        assertEquals(1, passwordResetRequestRepository.count());
    }

    @Test
    public void testRequestPasswordReset_EmptyEmail() throws Exception {
        String requestBody = "{\"email\":\"\"}";

        mockMvc.perform(post("/api/auth/request-password-reset")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody)
                .header("X-Forwarded-For", "192.168.1.1")
                .header("User-Agent", "Mozilla/5.0"))
                .andExpect(status().isOk());

        // Request should still be recorded
        assertEquals(1, passwordResetRequestRepository.count());
    }

    @Test
    public void testRequestPasswordReset_IPAddressExtraction() throws Exception {
        String email = "test@example.com";
        String requestBody = String.format("{\"email\":\"%s\"}", email);

        // Test X-Forwarded-For header
        mockMvc.perform(post("/api/auth/request-password-reset")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody)
                .header("X-Forwarded-For", "10.0.0.1, 192.168.1.1")
                .header("User-Agent", "Mozilla/5.0"))
                .andExpect(status().isOk());

        PasswordResetRequest savedRequest = passwordResetRequestRepository.findAll().get(0);
        assertEquals("10.0.0.1", savedRequest.getIpAddress());
    }
}
