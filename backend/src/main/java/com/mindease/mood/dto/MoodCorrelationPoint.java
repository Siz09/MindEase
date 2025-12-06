package com.mindease.mood.dto;

import java.time.LocalDate;

public record MoodCorrelationPoint(
        LocalDate day,
        double avgMood,
        long chatCount
) {
}

