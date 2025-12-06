package com.mindease.crisis.model;

/**
 * Enum representing the risk level classification of a message.
 * Used by the safety classification system to determine appropriate response
 * and escalation.
 */
public enum RiskLevel {
    /**
     * No risk detected - normal conversation
     */
    NONE,

    /**
     * Low risk - mild distress, negative mood, but no immediate concerns
     */
    LOW,

    /**
     * Medium risk - moderate distress, mentions of self-harm thoughts without
     * intent
     */
    MEDIUM,

    /**
     * High risk - strong distress, suicidal ideation, self-harm intent
     */
    HIGH,

    /**
     * Critical risk - immediate danger, active crisis, requires urgent intervention
     */
    CRITICAL;

    /**
     * Utility method to check if the level is HIGH or CRITICAL.
     * This avoids relying on enum ordinal ordering.
     */
    public boolean isHighOrCritical() {
        return this == HIGH || this == CRITICAL;
    }
}
