-- Ensure unique per (chat_id, keyword_detected) and add risk_score column

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uk_crisis_flag_chat_keyword'
  ) THEN
    ALTER TABLE crisis_flags
      ADD CONSTRAINT uk_crisis_flag_chat_keyword
      UNIQUE (chat_id, keyword_detected);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'crisis_flags' AND column_name = 'risk_score'
  ) THEN
    ALTER TABLE crisis_flags
      ADD COLUMN risk_score DOUBLE PRECISION NULL;
  END IF;
END$$;

