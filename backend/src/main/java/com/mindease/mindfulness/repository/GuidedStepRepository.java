package com.mindease.mindfulness.repository;

import com.mindease.mindfulness.model.GuidedStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface GuidedStepRepository extends JpaRepository<GuidedStep, UUID> {
    List<GuidedStep> findByProgramIdOrderByStepNumberAsc(UUID programId);
}
