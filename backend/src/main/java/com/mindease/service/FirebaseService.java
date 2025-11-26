// backend/src/main/java/com/mindease/service/FirebaseService.java
package com.mindease.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class FirebaseService {

  private static final Logger logger = LoggerFactory.getLogger(FirebaseService.class);

  /**
   * Verify Firebase ID token and check expiration
   * @param idToken Firebase ID token
   * @return Decoded and verified Firebase token
   * @throws FirebaseAuthException if token is invalid or expired
   */
  public FirebaseToken verifyToken(String idToken) throws FirebaseAuthException {
    FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);

    // Check if token is expired
    long expirationTimeSeconds = decodedToken.getClaims().get("exp") != null
        ? ((Number) decodedToken.getClaims().get("exp")).longValue()
        : 0;
    long currentTimeSeconds = System.currentTimeMillis() / 1000;

    if (expirationTimeSeconds > 0 && currentTimeSeconds > expirationTimeSeconds) {
      logger.warn("Firebase token has expired. Expiration: {}, Current: {}",
          expirationTimeSeconds, currentTimeSeconds);
      throw new FirebaseAuthException("EXPIRED_TOKEN", "Firebase token has expired");
    }

    logger.debug("Firebase token verified successfully for UID: {}", decodedToken.getUid());
    return decodedToken;
  }

  /**
   * Get UID from Firebase token after verification
   * @param idToken Firebase ID token
   * @return Firebase UID
   * @throws FirebaseAuthException if token is invalid or expired
   */
  public String getUidFromToken(String idToken) throws FirebaseAuthException {
    FirebaseToken decodedToken = verifyToken(idToken);
    return decodedToken.getUid();
  }
}
