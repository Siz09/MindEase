-- Add is_read column to track in-app read status separately from email delivery
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill: if previously using is_sent for read semantics, seed is_read from is_sent
UPDATE notifications SET is_read = is_sent WHERE is_read = FALSE AND is_sent = TRUE;

-- Index to optimize unread queries
CREATE INDEX IF NOT EXISTS idx_notification_is_read ON notifications(is_read);

