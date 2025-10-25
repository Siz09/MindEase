-- V26__admin_user_remove_password_and_set_deterministic_uid.sql
-- Security/Compliance: avoid storing demo credentials and stabilize UID.

DO $$
BEGIN
  -- Remove any stored password hash for the seeded admin user
  UPDATE users
  SET password_hash = NULL,
      updated_at = NOW()
  WHERE email = 'admin@mindease.com';

  -- If firebase_uid is not set, use a deterministic placeholder derived from email
  UPDATE users
  SET firebase_uid = COALESCE(firebase_uid, 'seed-admin-' || substring(md5('admin@mindease.com'::text) from 1 for 8)),
      updated_at = NOW()
  WHERE email = 'admin@mindease.com';
END $$;

