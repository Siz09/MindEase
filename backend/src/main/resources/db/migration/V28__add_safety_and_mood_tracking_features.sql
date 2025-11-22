-- Add safety classification fields to messages table
ALTER TABLE messages
ADD COLUMN risk_level VARCHAR(20) NOT NULL DEFAULT 'NONE',
ADD COLUMN moderation_action VARCHAR(20) DEFAULT 'NONE',
ADD COLUMN moderation_reason TEXT,
ADD COLUMN safety_checked BOOLEAN NOT NULL DEFAULT FALSE;

-- Create crisis_resources table for localized crisis support information
CREATE TABLE crisis_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language VARCHAR(10) NOT NULL,
    region VARCHAR(50),
    resource_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    contact_info VARCHAR(255) NOT NULL,
    availability VARCHAR(100),
    display_order INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_crisis_resources_language_region ON crisis_resources(language, region);
CREATE INDEX idx_crisis_resources_active ON crisis_resources(active);

-- Create mood_checkins table for structured mood tracking
CREATE TABLE mood_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
    tags TEXT[], -- Array of mood tags like 'anxious', 'calm', 'stressed'
    checkin_type VARCHAR(20) NOT NULL DEFAULT 'standalone', -- 'pre_chat', 'post_chat', 'standalone'
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mood_checkins_user_id ON mood_checkins(user_id);
CREATE INDEX idx_mood_checkins_session_id ON mood_checkins(session_id);
CREATE INDEX idx_mood_checkins_created_at ON mood_checkins(created_at);
CREATE INDEX idx_mood_checkins_user_created ON mood_checkins(user_id, created_at DESC);

-- Create session_summaries table for AI-generated chat summaries
CREATE TABLE session_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    key_takeaways TEXT[], -- Array of key insights
    sentiment VARCHAR(20), -- 'positive', 'neutral', 'negative'
    generated_by VARCHAR(50) NOT NULL DEFAULT 'ai', -- 'ai', 'manual'
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(session_id) -- One summary per session
);

CREATE INDEX idx_session_summaries_session_id ON session_summaries(session_id);

-- Create guided_programs table for CBT-style programs
CREATE TABLE guided_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    program_type VARCHAR(50) NOT NULL, -- 'cbt', 'breathing', 'grounding', etc.
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    estimated_duration_minutes INTEGER,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_guided_programs_language ON guided_programs(language);
CREATE INDEX idx_guided_programs_active ON guided_programs(active);

-- Create guided_steps table for individual steps within programs
CREATE TABLE guided_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES guided_programs(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    title VARCHAR(255),
    prompt_text TEXT NOT NULL,
    input_type VARCHAR(50) NOT NULL, -- 'text', 'choice', 'scale', 'none'
    input_options JSONB, -- For choice-based inputs
    next_step_logic JSONB, -- Conditional navigation rules
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(program_id, step_number)
);

CREATE INDEX idx_guided_steps_program_id ON guided_steps(program_id);

-- Create guided_sessions table for user progress through programs
CREATE TABLE guided_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES guided_programs(id) ON DELETE CASCADE,
    current_step_number INTEGER NOT NULL DEFAULT 1,
    responses JSONB, -- Stores user responses by step
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'completed', 'abandoned'
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_guided_sessions_user_id ON guided_sessions(user_id);
CREATE INDEX idx_guided_sessions_program_id ON guided_sessions(program_id);
CREATE INDEX idx_guided_sessions_status ON guided_sessions(status);
CREATE INDEX idx_guided_sessions_user_started ON guided_sessions(user_id, started_at DESC);

-- Add language preference to users table
ALTER TABLE users
ADD COLUMN preferred_language VARCHAR(10) DEFAULT 'en';

-- Insert default crisis resources
-- English resources
INSERT INTO crisis_resources (language, region, resource_type, title, description, contact_info, availability, display_order) VALUES
('en', 'US', 'hotline', 'National Suicide Prevention Lifeline', 'Free and confidential support for people in distress, 24/7', '988', '24/7', 1),
('en', 'US', 'textline', 'Crisis Text Line', 'Text HOME to connect with a crisis counselor', '741741', '24/7', 2),
('en', 'global', 'website', 'International Association for Suicide Prevention', 'Find crisis centers worldwide', 'https://www.iasp.info/resources/Crisis_Centres/', '24/7', 3);

-- Nepali resources
INSERT INTO crisis_resources (language, region, resource_type, title, description, contact_info, availability, display_order) VALUES
('ne', 'NP', 'hotline', 'Transcultural Psychosocial Organization (TPO) Nepal', 'मानसिक स्वास्थ्य सहायता हटलाइन', '16600102005', 'Mon-Fri 10am-5pm', 1),
('ne', 'NP', 'hotline', 'Nepal Mental Health Helpline', 'मानसिक स्वास्थ्य परामर्श सेवा', '1660-01-20666', '24/7', 2);

-- Add constraint check for risk_level enum values
ALTER TABLE messages
ADD CONSTRAINT chk_risk_level CHECK (risk_level IN ('NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'));

-- Add constraint check for moderation_action enum values
ALTER TABLE messages
ADD CONSTRAINT chk_moderation_action CHECK (moderation_action IN ('NONE', 'FLAGGED', 'MODIFIED', 'BLOCKED'));

-- Add constraint check for checkin_type
ALTER TABLE mood_checkins
ADD CONSTRAINT chk_checkin_type CHECK (checkin_type IN ('pre_chat', 'post_chat', 'standalone'));

-- Add constraint check for guided_sessions status
ALTER TABLE guided_sessions
ADD CONSTRAINT chk_guided_session_status CHECK (status IN ('in_progress', 'completed', 'abandoned'));
