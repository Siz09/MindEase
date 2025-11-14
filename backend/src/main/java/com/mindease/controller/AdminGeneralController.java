package com.mindease.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "Admin General")
@Validated
public class AdminGeneralController {

  private static final Logger logger = LoggerFactory.getLogger(AdminGeneralController.class);

  @GetMapping("/search")
  @PreAuthorize("hasRole('ADMIN')")
  @Operation(summary = "Global search", description = "Placeholder endpoint for global admin search")
  public ResponseEntity<Map<String, Object>> search(
      @RequestParam("q") @NotBlank(message = "Query cannot be empty") @Size(max = 500, message = "Query too long") String q) {
    logger.info("Admin search performed with query: {}", q);
    return ResponseEntity.ok(Map.of(
      "query", q,
      "results", java.util.List.of()
    ));
  }

  @PostMapping("/export")
  @PreAuthorize("hasRole('ADMIN')")
  @Operation(
      summary = "Export data",
      description = "Placeholder endpoint for data export. Future implementation will accept export configuration in request body."
  )
  public ResponseEntity<Map<String, String>> export() {
    logger.info("Admin export endpoint accessed (not yet implemented)");
    return ResponseEntity.ok(Map.of(
      "status", "not_implemented",
      "message", "Exporting data will be implemented in a future version."
    ));
  }
}
