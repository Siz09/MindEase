package com.mindease.controller;

import com.mindease.dto.AdminSettingsPayload;
import com.mindease.dto.ApiKeyInfo;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "Admin Settings")
public class AdminSettingsController {

    private static final int MIN_CRISIS_THRESHOLD = 1;
    private static final int MAX_CRISIS_THRESHOLD = 10;
    private static final int MIN_ARCHIVE_DAYS = 1;
    private static final int MAX_ARCHIVE_DAYS = 365;
    private static final String TIME_PATTERN = "^([01]\\d|2[0-3]):[0-5]\\d$";

    private final AtomicReference<AdminSettingsPayload> currentSettings =
            new AtomicReference<>(new AdminSettingsPayload(
                    5,
                    "all",
                    true,
                    30,
                    "09:00"
            ));

    @Value("${openai.api.key:}")
    private String openaiApiKey;

    @Value("${stripe.secret-key:}")
    private String stripeSecretKey;

    @GetMapping("/settings")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get admin settings", description = "Retrieve current admin UI settings")
    public AdminSettingsPayload getSettings() {
        return currentSettings.get();
    }

    @PutMapping("/settings")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update admin settings", description = "Update admin UI settings")
    public ResponseEntity<?> updateSettingsPut(@Valid @RequestBody AdminSettingsPayload payload) {
        return saveSettings(payload);
    }

    @PostMapping("/settings")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Save admin settings", description = "Create or update admin UI settings")
    public ResponseEntity<?> updateSettingsPost(@Valid @RequestBody AdminSettingsPayload payload) {
        return saveSettings(payload);
    }

    private ResponseEntity<?> saveSettings(AdminSettingsPayload payload) {
        if (payload == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Payload cannot be null"));
        }
        // Validate crisis threshold (1-10)
        if (payload.crisisThreshold() < MIN_CRISIS_THRESHOLD || payload.crisisThreshold() > MAX_CRISIS_THRESHOLD) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "error",
                            "Crisis threshold must be between " + MIN_CRISIS_THRESHOLD + " and " + MAX_CRISIS_THRESHOLD
                    ));
        }
        // Validate email notifications mode
        if (!"all".equals(payload.emailNotifications())
                && !"critical".equals(payload.emailNotifications())
                && !"none".equals(payload.emailNotifications())) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "error",
                            "emailNotifications must be one of: all, critical, none"
                    ));
        }
        // Validate auto-archive days when enabled
        if (payload.autoArchive()) {
            Integer days = payload.autoArchiveDays();
            if (days == null || days < MIN_ARCHIVE_DAYS || days > MAX_ARCHIVE_DAYS) {
                return ResponseEntity.badRequest()
                        .body(Map.of(
                                "error",
                                "autoArchiveDays must be between " + MIN_ARCHIVE_DAYS + " and " + MAX_ARCHIVE_DAYS
                        ));
            }
        }
        // Validate daily report time (HH:mm)
        if (payload.dailyReportTime() != null &&
                !payload.dailyReportTime().matches(TIME_PATTERN)) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "error",
                            "dailyReportTime must match pattern HH:mm (00:00 - 23:59)"
                    ));
        }
        currentSettings.set(payload);
        return ResponseEntity.ok(payload);
    }

    @GetMapping("/api-keys")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List API keys", description = "Safe listing of configured API keys (masked)")
    public List<ApiKeyInfo> listApiKeys() {
        List<ApiKeyInfo> items = new ArrayList<>();
        items.add(new ApiKeyInfo(
                "openai",
                "OpenAI API Key",
                last4(openaiApiKey),
                openaiApiKey != null && !openaiApiKey.isBlank()
        ));
        items.add(new ApiKeyInfo(
                "stripe",
                "Stripe Secret Key",
                last4(stripeSecretKey),
                stripeSecretKey != null && !stripeSecretKey.isBlank()
        ));
        return items;
    }

    @PostMapping("/api-keys")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Generate API key", description = "Not supported for environment-managed keys")
    public ResponseEntity<Map<String, String>> generateKey() {
        return ResponseEntity.status(501).body(Map.of(
                "status", "not_supported",
                "message", "API keys are managed via environment configuration."
        ));
    }

    @PutMapping("/api-keys/{id}/rotate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Rotate API key", description = "Not supported for environment-managed keys")
    public ResponseEntity<Map<String, String>> rotateKey(@PathVariable String id) {
        return ResponseEntity.status(501).body(Map.of(
                "status", "not_supported",
                "message", "Rotation for key '" + id + "' is managed outside the application."
        ));
    }

    private static String last4(String value) {
        if (value == null || value.length() < 4) return "";
        return value.substring(value.length() - 4);
    }
}
