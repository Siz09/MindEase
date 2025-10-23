DO $$
BEGIN
  IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'uk_crisis_flag_chat_keyword'
  ) THEN
    -- If a unique index with the desired name already exists, reuse it for the constraint
    IF EXISTS (
        SELECT 1 FROM pg_class WHERE relname = 'uk_crisis_flag_chat_keyword'
    ) THEN
      ALTER TABLE crisis_flags
        ADD CONSTRAINT uk_crisis_flag_chat_keyword
        UNIQUE USING INDEX uk_crisis_flag_chat_keyword;
    ELSE
      ALTER TABLE crisis_flags
        ADD CONSTRAINT uk_crisis_flag_chat_keyword
        UNIQUE (chat_id, keyword_detected);
    END IF;
  END IF;
END$$;

