package com.mindease.subscription.controller;

import com.mindease.subscription.dto.SubscriptionCreateRequest;
import com.mindease.subscription.dto.SubscriptionCreateResponse;
import com.mindease.shared.security.CurrentUserId;
import com.mindease.subscription.model.BillingPeriod;
import com.mindease.subscription.model.PlanType;
import com.mindease.subscription.model.SubscriptionStatus;
import com.mindease.subscription.service.SubscriptionService;
import com.stripe.exception.StripeException;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Locale;
import java.util.UUID;

@RestController
@RequestMapping("/api/subscription")
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:5173}")
public class SubscriptionController {

    private static final Logger logger = LoggerFactory.getLogger(SubscriptionController.class);

    private final SubscriptionService subscriptionService;

    @Value("${stripe.publishable-key}")
    private String publishableKey;

    public SubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping({ "/create", "" }) // Support both /create and root path
    public ResponseEntity<?> create(@RequestBody @Valid SubscriptionCreateRequest body) throws StripeException {

        // Simplified two-price mode: always treat as PREMIUM tier.
        PlanType planType = PlanType.PREMIUM;

        UUID userId = CurrentUserId.get();

        boolean hasActiveish = subscriptionService.hasActiveLikeSubscription(
                userId, List.of(SubscriptionStatus.INCOMPLETE, SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE));

        if (hasActiveish) {
            logger.info("User {} already has an active-ish subscription; skipping new Checkout Session", userId);
            return ResponseEntity.status(409).body(Map.of(
                    "error", "subscription_exists",
                    "message", "You already have a subscription in progress or active."));
        }

        // Determine billing period: prefer request; default to MONTHLY for PREMIUM when
        // missing
        BillingPeriod billing;
        String periodRaw = body.getBillingPeriod();
        if (periodRaw != null && !periodRaw.isBlank()) {
            String p = periodRaw.toLowerCase(Locale.ROOT).trim();
            try {
                billing = switch (p) {
                    case "monthly", "month", "mo" -> BillingPeriod.MONTHLY;
                    case "annual", "yearly", "year", "yr" -> BillingPeriod.ANNUAL;
                    default -> BillingPeriod.valueOf(periodRaw.toUpperCase(Locale.ROOT));
                };
            } catch (IllegalArgumentException e) {
                logger.warn("Invalid billing period '{}' provided by user {}", periodRaw, userId);
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "invalid_billing_period",
                        "message", "Allowed values: monthly|month|mo or annual|yearly|year|yr."));
            }
        } else {
            // Default to MONTHLY for PREMIUM tier
            billing = BillingPeriod.MONTHLY;
        }

        String sessionId = subscriptionService.createCheckoutSession(userId, planType, billing);
        logger.info("Created Stripe Checkout Session {} for user ID {} with plan {}", sessionId, userId, planType);

        return ResponseEntity.ok(new SubscriptionCreateResponse(sessionId, publishableKey));
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/status")
    public ResponseEntity<Map<String, String>> status() {
        UUID userId = CurrentUserId.get();
        String status = subscriptionService.findLatestStatusForUser(userId);
        return ResponseEntity.ok(Map.of("status", status));
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/cancel")
    public ResponseEntity<?> cancel() {
        UUID userId = CurrentUserId.get();
        logger.info("User {} requested subscription cancellation", userId);

        try {
            boolean canceled = subscriptionService.cancelActiveSubscription(userId);

            if (!canceled) {
                logger.info("User {} requested cancellation but has no active subscription (idempotent success)", userId);
                return ResponseEntity.ok(Map.of(
                        "status", "success",
                        "message", "No active subscription to cancel."));
            }

            logger.info("Successfully canceled subscription for user {}", userId);
            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Subscription canceled"));
        } catch (StripeException e) {
            logger.error("Stripe error during cancellation for user {}", userId, e);
            return ResponseEntity.status(500).body(Map.of(
                    "status", "error",
                    "message", "Failed to cancel subscription due to payment provider error. Please try again or contact support."));
        } catch (Exception e) {
            logger.error("Unexpected error during cancellation for user {}", userId, e);
            return ResponseEntity.status(500).body(Map.of(
                    "status", "error",
                    "message", "An unexpected error occurred while canceling subscription."));
        }
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/clear-incomplete")
    public ResponseEntity<?> clearIncomplete() {
        UUID userId = CurrentUserId.get();
        logger.info("User {} requested to clear incomplete subscription", userId);

        boolean cleared = subscriptionService.clearIncompleteSubscription(userId);

        if (!cleared) {
            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "No incomplete subscription to clear."));
        }

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Incomplete subscription cleared successfully."));
    }
}
