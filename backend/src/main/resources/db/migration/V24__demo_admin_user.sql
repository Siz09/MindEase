-- V24__demo_admin_user.sql
-- Seed a demo admin account (email: admin@mindease.com, password = 'admin123')

-- Ensure pgcrypto available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    -- bcrypt hash for 'admin123' (BCrypt $2a$10)
    hashed TEXT := '$2a$10$yM4S.jTTvZBi6W3dFy8Xgecfuh86FZKx/V7BfIxIY1nO1RtdY6d0a';
BEGIN
    -- Insert only if the email does not exist yet
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@mindease.com') THEN
        INSERT INTO users (
            id,
            email,
            password_hash,
            role,
            anonymous_mode,
            created_at,
            updated_at,
            firebase_uid
        ) VALUES (
            gen_random_uuid(),
            'admin@mindease.com',
            hashed,
            'ADMIN',
            FALSE,
            NOW(),
            NOW(),
            'seed-admin-' || substring(md5(random()::text) from 1 for 8)
        );
    END IF;
END $$;

