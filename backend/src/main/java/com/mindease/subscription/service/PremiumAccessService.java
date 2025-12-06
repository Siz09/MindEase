package com.mindease.subscription.service;

import org.springframework.cache.annotation.CacheEvict;
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
     * Cached "is premium?" check; TTL configured via Caffeine spec in
     * application.yml.
     */
    @Cacheable(value = "subscription_status", key = "#userId")
    public boolean isPremium(UUID userId) {
        if (userId == null)
            return false;
        String status = subscriptionService.findLatestStatusForUser(userId);
        return "active".equalsIgnoreCase(status);
    }

    /** Evict cached premium status for a user after subscription status changes. */
    @CacheEvict(value = "subscription_status", key = "#userId")
    public void evict(UUID userId) {
        if (userId == null)
            return;
        // no-op: annotation triggers eviction
    }
}

