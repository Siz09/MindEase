package com.mindease.service;

import com.mindease.model.User;
import com.mindease.model.Role;
import com.mindease.model.UserActivity;
import com.mindease.repository.UserRepository;
import com.mindease.repository.UserActivityRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import com.mindease.dto.QuietHoursRequest;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private UserActivityRepository userActivityRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    /**
     * Create a new user with hashed password
     */
    public User createUser(String email, String password, Role role, Boolean anonymousMode, String firebaseUid) {
        // Check if user already exists
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("User with email " + email + " already exists");
        }

        if (firebaseUid != null && userRepository.existsByFirebaseUid(firebaseUid)) {
            throw new RuntimeException("User with Firebase UID " + firebaseUid + " already exists");
        }

        // Hash the password
        String passwordHash = passwordEncoder.encode(password);

        // Create and save user
        User user = new User(email, passwordHash, role, anonymousMode, firebaseUid);
        return userRepository.save(user);
    }

    /**
     * Create a user without a password (for Firebase auth)
     */
    public User createUser(String email, Role role, Boolean anonymousMode, String firebaseUid) {
        // Check if user already exists
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("User with email " + email + " already exists");
        }

        if (firebaseUid != null && userRepository.existsByFirebaseUid(firebaseUid)) {
            throw new RuntimeException("User with Firebase UID " + firebaseUid + " already exists");
        }

        // Create and save user without password
        User user = new User(email, null, role, anonymousMode, firebaseUid);
        return userRepository.save(user);
    }

    /**
     * Find user by email
     */
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    /**
     * Find user by Firebase UID
     */
    public Optional<User> findByFirebaseUid(String firebaseUid) {
        return userRepository.findByFirebaseUid(firebaseUid);
    }

    /**
     * Find user by ID
     */
    public Optional<User> findById(UUID id) {
        return userRepository.findById(id);
    }

    /**
     * Update user information
     */
    public User updateUser(User user) {
        return userRepository.save(user);
    }

    /**
     * Verify a password against the stored hash
     */
    public boolean verifyPassword(String rawPassword, String hashedPassword) {
        return passwordEncoder.matches(rawPassword, hashedPassword);
    }

    /**
     * Hash a password
     */
    public String hashPassword(String rawPassword) {
        return passwordEncoder.encode(rawPassword);
    }

    /**
     * Update user password
     */
    public User updatePassword(UUID userId, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        return userRepository.save(user);
    }

    /**
     * Update user's quiet hours by email
     */
    @Transactional
    public User updateQuietHours(String email, QuietHoursRequest request) {
        if (email == null || request == null) {
            throw new IllegalArgumentException("Email and request must not be null");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setQuietHoursStart(request.getQuietHoursStart());
        user.setQuietHoursEnd(request.getQuietHoursEnd());
        return userRepository.save(user);
    }

    /**
     * Toggle anonymous mode for a user
     */
    public User toggleAnonymousMode(UUID userId, boolean anonymousMode) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        user.setAnonymousMode(anonymousMode);
        return userRepository.save(user);
    }

    /**
     * Track user activity - updates or creates UserActivity record
     * Includes null safety and race condition mitigation
     */
    @Transactional
    public void trackUserActivity(User user) {
        if (user == null) {
            throw new IllegalArgumentException("User cannot be null");
        }

        try {
            Optional<UserActivity> existing = userActivityRepository.findByUser(user);

            if (existing.isPresent()) {
                UserActivity ua = existing.get();
                ua.setLastActiveAt(LocalDateTime.now());
                userActivityRepository.save(ua);
            } else {
                // Create a new activity record
                UserActivity ua = new UserActivity(user, LocalDateTime.now());
                userActivityRepository.save(ua);
            }
        } catch (DataIntegrityViolationException ex) {
            // ✅ Handle potential race condition (unique constraint violation)
            logger.warn("Concurrent activity update detected for user {} — retrying", user.getEmail());
            Optional<UserActivity> existing = userActivityRepository.findByUser(user);
            existing.ifPresent(ua -> {
                ua.setLastActiveAt(LocalDateTime.now());
                userActivityRepository.save(ua);
            });
        } catch (Exception e) {
            logger.error("Failed to track activity for user: {}", user.getEmail(), e);
        }
    }

     /**
      * Track user activity by user ID
      */
     @Transactional
     public void trackUserActivity(UUID userId) {
         if (userId == null) {
             throw new IllegalArgumentException("User ID cannot be null");
         }

         User user = userRepository.findById(userId)
                 .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
         trackUserActivity(user);
     }

     /**
      * Asynchronously track user activity - fire-and-forget approach
      * This method will not block the calling thread and failures are logged but don't affect the response
      */
     @Async
     public void trackUserActivityAsync(User user) {
         try {
             trackUserActivity(user); // call existing synchronous method
         } catch (Exception e) {
             logger.warn("Failed to track activity asynchronously for user {}: {}", 
                     user != null ? user.getEmail() : "null", e.getMessage());
         }
     }

     /**
      * Asynchronously track user activity by user ID - fire-and-forget approach
      * This method will not block the calling thread and failures are logged but don't affect the response
      */
     @Async
     public void trackUserActivityAsync(UUID userId) {
         try {
             trackUserActivity(userId);
         } catch (Exception e) {
             logger.warn("Failed to track activity asynchronously for userId {}: {}", 
                     userId, e.getMessage());
         }
     }

}
