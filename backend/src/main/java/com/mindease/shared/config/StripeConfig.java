package com.mindease.shared.config;

import com.stripe.Stripe;
import com.stripe.StripeClient;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class StripeConfig {

    private static final Logger logger = LoggerFactory.getLogger(StripeConfig.class);

    @Value("${stripe.secret-key:}")
    private String secretKey;

    @Value("${stripe.publishable-key:}")
    private String publishableKey;

    // Support both nested (stripe.webhook.secret) and legacy dashed
    // (stripe.webhook-secret) properties
    @Value("${stripe.webhook.secret:${stripe.webhook-secret:}}")
    private String webhookSecret;

    @Bean
    public StripeClient stripeClient() {
        return new StripeClient(secretKey);
    }

    @PostConstruct
    public void initialize() {
        if (secretKey != null && !secretKey.isEmpty()) {
            Stripe.apiKey = secretKey; // For code paths relying on static apiKey
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
        return secretKey != null && !secretKey.isEmpty()
                && publishableKey != null && !publishableKey.isEmpty()
                && webhookSecret != null && !webhookSecret.isEmpty();
    }
}
