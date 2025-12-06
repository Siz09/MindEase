package com.mindease.mood.repository;

import com.mindease.auth.model.User;
import com.mindease.mood.model.MoodEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface MoodEntryRepository extends JpaRepository<MoodEntry, UUID> {

    List<MoodEntry> findByUserOrderByCreatedAtDesc(User user);

    Page<MoodEntry> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    List<MoodEntry> findByUserAndCreatedAtBetweenOrderByCreatedAtDesc(User user, LocalDateTime start,
                                                                      LocalDateTime end);

    List<MoodEntry> findByUserAndCreatedAtBetween(User user, LocalDateTime start, LocalDateTime end);

    @Query("SELECT COUNT(m) FROM MoodEntry m WHERE m.user = :user AND m.createdAt >= :startDate")
    long countByUserAndCreatedAtAfter(@Param("user") User user, @Param("startDate") LocalDateTime startDate);

    @Query("SELECT AVG(m.moodValue) FROM MoodEntry m WHERE m.user = :user AND m.createdAt >= :startDate")
    Double getAverageMoodByUserAndCreatedAtAfter(@Param("user") User user,
                                                 @Param("startDate") LocalDateTime startDate);

    @Modifying
    void deleteByUser(User user);

    List<MoodEntry> findByUserAndCreatedAtAfterOrderByCreatedAtAsc(User user, LocalDateTime date);
}

