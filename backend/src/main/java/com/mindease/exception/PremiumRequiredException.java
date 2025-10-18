package com.mindease.exception;

public class PremiumRequiredException extends RuntimeException {
  public PremiumRequiredException() {
    super("Premium subscription required");
  }
}

