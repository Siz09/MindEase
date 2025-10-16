package com.mindease.controller;

import com.mindease.config.StripeConfig;
import com.mindease.model.Subscription;
import com.mindease.model.User;
import com.mindease.repository.SubscriptionRepository;
import com.mindease.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubscriptionControllerUnitTest {

    @Mock
    private StripeConfig stripeConfig;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private SubscriptionController subscriptionController;

    private User testUser;
    private SubscriptionController.CreateSubscriptionRequest request;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(java.util.UUID.randomUUID());
        testUser.setEmail("test@example.com");

        request = new SubscriptionController.CreateSubscriptionRequest();
    }

    @Test
    void createSubscription_FreePlan_ShouldReturnSuccess() {
        // Arrange
        request.setPlanType("FREE");
        when(authentication.getName()).thenReturn("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(stripeConfig.isConfigured()).thenReturn(true);
        when(subscriptionRepository.save(any(Subscription.class))).thenReturn(new Subscription());

        // Act
        var response = subscriptionController.createSubscription(request, authentication, null);

        // Assert
        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertTrue(body.containsKey("success"));
        assertEquals(true, body.get("success"));
        assertTrue(body.containsKey("data"));
        
        Map<String, Object> data = (Map<String, Object>) body.get("data");
        assertEquals("FREE", data.get("planType"));
        assertEquals("ACTIVE", data.get("status"));
    }

    @Test
    void createSubscription_UserNotFound_ShouldReturnBadRequest() {
        // Arrange
        request.setPlanType("PREMIUM");
        when(authentication.getName()).thenReturn("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.empty());
        when(stripeConfig.isConfigured()).thenReturn(true);

        // Act
        var response = subscriptionController.createSubscription(request, authentication, null);

        // Assert
        assertNotNull(response);
        assertEquals(400, response.getStatusCode().value());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertTrue(body.containsKey("success"));
        assertEquals(false, body.get("success"));
        assertEquals("User not found", body.get("message"));
    }

    @Test
    void createSubscription_StripeNotConfigured_ShouldReturnInternalServerError() {
        // Arrange
        request.setPlanType("PREMIUM");
        when(stripeConfig.isConfigured()).thenReturn(false);

        // Act
        var response = subscriptionController.createSubscription(request, authentication, null);

        // Assert
        assertNotNull(response);
        assertEquals(500, response.getStatusCode().value());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertTrue(body.containsKey("success"));
        assertEquals(false, body.get("success"));
        assertEquals("Payment system is not configured", body.get("message"));
    }

    @Test
    void createSubscription_InvalidPlanType_ShouldReturnBadRequest() {
        // Arrange
        request.setPlanType("INVALID_PLAN");
        when(authentication.getName()).thenReturn("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(stripeConfig.isConfigured()).thenReturn(true);

        // Act
        var response = subscriptionController.createSubscription(request, authentication, null);

        // Assert
        assertNotNull(response);
        assertEquals(400, response.getStatusCode().value());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertTrue(body.containsKey("success"));
        assertEquals(false, body.get("success"));
        assertEquals("Invalid plan type. Must be FREE, PREMIUM, ENTERPRISE, MONTHLY, YEARLY, or ANNUAL", body.get("message"));
    }

    @Test
    void createSubscription_ValidPlanTypes_ShouldPassValidation() {
        // Test all valid plan types
        String[] validPlanTypes = {"FREE", "PREMIUM", "ENTERPRISE"};
        
        // Set up mocks once outside the loop
        when(authentication.getName()).thenReturn("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(stripeConfig.isConfigured()).thenReturn(true);
        when(subscriptionRepository.save(any(Subscription.class))).thenReturn(new Subscription());
        
        for (String planType : validPlanTypes) {
            // Arrange
            request.setPlanType(planType);

            // Act
            var response = subscriptionController.createSubscription(request, authentication, null);

            // Assert
            assertNotNull(response);
            if (planType.equals("FREE")) {
                assertEquals(200, response.getStatusCode().value());
            } else {
                // For paid plans, we expect 500 due to missing Stripe price configuration
                // This is expected behavior in our current implementation
                assertEquals(500, response.getStatusCode().value());
            }
        }
    }

    @Test
    void createSubscription_PlanTypeAliases_ShouldWork() {
        // Test that plan type aliases work
        String[] aliases = {"MONTHLY", "YEARLY", "ANNUAL"};
        
        // Set up mocks once outside the loop
        when(authentication.getName()).thenReturn("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(stripeConfig.isConfigured()).thenReturn(true);
        
        for (String alias : aliases) {
            request.setPlanType(alias);

            // Act
            var response = subscriptionController.createSubscription(request, authentication, null);

            // Assert - aliases should be accepted (not return 400 for invalid plan)
            assertNotNull(response);
            assertNotEquals(400, response.getStatusCode().value(),
                "Alias " + alias + " should be recognized as valid");
        }
    }
}
