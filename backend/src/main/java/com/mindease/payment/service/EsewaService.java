package com.mindease.payment.service;

import com.mindease.auth.model.User;
import com.mindease.auth.repository.UserRepository;
import com.mindease.payment.dto.EsewaPaymentRequest;
import com.mindease.payment.dto.EsewaPaymentResponse;
import com.mindease.payment.util.EsewaSignatureUtil;
import com.mindease.subscription.model.BillingPeriod;
import com.mindease.subscription.model.PlanType;
import com.mindease.subscription.model.Subscription;
import com.mindease.subscription.model.SubscriptionStatus;
import com.mindease.subscription.repository.SubscriptionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class EsewaService {

    private static final Logger logger = LoggerFactory.getLogger(EsewaService.class);
    private static final DateTimeFormatter UUID_FORMATTER = DateTimeFormatter.ofPattern("yyMMdd-HHmmss");

    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final ObjectMapper objectMapper;

    @Value("${esewa.url.test:https://rc-epay.esewa.com.np/api/epay/main/v2/form}")
    private String esewaUrlTest;

    @Value("${esewa.url.production:https://epay.esewa.com.np/api/epay/main/v2/form}")
    private String esewaUrlProduction;

    @Value("${esewa.product-code:EPAYTEST}")
    private String productCode;

    @Value("${esewa.secret-key:8gBm/:&EnhH.1/q}")
    private String secretKey;

    @Value("${esewa.success-url:http://localhost:5173/esewa/success}")
    private String successUrl;

    @Value("${esewa.failure-url:http://localhost:5173/esewa/failure}")
    private String failureUrl;

    @Value("${esewa.mode:test}")
    private String mode; // test or production

    public EsewaService(
            UserRepository userRepository,
            SubscriptionRepository subscriptionRepository,
            ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Creates an eSewa payment request and returns form data for client-side
     * submission.
     */
    @Transactional
    public EsewaPaymentResponse createPaymentRequest(UUID userId, EsewaPaymentRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        // Check for existing incomplete subscription
        Optional<Subscription> existing = subscriptionRepository
                .findByUser_IdAndStatus(userId, SubscriptionStatus.INCOMPLETE);

        String transactionUuid;
        Subscription subscription;

        if (existing.isPresent() && existing.get().getCheckoutSessionId() != null) {
            // Reuse existing transaction UUID from checkout session ID
            transactionUuid = existing.get().getCheckoutSessionId();
            subscription = existing.get();
            logger.info("Reusing existing INCOMPLETE eSewa transaction {} for user {}", transactionUuid, userId);
        } else {
            // Generate new transaction UUID
            transactionUuid = generateTransactionUuid(userId);

            // Create subscription record
            BillingPeriod billingPeriod = parseBillingPeriod(request.getBillingPeriod());
            subscription = new Subscription(user, null, PlanType.PREMIUM, SubscriptionStatus.INCOMPLETE);
            subscription.setCheckoutSessionId(transactionUuid);
            subscription.setBillingPeriod(billingPeriod);
            subscriptionRepository.save(subscription);
        }

        // Calculate totals
        BigDecimal amount = request.getAmount();
        BigDecimal taxAmount = request.getTaxAmount();
        BigDecimal serviceCharge = request.getProductServiceCharge() != null
                ? request.getProductServiceCharge()
                : BigDecimal.ZERO;
        BigDecimal deliveryCharge = request.getProductDeliveryCharge() != null
                ? request.getProductDeliveryCharge()
                : BigDecimal.ZERO;
        BigDecimal totalAmount = amount.add(taxAmount).add(serviceCharge).add(deliveryCharge);

        // Prepare form data - eSewa expects string values, typically without decimals
        // for whole numbers
        // Format amounts: remove trailing zeros and decimals if whole number
        String formattedTotalAmount = formatAmountForEsewa(totalAmount);
        String formattedAmount = formatAmountForEsewa(amount);
        String formattedTaxAmount = formatAmountForEsewa(taxAmount);
        String formattedServiceCharge = formatAmountForEsewa(serviceCharge);
        String formattedDeliveryCharge = formatAmountForEsewa(deliveryCharge);

        Map<String, String> formDataMap = new LinkedHashMap<>();
        formDataMap.put("amount", formattedAmount);
        formDataMap.put("tax_amount", formattedTaxAmount);
        formDataMap.put("total_amount", formattedTotalAmount);
        formDataMap.put("transaction_uuid", transactionUuid);
        formDataMap.put("product_code", productCode);
        formDataMap.put("product_service_charge", formattedServiceCharge);
        formDataMap.put("product_delivery_charge", formattedDeliveryCharge);
        formDataMap.put("success_url", successUrl);
        formDataMap.put("failure_url", failureUrl);
        formDataMap.put("signed_field_names", "total_amount,transaction_uuid,product_code");

        // Generate signature - must use exact same format as form data values
        try {
            String signedMessage = EsewaSignatureUtil.createSignedMessage(
                    "total_amount,transaction_uuid,product_code",
                    formattedTotalAmount, // Use same format as form data
                    transactionUuid,
                    productCode);
            String signature = EsewaSignatureUtil.generateSignature(signedMessage, secretKey);
            formDataMap.put("signature", signature);

            logger.info("Created eSewa payment request for user {} with transaction UUID {}", userId, transactionUuid);
            logger.info("eSewa signature message: '{}'", signedMessage);
            logger.info("eSewa form data values - total_amount: '{}', transaction_uuid: '{}', product_code: '{}'",
                    formattedTotalAmount, transactionUuid, productCode);
            logger.info("eSewa signature: {}", signature);
            logger.info("eSewa secret key configured: {}", secretKey != null && !secretKey.isBlank() ? "YES" : "NO");
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            logger.error("Failed to generate eSewa signature", e);
            throw new RuntimeException("Failed to generate payment signature", e);
        }

        // Convert form data to JSON string for client
        String formDataJson;
        try {
            formDataJson = objectMapper.writeValueAsString(formDataMap);
        } catch (Exception e) {
            logger.error("Failed to serialize form data to JSON", e);
            throw new RuntimeException("Failed to serialize payment form data", e);
        }

        String checkoutUrl = "test".equalsIgnoreCase(mode) ? esewaUrlTest : esewaUrlProduction;

        return new EsewaPaymentResponse(checkoutUrl, transactionUuid, formDataJson);
    }

    /**
     * Verifies and processes eSewa payment callback.
     */
    @Transactional
    public boolean processPaymentCallback(Map<String, String> callbackData) {
        String transactionUuid = callbackData.get("transaction_uuid");
        if (transactionUuid == null || transactionUuid.isBlank()) {
            logger.warn("Received eSewa callback without transaction_uuid");
            return false;
        }

        Optional<Subscription> subscriptionOpt = subscriptionRepository
                .findByCheckoutSessionId(transactionUuid);

        if (subscriptionOpt.isEmpty()) {
            logger.warn("No subscription found for eSewa transaction UUID: {}", transactionUuid);
            return false;
        }

        Subscription subscription = subscriptionOpt.get();

        // Verify signature if provided
        String signature = callbackData.get("signature");
        String signedFieldNames = callbackData.get("signed_field_names");
        if (signature != null && signedFieldNames != null) {
            try {
                String[] fields = signedFieldNames.split(",");
                List<String> values = new ArrayList<>();
                for (String field : fields) {
                    String value = callbackData.get(field.trim());
                    if (value != null) {
                        values.add(value);
                    }
                }
                String signedMessage = EsewaSignatureUtil.createSignedMessage(
                        signedFieldNames,
                        values.toArray(new String[0]));
                if (!EsewaSignatureUtil.verifySignature(signedMessage, secretKey, signature)) {
                    logger.warn("Invalid signature in eSewa callback for transaction: {}", transactionUuid);
                    return false;
                }
            } catch (Exception e) {
                logger.error("Error verifying eSewa callback signature", e);
                return false;
            }
        }

        // Update subscription status based on callback status
        String status = callbackData.get("status");
        if ("COMPLETE".equalsIgnoreCase(status)) {
            subscription.setStatus(SubscriptionStatus.ACTIVE);
            subscription.setStripeSubscriptionId(callbackData.get("transaction_code"));
            subscriptionRepository.save(subscription);
            logger.info("Activated subscription via eSewa callback: transaction={}", transactionUuid);
            return true;
        }

        logger.info("Received eSewa callback with status '{}' for transaction: {}", status, transactionUuid);
        return false;
    }

    private String generateTransactionUuid(UUID userId) {
        String timestamp = LocalDateTime.now().format(UUID_FORMATTER);
        String userIdShort = userId.toString().substring(0, 8).replace("-", "");
        return timestamp + "-" + userIdShort;
    }

    private BillingPeriod parseBillingPeriod(String period) {
        if (period == null) {
            return BillingPeriod.MONTHLY;
        }
        String p = period.toLowerCase().trim();
        return switch (p) {
            case "annual", "yearly", "year", "yr" -> BillingPeriod.ANNUAL;
            default -> BillingPeriod.MONTHLY;
        };
    }

    private String formatAmount(BigDecimal amount) {
        return amount.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString();
    }

    /**
     * Formats amount for eSewa (removes trailing zeros and decimals if whole
     * number).
     * Example: 100.00 -> "100", 100.50 -> "100.5", 100.55 -> "100.55"
     */
    private String formatAmountForEsewa(BigDecimal amount) {
        if (amount == null) {
            return "0";
        }
        // Remove trailing zeros and unnecessary decimal point
        BigDecimal stripped = amount.stripTrailingZeros();
        String result = stripped.toPlainString();
        // eSewa typically expects integer format for whole numbers in form data
        if (stripped.scale() == 0) {
            return String.valueOf(stripped.intValue());
        }
        return result;
    }
}
