package com.mindease.auth.service;

import com.mindease.auth.model.Role;
import com.mindease.auth.model.User;
import com.mindease.auth.model.UserActivity;
import com.mindease.auth.repository.UserRepository;
import com.mindease.auth.repository.UserActivityRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import com.mindease.auth.dto.QuietHoursRequest;
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

    @Value("${account.lockout.max-attempts:5}")
    private int maxFailedAttempts;

    @Value("${account.lockout.duration-minutes:30}")
    private int lockoutDurationMinutes;

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

        if (request.getQuietHoursStart() == null || request.getQuietHoursEnd() == null) {
            throw new IllegalArgumentException("Quiet hours start and end times must not be null");
        }
        if (request.getQuietHoursStart().equals(request.getQuietHoursEnd())) {
            throw new IllegalArgumentException("Quiet hours start and end times must not be equal");
        }

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
     * This method will not block the calling thread and failures are logged but
     * don't affect the response
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
     * This method will not block the calling thread and failures are logged but
     * don't affect the response
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

    /**
     * Check if user account is locked due to failed login attempts
     */
    @Transactional(readOnly = true)
    public boolean isAccountLocked(User user) {
        if (user == null) {
            throw new IllegalArgumentException("User cannot be null");
        }

        Optional<UserActivity> activityOpt = userActivityRepository.findByUser(user);
        if (activityOpt.isEmpty()) {
            return false;
        }

        UserActivity activity = activityOpt.get();
        return activity.isLocked();
    }

    /**
     * Increment failed login attempts and lock account if threshold is reached
     */
    @Transactional
    public void recordFailedLoginAttempt(User user) {
        if (user == null) {
            throw new IllegalArgumentException("User cannot be null");
        }

        try {
            Optional<UserActivity> activityOpt = userActivityRepository.findByUser(user);
            UserActivity activity;

            if (activityOpt.isPresent()) {
                activity = activityOpt.get();
            } else {
                activity = new UserActivity(user, LocalDateTime.now());
            }

            activity.incrementFailedAttempts();

            // Lock account if max attempts reached
            if (activity.getFailedLoginAttempts() >= maxFailedAttempts) {
                activity.setLockedUntil(LocalDateTime.now().plusMinutes(lockoutDurationMinutes));
                logger.warn("Account locked for user {} due to {} failed login attempts. Locked until: {}",
                        user.getEmail(), activity.getFailedLoginAttempts(), activity.getLockedUntil());
            } else {
                logger.info("Failed login attempt {} of {} for user {}",
                        activity.getFailedLoginAttempts(), maxFailedAttempts, user.getEmail());
            }

            userActivityRepository.save(activity);
        } catch (Exception e) {
            logger.error("Failed to record failed login attempt for user: {}", user.getEmail(), e);
        }
    }

    /**
     * Reset failed login attempts after successful login
     */
    @Transactional
    public void resetFailedLoginAttempts(User user) {
        if (user == null) {
            throw new IllegalArgumentException("User cannot be null");
        }

        try {
            Optional<UserActivity> activityOpt = userActivityRepository.findByUser(user);
            if (activityOpt.isPresent()) {
                UserActivity activity = activityOpt.get();
                if (activity.getFailedLoginAttempts() > 0 || activity.getLockedUntil() != null) {
                    activity.resetFailedAttempts();
                    userActivityRepository.save(activity);
                    logger.debug("Reset failed login attempts for user: {}", user.getEmail());
                }
            }
        } catch (Exception e) {
            logger.error("Failed to reset failed login attempts for user: {}", user.getEmail(), e);
        }
    }

}
