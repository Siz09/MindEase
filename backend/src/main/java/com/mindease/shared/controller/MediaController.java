package com.mindease.shared.controller;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/media")
public class MediaController {

  private final Path audioRoot = Paths.get("src/main/resources/static/audio");
  private final Path animationsRoot = Paths.get("src/main/resources/static/animations");

  @GetMapping("/audio/{filename}")
  public ResponseEntity<Resource> serveAudio(@PathVariable String filename) {
    try {
      Path file = audioRoot.resolve(filename);
      Resource resource = new UrlResource(file.toUri());

      if (resource.exists() && resource.isReadable()) {
        return ResponseEntity.ok()
          .contentType(MediaType.parseMediaType("audio/mpeg"))
          .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
          .body(resource);
      } else {
        return ResponseEntity.notFound().build();
      }
    } catch (Exception e) {
      return ResponseEntity.internalServerError().build();
    }
  }

  @GetMapping("/animations/{filename}")
  public ResponseEntity<Resource> serveAnimation(@PathVariable String filename) {
    try {
      Path file = animationsRoot.resolve(filename);
      Resource resource = new UrlResource(file.toUri());

      if (resource.exists() && resource.isReadable()) {
        return ResponseEntity.ok()
          .contentType(MediaType.APPLICATION_JSON)
          .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
          .body(resource);
      } else {
        return ResponseEntity.notFound().build();
      }
    } catch (Exception e) {
      return ResponseEntity.internalServerError().build();
    }
  }
}

