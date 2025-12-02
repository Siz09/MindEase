-- Add AI provider preference column
ALTER TABLE users
ADD COLUMN preferred_ai_provider VARCHAR(20);

-- Add user profile fields for ML risk model
ALTER TABLE users
ADD COLUMN age INTEGER;

ALTER TABLE users
ADD COLUMN gender VARCHAR(50);

ALTER TABLE users
ADD COLUMN course VARCHAR(100);

ALTER TABLE users
ADD COLUMN year VARCHAR(20);

ALTER TABLE users
ADD COLUMN cgpa DOUBLE PRECISION;

ALTER TABLE users
ADD COLUMN marital_status VARCHAR(50);

-- Create index for AI provider queries
CREATE INDEX idx_users_ai_provider ON users(preferred_ai_provider);

-- Add check constraint for AI provider values
ALTER TABLE users
ADD CONSTRAINT check_ai_provider
CHECK (preferred_ai_provider IS NULL OR preferred_ai_provider IN ('OPENAI', 'LOCAL', 'AUTO'));
