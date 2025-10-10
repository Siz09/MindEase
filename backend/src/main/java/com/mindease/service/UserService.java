package com.mindease.service;

import com.mindease.model.User;
import com.mindease.model.Role;
import com.mindease.model.UserActivity;
import com.mindease.repository.UserRepository;
import com.mindease.repository.UserActivityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class UserService {

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
   */
  @Transactional
  public void trackUserActivity(User user) {
    Optional<UserActivity> existing = userActivityRepository.findByUser(user);
    UserActivity activity = existing.orElse(new UserActivity(user, LocalDateTime.now()));
    activity.setLastActiveAt(LocalDateTime.now());
    userActivityRepository.save(activity);
  }

  /**
   * Track user activity by user ID
   */
  @Transactional
  public void trackUserActivity(UUID userId) {
    User user = userRepository.findById(userId)
      .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
    trackUserActivity(user);
  }

}
