package com.mindease.auth.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;

public class QuietHoursRequest {

  @NotNull
  private LocalTime quietHoursStart;

  @NotNull
  private LocalTime quietHoursEnd;

  public LocalTime getQuietHoursStart() {
    return quietHoursStart;
  }

  public void setQuietHoursStart(LocalTime quietHoursStart) {
    this.quietHoursStart = quietHoursStart;
  }

  public LocalTime getQuietHoursEnd() {
    return quietHoursEnd;
  }

  public void setQuietHoursEnd(LocalTime quietHoursEnd) {
    this.quietHoursEnd = quietHoursEnd;
  }
}

