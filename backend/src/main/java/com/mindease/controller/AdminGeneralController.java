package com.mindease.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "Admin General")
public class AdminGeneralController {

  @GetMapping("/search")
  @PreAuthorize("hasRole('ADMIN')")
  @Operation(summary = "Global search", description = "Placeholder endpoint for global admin search")
  public ResponseEntity<Map<String, Object>> search(@org.springframework.web.bind.annotation.RequestParam("q") String q) {
    return ResponseEntity.ok(Map.of(
      "query", q,
      "results", java.util.List.of()
    ));
  }

  @PostMapping("/export")
  @PreAuthorize("hasRole('ADMIN')")
  @Operation(summary = "Export data", description = "Placeholder endpoint for data export")
  public ResponseEntity<Map<String, String>> export(@RequestBody(required = false) Map<String, Object> body) {
    return ResponseEntity.ok(Map.of(
      "status", "not_implemented",
      "message", "Exporting data will be implemented in a future version."
    ));
  }
}

