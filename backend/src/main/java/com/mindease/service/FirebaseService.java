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
   * Verify Firebase ID token
   * @param idToken Firebase ID token
   * @return Decoded and verified Firebase token
   * @throws FirebaseAuthException if token is invalid or expired
   * Note: Firebase SDK's verifyIdToken() already validates expiration
   */
  public FirebaseToken verifyToken(String idToken) throws FirebaseAuthException {
    FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
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
