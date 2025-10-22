-- Dev-only seeds
INSERT INTO admin_settings (id, feature_name, enabled)
VALUES (gen_random_uuid(), 'CRISIS_EMAIL_ALERTS', true)
ON CONFLICT DO NOTHING;

