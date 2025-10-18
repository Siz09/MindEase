package com.mindease.controller;

import com.google.firebase.auth.FirebaseAuthException;
import com.mindease.exception.PremiumRequiredException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@ControllerAdvice
public class GlobalExceptionHandler {

  private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  @ExceptionHandler(PremiumRequiredException.class)
  public ResponseEntity<Map<String, Object>> handlePremiumRequired(PremiumRequiredException ex) {
    logger.warn("Premium feature access attempted: {}", ex.getMessage());

    Map<String, Object> body = new HashMap<>();
    body.put("status", "error");
    body.put("errorCode", "premium_required");
    body.put("message", ex.getMessage());
    body.put("timestamp", System.currentTimeMillis());
    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<Map<String, Object>> handleAllExceptions(Exception ex) {
    logger.error("Global exception handler: ", ex);

    Map<String, Object> response = new HashMap<>();
    response.put("status", "error");
    response.put("timestamp", System.currentTimeMillis());

    if (ex instanceof FirebaseAuthException) {
      response.put("message", "Authentication failed: Invalid Firebase token");
      return ResponseEntity.status(401).body(response);
    }

    if (ex instanceof RuntimeException) {
      response.put("message", ex.getMessage());
      return ResponseEntity.status(400).body(response);
    }

    response.put("message", "An unexpected error occurred");
    return ResponseEntity.status(500).body(response);
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
    Map<String, Object> response = new HashMap<>();
    response.put("status", "error");

    List<String> errors = ex.getBindingResult()
      .getFieldErrors()
      .stream()
      .map(error -> error.getField() + ": " + error.getDefaultMessage())
      .collect(Collectors.toList());

    response.put("message", "Validation failed");
    response.put("errors", errors);

    return ResponseEntity.status(400).body(response);
  }
}
