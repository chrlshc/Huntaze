-- Production jobs table for tracking video processing jobs
CREATE TABLE IF NOT EXISTS production_jobs (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  s3_key VARCHAR(500),
  tiktok_url TEXT,
  idea TEXT,
  targets VARCHAR(50) DEFAULT 'all',
  variants INTEGER DEFAULT 3,
  options JSONB DEFAULT '{}',
  script JSONB,
  packaging JSONB,
  status VARCHAR(50) DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'finished', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_content_ids JSONB DEFAULT '[]',
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_production_jobs_user_id ON production_jobs(user_id);
CREATE INDEX idx_production_jobs_status ON production_jobs(status);
CREATE INDEX idx_production_jobs_created_at ON production_jobs(created_at DESC);

-- Content table for storing generated video drafts
CREATE TABLE IF NOT EXISTS content (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  job_id VARCHAR(255) REFERENCES production_jobs(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  s3_key VARCHAR(500) NOT NULL,
  variant VARCHAR(50) DEFAULT 'main',
  duration FLOAT,
  caption TEXT,
  hook TEXT,
  cta TEXT,
  platforms JSONB DEFAULT '[]',
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'ready', 'posted')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for content
CREATE INDEX idx_content_user_id ON content(user_id);
CREATE INDEX idx_content_job_id ON content(job_id);
CREATE INDEX idx_content_status ON content(status);
CREATE INDEX idx_content_created_at ON content(created_at DESC);

-- Marketing queue table for content ready to be posted
CREATE TABLE IF NOT EXISTS content_queue (
  id VARCHAR(255) PRIMARY KEY,
  content_id VARCHAR(255) REFERENCES content(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  title VARCHAR(500) NOT NULL,
  platforms JSONB DEFAULT '[]',
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'posted', 'failed', 'cancelled')),
  scheduled_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for queue
CREATE INDEX idx_content_queue_user_id ON content_queue(user_id);
CREATE INDEX idx_content_queue_status ON content_queue(status);
CREATE INDEX idx_content_queue_scheduled_at ON content_queue(scheduled_at);
CREATE INDEX idx_content_queue_created_at ON content_queue(created_at DESC);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables
CREATE TRIGGER update_production_jobs_updated_at BEFORE UPDATE ON production_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_queue_updated_at BEFORE UPDATE ON content_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
