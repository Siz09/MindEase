-- V3: Update chat_sessions and mood_entries schema

-- Add a title column to chat_sessions (nullable so old rows don’t break)
ALTER TABLE chat_sessions
  ADD COLUMN IF NOT EXISTS title VARCHAR(255);

-- Add updated_at column if not already present
ALTER TABLE chat_sessions
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

-- Ensure updated_at index exists
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at
  ON chat_sessions(updated_at);

-- Extra indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id
  ON chat_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_mood_entries_user_id
  ON mood_entries(user_id);

CREATE INDEX IF NOT EXISTS idx_mood_entries_created_at
  ON mood_entries(created_at);
