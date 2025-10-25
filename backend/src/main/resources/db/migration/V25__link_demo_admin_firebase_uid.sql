-- V25__link_demo_admin_firebase_uid.sql
-- Link the Firebase UID to the seeded demo admin so Firebase login works

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM users WHERE email = 'admin@mindease.com') THEN
    UPDATE users
    SET firebase_uid = 'ywFz9UHG5eekemTk3PzkMSgAfvE2',
        updated_at = NOW()
    WHERE email = 'admin@mindease.com';
  END IF;
END $$;

