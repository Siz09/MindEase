package com.mindease.repository;

import com.mindease.model.User;
import com.mindease.model.UserContext;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserContextRepository extends JpaRepository<UserContext, Long> {
    List<UserContext> findByUser(User user);

    Optional<UserContext> findByUserAndKey(User user, String key);

    @Transactional
    @Modifying
    void deleteByUser(User user);
}
