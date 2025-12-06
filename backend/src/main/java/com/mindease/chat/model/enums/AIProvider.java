package com.mindease.chat.model.enums;

/**
 * Enum representing available AI providers for chat functionality.
 */
public enum AIProvider {
    /**
     * OpenAI cloud-based provider (GPT-4o-mini)
     */
    OPENAI,

    /**
     * Local MindEase AI service with ML risk model and RAG
     */
    LOCAL,

    /**
     * Automatic selection based on user profile and context
     */
    AUTO
}
