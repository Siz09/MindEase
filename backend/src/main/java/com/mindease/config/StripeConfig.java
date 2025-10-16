package com.mindease.config;

import com.stripe.Stripe;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration class for Stripe integration.
 * Sets up Stripe API keys from environment variables.
 */
@Configuration
public class StripeConfig {

    private static final Logger logger = LoggerFactory.getLogger(StripeConfig.class);

    @Value("${stripe.secret-key:}")
    private String secretKey;

    @Value("${stripe.publishable-key:}")
    private String publishableKey;

    @Value("${stripe.webhook-secret:}")
    private String webhookSecret;

    @PostConstruct
    public void initialize() {
        if (secretKey != null && !secretKey.isEmpty()) {
            Stripe.apiKey = secretKey;
            logger.info("Stripe secret key configured successfully");
        } else {
            logger.warn("Stripe secret key not configured. Stripe functionality will be disabled.");
        }

        if (publishableKey != null && !publishableKey.isEmpty()) {
            logger.info("Stripe publishable key configured successfully");
        } else {
            logger.warn("Stripe publishable key not configured.");
        }

        if (webhookSecret != null && !webhookSecret.isEmpty()) {
            logger.info("Stripe webhook secret configured successfully");
        } else {
            logger.warn("Stripe webhook secret not configured.");
        }
    }

    public String getPublishableKey() {
        return publishableKey;
    }

    public String getWebhookSecret() {
        return webhookSecret;
    }

    public boolean isConfigured() {
        return secretKey != null && !secretKey.isEmpty() && 
               publishableKey != null && !publishableKey.isEmpty() &&
               webhookSecret != null && !webhookSecret.isEmpty();
    }
}
