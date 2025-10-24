package com.mindease.dto;

import java.time.LocalDate;

public record ActiveUsersPoint(LocalDate day, long activeUsers) {}

