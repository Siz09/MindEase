package com.mindease.shared.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
@ConfigurationProperties(prefix = "chat")
public class ChatConfig {
    private Openai openai = new Openai();
    private CrisisDetection crisisDetection = new CrisisDetection();
    private Limits limits = new Limits();

    public static class Openai {
        private String apiKey;
        private String model = "gpt-3.5-turbo";
        private Double temperature = 0.7;
        private Integer maxTokens = 500;

        // Getters and setters
        public String getApiKey() {
            return apiKey;
        }

        public void setApiKey(String apiKey) {
            this.apiKey = apiKey;
        }

        public String getModel() {
            return model;
        }

        public void setModel(String model) {
            this.model = model;
        }

        public Double getTemperature() {
            return temperature;
        }

        public void setTemperature(Double temperature) {
            this.temperature = temperature;
        }

        public Integer getMaxTokens() {
            return maxTokens;
        }

        public void setMaxTokens(Integer maxTokens) {
            this.maxTokens = maxTokens;
        }
    }

    public static class CrisisDetection {
        private List<String> crisisKeywords = List.of(
                "suicide", "kill myself", "want to die", "end it all",
                "harm myself", "self harm", "no reason to live",
                "depressed", "hopeless", "helpless");
        private Boolean enabled = true;

        // Getters and setters
        public List<String> getCrisisKeywords() {
            return crisisKeywords;
        }

        public void setCrisisKeywords(List<String> crisisKeywords) {
            this.crisisKeywords = crisisKeywords;
        }

        public Boolean getEnabled() {
            return enabled;
        }

        public void setEnabled(Boolean enabled) {
            this.enabled = enabled;
        }
    }

    public static class Limits {
        private Integer freeDailyMessageLimit = 20;

        public Integer getFreeDailyMessageLimit() {
            return freeDailyMessageLimit;
        }

        public void setFreeDailyMessageLimit(Integer freeDailyMessageLimit) {
            this.freeDailyMessageLimit = freeDailyMessageLimit;
        }
    }

    // Getters and setters
    public Openai getOpenai() {
        return openai;
    }

    public void setOpenai(Openai openai) {
        this.openai = openai;
    }

    public CrisisDetection getCrisisDetection() {
        return crisisDetection;
    }

    public void setCrisisDetection(CrisisDetection crisisDetection) {
        this.crisisDetection = crisisDetection;
    }

    public Limits getLimits() {
        return limits;
    }

    public void setLimits(Limits limits) {
        this.limits = limits;
    }
}
