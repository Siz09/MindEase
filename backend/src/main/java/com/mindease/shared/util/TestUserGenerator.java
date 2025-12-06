package com.mindease.shared.util;

import com.mindease.auth.model.Role;
import com.mindease.auth.model.User;
import com.mindease.auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@Profile("dev") // Only run in development mode
public class TestUserGenerator implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    public void run(String... args) throws Exception {
        String testEmail = "testuser@example.com";
        Optional<User> existingUser = userRepository.findByEmail(testEmail);

        User user;
        if (existingUser.isPresent()) {
            user = existingUser.get();
        } else {
            user = new User();
            user.setEmail(testEmail);
            user.setRole(Role.USER);
            user.setAnonymousMode(false);
            user.setFirebaseUid("test-firebase-uid-123");
            user = userRepository.save(user);
        }

        String token = jwtUtil.generateToken(user);
        System.out.println("=== DEVELOPMENT MODE ===");
        System.out.println("Test User Email: " + testEmail);
        System.out.println("JWT Token: " + token);
        System.out.println("Use this token for testing in Postman");
        System.out.println("=========================");
    }
}
