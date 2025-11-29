-- Link journal entries to mood entries
-- This allows journal entries to reference a structured mood entry instead of just prepending emoji to content

-- Add foreign key column to link journal entries to mood entries
ALTER TABLE journal_entries
ADD COLUMN mood_entry_id UUID REFERENCES mood_entries(id) ON DELETE SET NULL;

-- Add index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_journal_entries_mood_entry_id ON journal_entries(mood_entry_id);

-- Analyze table to update statistics for query planner
ANALYZE journal_entries;
