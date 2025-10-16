package com.mindease.subscription;

import com.stripe.StripeClient;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

@Configuration
public class StripeConfig {
  private static final Logger logger = LoggerFactory.getLogger(StripeConfig.class);

  @Value("${stripe.secret-key:}")
  private String secretKey;

  @Value("${stripe.publishable-key:}")
  private String publishableKey;

  @Value("${stripe.webhook.secret:}")
  private String webhookSecret;

  @Bean
  @ConditionalOnProperty(name = "stripe.secret-key")
  public StripeClient stripeClient() {
    if (!StringUtils.hasText(secretKey)) {
      throw new IllegalStateException("stripe.secret-key must be configured to create StripeClient");
    }
    return new StripeClient(secretKey);
  }

  @PostConstruct
  public void initialize() {
    if (StringUtils.hasText(secretKey)) {
      // Deliberately NOT setting Stripe.apiKey (global static) to avoid global state leakage in tests/tenancy.
      logger.info("Stripe secret key configured successfully");
    } else {
      logger.warn("Stripe secret key not configured. Stripe functionality will be disabled.");
    }

    if (StringUtils.hasText(publishableKey)) {
      logger.info("Stripe publishable key configured successfully");
    } else {
      logger.warn("Stripe publishable key not configured.");
    }

    if (StringUtils.hasText(webhookSecret)) {
      logger.info("Stripe webhook secret configured successfully");
    } else {
      logger.warn("Stripe webhook secret not configured.");
    }
  }

  public boolean isConfigured() {
    return StringUtils.hasText(secretKey)
        && StringUtils.hasText(publishableKey)
        && StringUtils.hasText(webhookSecret);
  }

  // No public getter for secretKey
  String getWebhookSecret() {
    return webhookSecret;
  }

  public String getPublishableKey() {
    return publishableKey;
  }
}
