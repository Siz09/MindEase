package com.mindease;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling // Add this annotation to enable scheduled tasks
@EnableAsync // Enable asynchronous processing
public class MindeaseBackendApplication {

  public static void main(String[] args) {
        // Load .env so Spring can see values like OPENAI_API_KEY.
        // Support both running from repo root and from backend/ directory.
        try {
            io.github.cdimascio.dotenv.Dotenv dotenv = io.github.cdimascio.dotenv.Dotenv.configure()
                    .directory("./") // when run from monorepo root
                    .ignoreIfMissing()
                    .load();

            // If nothing was loaded from ./backend, try current working directory
            if (dotenv.entries().isEmpty()) {
                System.out.println("DEBUG: .env not found in ./backend or empty. Trying current directory...");
                dotenv = io.github.cdimascio.dotenv.Dotenv.configure()
                        .ignoreIfMissing()
                        .load();
            }

            if (dotenv.entries().isEmpty()) {
                System.out.println("DEBUG: No .env entries loaded.");
            } else {
                System.out.println("DEBUG: Loaded .env with " + dotenv.entries().size() + " entries.");
                if (dotenv.get("OPENAI_API_KEY") != null) {
                    System.out.println("DEBUG: OPENAI_API_KEY found in loaded .env");
                } else {
                    System.out.println("DEBUG: OPENAI_API_KEY NOT found in loaded .env");
                }
                dotenv.entries().forEach(entry -> System.setProperty(entry.getKey(), entry.getValue()));
            }
        } catch (Exception e) {
            System.out.println("DEBUG: Error loading .env: " + e.getMessage());
        }

        SpringApplication.run(MindeaseBackendApplication.class, args);
    }
}
