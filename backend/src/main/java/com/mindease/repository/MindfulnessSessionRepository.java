package com.mindease.repository;

import com.mindease.model.MindfulnessSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MindfulnessSessionRepository extends JpaRepository<MindfulnessSession, Long> {

  List<MindfulnessSession> findByTypeOrderByDurationAsc(String type);

  List<MindfulnessSession> findByCategoryOrderByDurationAsc(String category);

  List<MindfulnessSession> findByDifficultyLevelOrderByDurationAsc(String difficultyLevel);

  @Query("SELECT DISTINCT m.category FROM MindfulnessSession m")
  List<String> findDistinctCategories();

  List<MindfulnessSession> findAllByOrderByDurationAsc();
}
