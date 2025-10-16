package com.mindease.repository;

import com.mindease.model.StripeEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StripeEventRepository extends JpaRepository<StripeEvent, String> {
  boolean existsById(String id);
}

