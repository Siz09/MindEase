package com.mindease.service;

import com.mindease.model.BillingPeriod;
import com.mindease.model.PlanType;
import com.mindease.model.Subscription;
import com.mindease.model.SubscriptionStatus;
import com.mindease.model.User;
import com.mindease.repository.SubscriptionRepository;
import com.mindease.repository.UserRepository;
import com.stripe.StripeClient;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.net.RequestOptions;
import com.stripe.param.checkout.SessionCreateParams;
import com.stripe.param.checkout.SessionExpireParams;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.util.Collection;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
public class SubscriptionService {
    private static final Logger logger = LoggerFactory.getLogger(SubscriptionService.class);

    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final CacheManager cacheManager;
    private final StripeClient stripeClient;

    @Value("${stripe.checkout.success-url:http://localhost:5173/subscription/success?session_id={CHECKOUT_SESSION_ID}}")
    private String successUrl;

    @Value("${stripe.checkout.cancel-url:http://localhost:5173/subscription/cancel}")
    private String cancelUrl;

    @Value("${stripe.price.monthly:}")
    private String monthlyPriceId;

    @Value("${stripe.price.annual:}")
    private String annualPriceId;

    public SubscriptionService(SubscriptionRepository subscriptionRepository,
            UserRepository userRepository,
            StripeClient stripeClient,
            CacheManager cacheManager) {
        this.subscriptionRepository = Objects.requireNonNull(subscriptionRepository, "subscriptionRepository");
        this.userRepository = Objects.requireNonNull(userRepository, "userRepository");
        this.stripeClient = Objects.requireNonNull(stripeClient, "stripeClient");
        this.cacheManager = Objects.requireNonNull(cacheManager, "cacheManager");
    }

    @PostConstruct
    void validateStripeConfig() {
        if (!isPriceIdValid(monthlyPriceId)) {
            throw new IllegalStateException("Invalid or missing stripe.price.monthly (must start with 'price_').");
        }
        if (!isPriceIdValid(annualPriceId)) {
            throw new IllegalStateException("Invalid or missing stripe.price.annual (must start with 'price_').");
        }
        if (successUrl == null || successUrl.isBlank()) {
            throw new IllegalStateException("stripe.checkout.success-url must be configured.");
        }
        if (cancelUrl == null || cancelUrl.isBlank()) {
            throw new IllegalStateException("stripe.checkout.cancel-url must be configured.");
        }
    }

    private static boolean isPriceIdValid(String priceId) {
        return priceId != null && !priceId.isBlank() && priceId.startsWith("price_");
    }

    public boolean hasActiveLikeSubscription(UUID userId, Collection<SubscriptionStatus> statuses) {
        return subscriptionRepository.existsByUser_IdAndStatusIn(userId, statuses);
    }

    @Transactional
    public String createCheckoutSession(UUID userId, PlanType planType) throws StripeException {
        BillingPeriod inferred = (planType == PlanType.ENTERPRISE) ? BillingPeriod.ANNUAL : BillingPeriod.MONTHLY;
        return createCheckoutSession(userId, planType, inferred);
    }

    @Transactional
    public String createCheckoutSession(UUID userId, PlanType tier, BillingPeriod billing) throws StripeException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        if (user.getEmail() == null || user.getEmail().isBlank()) {
            throw new IllegalStateException("User " + userId + " has no email; required for Stripe Checkout.");
        }

        // Pessimistic lock to prevent duplicate INCOMPLETE sessions under concurrency
        Optional<Subscription> existing = subscriptionRepository
                .findByUser_IdAndStatusForUpdate(userId, SubscriptionStatus.INCOMPLETE);
        if (existing.isPresent() && existing.get().getCheckoutSessionId() != null) {
            String sid = existing.get().getCheckoutSessionId();
            logger.info("Reusing existing INCOMPLETE checkout session {} for user {}", sid, userId);
            return sid;
        }

