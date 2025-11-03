-- Migration: Remove Collaboration Features
-- Date: 2024-11-03
-- Purpose: Remove all collaboration-related tables and columns for solo creator optimization

-- Drop collaboration tables
DROP TABLE IF EXISTS content_collaborators CASCADE;
DROP TABLE IF EXISTS content_comments CASCADE;
DROP TABLE IF EXISTS content_revisions CASCADE;
DROP TABLE IF EXISTS collaboration_sessions CASCADE;

-- Remove collaboration columns from content_items
ALTER TABLE content_items 
DROP COLUMN IF EXISTS shared_with,
DROP COLUMN IF EXISTS collaboration_enabled,
DROP COLUMN IF EXISTS last_collaborator_id;

-- Remove any collaboration-related indexes
DROP INDEX IF EXISTS idx_content_collaborators_content_id;
DROP INDEX IF EXISTS idx_content_collaborators_user_id;
DROP INDEX IF EXISTS idx_content_comments_content_id;
DROP INDEX IF EXISTS idx_content_comments_user_id;
DROP INDEX IF EXISTS idx_content_revisions_content_id;
DROP INDEX IF EXISTS idx_content_revisions_created_at;
DROP INDEX IF EXISTS idx_collaboration_sessions_content_id;

-- Clean up any orphaned data or constraints
-- (Add any additional cleanup as needed)

-- Optimize remaining indexes for single-user scenarios
CREATE INDEX IF NOT EXISTS idx_content_items_user_id_status ON content_items(user_id, status);
CREATE INDEX IF NOT EXISTS idx_content_items_user_id_created_at ON content_items(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_assets_user_id_type ON media_assets(user_id, file_type);