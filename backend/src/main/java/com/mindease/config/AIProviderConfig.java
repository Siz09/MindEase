package com.mindease.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
@ConfigurationProperties(prefix = "mindease.ai")
public class AIProviderConfig {

    private Map<String, ProviderSettings> providers = new HashMap<>();
    private String selectionStrategy = "USER_PREFERENCE";
    private AutoSelection autoSelection = new AutoSelection();

    public Map<String, ProviderSettings> getProviders() {
        return providers;
    }

    public void setProviders(Map<String, ProviderSettings> providers) {
        this.providers = providers;
    }

    public String getSelectionStrategy() {
        return selectionStrategy;
    }

    public void setSelectionStrategy(String selectionStrategy) {
        this.selectionStrategy = selectionStrategy;
    }

    public AutoSelection getAutoSelection() {
        return autoSelection;
    }

    public void setAutoSelection(AutoSelection autoSelection) {
        this.autoSelection = autoSelection;
    }

    public static class ProviderSettings {
        private boolean enabled = true;
        private int fallbackPriority = 1;
        private String url;
        private int timeout = 10000;

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }

        public int getFallbackPriority() {
            return fallbackPriority;
        }

        public void setFallbackPriority(int fallbackPriority) {
            this.fallbackPriority = fallbackPriority;
        }

        public String getUrl() {
            return url;
        }

        public void setUrl(String url) {
            this.url = url;
        }

        public int getTimeout() {
            return timeout;
        }

        public void setTimeout(int timeout) {
            this.timeout = timeout;
        }
    }

    public static class AutoSelection {
        private boolean preferLocalWhenProfileAvailable = true;
        private int loadBalancePercentage = 50;

        public boolean isPreferLocalWhenProfileAvailable() {
            return preferLocalWhenProfileAvailable;
        }

        public void setPreferLocalWhenProfileAvailable(boolean preferLocalWhenProfileAvailable) {
            this.preferLocalWhenProfileAvailable = preferLocalWhenProfileAvailable;
        }

        public int getLoadBalancePercentage() {
            return loadBalancePercentage;
        }

        public void setLoadBalancePercentage(int loadBalancePercentage) {
            this.loadBalancePercentage = loadBalancePercentage;
        }
    }
}
