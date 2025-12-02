package com.mindease.dto.local;

import java.util.List;
import java.util.Map;

public class LocalAIChatRequest {
    private String user_id;
    private String message;
    private Map<String, Object> profile;
    private List<ConversationMessage> history;

    public LocalAIChatRequest() {}

    public LocalAIChatRequest(String user_id, String message, Map<String, Object> profile, List<ConversationMessage> history) {
        this.user_id = user_id;
        this.message = message;
        this.profile = profile;
        this.history = history;
    }

    public static LocalAIChatRequestBuilder builder() {
        return new LocalAIChatRequestBuilder();
    }

    public String getUser_id() {
        return user_id;
    }

    public void setUser_id(String user_id) {
        this.user_id = user_id;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Map<String, Object> getProfile() {
        return profile;
    }

    public void setProfile(Map<String, Object> profile) {
        this.profile = profile;
    }

    public List<ConversationMessage> getHistory() {
        return history;
    }

    public void setHistory(List<ConversationMessage> history) {
        this.history = history;
    }

    public static class ConversationMessage {
        private String role;
        private String content;

        public ConversationMessage() {}

        public ConversationMessage(String role, String content) {
            this.role = role;
            this.content = content;
        }

        public static ConversationMessageBuilder builder() {
            return new ConversationMessageBuilder();
        }

        public String getRole() {
            return role;
        }

        public void setRole(String role) {
            this.role = role;
        }

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }
    }

    public static class LocalAIChatRequestBuilder {
        private String user_id;
        private String message;
        private Map<String, Object> profile;
        private List<ConversationMessage> history;

        public LocalAIChatRequestBuilder user_id(String user_id) {
            this.user_id = user_id;
            return this;
        }

        public LocalAIChatRequestBuilder message(String message) {
            this.message = message;
            return this;
        }

        public LocalAIChatRequestBuilder profile(Map<String, Object> profile) {
            this.profile = profile;
            return this;
        }

        public LocalAIChatRequestBuilder history(List<ConversationMessage> history) {
            this.history = history;
            return this;
        }

        public LocalAIChatRequest build() {
            return new LocalAIChatRequest(user_id, message, profile, history);
        }
    }

    public static class ConversationMessageBuilder {
        private String role;
        private String content;

        public ConversationMessageBuilder role(String role) {
            this.role = role;
            return this;
        }

        public ConversationMessageBuilder content(String content) {
            this.content = content;
            return this;
        }

        public ConversationMessage build() {
            return new ConversationMessage(role, content);
        }
    }
}
