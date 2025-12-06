package com.mindease.controller;

import com.mindease.subscription.repository.StripeEventRepository;
import com.mindease.subscription.service.SubscriptionService;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class StripeWebhookControllerTest {

  @Test
  void invalidSignature_returns400() {
    SubscriptionService service = mock(SubscriptionService.class);
    StripeEventRepository repo = mock(StripeEventRepository.class);

    StripeWebhookController ctrl = new StripeWebhookController(service, repo);
    // Inject secret via reflection to avoid @PostConstruct validation failures
    org.springframework.test.util.ReflectionTestUtils.setField(ctrl, "webhookSecret", "whsec_test");

    // Supply garbage signature header
    ResponseEntity<String> res = ctrl.handle("{}", "t=123,v1=garbage");

    assertThat(res.getStatusCodeValue()).isEqualTo(400);
    assertThat(res.getBody()).contains("invalid signature");
  }
}
