-- Add version column to guided_sessions table for optimistic locking
ALTER TABLE guided_sessions
ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

-- Add comment
COMMENT ON COLUMN guided_sessions.version IS 'Version field for optimistic locking to prevent lost updates on concurrent modifications';
