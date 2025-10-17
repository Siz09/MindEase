package com.mindease.repository;

import com.mindease.model.StripeEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface StripeEventRepository extends JpaRepository<StripeEvent, String> {
  boolean existsById(String id);

  @Modifying
  @Transactional
  @Query(value = "INSERT INTO stripe_events (id, created_at) VALUES (:id, NOW()) ON CONFLICT DO NOTHING", nativeQuery = true)
  int insertIgnore(@Param("id") String id);
}
