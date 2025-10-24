package com.mindease.dto;

import java.time.LocalDate;

public record MoodCorrelationPoint(LocalDate day, Double avgMood, long chatCount) {}

