-- Performance indexes for chat feature
-- These indexes optimize common query patterns for message history and chat sessions
-- Index for fetching messages by chat session, ordered by creation time (most common query)
-- This supports: SELECT * FROM messages WHERE chat_session_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_messages_chat_session_created ON messages(chat_session_id, created_at DESC);
-- Index for filtering user vs bot messages within a session
-- This supports: SELECT * FROM messages WHERE chat_session_id = ? AND is_user_message = ? ORDER BY created_at
CREATE INDEX IF NOT EXISTS idx_messages_user_created ON messages(chat_session_id, is_user_message, created_at);
-- Index for fetching user's chat sessions ordered by last update
-- This supports: SELECT * FROM chat_sessions WHERE user_id = ? ORDER BY updated_at DESC
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_updated ON chat_sessions(user_id, updated_at DESC);
-- Index for crisis detection queries (already partially covered, but adding composite for better performance)
-- This supports: SELECT * FROM messages WHERE chat_session_id = ? AND is_crisis_flagged = true
CREATE INDEX IF NOT EXISTS idx_messages_crisis_flagged ON messages(chat_session_id, is_crisis_flagged)
WHERE is_crisis_flagged = true;
-- Index for message moderation queries
-- This supports: SELECT * FROM messages WHERE moderation_action IS NOT NULL
CREATE INDEX IF NOT EXISTS idx_messages_moderation ON messages(moderation_action)
WHERE moderation_action IS NOT NULL;
-- Analyze tables to update statistics for query planner
ANALYZE messages;
ANALYZE chat_sessions;
ANALYZE crisis_flags;
