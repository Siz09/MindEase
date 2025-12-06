package com.mindease.mindfulness.repository;

import com.mindease.mindfulness.model.GuidedProgram;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface GuidedProgramRepository extends JpaRepository<GuidedProgram, UUID> {
    List<GuidedProgram> findByActiveTrueOrderByDisplayOrderAsc();
}
