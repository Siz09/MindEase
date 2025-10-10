-- Add unique constraint to ensure one UserActivity record per user
-- This prevents race conditions and ensures data integrity

ALTER TABLE user_activity
ADD CONSTRAINT unique_user_activity_user UNIQUE (user_id);
