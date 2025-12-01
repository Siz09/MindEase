package com.mindease.controller;

import com.google.firebase.auth.FirebaseAuthException;
import com.mindease.exception.PremiumRequiredException;
import com.mindease.exception.UnauthenticatedException;
import com.mindease.exception.AccessDeniedException;
import com.mindease.exception.SessionNotFoundException;
import com.mindease.exception.ProgramNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
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

    @ExceptionHandler(UnauthenticatedException.class)
    public ResponseEntity<Map<String, Object>> handleUnauthenticated(UnauthenticatedException ex) {
        logger.warn("Unauthenticated access attempted: {}", ex.getMessage());

        Map<String, Object> body = new HashMap<>();
        body.put("status", "error");
        body.put("errorCode", "unauthenticated");
        body.put("message", ex.getMessage());
        body.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
    }

    @ExceptionHandler(FirebaseAuthException.class)
    public ResponseEntity<Map<String, Object>> handleFirebaseAuthException(FirebaseAuthException ex) {
        logger.warn("Authentication failed: Invalid Firebase token", ex);
        Map<String, Object> response = new HashMap<>();
        response.put("status", "error");
        response.put("timestamp", System.currentTimeMillis());
        response.put("message", "Authentication failed: Invalid Firebase token");
        return ResponseEntity.status(401).body(response);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgumentException(IllegalArgumentException ex) {
        logger.warn("Invalid request: {}", ex.getMessage());
        Map<String, Object> response = new HashMap<>();
        response.put("status", "error");
        response.put("timestamp", System.currentTimeMillis());
        response.put("message", "Invalid request");
        return ResponseEntity.status(400).body(response);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDeniedException(AccessDeniedException ex) {
        logger.warn("Access denied: {}", ex.getMessage());
        Map<String, Object> response = new HashMap<>();
        response.put("status", "error");
        response.put("timestamp", System.currentTimeMillis());
        response.put("message", "Access denied");
        return ResponseEntity.status(403).body(response);
    }

    @ExceptionHandler({SessionNotFoundException.class, ProgramNotFoundException.class})
    public ResponseEntity<Map<String, Object>> handleResourceNotFoundException(Exception ex) {
        logger.warn("Resource not found: {}", ex.getMessage());
        Map<String, Object> response = new HashMap<>();
        response.put("status", "error");
        response.put("timestamp", System.currentTimeMillis());
        response.put("message", "Resource not found");
        return ResponseEntity.status(404).body(response);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        logger.error("Unexpected runtime exception: ", ex);
        Map<String, Object> response = new HashMap<>();
        response.put("status", "error");
        response.put("timestamp", System.currentTimeMillis());
        response.put("message", "An unexpected error occurred");
        return ResponseEntity.status(500).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleAllExceptions(Exception ex) {
        logger.error("Global exception handler: ", ex);
        Map<String, Object> response = new HashMap<>();
        response.put("status", "error");
        response.put("timestamp", System.currentTimeMillis());
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
        response.put("timestamp", System.currentTimeMillis());

        return ResponseEntity.status(400).body(response);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        // Sanitize parameter value to prevent exposure of sensitive data
        String sanitizedValue = sanitizeParameterValue(ex.getValue());
        String parameterName = ex.getName();
        logger.warn("Parameter type mismatch: {} = {}", parameterName, sanitizedValue, ex);

        Map<String, Object> response = new HashMap<>();
        response.put("status", "error");
        response.put("errorCode", "invalid_parameter");
        response.put("message", String.format("Invalid value for parameter '%s'", parameterName));
        response.put("parameter", parameterName);
        // Only include sanitized value for debugging, truncated to prevent data leakage
        if (sanitizedValue != null) {
            response.put("value", sanitizedValue);
        }
        response.put("timestamp", System.currentTimeMillis());

        return ResponseEntity.status(400).body(response);
    }

    /**
     * Sanitizes parameter values to prevent accidental exposure of sensitive data.
     * Truncates long values and redacts potentially sensitive patterns.
     *
     * @param value The parameter value to sanitize
     * @return Sanitized value safe for inclusion in error responses
     */
    private String sanitizeParameterValue(Object value) {
        if (value == null) {
            return null;
        }

        String valueStr = String.valueOf(value);

        // Truncate long values to prevent excessive data exposure
        int maxLength = 50;
        if (valueStr.length() > maxLength) {
            return valueStr.substring(0, maxLength) + "... (truncated)";
        }

        // Check for potentially sensitive patterns and redact
        String lowerValue = valueStr.toLowerCase();
        if (lowerValue.contains("token") ||
                lowerValue.contains("password") ||
                lowerValue.contains("secret") ||
                lowerValue.contains("key") ||
                lowerValue.matches(".*[a-zA-Z0-9]{20,}.*")) { // Long alphanumeric strings (potential tokens)
            return "[REDACTED]";
        }

        return valueStr;
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<Map<String, Object>> handleMissingParameter(MissingServletRequestParameterException ex) {
        logger.warn("Missing required parameter: {}", ex.getParameterName(), ex);

        Map<String, Object> response = new HashMap<>();
        response.put("status", "error");
        response.put("errorCode", "missing_parameter");
        response.put("message", String.format("Missing required parameter: %s", ex.getParameterName()));
        response.put("parameter", ex.getParameterName());
        response.put("timestamp", System.currentTimeMillis());

        return ResponseEntity.status(400).body(response);
    }
}
