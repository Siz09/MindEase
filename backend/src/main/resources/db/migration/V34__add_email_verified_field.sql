-- Add email_verified field to users table
ALTER TABLE users
ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Add index for email verification queries
CREATE INDEX idx_users_email_verified ON users(email_verified);

-- Add comment
COMMENT ON COLUMN users.email_verified IS 'Whether the user has verified their email address';

-- Set email_verified to true for existing users (grandfather them in)
UPDATE users SET email_verified = TRUE WHERE email IS NOT NULL;
