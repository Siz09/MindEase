-- Create password_reset_requests table for tracking password reset requests
-- This table is used for security monitoring and rate limiting

CREATE TABLE password_reset_requests (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),  -- IPv6 max length is 45 characters
    user_agent VARCHAR(500),
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX idx_password_reset_email ON password_reset_requests(email);
CREATE INDEX idx_password_reset_ip_address ON password_reset_requests(ip_address);
CREATE INDEX idx_password_reset_requested_at ON password_reset_requests(requested_at);

-- Add comments for documentation
COMMENT ON TABLE password_reset_requests IS 'Tracks password reset requests for security monitoring and rate limiting';
COMMENT ON COLUMN password_reset_requests.email IS 'Email address for which password reset was requested';
COMMENT ON COLUMN password_reset_requests.requested_at IS 'Timestamp when the reset was requested';
COMMENT ON COLUMN password_reset_requests.ip_address IS 'IP address of the requester';
COMMENT ON COLUMN password_reset_requests.user_agent IS 'User agent string of the requester';
COMMENT ON COLUMN password_reset_requests.completed IS 'Whether the password reset was completed';
COMMENT ON COLUMN password_reset_requests.completed_at IS 'Timestamp when the reset was completed';
