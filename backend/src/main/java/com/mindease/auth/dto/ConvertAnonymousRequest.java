package com.mindease.auth.dto;

public class ConvertAnonymousRequest {

    private String email;
    private String password;
    private String firebaseToken;

    public ConvertAnonymousRequest() {
    }

    public ConvertAnonymousRequest(String email, String password, String firebaseToken) {
        this.email = email;
        this.password = password;
        this.firebaseToken = firebaseToken;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getFirebaseToken() {
        return firebaseToken;
    }

    public void setFirebaseToken(String firebaseToken) {
        this.firebaseToken = firebaseToken;
    }
}

