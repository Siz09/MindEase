CREATE TABLE users (
                     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                     email VARCHAR(255) UNIQUE NOT NULL,
                     password_hash TEXT,
                     anonymous_mode BOOLEAN DEFAULT FALSE,
                     created_at TIMESTAMP DEFAULT NOW(),
                     updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chat_sessions (
                             id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                             user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                             created_at TIMESTAMP DEFAULT NOW(),
                             updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE messages (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        chat_session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
                        content TEXT NOT NULL,
                        is_user_message BOOLEAN NOT NULL,
                        created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE mood_entries (
                            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                            mood_value INTEGER NOT NULL CHECK (mood_value >= 1 AND mood_value <= 10),
                            notes TEXT,
                            created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_messages_chat_session_id ON messages(chat_session_id);
CREATE INDEX idx_mood_entries_user_id ON mood_entries(user_id);
CREATE INDEX idx_mood_entries_created_at ON mood_entries(created_at);
