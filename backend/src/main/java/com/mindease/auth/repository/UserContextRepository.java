package com.mindease.auth.repository;

import com.mindease.auth.model.User;
import com.mindease.auth.model.UserContext;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserContextRepository extends JpaRepository<UserContext, Long> {
    List<UserContext> findByUser(User user);

    Optional<UserContext> findByUserAndKey(User user, String key);

    /**
     * Bulk delete for memory-efficient cleanup operations.
     *
     * NOTE: Transaction management should be handled at the service layer.
     * The calling service method must be annotated with @Transactional.
     */
    @Modifying
    void deleteByUser(User user);
}
