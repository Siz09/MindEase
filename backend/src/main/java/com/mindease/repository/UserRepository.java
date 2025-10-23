// backend/src/main/java/com/mindease/repository/UserRepository.java
package com.mindease.repository;

import com.mindease.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;
import java.util.List;
import com.mindease.model.Role;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

  Optional<User> findByEmail(String email);

  Optional<User> findByFirebaseUid(String firebaseUid);

  boolean existsByEmail(String email);

  boolean existsByFirebaseUid(String firebaseUid);

  List<User> findByRole(Role role);
}
