package com.mindease.controller;

import com.mindease.model.SubscriptionStatus;
import com.mindease.model.StripeEvent;
import com.mindease.repository.StripeEventRepository;
import com.mindease.service.SubscriptionService;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.Invoice;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
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

  private final SubscriptionService subscriptionService;
  private final StripeEventRepository stripeEventRepository;

  @Value("${stripe.webhook.secret:}")
  private String webhookSecret;

  public StripeWebhookController(SubscriptionService subscriptionService,
                                 StripeEventRepository stripeEventRepository) {
    this.subscriptionService = subscriptionService;
    this.stripeEventRepository = stripeEventRepository;
  }

  @PostMapping("/webhook")
  public ResponseEntity<String> handle(@RequestBody String payload,
                                       @RequestHeader("Stripe-Signature") String sigHeader) {
    final Event event;
    try {
      event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
    } catch (SignatureVerificationException e) {
      log.warn("Invalid Stripe signature: {}", e.getMessage());
      return ResponseEntity.badRequest().body("invalid signature");
    }

    final String eventId = event.getId();
    if (stripeEventRepository.existsById(eventId)) {
      log.info("Ignoring already-processed Stripe event id={}", eventId);
      return ResponseEntity.ok("duplicate");
    }

    String type = event.getType();
    log.info("Stripe webhook received: id={}, type={}", eventId, type);

    EventDataObjectDeserializer dataObjectDeserializer = event.getDataObjectDeserializer();

    try {
      switch (type) {
        case "checkout.session.completed" -> {
          var maybeObj = dataObjectDeserializer.getObject();
          if (maybeObj.isPresent()) {
            Session session = (Session) maybeObj.get();
            String stripeSubId = session.getSubscription() != null ? session.getSubscription().toString() : null;
            subscriptionService.handleCheckoutCompleted(session.getId(), stripeSubId);
          }
        }
        case "invoice.payment_succeeded" -> {
          var maybeObj = dataObjectDeserializer.getObject();
          if (maybeObj.isPresent()) {
            Invoice invoice = (Invoice) maybeObj.get();
            subscriptionService.updateStatusByStripeSubId(
                invoice.getSubscription(), SubscriptionStatus.ACTIVE);
          }
        }
        case "invoice.payment_failed" -> {
          var maybeObj = dataObjectDeserializer.getObject();
          if (maybeObj.isPresent()) {
            Invoice invoice = (Invoice) maybeObj.get();
            subscriptionService.updateStatusByStripeSubId(
                invoice.getSubscription(), SubscriptionStatus.PAST_DUE);
          }
        }
        case "customer.subscription.updated" -> {
          var maybeObj = dataObjectDeserializer.getObject();
          if (maybeObj.isPresent()) {
            com.stripe.model.Subscription sub = (com.stripe.model.Subscription) maybeObj.get();
            SubscriptionStatus mapped = mapStripeStatus(sub.getStatus());
            subscriptionService.updateStatusByStripeSubId(sub.getId(), mapped);
          }
        }
        case "customer.subscription.deleted" -> {
          var maybeObj = dataObjectDeserializer.getObject();
          if (maybeObj.isPresent()) {
            com.stripe.model.Subscription sub = (com.stripe.model.Subscription) maybeObj.get();
            subscriptionService.updateStatusByStripeSubId(sub.getId(), SubscriptionStatus.CANCELED);
          }
        }
        default -> {
        }
      }
    } catch (Exception ex) {
      log.error("Failed handling Stripe event id={}, type={}", eventId, type, ex);
      return ResponseEntity.internalServerError().body("error");
    }

    stripeEventRepository.save(new StripeEvent(eventId));
    return ResponseEntity.ok("ok");
  }

  private SubscriptionStatus mapStripeStatus(String stripeStatus) {
    if (stripeStatus == null) return SubscriptionStatus.INCOMPLETE;
    return switch (stripeStatus) {
      case "active", "trialing" -> SubscriptionStatus.ACTIVE;
      case "past_due", "unpaid" -> SubscriptionStatus.PAST_DUE;
      case "canceled", "incomplete_expired" -> SubscriptionStatus.CANCELED;
      default -> SubscriptionStatus.INCOMPLETE;
    };
  }
}
