package com.mindease.model;

/**
 * Enum representing moderation actions taken on AI responses.
 * Used to track when content has been filtered, modified, or blocked.
 */
public enum ModerationAction {
    /**
     * No moderation needed - content passed all checks
     */
    NONE,

    /**
     * Content flagged but allowed through with warning
     */
    FLAGGED,

    /**
     * Content partially modified to remove unsafe elements
     */
    MODIFIED,

    /**
     * Content blocked entirely and replaced with safe fallback
     */
    BLOCKED
}
