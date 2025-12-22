-- Marketing War Room Schema
-- Content Calendar → Job Queue → Multi-platform Publishing (API-only, no scraping)
--
-- Run with: psql -d your_database -f migrations/002_marketing_war_room_schema.sql

-- Extensions
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1) Social Accounts (connected TikTok/Instagram profiles)
-- ============================================================================
CREATE TABLE IF NOT EXISTS social_accounts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL,
  platform        text NOT NULL CHECK (platform IN ('tiktok', 'instagram')),
  external_id     text NOT NULL,  -- open_id (TikTok) / ig_user_id
  display_name    text,
  page_id         text,           -- useful for IG messaging/publishing
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (platform, external_id)
);

CREATE INDEX IF NOT EXISTS idx_social_accounts_user ON social_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_platform ON social_accounts(platform);

-- ============================================================================
-- 2) OAuth Tokens (encrypted in app layer / KMS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  social_account_id   uuid NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  access_token        text NOT NULL,      -- Encrypt this!
  refresh_token       text,               -- Encrypt this!
  scopes              text[] NOT NULL DEFAULT '{}',
  expires_at          timestamptz,
  last_refresh_at     timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_oauth_tokens_account ON oauth_tokens(social_account_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_expires ON oauth_tokens(expires_at);

-- ============================================================================
-- 3) Content Assets (your master videos stored in S3/R2)
-- ============================================================================
CREATE TABLE IF NOT EXISTS content_assets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id   uuid NOT NULL,
  kind            text NOT NULL CHECK (kind IN ('video', 'image')),
  storage_url     text NOT NULL,        -- S3/R2 key or signed URL generator reference
  checksum_sha256 text,
  duration_sec    int,
  width           int,
  height          int,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_assets_owner ON content_assets(owner_user_id);

-- ============================================================================
-- 4) Content Items (Content Calendar - source of truth)
-- ============================================================================
CREATE TABLE IF NOT EXISTS content_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id   uuid NOT NULL,
  asset_id        uuid NOT NULL REFERENCES content_assets(id),
  title           text,
  caption         text,
  hashtags        text[],
  schedule_at     timestamptz NOT NULL,
  targets         jsonb NOT NULL DEFAULT '{}'::jsonb,  -- {"tiktok": {...}, "instagram": {...}}
  status          text NOT NULL DEFAULT 'scheduled' 
                  CHECK (status IN ('scheduled', 'in_progress', 'completed', 'failed', 'paused')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_items_owner ON content_items(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_content_items_schedule ON content_items(schedule_at);
CREATE INDEX IF NOT EXISTS idx_content_items_status ON content_items(status);

-- ============================================================================
-- 5) Platform Publications (1 content_item → N platforms)
-- ============================================================================
CREATE TABLE IF NOT EXISTS platform_publications (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id    uuid NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  platform           text NOT NULL CHECK (platform IN ('tiktok', 'instagram')),
  social_account_id  uuid NOT NULL REFERENCES social_accounts(id),
  status             text NOT NULL DEFAULT 'scheduled'
                     CHECK (status IN ('scheduled', 'uploading', 'processing', 'posted', 'failed')),
  remote_media_id    text,        -- TikTok video ID / IG media ID
  error_code         text,
  error_message      text,
  posted_at          timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (content_item_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_platform_publications_item ON platform_publications(content_item_id);
CREATE INDEX IF NOT EXISTS idx_platform_publications_status ON platform_publications(status);

-- ============================================================================
-- 6) Publish Jobs (durable queue + idempotency)
-- ============================================================================
CREATE TABLE IF NOT EXISTS publish_jobs (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind                    text NOT NULL,  -- PUBLISH_TIKTOK_DIRECT_POST | PUBLISH_INSTAGRAM_REELS | HEALTH_CHECK
  content_item_id         uuid REFERENCES content_items(id) ON DELETE CASCADE,
  platform                text,
  platform_publication_id uuid REFERENCES platform_publications(id) ON DELETE CASCADE,
  run_at                  timestamptz NOT NULL DEFAULT now(),
  status                  text NOT NULL DEFAULT 'queued'
                          CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'retrying', 'canceled')),
  attempts                int NOT NULL DEFAULT 0,
  max_attempts            int NOT NULL DEFAULT 8,
  idempotency_key         text NOT NULL,
  last_error              text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE (idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_publish_jobs_status ON publish_jobs(status);
CREATE INDEX IF NOT EXISTS idx_publish_jobs_run_at ON publish_jobs(run_at);
CREATE INDEX IF NOT EXISTS idx_publish_jobs_content ON publish_jobs(content_item_id);

-- ============================================================================
-- 7) Job Events (timeline for Content Queue UI)
-- ============================================================================
CREATE TABLE IF NOT EXISTS job_events (
  id            bigserial PRIMARY KEY,
  job_id        uuid REFERENCES publish_jobs(id) ON DELETE CASCADE,
  at            timestamptz NOT NULL DEFAULT now(),
  level         text NOT NULL CHECK (level IN ('info', 'warn', 'error', 'success')),
  message       text NOT NULL,
  payload       jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_job_events_job ON job_events(job_id);
CREATE INDEX IF NOT EXISTS idx_job_events_at ON job_events(at DESC);

-- ============================================================================
-- 8) Automations (feature flags)
-- ============================================================================
CREATE TABLE IF NOT EXISTS automations (
  key          text PRIMARY KEY,
  enabled      boolean NOT NULL DEFAULT false,
  label        text NOT NULL,
  description  text,
  compliance   text DEFAULT 'api_only',
  config       jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Insert default automations
INSERT INTO automations (key, enabled, label, description, compliance) VALUES
  ('instagram_welcome_dm', false, 'Instagram Welcome DM', 
   'Welcome flow compliant (opt-in / conversation window). Pas de DM blast aux nouveaux follows.', 'api_only'),
  ('tiktok_warmup', false, 'TikTok Warmup', 
   'Mode compliant: plan de cadence + checks. Pas d''auto-scroll.', 'api_only'),
  ('auto_reposter', false, 'Auto-Reposter', 
   '1 asset → multi-platform publish (TikTok + Reels) via APIs officielles.', 'api_only')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 9) Automation Audit Log (who toggled what, when)
-- ============================================================================
CREATE TABLE IF NOT EXISTS automation_audit_log (
  id              bigserial PRIMARY KEY,
  automation_key  text NOT NULL,
  action          text NOT NULL,  -- 'toggle', 'config_change'
  enabled         boolean,
  user_id         uuid,
  details         jsonb DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_audit_key ON automation_audit_log(automation_key);
CREATE INDEX IF NOT EXISTS idx_automation_audit_created ON automation_audit_log(created_at DESC);

-- ============================================================================
-- 10) Trends (curated, not scraped)
-- ============================================================================
CREATE TABLE IF NOT EXISTS trends (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  why         text NOT NULL,
  example     text,
  source      text DEFAULT 'internal',  -- 'internal', 'team_notes', 'analytics'
  active      boolean NOT NULL DEFAULT true,
  sort_order  int DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Insert default trends
INSERT INTO trends (title, why, example, source) VALUES
  ('Hook 0–1s + sous-titres', 'Boost watch time, meilleur cross-post Reels/TikTok', 
   '"Stop scrolling si tu fais X…"', 'team_notes'),
  ('Series content (épisodes)', 'Structure, retention, re-use en calendar', 
   'Épisode 1/7 : …', 'analytics')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Helper functions
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers for updated_at
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN 
    SELECT unnest(ARRAY[
      'social_accounts', 'oauth_tokens', 'content_items', 
      'platform_publications', 'publish_jobs', 'automations', 'trends'
    ])
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
      CREATE TRIGGER update_%I_updated_at
        BEFORE UPDATE ON %I
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    ', t, t, t, t);
  END LOOP;
END;
$$;

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE social_accounts IS 'Connected TikTok/Instagram accounts with OAuth';
COMMENT ON TABLE oauth_tokens IS 'OAuth tokens - MUST be encrypted at rest';
COMMENT ON TABLE content_assets IS 'Master video/image files stored in S3/R2';
COMMENT ON TABLE content_items IS 'Content calendar - source of truth for scheduled posts';
COMMENT ON TABLE platform_publications IS 'Per-platform publication status (1 item → N platforms)';
COMMENT ON TABLE publish_jobs IS 'Durable job queue with idempotency keys';
COMMENT ON TABLE job_events IS 'Timeline events for real-time UI updates';
COMMENT ON TABLE automations IS 'Feature flags for server-side automation pipelines';
COMMENT ON TABLE automation_audit_log IS 'Audit trail for automation toggles';
COMMENT ON TABLE trends IS 'Curated trend suggestions (no scraping)';
