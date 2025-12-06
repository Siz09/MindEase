package com.mindease.service;

import com.mindease.subscription.service.PremiumAccessService;
import com.mindease.subscription.service.SubscriptionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PremiumAccessServiceTest {

    private SubscriptionService subscriptionService;
    private PremiumAccessService premiumAccessService;

    @BeforeEach
    void setUp() {
        subscriptionService = mock(SubscriptionService.class);
        premiumAccessService = new PremiumAccessService(subscriptionService);
    }

    @Test
    void isPremiumReturnsFalseWhenUserIdIsNull() {
        boolean result = premiumAccessService.isPremium(null);
        assertThat(result).isFalse();
    }

    @Test
    void isPremiumReturnsTrueWhenLatestStatusIsActive() {
        UUID userId = UUID.randomUUID();
        when(subscriptionService.findLatestStatusForUser(userId)).thenReturn("active");

        boolean result = premiumAccessService.isPremium(userId);

        assertThat(result).isTrue();
    }

    @Test
    void isPremiumReturnsFalseWhenLatestStatusIsInactiveLike() {
        UUID userId = UUID.randomUUID();
        when(subscriptionService.findLatestStatusForUser(userId)).thenReturn("canceled");

        boolean result = premiumAccessService.isPremium(userId);

        assertThat(result).isFalse();
    }
}
