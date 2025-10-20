package com.mindease.repository;

import com.mindease.model.Subscription;
import com.mindease.model.User;
import com.mindease.model.SubscriptionStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {

  List<Subscription> findByUser(User user);

  List<Subscription> findByUser_Id(UUID userId);

  Optional<Subscription> findByStripeSubscriptionId(String stripeSubscriptionId);

  Optional<Subscription> findByCheckoutSessionId(String checkoutSessionId);

  Optional<Subscription> findByUserAndStatus(User user, SubscriptionStatus status);

  // Idempotency helpers
  boolean existsByUser_IdAndStatusIn(UUID userId, Collection<SubscriptionStatus> statuses);

  Optional<Subscription> findFirstByUser_IdAndStatusInOrderByCreatedAtDesc(
    UUID userId, Collection<SubscriptionStatus> statuses);

  Optional<Subscription> findByUser_IdAndStatus(UUID userId, SubscriptionStatus status);

  Optional<Subscription> findFirstByUser_IdOrderByCreatedAtDesc(UUID userId);

  // Pessimistic lock for webhook processing to avoid concurrent updates
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("SELECT s FROM Subscription s WHERE s.checkoutSessionId = :sessionId")
  Optional<Subscription> findByCheckoutSessionIdForUpdate(@Param("sessionId") String sessionId);

  // NEW: Pessimistic lock to serialize creation/reuse of INCOMPLETE sessions
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("SELECT s FROM Subscription s WHERE s.user.id = :userId AND s.status = :status")
  Optional<Subscription> findByUser_IdAndStatusForUpdate(
    @Param("userId") UUID userId, @Param("status") SubscriptionStatus status
  );
}
