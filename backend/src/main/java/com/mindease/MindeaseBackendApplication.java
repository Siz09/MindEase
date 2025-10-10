package com.mindease;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling  // Add this annotation to enable scheduled tasks
@EnableAsync       // Enable asynchronous processing
public class MindeaseBackendApplication {

  public static void main(String[] args) {
    SpringApplication.run(MindeaseBackendApplication.class, args);
  }
}
