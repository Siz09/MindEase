-- Add checkout_session_id and allow null stripe_subscription_id for pending checkouts

ALTER TABLE subscription
  ALTER COLUMN stripe_subscription_id DROP NOT NULL;

ALTER TABLE subscription
  ADD COLUMN IF NOT EXISTS checkout_session_id TEXT UNIQUE;

-- Optional: index for faster lookups if uniqueness is removed later
-- CREATE INDEX IF NOT EXISTS idx_subscription_checkout_session_id ON subscription(checkout_session_id);

