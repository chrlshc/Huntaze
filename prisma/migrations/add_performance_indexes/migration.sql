-- Migration: Add performance indexes for dashboard queries
-- Generated for Task 8.1 - Database Query Optimization
-- Requirements: 7.1 - Use database indexes for filtering and sorting

-- Content table: Add composite index for date range queries
CREATE INDEX IF NOT EXISTS "idx_content_user_created_status" ON "content" ("user_id", "created_at" DESC, "status");

-- Content table: Add index for platform + status filtering (common in dashboard)
CREATE INDEX IF NOT EXISTS "idx_content_platform_status" ON "content" ("platform", "status");

-- Transactions table: Add composite index for type + date filtering
CREATE INDEX IF NOT EXISTS "idx_transactions_user_type_created" ON "transactions" ("user_id", "type", "created_at" DESC);

-- Transactions table: Add index for date range queries
CREATE INDEX IF NOT EXISTS "idx_transactions_created_status" ON "transactions" ("created_at" DESC, "status");

-- Subscriptions table: Add index for date filtering
CREATE INDEX IF NOT EXISTS "idx_subscriptions_started_at" ON "subscriptions" ("started_at" DESC);

-- Subscriptions table: Add composite index for platform + status
CREATE INDEX IF NOT EXISTS "idx_subscriptions_platform_status" ON "subscriptions" ("platform", "status");

-- Marketing campaigns table: Add index for date filtering
CREATE INDEX IF NOT EXISTS "idx_campaigns_created_at" ON "marketing_campaigns" ("created_at" DESC);

-- OAuth accounts table: Add index for provider lookups
CREATE INDEX IF NOT EXISTS "idx_oauth_provider" ON "oauth_accounts" ("provider");

-- UsageLog table: Add index for feature filtering
CREATE INDEX IF NOT EXISTS "idx_usage_logs_feature" ON "usage_logs" ("feature");

-- UsageLog table: Add composite index for date range + feature
CREATE INDEX IF NOT EXISTS "idx_usage_logs_created_feature" ON "usage_logs" ("createdAt" DESC, "feature");

-- AIInsight table: Add index for confidence filtering
CREATE INDEX IF NOT EXISTS "idx_ai_insights_confidence" ON "ai_insights" ("confidence" DESC);

-- SignupAnalytics table: Add index for funnel analysis
CREATE INDEX IF NOT EXISTS "idx_signup_method_completed" ON "signup_analytics" ("methodSelected", "signupCompleted");

-- SignupAnalytics table: Add index for conversion tracking
CREATE INDEX IF NOT EXISTS "idx_signup_funnel" ON "signup_analytics" ("formStarted", "formSubmitted", "signupCompleted");

-- Events outbox table: Add index for unsent events
CREATE INDEX IF NOT EXISTS "idx_events_outbox_sent" ON "events_outbox" ("sent_at", "event_time" DESC) WHERE "sent_at" IS NULL;

-- Events outbox table: Add index for event type filtering
CREATE INDEX IF NOT EXISTS "idx_events_outbox_type" ON "events_outbox" ("event_type", "event_time" DESC);

-- Account table (NextAuth): Add index for type filtering
CREATE INDEX IF NOT EXISTS "idx_nextauth_accounts_type" ON "nextauth_accounts" ("type");

-- Session table (NextAuth): Add index for expiry cleanup
CREATE INDEX IF NOT EXISTS "idx_nextauth_sessions_expires" ON "nextauth_sessions" ("expires");

-- VerificationToken table: Add index for expiry cleanup
CREATE INDEX IF NOT EXISTS "idx_nextauth_verification_expires" ON "nextauth_verification_tokens" ("expires");
