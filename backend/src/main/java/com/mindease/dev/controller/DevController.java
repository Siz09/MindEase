package com.mindease.dev.controller;

import com.mindease.auth.model.Role;
import com.mindease.auth.model.User;
import com.mindease.auth.repository.UserRepository;
import com.mindease.mood.service.AutoMoodService;
import com.mindease.shared.service.InactivityDetectionService;
import com.mindease.subscription.service.SubscriptionService;
import com.mindease.shared.util.JwtUtil;
import com.mindease.subscription.model.BillingPeriod;
import com.mindease.subscription.model.PlanType;
import com.mindease.subscription.model.Subscription;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/dev")
public class DevController {

    @Value("${spring.profiles.active:}")
    private String activeProfile;

    @Autowired
    private AutoMoodService autoMoodService;

    @Autowired
    private InactivityDetectionService inactivityDetectionService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private SubscriptionService subscriptionService;

    // --- Core dev helpers (from original DevController) ---

    @GetMapping("/profile")
    public Map<String, String> getActiveProfile() {
        Map<String, String> response = new HashMap<>();
        response.put("activeProfile", activeProfile);
        response.put("status", "success");
        return response;
    }

    @PostMapping("/trigger-auto-mood")
    public ResponseEntity<?> triggerAutoMood() {
        if (!isDevelopmentMode()) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("This endpoint is only available in development mode"));
        }

        try {
            autoMoodService.manualTrigger();
            return ResponseEntity.ok("Auto mood task triggered manually");
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("Failed to trigger auto mood: " + e.getMessage()));
        }
    }

    @PostMapping("/trigger-inactivity-detection")
    public ResponseEntity<?> triggerInactivityDetection() {
        if (!isDevelopmentMode()) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("This endpoint is only available in development mode"));
        }

        try {
            inactivityDetectionService.manualTrigger();
            return ResponseEntity.ok("Inactivity detection task triggered manually");
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("Failed to trigger inactivity detection: " + e.getMessage()));
        }
    }

    @GetMapping("/health")
    public Map<String, String> healthCheck() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "healthy");
        response.put("profile", activeProfile);
        response.put("timestamp", java.time.LocalDateTime.now().toString());
        return response;
    }

    // --- Auth-related dev endpoints (from DevAuthController) ---

    @PostMapping("/login-test")
    public ResponseEntity<?> devLogin(@RequestBody DevLoginRequest request) {
        if (!isDevelopmentMode()) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("This endpoint is only available in development mode"));
        }

        try {
            String email = request.getEmail();
            Optional<User> userOptional = userRepository.findByEmail(email);

            User user = userOptional.orElseGet(() -> {
                User u = new User();
                u.setEmail(email);
                u.setRole(Role.USER);
                u.setAnonymousMode(false);
                u.setFirebaseUid("dev-test-uid-" + UUID.randomUUID());
                return userRepository.save(u);
            });

            String jwtToken = jwtUtil.generateToken(user);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Development login successful");
            response.put("status", "success");
            response.put("token", jwtToken);

            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", user.getId());
            userInfo.put("email", user.getEmail());
            userInfo.put("role", user.getRole());
            userInfo.put("anonymousMode", user.getAnonymousMode());

            response.put("user", userInfo);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("Development login failed: " + e.getMessage()));
        }
    }

    @PostMapping("/create-admin-user")
    public ResponseEntity<?> createAdminUser(@RequestBody DevLoginRequest request) {
        if (!isDevelopmentMode()) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("This endpoint is only available in development mode"));
        }

        try {
            String email = request.getEmail();
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("Email is required"));
            }

            Optional<User> userOptional = userRepository.findByEmail(email);

            User user;
            if (userOptional.isPresent()) {
                user = userOptional.get();
                user.setRole(Role.ADMIN);
                user = userRepository.save(user);
            } else {
                user = new User();
                user.setEmail(email);
                user.setRole(Role.ADMIN);
                user.setAnonymousMode(false);
                user.setFirebaseUid("dev-admin-uid-" + UUID.randomUUID());
                user = userRepository.save(user);
            }

            String jwtToken = jwtUtil.generateToken(user);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Admin user created/updated successfully");
            response.put("status", "success");
            response.put("token", jwtToken);

            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", user.getId());
            userInfo.put("email", user.getEmail());
            userInfo.put("role", user.getRole());
            userInfo.put("anonymousMode", user.getAnonymousMode());

            response.put("user", userInfo);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("Failed to create admin user: " + e.getMessage()));
        }
    }

    // --- Subscription-related dev endpoint (from DevSubscriptionController) ---

    @PostMapping("/subscription/activate")
    public ResponseEntity<?> activateSubscription(@RequestBody DevActivateRequest req) {
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

    // --- Helpers and DTOs ---

    private boolean isDevelopmentMode() {
        return "dev".equals(activeProfile) || (activeProfile != null && activeProfile.contains("development"));
    }

    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("message", message);
        response.put("status", "error");
        return response;
    }

    private static PlanType parsePlan(String raw) {
        if (raw == null || raw.isBlank())
            return PlanType.PREMIUM;
        try {
            return PlanType.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return PlanType.PREMIUM;
        }
    }

    private static BillingPeriod parseBilling(String raw) {
        if (raw == null || raw.isBlank())
            return BillingPeriod.MONTHLY;
        String p = raw.trim().toLowerCase();
        return switch (p) {
            case "annual", "year", "yearly", "yr" -> BillingPeriod.ANNUAL;
            default -> BillingPeriod.MONTHLY;
        };
    }

    public static class DevLoginRequest {
        private String email;

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }
    }

    public static class DevActivateRequest {
        private String email;
        private UUID userId;
        private String planType;
        private String billingPeriod;

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public UUID getUserId() {
            return userId;
        }

        public void setUserId(UUID userId) {
            this.userId = userId;
        }

        public String getPlanType() {
            return planType;
        }

        public void setPlanType(String planType) {
            this.planType = planType;
        }

        public String getBillingPeriod() {
            return billingPeriod;
        }

        public void setBillingPeriod(String billingPeriod) {
            this.billingPeriod = billingPeriod;
        }
    }
}
