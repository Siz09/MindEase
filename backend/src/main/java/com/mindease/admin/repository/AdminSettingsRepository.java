package com.mindease.admin.repository;

import com.mindease.admin.model.AdminSettings;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AdminSettingsRepository extends JpaRepository<AdminSettings, UUID> {
    Optional<AdminSettings> findByFeatureName(String featureName);

    Optional<AdminSettings> findTopByOrderByIdAsc();
}

