package com.mindease.aop;

public final class SafeLog {
    private SafeLog() {}

    public static String redact(String s) {
        if (s == null) return null;
        String lower = s.toLowerCase();
        if (lower.contains("suicide") || lower.contains("self-harm") || lower.contains("self harm")) {
            return "[REDACTED]";
        }
        return s.length() > 200 ? s.substring(0, 200) + "..." : s;
        
    }
}

