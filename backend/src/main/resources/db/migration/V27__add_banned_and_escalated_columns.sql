-- Add banned, banned_at, and banned_by columns to users table
-- Add escalated column to crisis_flags table

-- Add banned column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'banned'
  ) THEN
    -- Add column as nullable first with default
    ALTER TABLE users
      ADD COLUMN banned BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
END$$;

-- Add banned_at column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'banned_at'
  ) THEN
    ALTER TABLE users
      ADD COLUMN banned_at TIMESTAMPTZ NULL;
  END IF;
END$$;

-- Add banned_by column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'banned_by'
  ) THEN
    ALTER TABLE users
      ADD COLUMN banned_by UUID NULL;
  END IF;
END$$;

-- Add escalated column to crisis_flags table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'crisis_flags' AND column_name = 'escalated'
  ) THEN
    -- Add column as nullable first with default
    ALTER TABLE crisis_flags
      ADD COLUMN escalated BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
END$$;
