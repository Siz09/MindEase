package com.mindease.mood.dto;

import java.time.LocalDate;

public record MoodCorrelationPoint(
        LocalDate day,
        Double avgMood,
        long chatCount
) {
}
