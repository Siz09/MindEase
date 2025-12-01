package com.mindease.exception;

public class SessionNotFoundException extends RuntimeException {
  public SessionNotFoundException(String message) {
    super(message);
  }
}
