#!/bin/bash

# Migration script for Huntaze Video Processor
# Usage: ./migrate-db.sh <DB_HOST> <DB_NAME> <DB_USER> <DB_PASSWORD>

DB_HOST=${1:-localhost}
DB_NAME=${2:-huntaze}
DB_USER=${3:-postgres}
DB_PASSWORD=${4:-password}

export PGPASSWORD=$DB_PASSWORD

echo "Running migration on database: $DB_NAME at $DB_HOST..."

psql -h $DB_HOST -U $DB_USER -d $DB_NAME << 'EOF'
-- MIGRATION: 001_production_jobs.sql

CREATE TABLE IF NOT EXISTS production_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255),
    s3_key_input VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'QUEUED', -- QUEUED, PROCESSING, COMPLETED, FAILED
    progress INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

CREATE TABLE IF NOT EXISTS content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES production_jobs(id),
    user_id VARCHAR(255) NOT NULL,
    type VARCHAR(50), -- HOOK, MAIN, TEASER
    s3_key_output VARCHAR(255) NOT NULL,
    url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_user ON production_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON production_jobs(status);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON production_jobs
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

EOF

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
else
    echo "❌ Migration failed!"
    exit 1
fi
