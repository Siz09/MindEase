package com.mindease.aop;

import java.util.regex.Pattern;

public final class SafeLog {
    private SafeLog() {}

    private static final Pattern SENSITIVE_PATTERN = Pattern.compile(
        "\\b(suicid(e|al)|self[\\s-]?harm|kill(ing)?\\s+(my)?self|end(ing)?\\s+(my)?life|want\\s+to\\s+die)\\b",
        Pattern.CASE_INSENSITIVE
    );

    public static String redact(String s) {
        if (s == null) return null;
        if (SENSITIVE_PATTERN.matcher(s).find()) {
            return "[REDACTED]";
        }
        String sanitized = s.replaceAll("[\\r\\n\\t]", " ");
        return sanitized.length() > 200 ? sanitized.substring(0, 200) + "..." : sanitized;
    }
}
