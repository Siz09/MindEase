package com.mindease.mindfulness.repository;

import com.mindease.mindfulness.model.GuidedSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface GuidedSessionRepository extends JpaRepository<GuidedSession, UUID> {
    List<GuidedSession> findByUserIdAndStatus(UUID userId, String status);

    List<GuidedSession> findByUserIdOrderByStartedAtDesc(UUID userId);
}
