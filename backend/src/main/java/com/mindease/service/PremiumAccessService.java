package com.mindease.service;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class PremiumAccessService {

  private final SubscriptionService subscriptionService;

  public PremiumAccessService(SubscriptionService subscriptionService) {
    this.subscriptionService = subscriptionService;
  }

  /**
   * Cached "is premium?" check; cached to reduce DB hits on hot endpoints.
   */
  @Cacheable(value = "subscription_status", key = "#userId")
  public boolean isPremium(UUID userId) {
    String status = subscriptionService.findLatestStatusForUser(userId);
    return "active".equals(status);
  }
}

