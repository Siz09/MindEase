package com.mindease.repository;

import com.mindease.model.MoodEntry;
import com.mindease.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface MoodEntryRepository extends JpaRepository<MoodEntry, UUID> {
  List<MoodEntry> findByUserOrderByCreatedAtDesc(User user);
  Page<MoodEntry> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
  List<MoodEntry> findByUserAndCreatedAtBetweenOrderByCreatedAtDesc(User user, LocalDateTime start, LocalDateTime end);
  List<MoodEntry> findByUserAndCreatedAtBetween(User user, LocalDateTime start, LocalDateTime end);
  // We'll add more custom methods as needed in future days
}
