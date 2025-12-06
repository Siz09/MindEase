package com.mindease.shared.exception;

public class ProgramNotFoundException extends RuntimeException {
    public ProgramNotFoundException(String message) {
        super(message);
    }
}
