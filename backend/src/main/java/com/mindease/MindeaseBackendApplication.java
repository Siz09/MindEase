package com.mindease;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling  // Add this annotation to enable scheduled tasks
public class MindeaseBackendApplication {

  public static void main(String[] args) {
    SpringApplication.run(MindeaseBackendApplication.class, args);
  }
}
