package com.mindease.safety;

import org.springframework.stereotype.Component;

import java.util.Objects;
import java.util.regex.Pattern;

@Component
public class CrisisKeywordDetector {

    // Extend this with your Phase 3 keywords (kept small here as example).
    // We avoid capturing the raw sentence in logs to reduce PII exposure.
    private static final Pattern SENSITIVE = Pattern.compile(
        "\\b(suicid(e|al)|self[\\s-]?harm|kill(ing)?\\s+(my)?self|end(ing)?\\s+(my)?life|want\\s+to\\s+die)\\b",
        Pattern.CASE_INSENSITIVE
    );

    public String detectKeyword(String text) {
        if (text == null) return null;
        var m = SENSITIVE.matcher(text);
        if (m.find()) {
            // Return the normalized keyword label rather than raw user text
            // to minimize sensitive data exposure.
            return normalize(m.group());
        }
        return null;
    }

    private String normalize(String matched) {
        String s = Objects.requireNonNullElse(matched, "").toLowerCase().replaceAll("\\s+", "");
        if (s.contains("suicid")) return "suicide";
        if (s.contains("selfharm")) return "self-harm";
        if (s.contains("kill") && s.contains("self")) return "kill-self";
        if (s.contains("end") && s.contains("life")) return "end-life";
        if (s.contains("wanttodie")) return "want-to-die";
        return "crisis";
    }
}

