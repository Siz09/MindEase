package com.mindease.service;

import com.mindease.model.PlanType;
import com.mindease.model.Subscription;
import com.mindease.model.SubscriptionStatus;
import com.mindease.model.User;
import com.mindease.repository.SubscriptionRepository;
import com.mindease.repository.UserRepository;
import com.stripe.StripeClient;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

@Service
public class SubscriptionService {
    private static final Logger logger = LoggerFactory.getLogger(SubscriptionService.class);

    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;

    @SuppressWarnings("unused")
    private final StripeClient stripeClient; // Ensure Stripe is configured; static apiKey paths are used by some SDK
                                             // calls

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
            StripeClient stripeClient) {
        this.subscriptionRepository = subscriptionRepository;
        this.userRepository = userRepository;
        this.stripeClient = stripeClient;
    }

    public boolean hasActiveLikeSubscription(UUID userId, Collection<SubscriptionStatus> statuses) {
        return subscriptionRepository.existsByUser_IdAndStatusIn(userId, statuses);
    }

    public String createCheckoutSession(UUID userId, PlanType planType) throws StripeException {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("User not found: " + userId);
        }
        User user = userOpt.get();

        String priceId = getPriceIdForPlan(planType);
        if (priceId == null || priceId.isEmpty()) {
            throw new IllegalStateException("Plan pricing not configured for plan: " + planType);
        }

        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
                .setCustomerEmail(user.getEmail())
                .setSuccessUrl(successUrl)
                .setCancelUrl(cancelUrl)
                .putMetadata("user_id", user.getId().toString())
                .putMetadata("plan_type", planType.toString())
                .addLineItem(SessionCreateParams.LineItem.builder().setPrice(priceId).setQuantity(1L).build())
                .build();

        Session session = Session.create(params);

        Subscription subscription = new Subscription(
                user,
                null,
                planType,
                SubscriptionStatus.INCOMPLETE);
        subscription.setCheckoutSessionId(session.getId());
        subscriptionRepository.save(subscription);

        return session.getId();
    }

    private String getPriceIdForPlan(PlanType planType) {
        return switch (planType) {
            case PREMIUM -> (monthlyPriceId == null || monthlyPriceId.isEmpty()) ? null : monthlyPriceId;
            case ENTERPRISE -> (annualPriceId == null || annualPriceId.isEmpty()) ? null : annualPriceId;
            default -> null;
        };
    }
}
