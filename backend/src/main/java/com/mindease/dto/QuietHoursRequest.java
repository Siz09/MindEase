package com.mindease.dto;

import java.time.LocalTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.validation.constraints.NotNull;

public class QuietHoursRequest {

  @NotNull
  @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "HH:mm")
  private LocalTime quietHoursStart;

  @NotNull
  @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "HH:mm")
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


