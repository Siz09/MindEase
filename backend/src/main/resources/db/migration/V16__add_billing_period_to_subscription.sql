ALTER TABLE subscription
  ADD COLUMN IF NOT EXISTS billing_period VARCHAR(16);

UPDATE subscription SET billing_period = 'MONTHLY' WHERE billing_period IS NULL;

