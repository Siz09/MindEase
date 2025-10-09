-- V7__create_notification_and_activity_tables.sql
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  is_sent BOOLEAN DEFAULT FALSE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notification_user_created ON notifications(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notification_is_sent ON notifications(is_sent);

CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_active_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_useractivity_user ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_useractivity_last_active ON user_activity(last_active_at);
