package com.mindease.shared.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.HashMap;
import java.util.Map;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/health")
@Tag(name = "Health Check", description = "Application health monitoring endpoints")
public class HealthController implements HealthIndicator {

  @Autowired
  private DataSource dataSource;

  @Override
  public Health health() {
    try (Connection connection = dataSource.getConnection()) {
      if (connection.isValid(1)) {
        return Health.up()
          .withDetail("database", "Available")
          .withDetail("status", "Healthy")
          .build();
      }
    } catch (Exception e) {
      return Health.down()
        .withDetail("database", "Unavailable")
        .withDetail("error", e.getMessage())
        .build();
    }
    return Health.down().build();
  }

  @Operation(summary = "Get application health status", description = "Check if the application and database are healthy")
  @GetMapping("/status")
  public ResponseEntity<Map<String, Object>> getHealthStatus() {
    Map<String, Object> status = new HashMap<>();
    Health health = health();

    status.put("status", health.getStatus().getCode());
    status.put("timestamp", System.currentTimeMillis());
    status.put("details", health.getDetails());

    if (health.getStatus().getCode().equals("UP")) {
      return ResponseEntity.ok(status);
    } else {
      return ResponseEntity.status(503).body(status);
    }
  }
}

