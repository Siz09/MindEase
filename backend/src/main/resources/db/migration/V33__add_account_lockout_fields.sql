-- Add account lockout fields to user_activity table
ALTER TABLE user_activity
ADD COLUMN failed_login_attempts INTEGER NOT NULL DEFAULT 0,
ADD COLUMN locked_until TIMESTAMP;

-- Add index for locked_until for efficient lockout checks
CREATE INDEX idx_user_activity_locked_until ON user_activity(locked_until);

-- Add comment
COMMENT ON COLUMN user_activity.failed_login_attempts IS 'Number of consecutive failed login attempts';
COMMENT ON COLUMN user_activity.locked_until IS 'Timestamp until which the account is locked due to failed login attempts';
