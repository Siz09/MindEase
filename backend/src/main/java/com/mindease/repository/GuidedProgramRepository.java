package com.mindease.repository;

import com.mindease.model.GuidedProgram;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface GuidedProgramRepository extends JpaRepository<GuidedProgram, UUID> {
    List<GuidedProgram> findByActiveTrueOrderByDisplayOrderAsc();
}
