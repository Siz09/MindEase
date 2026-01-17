package com.mindease.payment.util;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

/**
 * Utility class for generating HMAC SHA256 signatures for eSewa payment integration.
 */
public class EsewaSignatureUtil {

    private static final String ALGORITHM = "HmacSHA256";

    /**
     * Generates HMAC SHA256 signature in Base64 format.
     *
     * @param message The message to sign (signed field values in order)
     * @param secretKey The secret key for HMAC generation
     * @return Base64 encoded signature
     * @throws NoSuchAlgorithmException If HMAC SHA256 algorithm is not available
     * @throws InvalidKeyException If the secret key is invalid
     */
    public static String generateSignature(String message, String secretKey)
            throws NoSuchAlgorithmException, InvalidKeyException {
        Mac mac = Mac.getInstance(ALGORITHM);
        SecretKeySpec secretKeySpec = new SecretKeySpec(
                secretKey.getBytes(StandardCharsets.UTF_8),
                ALGORITHM
        );
        mac.init(secretKeySpec);
        byte[] hash = mac.doFinal(message.getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encodeToString(hash);
    }

    /**
     * Creates the signed message string from field names and values.
     * Example: "total_amount=100,transaction_uuid=11-201-13,product_code=EPAYTEST"
     *
     * @param signedFieldNames Comma-separated field names (e.g., "total_amount,transaction_uuid,product_code")
     * @param fieldValues Array of field values in the same order as field names
     * @return Formatted message string for signing
     */
    public static String createSignedMessage(String signedFieldNames, String... fieldValues) {
        String[] fields = signedFieldNames.split(",");
        if (fields.length != fieldValues.length) {
            throw new IllegalArgumentException(
                    "Number of field names (" + fields.length +
                    ") must match number of values (" + fieldValues.length + ")");
        }

        StringBuilder message = new StringBuilder();
        for (int i = 0; i < fields.length; i++) {
            if (i > 0) {
                message.append(",");
            }
            message.append(fields[i].trim()).append("=").append(fieldValues[i]);
        }
        return message.toString();
    }

    /**
     * Verifies a signature by regenerating it and comparing.
     *
     * @param message The original message
     * @param secretKey The secret key
     * @param expectedSignature The signature to verify
     * @return true if signatures match, false otherwise
     */
    public static boolean verifySignature(String message, String secretKey, String expectedSignature) {
        try {
            String computedSignature = generateSignature(message, secretKey);
            return computedSignature.equals(expectedSignature);
        } catch (Exception e) {
            return false;
        }
    }
}