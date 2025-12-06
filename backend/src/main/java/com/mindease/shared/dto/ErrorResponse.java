package com.mindease.shared.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Error response")
public class ErrorResponse {

    @Schema(description = "Response status", example = "error")
    private String status;

    @Schema(description = "Error message", example = "Invalid credentials")
    private String message;

    @Schema(description = "Error code for programmatic handling", example = "INVALID_CREDENTIALS")
    private String code;

    public ErrorResponse() {
        this.status = "error";
    }

    public ErrorResponse(String message) {
        this.status = "error";
        this.message = message;
    }

    public ErrorResponse(String message, String code) {
        this.status = "error";
        this.message = message;
        this.code = code;
    }

    public static ErrorResponse of(String message) {
        return new ErrorResponse(message);
    }

    public static ErrorResponse of(String message, String code) {
        return new ErrorResponse(message, code);
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }
}

