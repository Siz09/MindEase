CREATE TABLE IF NOT EXISTS stripe_events (
  id VARCHAR(255) PRIMARY KEY,
  status VARCHAR(255) NOT NULL DEFAULT 'COMPLETED',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- Admin & Safety tables for tests (H2 in PostgreSQL mode)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  action_type VARCHAR(100) NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action_time
  ON audit_logs (user_id, action_type, created_at);

CREATE TABLE IF NOT EXISTS crisis_flags (
  id UUID PRIMARY KEY,
  chat_id UUID NOT NULL,
  user_id UUID NOT NULL,
  keyword_detected VARCHAR(200) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_crisis_flags_user_time
  ON crisis_flags (user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_crisis_flags_chat
  ON crisis_flags (chat_id);

CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY,
  feature_name VARCHAR(120) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_admin_settings_feature_name UNIQUE (feature_name)
);