        String priceId = selectPriceId(tier, billing);
        requireValidPriceId(priceId, tier, billing);

        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
                .setCustomerEmail(user.getEmail())
                .setSuccessUrl(successUrl)
                .setCancelUrl(cancelUrl)
                .putMetadata("user_id", user.getId().toString())
                .putMetadata("plan_type", tier.toString())
                .putMetadata("billing_period", billing.toString())
                .addLineItem(SessionCreateParams.LineItem.builder()
                        .setPrice(priceId)
                        .setQuantity(1L)
                        .build())
                .build();

        // Precise idempotency key to avoid parameter-mismatch collisions
        String idemKey = "checkout:" + userId + ":" + tier + ":" + billing + ":" + UUID.randomUUID();
        RequestOptions requestOptions = RequestOptions.builder().setIdempotencyKey(idemKey).build();

        // Use instance-based Stripe client (modern SDK)
        Session session = stripeClient.v1().checkout().sessions().create(params, requestOptions);

        Subscription subscription = new Subscription(
                user,
                null,
                tier,
                SubscriptionStatus.INCOMPLETE);
        subscription.setCheckoutSessionId(session.getId());
        subscription.setBillingPeriod(billing);

        try {
            subscriptionRepository.save(subscription);
        } catch (Exception e) {
            logger.error("DB save failed after creating Stripe session {} — attempting to expire it", session.getId(),
                    e);
            // Compensate: expire the orphaned Checkout Session to avoid dangling sessions
            try {
                stripeClient.v1().checkout().sessions().expire(
                        session.getId(),
                        SessionExpireParams.builder().build(),
                        null /* RequestOptions, if you want to pass a separate one */
                );
                logger.warn("Expired orphaned Stripe Checkout Session {}", session.getId());
            } catch (Exception expireEx) {
                logger.error("Failed to expire orphaned Stripe Checkout Session {}", session.getId(), expireEx);
            }
            throw e;
        }

