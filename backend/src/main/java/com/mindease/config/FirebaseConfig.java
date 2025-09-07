// backend/src/main/java/com/mindease/config/FirebaseConfig.java
package com.mindease.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import javax.annotation.PostConstruct;
import java.io.IOException;

@Configuration
public class FirebaseConfig {

  @PostConstruct
  public void initialize() {
    try {
      FirebaseOptions options = FirebaseOptions.builder()
        .setCredentials(GoogleCredentials.fromStream(
          new ClassPathResource("firebase-service-account.json").getInputStream()))
        .build();

      if (FirebaseApp.getApps().isEmpty()) {
        FirebaseApp.initializeApp(options);
        System.out.println("Firebase Admin SDK initialized successfully");
      }
    } catch (IOException e) {
      System.err.println("Failed to initialize Firebase Admin SDK: " + e.getMessage());
      e.printStackTrace();
    }
  }
}
