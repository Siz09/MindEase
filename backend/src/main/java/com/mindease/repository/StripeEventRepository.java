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

  @Modifying
  @Transactional
  @Query(value = "INSERT INTO stripe_events (id, status, created_at) VALUES (:id, :status, NOW()) ON CONFLICT (id) DO NOTHING", nativeQuery = true)
  int insertIfNotExists(@Param("id") String id, @Param("status") String status);

  @Query(value = "SELECT status FROM stripe_events WHERE id = :id", nativeQuery = true)
  String getStatus(@Param("id") String id);

  @Modifying
  @Transactional
  @Query(value = "UPDATE stripe_events SET status = :status, updated_at = NOW() WHERE id = :id", nativeQuery = true)
  int updateStatus(@Param("id") String id, @Param("status") String status);
}
