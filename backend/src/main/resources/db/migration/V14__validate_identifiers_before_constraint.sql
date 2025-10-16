-- Validate existing data and ensure subscriptions always have an identifier
DO $$
BEGIN
  -- Fail fast if any rows lack both identifiers
  IF EXISTS (
    SELECT 1 FROM subscription
    WHERE stripe_subscription_id IS NULL AND checkout_session_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot add/keep identifier constraint: % rows have both identifiers NULL',
      (SELECT COUNT(*) FROM subscription WHERE stripe_subscription_id IS NULL AND checkout_session_id IS NULL);
  END IF;

  -- Re-add constraint if missing (idempotent)
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE c.conname = 'chk_subscription_has_identifier' AND t.relname = 'subscription'
  ) THEN
    ALTER TABLE subscription
      ADD CONSTRAINT chk_subscription_has_identifier
      CHECK (stripe_subscription_id IS NOT NULL OR checkout_session_id IS NOT NULL);
  END IF;
END$$;