        logger.info("Created checkout session {} for user {} with tier {} and billing {}",
                session.getId(), userId, tier, billing);
        return session.getId();
    }

    private String selectPriceId(PlanType tier, BillingPeriod billing) {
        return billing == BillingPeriod.ANNUAL ? annualPriceId : monthlyPriceId;
    }

    private void requireValidPriceId(String priceId, PlanType tier, BillingPeriod billing) {
        if (priceId == null || priceId.isBlank()) {
            throw new IllegalArgumentException(
                    "Stripe priceId not configured for tier=" + tier + ", billing=" + billing);
        }
        if (!priceId.startsWith("price_")) {
            throw new IllegalArgumentException(
                    "Invalid Stripe priceId for tier=" + tier + ", billing=" + billing +
                            ": expected an ID starting with 'price_' but got '" + priceId + "'.");
        }
    }

    @Transactional
    public void handleCheckoutCompleted(String checkoutSessionId, String stripeSubscriptionId) {
        subscriptionRepository.findByCheckoutSessionId(checkoutSessionId)
                .ifPresent(sub -> {
                    SubscriptionStatus old = sub.getStatus();
                    sub.setStripeSubscriptionId(stripeSubscriptionId);
                    sub.setStatus(SubscriptionStatus.ACTIVE);
                    subscriptionRepository.save(sub);
                    Cache cache = cacheManager.getCache("subscription_status");
                    if (cache != null) {
                        cache.evictIfPresent(sub.getUser().getId());
                    }
                    logger.info(
                            "Subscription activated via checkout completion: user={}, oldStatus={}, newStatus={}, stripeSub={}",
                            sub.getUser().getId(), old, sub.getStatus(), stripeSubscriptionId);
                });
    }

    @Transactional
    public void updateStatusByStripeSubId(String stripeSubscriptionId, SubscriptionStatus newStatus) {
        subscriptionRepository.findByStripeSubscriptionId(stripeSubscriptionId)
                .ifPresent(sub -> {
                    SubscriptionStatus old = sub.getStatus();
                    if (old != newStatus) {
                        sub.setStatus(newStatus);
                        subscriptionRepository.save(sub);
                        Cache cache = cacheManager.getCache("subscription_status");
                        if (cache != null) {
                            cache.evictIfPresent(sub.getUser().getId());
                        }
                        logger.info("Subscription status updated: user={}, stripeSub={}, {} -> {}",
                                sub.getUser().getId(), stripeSubscriptionId, old, newStatus);
                    }
                });
    }

    public String findLatestStatusForUser(UUID userId) {
        return subscriptionRepository.findFirstByUser_IdOrderByCreatedAtDesc(userId)
                .map(s -> switch (s.getStatus()) {
                    case ACTIVE -> "active";
                    case PAST_DUE -> "past_due";
                    case CANCELED -> "canceled";
                    default -> "inactive";
                })
                .orElse("inactive");
    }

    /**
     * DEV-ONLY helper: mark user's subscription ACTIVE, creating a row if needed.
     */
    @Transactional
    public Subscription markActiveForUser(UUID userId, PlanType planType, BillingPeriod billing) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        Subscription sub = subscriptionRepository.findFirstByUser_IdOrderByCreatedAtDesc(userId)
                .orElse(null);

        if (sub == null) {
            String placeholderStripeId = "dev_" + UUID.randomUUID();
            sub = new Subscription(user, placeholderStripeId, planType, SubscriptionStatus.ACTIVE);
            sub.setCheckoutSessionId("dev_cs_" + UUID.randomUUID());
            sub.setBillingPeriod(billing);
        } else {
            sub.setStatus(SubscriptionStatus.ACTIVE);
            sub.setPlanType(planType);
            if (billing != null) sub.setBillingPeriod(billing);
        }

        Subscription saved = subscriptionRepository.save(sub);
        Cache cache = cacheManager.getCache("subscription_status");
        if (cache != null) {
            cache.evictIfPresent(userId);
        }
        logger.info("[DEV] Marked subscription ACTIVE for user {} (subId={})", userId, saved.getId());
        return saved;
    }

    /**
     * Cancel the user's most recent active-ish subscription in Stripe and mark it CANCELED locally.
     * If only a pending Checkout session exists (INCOMPLETE), expire that session.
     */
    @Transactional
    public boolean cancelActiveSubscription(UUID userId) throws StripeException {
        var targetStatuses = java.util.List.of(
                SubscriptionStatus.ACTIVE,
                SubscriptionStatus.TRIALING,
                SubscriptionStatus.PAST_DUE,
                SubscriptionStatus.INCOMPLETE
        );

        var subOpt = subscriptionRepository
                .findFirstByUser_IdAndStatusInOrderByCreatedAtDesc(userId, targetStatuses);

        if (subOpt.isEmpty()) {
            logger.info("No subscription to cancel for user {}", userId);
            return false; // nothing to cancel
        }

        var sub = subOpt.get();

        String stripeSubId = sub.getStripeSubscriptionId();
        if (stripeSubId != null && !stripeSubId.isBlank()) {
            try {
                stripeClient.v1().subscriptions().cancel(stripeSubId, null, null);
                logger.info("Canceled Stripe subscription {} for user {}", stripeSubId, userId);
            } catch (Exception e) {
                logger.error("Failed to cancel Stripe subscription {} for user {}", stripeSubId, userId, e);
                if (e instanceof StripeException se) {
                    throw se;
                } else {
                    throw new RuntimeException("Failed to cancel Stripe subscription: " + e.getMessage(), e);
                }
            }
        } else if (sub.getCheckoutSessionId() != null && !sub.getCheckoutSessionId().isBlank()) {
            try {
                stripeClient.v1().checkout().sessions().expire(
                        sub.getCheckoutSessionId(),
                        SessionExpireParams.builder().build(),
                        null
                );
                logger.info("Expired Stripe Checkout session {} for user {}", sub.getCheckoutSessionId(), userId);
            } catch (Exception e) {
                logger.warn("Failed to expire Checkout session {} for user {} (continuing)", sub.getCheckoutSessionId(), userId, e);
            }
        }

        sub.setStatus(SubscriptionStatus.CANCELED);
        subscriptionRepository.save(sub);

        Cache cache = cacheManager.getCache("subscription_status");
        if (cache != null) {
            cache.evictIfPresent(userId);
        }

        return true;
    }
}
