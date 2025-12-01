package com.mindease.repository;

import com.mindease.model.MindfulnessSessionActivity;
import com.mindease.model.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MindfulnessSessionActivityRepository extends JpaRepository<MindfulnessSessionActivity, UUID> {

    @EntityGraph(attributePaths = {"session"})
    List<MindfulnessSessionActivity> findByUserOrderByCompletedAtDesc(User user);

    @EntityGraph(attributePaths = {"session"})
    List<MindfulnessSessionActivity> findByUserAndCompletedAtBetween(
            User user, LocalDateTime start, LocalDateTime end);

    List<MindfulnessSessionActivity> findBySessionIdOrderByCompletedAtDesc(UUID sessionId);

    Optional<MindfulnessSessionActivity> findFirstByUserOrderByCompletedAtDesc(User user);

    @Query("SELECT COUNT(DISTINCT DATE(a.completedAt)) FROM MindfulnessSessionActivity a WHERE a.user = :user AND a.completedAt >= :since")
    Long countDistinctDaysByUserSince(@Param("user") User user, @Param("since") LocalDateTime since);

    @Query("SELECT SUM(a.durationMinutes) FROM MindfulnessSessionActivity a WHERE a.user = :user AND a.completedAt >= :since")
    Long sumDurationMinutesByUserSince(@Param("user") User user, @Param("since") LocalDateTime since);

    @Query("SELECT a.session.id, COUNT(a) FROM MindfulnessSessionActivity a WHERE a.user = :user GROUP BY a.session.id ORDER BY COUNT(a) DESC")
    List<Object[]> findFavoriteSessionsByUser(@Param("user") User user);

    @Query("SELECT COUNT(a) > 0 FROM MindfulnessSessionActivity a WHERE a.user = :user AND a.completedAt >= :start AND a.completedAt <= :end")
    boolean hasActivityInDateRange(@Param("user") User user, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
