-- Advanced Analytics Tables Migration
-- Created: 2024-10-31
-- Purpose: Create tables for advanced analytics features across social platforms

-- Analytics snapshots (daily aggregated metrics)
CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  snapshot_date DATE NOT NULL,
  followers INTEGER DEFAULT 0,
  engagement INTEGER DEFAULT 0,
  posts INTEGER DEFAULT 0,
  reach BIGINT DEFAULT 0,
  impressions BIGINT DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, platform, snapshot_date)
);

-- Performance goals
CREATE TABLE IF NOT EXISTS performance_goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_type VARCHAR(50) NOT NULL, -- 'followers', 'engagement_rate', 'post_frequency'
  platform VARCHAR(50), -- NULL for all platforms
  target_value DECIMAL(10, 2) NOT NULL,
  current_value DECIMAL(10, 2) DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  achieved BOOLEAN DEFAULT FALSE,
  achieved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Report schedules
CREATE TABLE IF NOT EXISTS report_schedules (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_type VARCHAR(50) NOT NULL, -- 'weekly', 'monthly'
  frequency VARCHAR(50) NOT NULL, -- 'weekly', 'monthly'
  day_of_week INTEGER, -- 0-6 for weekly
  day_of_month INTEGER, -- 1-31 for monthly
  time_of_day TIME,
  email_delivery BOOLEAN DEFAULT TRUE,
  enabled BOOLEAN DEFAULT TRUE,
  last_generated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Generated reports
CREATE TABLE IF NOT EXISTS generated_reports (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_type VARCHAR(50) NOT NULL,
  time_range_start DATE NOT NULL,
  time_range_end DATE NOT NULL,
  summary_json JSONB NOT NULL,
  pdf_url TEXT,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Industry benchmarks
CREATE TABLE IF NOT EXISTS industry_benchmarks (
  id SERIAL PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  platform VARCHAR(50),
  avg_engagement_rate DECIMAL(5, 2),
  avg_follower_growth DECIMAL(5, 2),
  avg_post_frequency DECIMAL(5, 2),
  percentile_25 DECIMAL(5, 2),
  percentile_50 DECIMAL(5, 2),
  percentile_75 DECIMAL(5, 2),
  percentile_90 DECIMAL(5, 2),
  sample_size INTEGER,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category, platform)
);

-- Alert configurations
CREATE TABLE IF NOT EXISTS alert_configurations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL, -- 'engagement_drop', 'viral_post', 'follower_spike'
  threshold_value DECIMAL(10, 2),
  enabled BOOLEAN DEFAULT TRUE,
  email_notification BOOLEAN DEFAULT TRUE,
  in_app_notification BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alert history
CREATE TABLE IF NOT EXISTS alert_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_user_date ON analytics_snapshots(user_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_platform ON analytics_snapshots(platform, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_user_platform ON analytics_snapshots(user_id, platform);

CREATE INDEX IF NOT EXISTS idx_performance_goals_user ON performance_goals(user_id, achieved);
CREATE INDEX IF NOT EXISTS idx_performance_goals_dates ON performance_goals(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_report_schedules_user ON report_schedules(user_id, enabled);
CREATE INDEX IF NOT EXISTS idx_report_schedules_enabled ON report_schedules(enabled) WHERE enabled = TRUE;

CREATE INDEX IF NOT EXISTS idx_generated_reports_user ON generated_reports(user_id, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_reports_type ON generated_reports(report_type);

CREATE INDEX IF NOT EXISTS idx_industry_benchmarks_category ON industry_benchmarks(category);
CREATE INDEX IF NOT EXISTS idx_industry_benchmarks_platform ON industry_benchmarks(platform);

CREATE INDEX IF NOT EXISTS idx_alert_configurations_user ON alert_configurations(user_id, enabled);
CREATE INDEX IF NOT EXISTS idx_alert_configurations_type ON alert_configurations(alert_type);

CREATE INDEX IF NOT EXISTS idx_alert_history_user ON alert_history(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_history_unread ON alert_history(user_id) WHERE read = FALSE;

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_performance_goals_updated_at BEFORE UPDATE ON performance_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_schedules_updated_at BEFORE UPDATE ON report_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alert_configurations_updated_at BEFORE UPDATE ON alert_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE analytics_snapshots IS 'Daily aggregated metrics from all social platforms';
COMMENT ON TABLE performance_goals IS 'User-defined performance goals and tracking';
COMMENT ON TABLE report_schedules IS 'Automated report generation schedules';
COMMENT ON TABLE generated_reports IS 'Historical generated reports';
COMMENT ON TABLE industry_benchmarks IS 'Industry average metrics for comparison';
COMMENT ON TABLE alert_configurations IS 'User alert preferences and thresholds';
COMMENT ON TABLE alert_history IS 'History of triggered alerts';

COMMENT ON COLUMN analytics_snapshots.platform IS 'Platform identifier: tiktok, instagram, reddit';
COMMENT ON COLUMN analytics_snapshots.followers IS 'Total followers/subscribers on snapshot date';
COMMENT ON COLUMN analytics_snapshots.engagement IS 'Total engagement (likes + comments + shares)';
COMMENT ON COLUMN analytics_snapshots.posts IS 'Total posts published';
COMMENT ON COLUMN analytics_snapshots.reach IS 'Total reach/impressions';
COMMENT ON COLUMN analytics_snapshots.metadata IS 'Platform-specific additional metrics';

COMMENT ON COLUMN performance_goals.goal_type IS 'Type of goal: followers, engagement_rate, post_frequency';
COMMENT ON COLUMN performance_goals.platform IS 'NULL for all platforms, or specific platform';

COMMENT ON COLUMN alert_configurations.alert_type IS 'Type: engagement_drop, viral_post, follower_spike';
