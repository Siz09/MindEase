-- Add is_crisis_flagged column to messages table
ALTER TABLE messages ADD COLUMN is_crisis_flagged BOOLEAN DEFAULT FALSE;
