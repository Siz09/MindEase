package com.mindease.controller;

import com.mindease.config.StripeConfig;
import com.mindease.model.Subscription;
import com.mindease.model.SubscriptionStatus;
import com.mindease.repository.SubscriptionRepository;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequestMapping("/api/stripe")
public class StripeWebhookController {

    private static final Logger logger = LoggerFactory.getLogger(StripeWebhookController.class);

    @Autowired
    private StripeConfig stripeConfig;

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @PostMapping("/webhook")
    public ResponseEntity<String> handleStripeWebhook(
            @RequestHeader(name = "Stripe-Signature", required = false) String sigHeader,
            @RequestBody String payload) {

        String endpointSecret = stripeConfig.getWebhookSecret();
        if (endpointSecret == null || endpointSecret.isEmpty()) {
            logger.error("Stripe webhook secret is not configured");
            return ResponseEntity.status(500).body("Webhook not configured");
        }

        if (sigHeader == null || sigHeader.isEmpty()) {
            logger.warn("Missing Stripe-Signature header");
            return ResponseEntity.badRequest().body("Missing signature");
        }

        final Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, endpointSecret);
        } catch (SignatureVerificationException e) {
            logger.warn("Invalid Stripe signature: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Invalid signature");
        } catch (Exception e) {
            logger.error("Error parsing Stripe event: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Invalid payload");
        }

        switch (event.getType()) {
            case "checkout.session.completed":
                handleCheckoutSessionCompleted(event);
                break;
            default:
                logger.debug("Unhandled Stripe event type: {}", event.getType());
                break;
        }

        return ResponseEntity.ok("received");
    }

    private void handleCheckoutSessionCompleted(Event event) {
        EventDataObjectDeserializer deserializer = event.getDataObjectDeserializer();

        if (!deserializer.getObject().isPresent()) {
            logger.warn("Stripe event missing data object for type: {}", event.getType());
            return;
        }

        Object stripeObject = deserializer.getObject().get();
        if (!(stripeObject instanceof Session)) {
            logger.warn("Expected Checkout Session object but got: {}", stripeObject.getClass().getName());
            return;
        }

        Session session = (Session) stripeObject;
        String sessionId = session.getId();
        String subscriptionId = session.getSubscription();

        if (subscriptionId == null || subscriptionId.isEmpty()) {
            logger.warn("Checkout session completed without subscription id. session={}", sessionId);
            return;
        }

        Optional<Subscription> subOpt = subscriptionRepository.findByCheckoutSessionId(sessionId);
        if (subOpt.isEmpty()) {
            logger.warn("No local subscription found for session id: {}", sessionId);
            return;
        }

        Subscription subscription = subOpt.get();
        subscription.setStripeSubscriptionId(subscriptionId);
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        subscriptionRepository.save(subscription);
        logger.info("Subscription {} activated for session {}", subscriptionId, sessionId);
    }
}

