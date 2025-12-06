package com.mindease.chat.model.enums;

/**
 * Enum representing the AI provider selection strategy
 */
public enum SelectionStrategy {
    USER_PREFERENCE("USER_PREFERENCE"),
    AUTO("AUTO"),
    ROUND_ROBIN("ROUND_ROBIN");

    private final String value;

    SelectionStrategy(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    /**
     * Converts a String value to SelectionStrategy enum
     * 
     * @param value the string value
     * @return the corresponding SelectionStrategy, defaults to USER_PREFERENCE if
     *         invalid
     */
    public static SelectionStrategy fromString(String value) {
        if (value == null) {
            return USER_PREFERENCE;
        }
        for (SelectionStrategy strategy : SelectionStrategy.values()) {
            if (strategy.value.equalsIgnoreCase(value)) {
                return strategy;
            }
        }
        return USER_PREFERENCE;
    }
}
