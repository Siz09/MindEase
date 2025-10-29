package com.mindease.controller;

import com.mindease.model.BillingPeriod;
import com.mindease.model.PlanType;
import com.mindease.model.Subscription;
import com.mindease.model.User;
import com.mindease.repository.UserRepository;
import com.mindease.service.SubscriptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/dev/subscription")
public class DevSubscriptionController {

    @Autowired
    private SubscriptionService subscriptionService;

    @Autowired
    private UserRepository userRepository;

    @Value("${spring.profiles.active:}")
    private String activeProfile;

    @PostMapping("/activate")
    public ResponseEntity<?> activate(@RequestBody DevActivateRequest req) {
        if (!isDevelopmentMode()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", "This endpoint is only available in development mode"));
        }

        if (req == null || (req.getEmail() == null && req.getUserId() == null)) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", "Provide email or userId"));
        }

        try {
            UUID userId;
            if (req.getUserId() != null) {
                userId = req.getUserId();
            } else {
                Optional<User> u = userRepository.findByEmail(req.getEmail());
                if (u.isEmpty()) {
                    return ResponseEntity.status(404).body(Map.of(
                            "status", "error",
                            "message", "User not found for email"));
                }
                userId = u.get().getId();
            }

            PlanType plan = parsePlan(req.getPlanType());
            BillingPeriod billing = parseBilling(req.getBillingPeriod());

            Subscription sub = subscriptionService.markActiveForUser(userId, plan, billing);

            Map<String, Object> resp = new HashMap<>();
            resp.put("status", "success");
            resp.put("userId", userId);
            resp.put("subscriptionId", sub.getId());
            resp.put("planType", sub.getPlanType());
            resp.put("billingPeriod", sub.getBillingPeriod());
            resp.put("newStatus", sub.getStatus());
            return ResponseEntity.ok(resp);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", e.getMessage()));
        }
    }

    private boolean isDevelopmentMode() {
        return "dev".equals(activeProfile) || (activeProfile != null && activeProfile.contains("development"));
    }

    private static PlanType parsePlan(String raw) {
        if (raw == null || raw.isBlank()) return PlanType.PREMIUM;
        try {
            return PlanType.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return PlanType.PREMIUM;
        }
    }

    private static BillingPeriod parseBilling(String raw) {
        if (raw == null || raw.isBlank()) return BillingPeriod.MONTHLY;
        String p = raw.trim().toLowerCase();
        return switch (p) {
            case "annual", "year", "yearly", "yr" -> BillingPeriod.ANNUAL;
            default -> BillingPeriod.MONTHLY;
        };
    }

    public static class DevActivateRequest {
        private String email;
        private UUID userId;
        private String planType;
        private String billingPeriod;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public UUID getUserId() { return userId; }
        public void setUserId(UUID userId) { this.userId = userId; }
        public String getPlanType() { return planType; }
        public void setPlanType(String planType) { this.planType = planType; }
        public String getBillingPeriod() { return billingPeriod; }
        public void setBillingPeriod(String billingPeriod) { this.billingPeriod = billingPeriod; }
    }
}

