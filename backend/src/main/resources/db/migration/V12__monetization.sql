-- Create subscription and feature_flag tables for monetization

CREATE TABLE subscription (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT,
    plan_type TEXT,
    status TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscription_user_id ON subscription(user_id);

CREATE TABLE feature_flag (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_name TEXT UNIQUE,
    enabled_for_premium BOOLEAN,
    created_at TIMESTAMP DEFAULT NOW()
);

