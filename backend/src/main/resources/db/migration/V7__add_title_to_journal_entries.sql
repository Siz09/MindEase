-- Add optional title column to journal entries for better context
ALTER TABLE journal_entries
    ADD COLUMN IF NOT EXISTS title VARCHAR(150);
