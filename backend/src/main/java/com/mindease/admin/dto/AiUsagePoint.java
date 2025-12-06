package com.mindease.admin.dto;

import java.time.LocalDate;

public record AiUsagePoint(LocalDate day, long calls) {}

