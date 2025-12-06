package com.mindease.admin.dto;

import java.time.LocalDate;

public record ActiveUsersPoint(LocalDate day, long activeUsers) {}

