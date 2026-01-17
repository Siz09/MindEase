package com.mindease.payment.controller;

import com.mindease.payment.dto.EsewaPaymentRequest;
import com.mindease.payment.dto.EsewaPaymentResponse;
import com.mindease.payment.service.EsewaService;
import com.mindease.shared.security.CurrentUserId;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/esewa")
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:5173}")
public class EsewaController {

    private static final Logger logger = LoggerFactory.getLogger(EsewaController.class);

    private final EsewaService esewaService;
    private final ObjectMapper objectMapper;

    public EsewaController(EsewaService esewaService, ObjectMapper objectMapper) {
        this.esewaService = esewaService;
        this.objectMapper = objectMapper;
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/create")
    public ResponseEntity<EsewaPaymentResponse> createPayment(@RequestBody @Valid EsewaPaymentRequest request) {
        UUID userId = CurrentUserId.get();
        logger.info("Creating eSewa payment request for user {}", userId);

        EsewaPaymentResponse response = esewaService.createPaymentRequest(userId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/success")
    public ResponseEntity<Map<String, String>> handleSuccess(@RequestParam Map<String, String> params) {
        logger.info("Received eSewa success callback with params: {}", params);

        // Decode Base64 response if present
        String data = params.get("data");
        Map<String, String> callbackData = params;

        if (data != null && !data.isBlank()) {
            try {
                // Decode Base64 and parse JSON
                byte[] decodedBytes = java.util.Base64.getDecoder().decode(data);
                String decodedJson = new String(decodedBytes, java.nio.charset.StandardCharsets.UTF_8);
                @SuppressWarnings("unchecked")
                Map<String, Object> decoded = objectMapper.readValue(decodedJson, Map.class);
                // Convert all values to strings for compatibility
                callbackData = new java.util.HashMap<>();
                for (Map.Entry<String, Object> entry : decoded.entrySet()) {
                    callbackData.put(entry.getKey(), entry.getValue() != null ? entry.getValue().toString() : "");
                }
                logger.info("Decoded eSewa callback data: {}", callbackData);
            } catch (Exception e) {
                logger.error("Failed to decode eSewa callback data", e);
            }
        }

        boolean success = esewaService.processPaymentCallback(callbackData);

        if (success) {
            return ResponseEntity.ok(Map.of("status", "success", "message", "Payment processed successfully"));
        } else {
            return ResponseEntity.ok(Map.of("status", "pending", "message", "Payment is being processed"));
        }
    }

    @PostMapping("/failure")
    public ResponseEntity<Map<String, String>> handleFailure(@RequestParam Map<String, String> params) {
        logger.info("Received eSewa failure callback with params: {}", params);

        // Decode Base64 response if present
        String data = params.get("data");
        Map<String, String> callbackData = params;

        if (data != null && !data.isBlank()) {
            try {
                byte[] decodedBytes = java.util.Base64.getDecoder().decode(data);
                String decodedJson = new String(decodedBytes, java.nio.charset.StandardCharsets.UTF_8);
                @SuppressWarnings("unchecked")
                Map<String, Object> decoded = objectMapper.readValue(decodedJson, Map.class);
                // Convert all values to strings for compatibility
                callbackData = new java.util.HashMap<>();
                for (Map.Entry<String, Object> entry : decoded.entrySet()) {
                    callbackData.put(entry.getKey(), entry.getValue() != null ? entry.getValue().toString() : "");
                }
                logger.info("Decoded eSewa failure callback data: {}", callbackData);
            } catch (Exception e) {
                logger.error("Failed to decode eSewa failure callback data", e);
            }
        }

        // Update subscription status if needed
        String transactionUuid = callbackData.get("transaction_uuid");
        if (transactionUuid != null) {
            logger.warn("Payment failed for transaction: {}", transactionUuid);
        }

        return ResponseEntity.ok(Map.of("status", "failure", "message", "Payment failed or was canceled"));
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> checkStatus(@RequestParam String transactionUuid) {
        UUID userId = CurrentUserId.get();
        logger.info("Checking eSewa payment status for transaction {} by user {}", transactionUuid, userId);

        // In a real implementation, you would call eSewa's status check API here
        // For now, we'll just check our database
        return ResponseEntity.ok(Map.of(
                "transaction_uuid", transactionUuid,
                "message", "Status check not yet implemented. Use eSewa status API directly."));
    }
}
