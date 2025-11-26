package com.mindease.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

/**
 * Validates JWT secret strength on application startup.
 * Ensures production environments don't use weak or default secrets.
 */
@Component
public class JwtSecretValidator {

    private static final Logger logger = LoggerFactory.getLogger(JwtSecretValidator.class);

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${spring.profiles.active:dev}")
    private String activeProfile;

    private static final int MINIMUM_SECRET_LENGTH = 32;
    private static final String DEFAULT_DEV_SECRET = "dev-jwt-secret-key-for-development-only-change-in-production";

    @PostConstruct
    public void validateJwtSecret() {
        logger.info("Validating JWT secret configuration for profile: {}", activeProfile);

        // In production, fail fast if secret is weak
        if (isProductionProfile()) {
            if (jwtSecret == null || jwtSecret.trim().isEmpty()) {
                throw new IllegalStateException(
                    "FATAL: JWT secret is not configured in production environment. " +
                    "Set JWT_SECRET environment variable."
                );
            }

            if (jwtSecret.equals(DEFAULT_DEV_SECRET)) {
                throw new IllegalStateException(
                    "FATAL: Using default development JWT secret in production environment. " +
                    "This is a critical security vulnerability. Set a strong JWT_SECRET environment variable."
                );
            }

            if (jwtSecret.length() < MINIMUM_SECRET_LENGTH) {
                throw new IllegalStateException(
                    String.format(
                        "FATAL: JWT secret is too short (%d characters). " +
                        "Minimum required length is %d characters for production.",
                        jwtSecret.length(), MINIMUM_SECRET_LENGTH
                    )
                );
            }

            // Check for common weak patterns
            if (isWeakSecret(jwtSecret)) {
                throw new IllegalStateException(
                    "FATAL: JWT secret appears to be weak (e.g., 'secret', 'password', repeated characters). " +
                    "Use a strong, randomly generated secret."
                );
            }

            logger.info("JWT secret validation passed for production environment");
        } else {
            // In dev/test, just warn
            if (jwtSecret.equals(DEFAULT_DEV_SECRET)) {
                logger.warn(
                    "WARNING: Using default development JWT secret. " +
                    "This is acceptable for development but MUST be changed in production."
                );
            } else if (jwtSecret.length() < MINIMUM_SECRET_LENGTH) {
                logger.warn(
                    "WARNING: JWT secret is shorter than recommended ({} characters). " +
                    "Consider using at least {} characters.",
                    jwtSecret.length(), MINIMUM_SECRET_LENGTH
                );
            } else {
                logger.info("JWT secret validation passed for {} environment", activeProfile);
            }
        }
    }

    private boolean isProductionProfile() {
        return activeProfile != null &&
               (activeProfile.equalsIgnoreCase("prod") ||
                activeProfile.equalsIgnoreCase("production"));
    }

    private boolean isWeakSecret(String secret) {
        String lowerSecret = secret.toLowerCase();

        // Check for common weak passwords
        String[] weakPatterns = {
            "secret", "password", "123456", "qwerty", "admin",
            "test", "demo", "changeme", "default"
        };

        for (String pattern : weakPatterns) {
            if (lowerSecret.contains(pattern)) {
                return true;
            }
        }

        // Check for repeated characters (e.g., "aaaaaaaaaa")
        if (secret.matches("(.)\\1{9,}")) {
            return true;
        }

        return false;
    }
}
