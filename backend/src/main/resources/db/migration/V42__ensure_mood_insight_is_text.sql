-- Ensure mood_insight column is TEXT type to support longer AI-generated insights
-- This migration fixes any instances where the column might have been created as VARCHAR(255)

ALTER TABLE journal_entries
ALTER COLUMN mood_insight TYPE TEXT;
