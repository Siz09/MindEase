package com.mindease.chat.dto.local;

import java.util.List;

public class LocalAIChatResponse {
    private String reply;
    private ResponseMeta meta;

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }

    public ResponseMeta getMeta() {
        return meta;
    }

    public void setMeta(ResponseMeta meta) {
        this.meta = meta;
    }

    public static class ResponseMeta {
        private String safety;
        private Double risk_score;
        private List<Citation> citations;
        private String model_used;

        public String getSafety() {
            return safety;
        }

        public void setSafety(String safety) {
            this.safety = safety;
        }

        public Double getRisk_score() {
            return risk_score;
        }

        public void setRisk_score(Double risk_score) {
            this.risk_score = risk_score;
        }

        public List<Citation> getCitations() {
            return citations;
        }

        public void setCitations(List<Citation> citations) {
            this.citations = citations;
        }

        public String getModel_used() {
            return model_used;
        }

        public void setModel_used(String model_used) {
            this.model_used = model_used;
        }
    }

    public static class Citation {
        private String title;
        private String source;
        private Double relevance;

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getSource() {
            return source;
        }

        public void setSource(String source) {
            this.source = source;
        }

        public Double getRelevance() {
            return relevance;
        }

        public void setRelevance(Double relevance) {
            this.relevance = relevance;
        }
    }
}

