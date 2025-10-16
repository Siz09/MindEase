package com.mindease.controller;

import com.mindease.config.StripeConfig;
import com.mindease.model.PlanType;
import com.mindease.model.Subscription;
import com.mindease.model.SubscriptionStatus;
import com.mindease.model.User;
import com.mindease.repository.SubscriptionRepository;
import com.mindease.repository.UserRepository;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Controller for handling subscription-related operations with Stripe integration.
 */
@RestController
@RequestMapping("/api/subscription")
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:5173}")
@Tag(name = "Subscription", description = "Subscription management with Stripe integration")
@SecurityRequirement(name = "Bearer Authentication")
public class SubscriptionController {

    private static final Logger logger = LoggerFactory.getLogger(SubscriptionController.class);

    @Autowired
    private StripeConfig stripeConfig;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @Value("${stripe.success-url:http://localhost:5173/success}")
    private String successUrl;

    @Value("${stripe.cancel-url:http://localhost:5173/cancel}")
    private String cancelUrl;

    @Value("${stripe.price.premium:}")
    private String premiumPriceId;

    @Value("${stripe.price.enterprise:}")
    private String enterprisePriceId;

    @Operation(summary = "Create a subscription", description = "Creates a new Stripe checkout session for subscription")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Checkout session created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request or user not found"),
        @ApiResponse(responseCode = "401", description = "Unauthorized - invalid JWT token"),
        @ApiResponse(responseCode = "500", description = "Stripe configuration error or internal server error")
    })
    @PostMapping("/create")
    public ResponseEntity<?> createSubscription(
            @RequestBody CreateSubscriptionRequest request,
            Authentication authentication,
            HttpServletRequest httpRequest) {

        try {
            // Check if Stripe is configured
            if (!stripeConfig.isConfigured()) {
                logger.error("Stripe is not configured properly");
                return ResponseEntity.status(500)
                    .body(createErrorResponse("Payment system is not configured"));
            }

            // Get user from authentication
            String userEmail = authentication.getName();
            Optional<User> userOpt = userRepository.findByEmail(userEmail);
            
            if (userOpt.isEmpty()) {
                logger.warn("User not found for email: {}", userEmail);
                return ResponseEntity.status(400)
                    .body(createErrorResponse("User not found"));
            }

            User user = userOpt.get();

            // Validate plan type and handle aliases
            PlanType planType;
            String planTypeStr = request.getPlanType().toUpperCase();
            
            // Handle common plan type aliases
            switch (planTypeStr) {
                case "MONTHLY":
                    planType = PlanType.PREMIUM;
                    break;
                case "YEARLY":
                case "ANNUAL":
                    planType = PlanType.ENTERPRISE;
                    break;
                default:
                    try {
                        planType = PlanType.valueOf(planTypeStr);
                    } catch (IllegalArgumentException e) {
                        logger.warn("Invalid plan type: {}", request.getPlanType());
                        return ResponseEntity.status(400)
                            .body(createErrorResponse("Invalid plan type. Must be FREE, PREMIUM, ENTERPRISE, MONTHLY, YEARLY, or ANNUAL"));
                    }
                    break;
            }

            // Skip Stripe for FREE plan
            if (planType == PlanType.FREE) {
                logger.info("Creating free subscription for user: {}", userEmail);
                
                // Create a local subscription record for free plan
                Subscription freeSubscription = new Subscription(
                    user, 
                    "free-plan-" + user.getId(), 
                    PlanType.FREE, 
                    SubscriptionStatus.ACTIVE
                );
                
                subscriptionRepository.save(freeSubscription);
                
                Map<String, Object> responseData = new HashMap<>();
                responseData.put("subscriptionId", freeSubscription.getId());
                responseData.put("planType", planType.toString());
                responseData.put("status", SubscriptionStatus.ACTIVE.toString());
                responseData.put("checkoutUrl", null);
                
                return ResponseEntity.ok(createSuccessResponse(
                    "Free subscription activated",
                    responseData
                ));
            }

            // Create Stripe checkout session for paid plans
            SessionCreateParams.Builder paramsBuilder = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
                .setCustomerEmail(userEmail)
                .setSuccessUrl(successUrl + "?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(cancelUrl)
                .putMetadata("user_id", user.getId().toString())
                .putMetadata("plan_type", planType.toString());

            // Add price based on plan type
            String priceId = getPriceIdForPlan(planType);
            if (priceId == null) {
                logger.error("No price ID configured for plan type: {}", planType);
                return ResponseEntity.status(500)
                    .body(createErrorResponse("Plan pricing not configured"));
            }

            paramsBuilder.addLineItem(
                SessionCreateParams.LineItem.builder()
                    .setPrice(priceId)
                    .setQuantity(1L)
                    .build()
            );

            Session session = Session.create(paramsBuilder.build());

            // Create subscription record with pending status. We'll fill Stripe subscription ID via webhook.
            Subscription subscription = new Subscription(
                user,
                null,
                planType,
                SubscriptionStatus.INCOMPLETE
            );
            subscription.setCheckoutSessionId(session.getId());

            subscriptionRepository.save(subscription);

            logger.info("Created Stripe checkout session {} for user {} with plan {}", 
                session.getId(), userEmail, planType);

            Map<String, Object> response = new HashMap<>();
            response.put("checkoutSessionId", session.getId());
            response.put("publishableKey", stripeConfig.getPublishableKey());
            response.put("clientSecret", session.getClientSecret());
            response.put("checkoutUrl", session.getUrl());
            response.put("subscriptionId", subscription.getId());
            response.put("planType", planType.toString());
            response.put("status", SubscriptionStatus.INCOMPLETE.toString());

            return ResponseEntity.ok(response);

        } catch (StripeException e) {
            logger.error("Stripe error creating subscription: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                .body(createErrorResponse("Failed to create subscription: " + e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error creating subscription: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                .body(createErrorResponse("Internal server error"));
        }
    }

    /**
     * Get Stripe price ID for the given plan type from configuration.
     */
    private String getPriceIdForPlan(PlanType planType) {
        switch (planType) {
            case PREMIUM:
                return premiumPriceId;
            case ENTERPRISE:
                return enterprisePriceId;
            default:
                return null;
        }
    }

    private Map<String, Object> createSuccessResponse(String message, Object data) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", message);
        response.put("data", data);
        return response;
    }

    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", message);
        return response;
    }

    /**
     * Request DTO for creating subscriptions
     */
    public static class CreateSubscriptionRequest {
        private String planType;

        public String getPlanType() {
            return planType;
        }

        public void setPlanType(String planType) {
            this.planType = planType;
        }
    }
}
