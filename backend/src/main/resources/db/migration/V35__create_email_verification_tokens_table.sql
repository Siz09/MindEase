-- Create email_verification_tokens table for persistent token storage
CREATE TABLE email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(500) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    used_at TIMESTAMP,

    CONSTRAINT chk_expires_after_created CHECK (expires_at > created_at)
);

-- Create indexes for performance
CREATE INDEX idx_verification_token ON email_verification_tokens(token);
CREATE INDEX idx_verification_email ON email_verification_tokens(email);
CREATE INDEX idx_verification_expires_at ON email_verification_tokens(expires_at);

-- Add comment
COMMENT ON TABLE email_verification_tokens IS 'Stores email verification tokens with expiration and usage tracking';
