ALTER TABLE users
  ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'USER',
ADD COLUMN firebase_uid VARCHAR(255);

-- Create index for better performance
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
