-- Create journal_entries table with UUID and proper foreign key
CREATE TABLE journal_entries (
                               id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                               user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                               content TEXT NOT NULL,
                               ai_summary TEXT,
                               mood_insight TEXT,
                               created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_journal_user_created ON journal_entries(user_id, created_at DESC);
CREATE INDEX idx_journal_created ON journal_entries(created_at DESC);

-- Create mindfulness_sessions table with UUID
CREATE TABLE mindfulness_sessions (
                                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                    title VARCHAR(255) NOT NULL,
                                    description TEXT,
                                    type VARCHAR(50) NOT NULL,
                                    duration INTEGER,
                                    media_url TEXT,
                                    category VARCHAR(100),
                                    difficulty_level VARCHAR(50),
                                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert comprehensive sample mindfulness sessions
INSERT INTO mindfulness_sessions (title, description, type, duration, media_url, category, difficulty_level) VALUES
-- Breathing Exercises
('Deep Breathing', 'Calm your mind with focused deep breathing', 'audio', 5, '/audio/deep-breathing.mp3', 'breathing', 'beginner'),
('Box Breathing', 'Navy SEAL technique for stress reduction', 'audio', 5, '/audio/box-breathing.mp3', 'breathing', 'beginner'),
('4-7-8 Breathing', 'Dr. Weil breathing technique for relaxation', 'audio', 7, '/audio/478-breathing.mp3', 'breathing', 'intermediate'),
-- Meditation
('Body Scan Meditation', 'Progressive relaxation through body awareness', 'audio', 10, '/audio/body-scan.mp3', 'meditation', 'beginner'),
('Loving-Kindness Meditation', 'Cultivate compassion for yourself and others', 'audio', 15, '/audio/loving-kindness.mp3', 'meditation', 'intermediate'),
-- Animation-based exercises
('Mindful Walking', 'Guided walking meditation with visual cues', 'animation', 5, '/animations/walking.json', 'movement', 'beginner'),
('Mindful Eating', 'Bring awareness to your eating experience', 'animation', 3, '/animations/eating.json', 'daily-life', 'beginner'),
-- Quick exercises
('One-Minute Breathing', 'Quick breathing space for busy moments', 'audio', 1, '/audio/one-minute-breathing.mp3', 'quick', 'beginner');