package com.mindease.dto;

import java.time.LocalDate;

public record AiUsagePoint(LocalDate day, long calls) {}

