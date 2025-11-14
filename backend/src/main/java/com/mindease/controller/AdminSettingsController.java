package com.mindease.controller;

import com.mindease.dto.AdminSettingsPayload;
import com.mindease.dto.ApiKeyInfo;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
    public ResponseEntity<AdminSettingsPayload> updateSettingsPut(@RequestBody AdminSettingsPayload payload) {
        return saveSettings(payload);
    }

    @PostMapping("/settings")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Save admin settings", description = "Create or update admin UI settings")
    public ResponseEntity<AdminSettingsPayload> updateSettingsPost(@RequestBody AdminSettingsPayload payload) {
        return saveSettings(payload);
    }

    private ResponseEntity<AdminSettingsPayload> saveSettings(AdminSettingsPayload payload) {
        if (payload == null) {
            return ResponseEntity.badRequest().build();
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
        return ResponseEntity.badRequest().body(Map.of(
                "status", "not_supported",
                "message", "API keys are managed via environment configuration."
        ));
    }

    @PutMapping("/api-keys/{id}/rotate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Rotate API key", description = "Not supported for environment-managed keys")
    public ResponseEntity<Map<String, String>> rotateKey(@PathVariable String id) {
        return ResponseEntity.badRequest().body(Map.of(
                "status", "not_supported",
                "message", "Rotation for key '" + id + "' is managed outside the application."
        ));
    }

    private static String last4(String value) {
        if (value == null || value.length() < 4) return "";
        return value.substring(value.length() - 4);
    }
}

