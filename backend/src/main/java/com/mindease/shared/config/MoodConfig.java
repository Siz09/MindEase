package com.mindease.shared.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Configuration class for mood-related settings.
 * Binds properties from application.yml for centralized configuration
 * management.
 */
@Component
@ConfigurationProperties(prefix = "mood")
public class MoodConfig {

    private Tracking tracking = new Tracking();
    private Prediction prediction = new Prediction();

    public Tracking getTracking() {
        return tracking;
    }

    public void setTracking(Tracking tracking) {
        this.tracking = tracking;
    }

    public Prediction getPrediction() {
        return prediction;
    }

    public void setPrediction(Prediction prediction) {
        this.prediction = prediction;
    }

    public static class Tracking {
        private List<String> checkinTypes;

        public List<String> getCheckinTypes() {
            return checkinTypes;
        }

        public void setCheckinTypes(List<String> checkinTypes) {
            this.checkinTypes = checkinTypes;
        }
    }

    public static class Prediction {
        private Map<String, String> insights;
        private Double trendThreshold;

        public Map<String, String> getInsights() {
            return insights;
        }

        public void setInsights(Map<String, String> insights) {
            this.insights = insights;
        }

        public Double getTrendThreshold() {
            return trendThreshold;
        }

        public void setTrendThreshold(Double trendThreshold) {
            this.trendThreshold = trendThreshold;
        }
    }
}
