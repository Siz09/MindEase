package com.mindease.shared.exception;

public class PremiumRequiredException extends RuntimeException {
    public PremiumRequiredException() {
        super("Premium subscription required");
    }
}
