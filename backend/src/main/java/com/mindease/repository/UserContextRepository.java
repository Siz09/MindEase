package com.mindease.repository;

import com.mindease.model.User;
import com.mindease.model.UserContext;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserContextRepository extends JpaRepository<UserContext, Long> {
    List<UserContext> findByUser(User user);

    Optional<UserContext> findByUserAndKey(User user, String key);

    void deleteByUser(User user);
}
