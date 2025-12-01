package com.mindease.repository;

import com.mindease.model.MindfulnessSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Repository
public interface MindfulnessSessionRepository extends JpaRepository<MindfulnessSession, UUID> {

  List<MindfulnessSession> findByTypeOrderByDurationAsc(String type);

  List<MindfulnessSession> findByCategoryOrderByDurationAsc(String category);

  List<MindfulnessSession> findByDifficultyLevelOrderByDurationAsc(String difficultyLevel);

  @Query("SELECT DISTINCT m.category FROM MindfulnessSession m")
  List<String> findDistinctCategories();

  List<MindfulnessSession> findAllByOrderByDurationAsc();

  @Query("SELECT m FROM MindfulnessSession m WHERE " +
         "(SIZE(:categorySet) = 0 OR m.category IN :categorySet) AND " +
         "(SIZE(:typeSet) = 0 OR m.type IN :typeSet) AND " +
         "(SIZE(:excludedIds) = 0 OR m.id NOT IN :excludedIds) " +
         "ORDER BY m.duration ASC")
  Page<MindfulnessSession> findSimilarSessions(
      @Param("categorySet") Set<String> categorySet,
      @Param("typeSet") Set<String> typeSet,
      @Param("excludedIds") Set<UUID> excludedIds,
      Pageable pageable);
}
