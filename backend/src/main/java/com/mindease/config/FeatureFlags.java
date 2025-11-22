package com.mindease.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * Feature flags configuration for gradual rollout of new features.
 *
 * Features can be enabled/disabled via application properties or environment variables.
 * This allows for safe deployment and easy rollback if issues are detected.
 */
@Configuration
public class FeatureFlags {

    @Value("${features.safety-pipeline.enabled:true}")
    private boolean safetyPipelineEnabled;

    @Value("${features.mood-tracking.enabled:true}")
    private boolean moodTrackingEnabled;

    @Value("${features.guided-programs.enabled:false}")
    private boolean guidedProgramsEnabled;

    @Value("${features.session-summaries.enabled:false}")
    private boolean sessionSummariesEnabled;

    @Value("${features.crisis-resources.enabled:true}")
    private boolean crisisResourcesEnabled;

    /**
     * Check if safety pipeline (risk classification and guardrails) is enabled.
     *
     * @return true if safety pipeline is enabled
     */
    public boolean isSafetyPipelineEnabled() {
        return safetyPipelineEnabled;
    }

    /**
     * Check if mood tracking features are enabled.
     *
     * @return true if mood tracking is enabled
     */
    public boolean isMoodTrackingEnabled() {
        return moodTrackingEnabled;
    }

    /**
     * Check if guided programs are enabled.
     *
     * @return true if guided programs are enabled
     */
    public boolean isGuidedProgramsEnabled() {
        return guidedProgramsEnabled;
    }

    /**
     * Check if AI-generated session summaries are enabled.
     *
     * @return true if session summaries are enabled
     */
    public boolean isSessionSummariesEnabled() {
        return sessionSummariesEnabled;
    }

    /**
     * Check if crisis resources display is enabled.
     *
     * @return true if crisis resources are enabled
     */
    public boolean isCrisisResourcesEnabled() {
        return crisisResourcesEnabled;
    }

    /**
     * Get a summary of all feature flags for debugging/monitoring.
     *
     * @return string representation of all feature flags
     */
    @Override
    public String toString() {
        return "FeatureFlags{" +
                "safetyPipeline=" + safetyPipelineEnabled +
                ", moodTracking=" + moodTrackingEnabled +
                ", guidedPrograms=" + guidedProgramsEnabled +
                ", sessionSummaries=" + sessionSummariesEnabled +
                ", crisisResources=" + crisisResourcesEnabled +
                '}';
    }
}
