-- Content Creation System Database Migration
-- Created: 2024-10-31
-- Description: Complete schema for content creation, media management, templates, collaboration, and scheduling

-- Content drafts and published content
CREATE TABLE IF NOT EXISTS content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  category VARCHAR(50),
  scheduled_at TIMESTAMP,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_content_items_user_status ON content_items(user_id, status);
CREATE INDEX IF NOT EXISTS idx_content_items_scheduled ON content_items(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_content_items_created ON content_items(created_at DESC);

-- Media assets (images and videos)
CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('image', 'video')),
  filename VARCHAR(255) NOT NULL,
  original_url TEXT NOT NULL,
  thumbnail_url TEXT,
  size_bytes BIGINT NOT NULL,
  width INTEGER,
  height INTEGER,
  duration_seconds INTEGER,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_media_assets_user_type ON media_assets(user_id, type);
CREATE INDEX IF NOT EXISTS idx_media_assets_uploaded ON media_assets(uploaded_at DESC);

-- Content-media relationships (many-to-many)
CREATE TABLE IF NOT EXISTS content_media (
  content_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
  media_id UUID REFERENCES media_assets(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  PRIMARY KEY (content_id, media_id)
);

CREATE INDEX IF NOT EXISTS idx_content_media_content ON content_media(content_id);
CREATE INDEX IF NOT EXISTS idx_content_media_media ON content_media(media_id);

-- Platform associations for multi-platform publishing
CREATE TABLE IF NOT EXISTS content_platforms (
  content_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  platform_specific_data JSONB DEFAULT '{}'::jsonb,
  published_url TEXT,
  published_at TIMESTAMP,
  PRIMARY KEY (content_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_content_platforms_platform ON content_platforms(platform);

-- Tags for content organization
CREATE TABLE IF NOT EXISTS content_tags (
  content_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
  tag VARCHAR(100) NOT NULL,
  PRIMARY KEY (content_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_content_tags_tag ON content_tags(tag);
CREATE INDEX IF NOT EXISTS idx_content_tags_content ON content_tags(content_id);

-- Templates for reusable content structures
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  structure JSONB NOT NULL,
  preview_url TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_user ON templates(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_templates_public ON templates(is_public) WHERE is_public = TRUE;

-- Collaboration - share content with team members
CREATE TABLE IF NOT EXISTS content_collaborators (
  content_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (content_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_content_collaborators_user ON content_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_content_collaborators_content ON content_collaborators(content_id);

-- Comments for collaboration
CREATE TABLE IF NOT EXISTS content_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES content_comments(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  position_start INTEGER,
  position_end INTEGER,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_comments_content ON content_comments(content_id);
CREATE INDEX IF NOT EXISTS idx_content_comments_parent ON content_comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;

-- Revisions for version history
CREATE TABLE IF NOT EXISTS content_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  snapshot JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_revisions_content ON content_revisions(content_id, created_at DESC);

-- A/B Testing variations
CREATE TABLE IF NOT EXISTS content_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  variation_name VARCHAR(100) NOT NULL,
  text TEXT NOT NULL,
  media_ids UUID[],
  audience_percentage INTEGER NOT NULL CHECK (audience_percentage > 0 AND audience_percentage <= 100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_variations_parent ON content_variations(parent_content_id);

-- Storage quota tracking per user
CREATE TABLE IF NOT EXISTS user_storage_quota (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  used_bytes BIGINT DEFAULT 0,
  quota_bytes BIGINT NOT NULL DEFAULT 10737418240, -- 10GB default
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Function to update content_items updated_at timestamp
CREATE OR REPLACE FUNCTION update_content_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
CREATE TRIGGER trigger_update_content_items_updated_at
  BEFORE UPDATE ON content_items
  FOR EACH ROW
  EXECUTE FUNCTION update_content_items_updated_at();

-- Function to update storage quota
CREATE OR REPLACE FUNCTION update_storage_quota()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO user_storage_quota (user_id, used_bytes, quota_bytes)
    VALUES (NEW.user_id, NEW.size_bytes, 10737418240)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      used_bytes = user_storage_quota.used_bytes + NEW.size_bytes,
      updated_at = NOW();
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_storage_quota
    SET used_bytes = GREATEST(0, used_bytes - OLD.size_bytes),
        updated_at = NOW()
    WHERE user_id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic storage quota updates
CREATE TRIGGER trigger_update_storage_quota_insert
  AFTER INSERT ON media_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_storage_quota();

CREATE TRIGGER trigger_update_storage_quota_delete
  AFTER DELETE ON media_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_storage_quota();

-- Comments
COMMENT ON TABLE content_items IS 'Stores all content drafts, scheduled, and published items';
COMMENT ON TABLE media_assets IS 'Stores uploaded images and videos with metadata';
COMMENT ON TABLE content_media IS 'Many-to-many relationship between content and media';
COMMENT ON TABLE content_platforms IS 'Tracks which platforms content is published to';
COMMENT ON TABLE content_tags IS 'Tags for organizing and searching content';
COMMENT ON TABLE templates IS 'Reusable content templates';
COMMENT ON TABLE content_collaborators IS 'Team members who can access content';
COMMENT ON TABLE content_comments IS 'Comments and discussions on content';
COMMENT ON TABLE content_revisions IS 'Version history for content items';
COMMENT ON TABLE content_variations IS 'A/B testing variations of content';
COMMENT ON TABLE user_storage_quota IS 'Tracks storage usage per user';
