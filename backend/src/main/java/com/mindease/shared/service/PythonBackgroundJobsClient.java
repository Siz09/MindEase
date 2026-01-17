package com.mindease.shared.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

import java.util.HashMap;
import java.util.Map;

/**
 * Client for calling Python Background Jobs service.
 * Replaces scheduled tasks in Java services.
 */
@Service
public class PythonBackgroundJobsClient {

    private static final Logger log = LoggerFactory.getLogger(PythonBackgroundJobsClient.class);

    private final RestTemplate restTemplate;
    private final String pythonServiceUrl;
    private final String apiKey;

    public PythonBackgroundJobsClient(
            RestTemplate restTemplate,
            @Value("${python.background-jobs.service.url:http://localhost:8003}") String pythonServiceUrl,
            @Value("${python.background-jobs.service.api-key:}") String apiKey) {
        this.restTemplate = restTemplate;
        this.pythonServiceUrl = pythonServiceUrl;
        this.apiKey = apiKey;
        log.info("PythonBackgroundJobsClient initialized with URL: {}", pythonServiceUrl);
    }

    /**
     * Trigger retention cleanup job.
     * Replaces RetentionPolicyService.cleanUpOldData()
     */
    public Map<String, Object> triggerRetentionCleanup() {
        try {
            String url = pythonServiceUrl + "/jobs/retention/trigger";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (apiKey != null && !apiKey.isEmpty()) {
                headers.set("x-api-key", apiKey);
            }
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity,
                    new ParameterizedTypeReference<Map<String, Object>>() {});

            return response.getBody() != null ? response.getBody() : Map.of("success", false, "message", "No response");

        } catch (RestClientException e) {
            log.error("Failed to call Python background jobs service for retention cleanup: {}", e.getMessage(), e);
            return Map.of("success", false, "message", "Python service unavailable: " + e.getMessage());
        }
    }

    /**
     * Trigger inactivity detection job.
     * Replaces InactivityDetectionService.detectInactiveUsers()
     */
    public Map<String, Object> triggerInactivityDetection() {
        try {
            String url = pythonServiceUrl + "/jobs/inactivity/trigger";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (apiKey != null && !apiKey.isEmpty()) {
                headers.set("x-api-key", apiKey);
            }
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity,
                    new ParameterizedTypeReference<Map<String, Object>>() {});

            return response.getBody() != null ? response.getBody() : Map.of("success", false, "message", "No response");

        } catch (RestClientException e) {
            log.error("Failed to call Python background jobs service for inactivity detection: {}", e.getMessage(), e);
            return Map.of("success", false, "message", "Python service unavailable: " + e.getMessage());
        }
    }

    /**
     * Trigger auto mood entry creation job.
     * Replaces AutoMoodService.createAutoMoodEntries()
     */
    public Map<String, Object> triggerAutoMoodCreation() {
        try {
            String url = pythonServiceUrl + "/jobs/auto-mood/trigger";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (apiKey != null && !apiKey.isEmpty()) {
                headers.set("x-api-key", apiKey);
            }
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity,
                    new ParameterizedTypeReference<Map<String, Object>>() {});

            return response.getBody() != null ? response.getBody() : Map.of("success", false, "message", "No response");

        } catch (RestClientException e) {
            log.error("Failed to call Python background jobs service for auto mood creation: {}", e.getMessage(), e);
            return Map.of("success", false, "message", "Python service unavailable: " + e.getMessage());
        }
    }
}
