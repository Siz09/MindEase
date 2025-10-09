package com.mindease.repository;

import com.mindease.model.UserActivity;
import com.mindease.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserActivityRepository extends JpaRepository<UserActivity, UUID> {

  Optional<UserActivity> findByUser(User user);

  List<UserActivity> findByLastActiveAtBefore(LocalDateTime cutoff);

}
