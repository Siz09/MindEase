package com.mindease.controller;

import com.mindease.model.PlanType;
import com.mindease.model.SubscriptionStatus;
import com.mindease.dto.SubscriptionCreateRequest;
import com.mindease.dto.SubscriptionCreateResponse;
import com.mindease.security.CurrentUserId;
import com.mindease.service.SubscriptionService;
import com.stripe.exception.StripeException;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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
  @PostMapping("/create")
  public ResponseEntity<SubscriptionCreateResponse> create(@RequestBody @Valid SubscriptionCreateRequest body)
      throws StripeException {

    String plan = body.getPlanType().toLowerCase(Locale.ROOT);
    // Map common plan aliases to existing PlanType values
    PlanType planType = switch (plan) {
      case "monthly" -> PlanType.PREMIUM;
      case "annual", "yearly" -> PlanType.ENTERPRISE;
      case "premium" -> PlanType.PREMIUM;
      case "enterprise" -> PlanType.ENTERPRISE;
      default -> throw new IllegalArgumentException("Invalid planType: " + plan);
    };

    UUID userId = CurrentUserId.get();

    boolean hasActiveish = subscriptionService.hasActiveLikeSubscription(
        userId, List.of(SubscriptionStatus.INCOMPLETE, SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE));

    if (hasActiveish) {
      logger.info("User {} already has an active-ish subscription; skipping new Checkout Session", userId);
      return ResponseEntity.status(409).build();
    }

    String sessionId = subscriptionService.createCheckoutSession(userId, planType);
    logger.info("Created Stripe Checkout Session {} for user ID {} with plan {}", sessionId, userId, planType);

    return ResponseEntity.ok(new SubscriptionCreateResponse(sessionId, publishableKey));
  }
}
