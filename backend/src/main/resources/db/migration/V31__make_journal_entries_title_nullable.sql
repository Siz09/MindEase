-- Make journal_entries.title column nullable to allow entries without titles
-- This migration is idempotent and safe to run even if column is already nullable
ALTER TABLE journal_entries
ALTER COLUMN title DROP NOT NULL;
