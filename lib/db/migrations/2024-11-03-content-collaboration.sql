-- Content Collaboration Tables
-- Migration: 2024-11-03-content-collaboration.sql

-- Add title column to content_items if it doesn't exist
ALTER TABLE content_items 
ADD COLUMN IF NOT EXISTS title VARCHAR(255),
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'post';

-- Create content_collaborators table
CREATE TABLE IF NOT EXISTS content_collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    permission VARCHAR(20) NOT NULL CHECK (permission IN ('owner', 'editor', 'viewer')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT,
    token VARCHAR(64) UNIQUE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_collaborators_content_id ON content_collaborators(content_id);
CREATE INDEX IF NOT EXISTS idx_content_collaborators_user_id ON content_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_content_collaborators_email ON content_collaborators(email);
CREATE INDEX IF NOT EXISTS idx_content_collaborators_token ON content_collaborators(token);
CREATE INDEX IF NOT EXISTS idx_content_collaborators_status ON content_collaborators(status);

-- Create content_comments table for commenting system
CREATE TABLE IF NOT EXISTS content_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES content_comments(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    position_start INTEGER,
    position_end INTEGER,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for comments
CREATE INDEX IF NOT EXISTS idx_content_comments_content_id ON content_comments(content_id);
CREATE INDEX IF NOT EXISTS idx_content_comments_user_id ON content_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_content_comments_parent_id ON content_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_content_comments_resolved ON content_comments(resolved);

-- Create content_revisions table for revision history
CREATE TABLE IF NOT EXISTS content_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    revision_number INTEGER NOT NULL,
    title VARCHAR(255),
    text TEXT NOT NULL,
    metadata JSONB,
    change_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for revisions
CREATE INDEX IF NOT EXISTS idx_content_revisions_content_id ON content_revisions(content_id);
CREATE INDEX IF NOT EXISTS idx_content_revisions_user_id ON content_revisions(user_id);
CREATE INDEX IF NOT EXISTS idx_content_revisions_revision_number ON content_revisions(content_id, revision_number);

-- Create unique constraint for revision numbers per content
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_revisions_unique 
ON content_revisions(content_id, revision_number);

-- Create content_presence table for real-time presence
CREATE TABLE IF NOT EXISTS content_presence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cursor_position INTEGER,
    selection_start INTEGER,
    selection_end INTEGER,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for presence
CREATE INDEX IF NOT EXISTS idx_content_presence_content_id ON content_presence(content_id);
CREATE INDEX IF NOT EXISTS idx_content_presence_user_id ON content_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_content_presence_last_seen ON content_presence(last_seen);

-- Create unique constraint for one presence record per user per content
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_presence_unique 
ON content_presence(content_id, user_id);

-- Update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers
DROP TRIGGER IF EXISTS update_content_collaborators_updated_at ON content_collaborators;
CREATE TRIGGER update_content_collaborators_updated_at 
    BEFORE UPDATE ON content_collaborators 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_comments_updated_at ON content_comments;
CREATE TRIGGER update_content_comments_updated_at 
    BEFORE UPDATE ON content_comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up old presence records (older than 5 minutes)
CREATE OR REPLACE FUNCTION cleanup_old_presence()
RETURNS void AS $$
BEGIN
    DELETE FROM content_presence 
    WHERE last_seen < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON content_collaborators TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON content_comments TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON content_revisions TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON content_presence TO your_app_user;