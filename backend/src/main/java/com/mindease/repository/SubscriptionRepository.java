package com.mindease.repository;

import com.mindease.model.Subscription;
import com.mindease.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {
  List<Subscription> findByUser(User user);
  List<Subscription> findByUser_Id(UUID userId);
  Optional<Subscription> findByStripeSubscriptionId(String stripeSubscriptionId);
}
