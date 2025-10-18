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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

@Service
public class SubscriptionService {
  private static final Logger logger = LoggerFactory.getLogger(SubscriptionService.class);

  private final SubscriptionRepository subscriptionRepository;
  private final UserRepository userRepository;
  private final CacheManager cacheManager;

  @SuppressWarnings("unused")
  private final StripeClient stripeClient;

  @Value("${stripe.checkout.success-url:http://localhost:5173/subscription/success?session_id={CHECKOUT_SESSION_ID}}")
  private String successUrl;

  @Value("${stripe.checkout.cancel-url:http://localhost:5173/subscription/cancel}")
  private String cancelUrl;

  @Value("${stripe.price.monthly:}")
  private String monthlyPriceId;

  @Value("${stripe.price.annual:}")
  private String annualPriceId;

  @Value("${stripe.price.premium.monthly:}")
  private String premiumMonthlyPriceId;

  @Value("${stripe.price.premium.annual:}")
  private String premiumAnnualPriceId;

  @Value("${stripe.price.enterprise.monthly:}")
  private String enterpriseMonthlyPriceId;

  @Value("${stripe.price.enterprise.annual:}")
  private String enterpriseAnnualPriceId;

  public SubscriptionService(SubscriptionRepository subscriptionRepository,
                             UserRepository userRepository,
                             StripeClient stripeClient,
                             CacheManager cacheManager) {
    this.subscriptionRepository = subscriptionRepository;
    this.userRepository = userRepository;
    this.stripeClient = stripeClient;
    this.cacheManager = cacheManager;
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
    Optional<User> userOpt = userRepository.findById(userId);
    if (userOpt.isEmpty()) {
      throw new IllegalArgumentException("User not found: " + userId);
    }
    User user = userOpt.get();

    Optional<Subscription> existing = subscriptionRepository
        .findByUser_IdAndStatus(userId, SubscriptionStatus.INCOMPLETE);
    if (existing.isPresent() && existing.get().getCheckoutSessionId() != null) {
      String sid = existing.get().getCheckoutSessionId();
      logger.info("Reusing existing INCOMPLETE checkout session {} for user {}", sid, userId);
      return sid;
    }

    String priceId = selectPriceId(tier, billing);
    if (priceId == null || priceId.isEmpty()) {
      throw new IllegalStateException("Plan pricing not configured for tier=" + tier + ", billing=" + billing);
    }

    SessionCreateParams params = SessionCreateParams.builder()
        .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
        .setCustomerEmail(user.getEmail())
        .setSuccessUrl(successUrl)
        .setCancelUrl(cancelUrl)
        .putMetadata("user_id", user.getId().toString())
        .putMetadata("plan_type", tier.toString())
        .putMetadata("billing_period", billing.toString())
        .addLineItem(SessionCreateParams.LineItem.builder().setPrice(priceId).setQuantity(1L).build())
        .build();

    String idemKey = "checkout:" + userId + ":" + (Instant.now().getEpochSecond() / 10);
    RequestOptions requestOptions = RequestOptions.builder().setIdempotencyKey(idemKey).build();

    Session session = Session.create(params, requestOptions);

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
      logger.error("Failed to save subscription after creating Stripe session: {}", session.getId(), e);
      throw e;
    }

    logger.info("Created checkout session {} for user {} with tier {} and billing {}", session.getId(), userId, tier, billing);
    return session.getId();
  }

  private String selectPriceId(PlanType tier, BillingPeriod billing) {
    if (tier == PlanType.PREMIUM) {
      if (billing == BillingPeriod.ANNUAL) return coalesce(premiumAnnualPriceId, annualPriceId);
      return coalesce(premiumMonthlyPriceId, monthlyPriceId);
    }
    if (tier == PlanType.ENTERPRISE) {
      if (billing == BillingPeriod.ANNUAL) return coalesce(enterpriseAnnualPriceId, annualPriceId);
      return coalesce(enterpriseMonthlyPriceId, monthlyPriceId);
    }
    return null;
  }

  private String coalesce(String a, String b) {
    return (a != null && !a.isEmpty()) ? a : (b != null && !b.isEmpty() ? b : null);
  }

  @Transactional
  public void handleCheckoutCompleted(String checkoutSessionId, String stripeSubscriptionId) {
    subscriptionRepository.findByCheckoutSessionId(checkoutSessionId)
        .ifPresent(sub -> {
          String old = sub.getStatus().name();
          sub.setStripeSubscriptionId(stripeSubscriptionId);
          sub.setStatus(SubscriptionStatus.ACTIVE);
          subscriptionRepository.save(sub);
          // Evict cached premium status for this user
          evictPremiumCache(sub.getUser().getId());
          logger.info("Subscription activated via checkout completion: user={}, old={}, new={}, stripeSub={}",
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
            // Evict cached premium status for this user
            evictPremiumCache(sub.getUser().getId());
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

  private void evictPremiumCache(UUID userId) {
    try {
      Cache cache = cacheManager.getCache("subscription_status");
      if (cache != null) {
        cache.evict(userId);
      }
    } catch (Exception ignore) {
      // no-op: cache eviction failure shouldn't disrupt webhook handling
    }
  }
}
