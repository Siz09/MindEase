package com.mindease.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class BasicApiIntegrationTest {

    @Autowired
    TestRestTemplate restTemplate;

    @Test
    void healthEndpointIsUp() {
        ResponseEntity<String> response = restTemplate.getForEntity("/api/health", String.class);
        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
    }

    @Test
    void unauthenticatedProtectedEndpointReturns401Or403() {
        ResponseEntity<String> response = restTemplate.getForEntity("/api/mood/history", String.class);
        assertThat(response.getStatusCode().value()).isIn(401, 403);
    }
}
