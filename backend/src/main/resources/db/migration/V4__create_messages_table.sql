-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
                                      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_user_message BOOLEAN NOT NULL,
  is_crisis_flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

-- Create indexes for messages table
CREATE INDEX IF NOT EXISTS idx_messages_chat_session_id ON messages(chat_session_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

