CREATE UNIQUE INDEX IF NOT EXISTS uk_crisis_flag_chat_keyword
  ON crisis_flags (chat_id, keyword_detected);

