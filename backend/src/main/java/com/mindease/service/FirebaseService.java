// backend/src/main/java/com/mindease/service/FirebaseService.java
package com.mindease.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import org.springframework.stereotype.Service;

@Service
public class FirebaseService {

  public FirebaseToken verifyToken(String idToken) throws FirebaseAuthException {
    return FirebaseAuth.getInstance().verifyIdToken(idToken);
  }

  public String getUidFromToken(String idToken) throws FirebaseAuthException {
    FirebaseToken decodedToken = verifyToken(idToken);
    return decodedToken.getUid();
  }
}
