package com.mindease.mindfulness.repository;

import com.mindease.mindfulness.model.MindfulnessSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface MindfulnessSessionRepository extends JpaRepository<MindfulnessSession, UUID> {

    List<MindfulnessSession> findByTypeOrderByDurationAsc(String type);

    List<MindfulnessSession> findByCategoryOrderByDurationAsc(String category);

    List<MindfulnessSession> findByDifficultyLevelOrderByDurationAsc(String difficultyLevel);

    @Query("SELECT DISTINCT m.category FROM MindfulnessSession m")
    List<String> findDistinctCategories();

    List<MindfulnessSession> findAllByOrderByDurationAsc();

    // TEMPORARILY DISABLED - Hibernate 6.6 compatibility issue
    // TODO: Fix or re-implement in service layer
    // @Query(value = "SELECT * FROM mindfulness_sessions m WHERE " +
    // "(CAST(:categorySet AS text) = '[]' OR m.category IN :categorySet) AND " +
    // "(CAST(:typeSet AS text) = '[]' OR m.type IN :typeSet) AND " +
    // "(CAST(:excludedIds AS text) = '[]' OR m.id NOT IN :excludedIds) " +
    // "ORDER BY m.duration ASC", nativeQuery = true)
    // Page<MindfulnessSession> findSimilarSessions(
    // @Param("categorySet") Set<String> categorySet,
    // @Param("typeSet") Set<String> typeSet,
    // @Param("excludedIds") Set<UUID> excludedIds,
    // Pageable pageable);
}
