-- Ensure subscription has at least one identifier (Stripe subscription or Checkout session)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_subscription_has_identifier'
  ) THEN
    ALTER TABLE subscription
      ADD CONSTRAINT chk_subscription_has_identifier
      CHECK (stripe_subscription_id IS NOT NULL OR checkout_session_id IS NOT NULL);
  END IF;
END$$;

