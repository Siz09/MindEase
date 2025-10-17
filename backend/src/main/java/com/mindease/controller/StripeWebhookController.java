package com.mindease.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindease.model.SubscriptionStatus;
import com.mindease.repository.StripeEventRepository;
import com.mindease.service.SubscriptionService;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.Subscription;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/subscription")
public class StripeWebhookController {

    private static final Logger log = LoggerFactory.getLogger(StripeWebhookController.class);
    private static final ObjectMapper OM = new ObjectMapper();

    private final SubscriptionService subscriptionService;
    private final StripeEventRepository stripeEventRepository;

    @Value("${stripe.webhook.secret:}")
    private String webhookSecret;

    public StripeWebhookController(SubscriptionService subscriptionService,
            StripeEventRepository stripeEventRepository) {
        this.subscriptionService = subscriptionService;
        this.stripeEventRepository = stripeEventRepository;
    }

    @PostConstruct
    public void validateConfig() {
        if (webhookSecret == null || webhookSecret.isBlank()) {
            throw new IllegalStateException("stripe.webhook.secret must be configured");
        }
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> handle(@RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {
        // SECURITY-REVIEW: verify Stripe signature to prevent spoofed events
        final Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (SignatureVerificationException e) {
            log.warn("Invalid Stripe signature: {}", e.getMessage());
            return ResponseEntity.badRequest().body("invalid signature");
        }

        final String type = event.getType();
        final String eventId = event.getId();
        final EventDataObjectDeserializer des = event.getDataObjectDeserializer();
        log.info("Stripe webhook received: id={}, type={}", eventId, type);

        // Idempotency: try to insert a row for this event id; if none inserted, it’s a
        // duplicate
        int inserted = stripeEventRepository.insertIfNotExists(eventId, "PROCESSING");
        if (inserted == 0) {
            String status = stripeEventRepository.getStatus(eventId);
            if ("COMPLETED".equals(status)) {
                log.info("Ignoring already-processed Stripe event id={}", eventId);
                return ResponseEntity.ok("duplicate");
            }
            log.info("Re-processing Stripe event id={} with existing status={}", eventId, status);
        }

        try {
            switch (type) {
                case "checkout.session.completed" -> {
                    // Expand data.object as Session, or fall back to raw JSON
                    if (des.getObject().isPresent()) {
                        Session session = (Session) des.getObject()
                                .orElseThrow(() -> new IllegalStateException("Missing deserialized Session"));

                        String subscriptionId;
                        Subscription expanded = session.getSubscriptionObject();
                        if (expanded != null) {
                            // Expanded case
                            subscriptionId = expanded.getId();
                        } else {
                            // Non-expanded case (already a String like "sub_...")
                            subscriptionId = session.getSubscription();
                        }

                        subscriptionService.handleCheckoutCompleted(session.getId(), subscriptionId);
                    } else {
                        JsonNode node = OM.readTree(des.getRawJson());
                        String sessionId = text(node, "id");
                        String stripeSubId = text(node, "subscription");
                        subscriptionService.handleCheckoutCompleted(sessionId, stripeSubId);
                    }
                }
                case "customer.subscription.updated" -> {
                    if (des.getObject().isPresent()) {
                        Subscription sub = (Subscription) des.getObject().get();
                        SubscriptionStatus mapped = mapStripeStatus(sub.getStatus());
                        subscriptionService.updateStatusByStripeSubId(sub.getId(), mapped);
                    } else {
                        JsonNode node = OM.readTree(des.getRawJson());
                        String subId = text(node, "id");
                        String st = text(node, "status");
                        subscriptionService.updateStatusByStripeSubId(subId, mapStripeStatus(st));
                    }
                }
                case "customer.subscription.deleted" -> {
                    if (des.getObject().isPresent()) {
                        Subscription sub = (Subscription) des.getObject().get();
                        subscriptionService.updateStatusByStripeSubId(sub.getId(), SubscriptionStatus.CANCELED);
                    } else {
                        JsonNode node = OM.readTree(des.getRawJson());
                        String subId = text(node, "id");
                        subscriptionService.updateStatusByStripeSubId(subId, SubscriptionStatus.CANCELED);
                    }
                }

                // OPTIONAL: invoice signals (safe via raw JSON; OK to keep if you want
                // immediate past_due/active flips)
                case "invoice.payment_succeeded" -> {
                    String subId = extractSubscriptionIdFromRaw(des.getRawJson());
                    if (subId != null) {
                        subscriptionService.updateStatusByStripeSubId(subId, SubscriptionStatus.ACTIVE);
                    } else {
                        log.info("invoice.payment_succeeded without subscription id; skipping");
                    }
                }
                case "invoice.payment_failed" -> {
                    String subId = extractSubscriptionIdFromRaw(des.getRawJson());
                    if (subId != null) {
                        subscriptionService.updateStatusByStripeSubId(subId, SubscriptionStatus.PAST_DUE);
                    } else {
                        log.info("invoice.payment_failed without subscription id; skipping");
                    }
                }

                default -> {
                    // no-op: we only act on events we understand
                    log.debug("No handler for event type={}", type);
                }
            }
        } catch (Exception ex) {
            log.error("Failed handling Stripe event id={}, type={}", eventId, type, ex);
            try {
                stripeEventRepository.updateStatus(eventId, "FAILED");
            } catch (Exception ignore) {
            }
            return ResponseEntity.internalServerError().body("error");
        }

        try {
            stripeEventRepository.updateStatus(eventId, "COMPLETED");
        } catch (Exception ignore) {
        }
        return ResponseEntity.ok("ok");
    }

    private static String text(JsonNode node, String field) {
        if (node == null)
            return null;
        JsonNode n = node.path(field);
        return (!n.isMissingNode() && !n.isNull()) ? n.asText() : null;
    }

    /**
     * Extract "subscription" string from invoice/raw event data.object JSON, or
     * null if absent.
     */
    private static String extractSubscriptionIdFromRaw(String rawJson) {
        try {
            if (rawJson == null)
                return null;
            JsonNode node = OM.readTree(rawJson);
            JsonNode subNode = node.path("subscription");
            if (!subNode.isMissingNode() && !subNode.isNull())
                return subNode.asText();
        } catch (Exception ignored) {
        }
        return null;
    }

    private static SubscriptionStatus mapStripeStatus(String stripeStatus) {
        if (stripeStatus == null)
            return SubscriptionStatus.INCOMPLETE;
        return switch (stripeStatus) {
            case "active", "trialing" -> SubscriptionStatus.ACTIVE;
            case "past_due", "unpaid" -> SubscriptionStatus.PAST_DUE;
            case "canceled", "incomplete_expired" -> SubscriptionStatus.CANCELED;
            default -> SubscriptionStatus.INCOMPLETE;
        };
    }
}
