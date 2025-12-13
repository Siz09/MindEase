package com.mindease.shared.service;

import com.mindease.admin.dto.ActiveUsersPoint;
import com.mindease.admin.dto.AiUsagePoint;
import com.mindease.mood.dto.MoodCorrelationPoint;
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

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Client for calling Python Analytics service.
 * Replaces AnalyticsRepository and MoodService analytics methods.
 */
@Service
public class PythonAnalyticsServiceClient {

    private static final Logger log = LoggerFactory.getLogger(PythonAnalyticsServiceClient.class);

    private final RestTemplate restTemplate;
    private final String pythonServiceUrl;

    public PythonAnalyticsServiceClient(
            RestTemplate restTemplate,
            @Value("${python.analytics.service.url:http://localhost:8002}") String pythonServiceUrl) {
        this.restTemplate = restTemplate;
        this.pythonServiceUrl = pythonServiceUrl;
        log.info("PythonAnalyticsServiceClient initialized with URL: {}", pythonServiceUrl);
    }

    /**
     * Get daily active users.
     * Replaces AnalyticsRepository.dailyActiveUsers()
     */
    public List<ActiveUsersPoint> dailyActiveUsers(OffsetDateTime from, OffsetDateTime to) {
        try {
            String url = pythonServiceUrl + "/analytics/daily-active-users";

            Map<String, Object> request = new HashMap<>();
            request.put("from_date", from);
            request.put("to_date", to);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            ResponseEntity<List<ActiveUsersPoint>> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity,
                    new ParameterizedTypeReference<List<ActiveUsersPoint>>() {
                    });

            return response.getBody() != null ? response.getBody() : List.of();

        } catch (RestClientException e) {
            log.error("Failed to call Python analytics service for daily active users: {}", e.getMessage(), e);
            throw new RuntimeException("Python analytics service unavailable: " + e.getMessage(), e);
        }
    }

    /**
     * Get daily AI usage.
     * Replaces AnalyticsRepository.dailyAiUsage()
     */
    public List<AiUsagePoint> dailyAiUsage(OffsetDateTime from, OffsetDateTime to) {
        try {
            String url = pythonServiceUrl + "/analytics/ai-usage";

            Map<String, Object> request = new HashMap<>();
            request.put("from_date", from);
            request.put("to_date", to);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            ResponseEntity<List<AiUsagePoint>> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity,
                    new ParameterizedTypeReference<List<AiUsagePoint>>() {
                    });

            return response.getBody() != null ? response.getBody() : List.of();

        } catch (RestClientException e) {
            log.error("Failed to call Python analytics service for AI usage: {}", e.getMessage(), e);
            throw new RuntimeException("Python analytics service unavailable: " + e.getMessage(), e);
        }
    }

    /**
     * Get mood correlation data.
     * Replaces AnalyticsRepository.moodCorrelation()
     */
    public List<MoodCorrelationPoint> moodCorrelation(OffsetDateTime from, OffsetDateTime to) {
        try {
            String url = pythonServiceUrl + "/analytics/mood-correlation";

            Map<String, Object> request = new HashMap<>();
            request.put("from_date", from);
            request.put("to_date", to);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            ResponseEntity<List<MoodCorrelationPoint>> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity,
                    new ParameterizedTypeReference<List<MoodCorrelationPoint>>() {
                    });

            return response.getBody() != null ? response.getBody() : List.of();

        } catch (RestClientException e) {
            log.error("Failed to call Python analytics service for mood correlation: {}", e.getMessage(), e);
            throw new RuntimeException("Python analytics service unavailable: " + e.getMessage(), e);
        }
    }

    /**
     * Count users created between dates.
     * Replaces AnalyticsRepository.countUsersCreatedBetween()
     */
    public long countUsersCreatedBetween(OffsetDateTime from, OffsetDateTime to) {
        try {
            String url = pythonServiceUrl + "/analytics/user-growth";

            Map<String, Object> request = new HashMap<>();
            request.put("from_date", from);
            request.put("to_date", to);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity,
                    new ParameterizedTypeReference<Map<String, Object>>() {
                    });

            Map<String, Object> body = response.getBody();
            if (body != null && body.containsKey("count")) {
                Object count = body.get("count");
                if (count instanceof Number) {
                    return ((Number) count).longValue();
                }
            }

            return 0L;

        } catch (RestClientException e) {
            log.error("Failed to call Python analytics service for user growth: {}", e.getMessage(), e);
            return 0L; // Return 0 on error
        }
    }

    /**
     * Get distinct active users.
     * Replaces AnalyticsRepository.distinctActiveUsers()
     */
    public long distinctActiveUsers(OffsetDateTime from, OffsetDateTime to) {
        try {
            String url = pythonServiceUrl + "/analytics/distinct-active-users";

            Map<String, Object> request = new HashMap<>();
            request.put("from_date", from);
            request.put("to_date", to);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity,
                    new ParameterizedTypeReference<Map<String, Object>>() {
                    });

            Map<String, Object> body = response.getBody();
            if (body != null && body.containsKey("count")) {
                Object count = body.get("count");
                if (count instanceof Number) {
                    return ((Number) count).longValue();
                }
            }

            return 0L;

        } catch (RestClientException e) {
            log.error("Failed to call Python analytics service for distinct active users: {}", e.getMessage(), e);
            return 0L; // Return 0 on error
        }
    }

    /**
     * Predict mood trend.
     * Replaces MoodService.predictMood()
     */
    public Map<String, Object> predictMood(UUID userId, int days) {
        try {
            String url = pythonServiceUrl + "/mood/predict";

            Map<String, Object> request = new HashMap<>();
            request.put("user_id", userId.toString());
            request.put("days", days);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity,
                    new ParameterizedTypeReference<Map<String, Object>>() {
                    });

            return response.getBody() != null ? response.getBody() : Map.of();

        } catch (RestClientException e) {
            log.error("Failed to call Python analytics service for mood prediction: {}", e.getMessage(), e);
            // Return default response on error
            return Map.of(
                    "prediction", null,
                    "trend", "insufficient_data",
                    "insight", "Unable to predict mood at this time.");
        }
    }

    /**
     * Get mood trend.
     * Replaces MoodService.getUnifiedMoodTrend()
     */
    @SuppressWarnings("unchecked")
    public Map<String, Double> getMoodTrend(UUID userId, int days) {
        try {
            String url = pythonServiceUrl + "/mood/trend";

            Map<String, Object> request = new HashMap<>();
            request.put("user_id", userId.toString());
            request.put("days", days);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity,
                    new ParameterizedTypeReference<Map<String, Object>>() {
                    });

            Map<String, Object> body = response.getBody();
            if (body != null && body.containsKey("trend")) {
                Object trendObj = body.get("trend");
                if (trendObj instanceof Map) {
                    Map<String, Object> trendMap = (Map<String, Object>) trendObj;
                    Map<String, Double> result = new HashMap<>();
                    for (Map.Entry<String, Object> entry : trendMap.entrySet()) {
                        if (entry.getValue() instanceof Number) {
                            result.put(entry.getKey(), ((Number) entry.getValue()).doubleValue());
                        }
                    }
                    return result;
                }
            }

            return Map.of();

        } catch (RestClientException e) {
            log.error("Failed to call Python analytics service for mood trend: {}", e.getMessage(), e);
            return Map.of();
        }
    }

    /**
     * Analyze chat impact on mood.
     * Replaces MoodService.analyzeChatImpact()
     */
    public Map<String, Object> analyzeChatImpact(UUID userId, int days) {
        try {
            String url = pythonServiceUrl + "/mood/analyze-impact";

            Map<String, Object> request = new HashMap<>();
            request.put("user_id", userId.toString());
            request.put("days", days);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity,
                    new ParameterizedTypeReference<Map<String, Object>>() {
                    });

            return response.getBody() != null ? response.getBody() : Map.of();

        } catch (RestClientException e) {
            log.error("Failed to call Python analytics service for chat impact: {}", e.getMessage(), e);
            return Map.of(
                    "sessionsWithBothCheckins", 0,
                    "sessionsImproved", 0,
                    "averageImprovement", 0.0,
                    "improvementRate", 0.0);
        }
    }
}
