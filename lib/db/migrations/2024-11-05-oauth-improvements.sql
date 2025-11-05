-- OAuth Improvements Migration
-- Adds missing indexes, constraints, and state management table
-- Run date: 2024-11-05

BEGIN;

-- Add missing indexes for oauth_accounts table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_oauth_accounts_user_provider 
ON oauth_accounts(user_id, provider);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_oauth_accounts_expires_at 
ON oauth_accounts(expires_at) WHERE expires_at > NOW();

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_oauth_accounts_provider 
ON oauth_accounts(provider);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_oauth_accounts_updated_at 
ON oauth_accounts(updated_at DESC);

-- Add proper foreign key constraint (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_oauth_accounts_user_id'
    ) THEN
        ALTER TABLE oauth_accounts 
        ADD CONSTRAINT fk_oauth_accounts_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add check constraint for provider values (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chk_oauth_accounts_provider'
    ) THEN
        ALTER TABLE oauth_accounts 
        ADD CONSTRAINT chk_oauth_accounts_provider 
        CHECK (provider IN ('tiktok', 'instagram', 'reddit', 'twitter', 'onlyfans'));
    END IF;
END $$;

-- Create oauth_states table for CSRF protection
CREATE TABLE IF NOT EXISTS oauth_states (
    id SERIAL PRIMARY KEY,
    state VARCHAR(64) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure provider is valid
    CONSTRAINT chk_oauth_states_provider 
    CHECK (provider IN ('tiktok', 'instagram', 'reddit', 'twitter', 'onlyfans'))
);

-- Add indexes for oauth_states
CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON oauth_states(state);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON oauth_states(expires_at);
CREATE INDEX IF NOT EXISTS idx_oauth_states_user_provider ON oauth_states(user_id, provider);

-- Function to cleanup expired OAuth states
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM oauth_states WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log cleanup operation
    INSERT INTO system_logs (level, message, metadata, created_at)
    VALUES (
        'INFO',
        'OAuth states cleanup completed',
        json_build_object('deleted_count', deleted_count),
        NOW()
    );
    
    RETURN deleted_count;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail
        INSERT INTO system_logs (level, message, metadata, created_at)
        VALUES (
            'ERROR',
            'OAuth states cleanup failed',
            json_build_object('error', SQLERRM),
            NOW()
        );
        RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired OAuth tokens
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete tokens expired for more than 7 days (keep for potential refresh)
    DELETE FROM oauth_accounts 
    WHERE expires_at < NOW() - INTERVAL '7 days'
    AND refresh_token_encrypted IS NULL; -- Only delete if no refresh token
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log cleanup operation
    INSERT INTO system_logs (level, message, metadata, created_at)
    VALUES (
        'INFO',
        'OAuth tokens cleanup completed',
        json_build_object('deleted_count', deleted_count),
        NOW()
    );
    
    RETURN deleted_count;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail
        INSERT INTO system_logs (level, message, metadata, created_at)
        VALUES (
            'ERROR',
            'OAuth tokens cleanup failed',
            json_build_object('error', SQLERRM),
            NOW()
        );
        RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- Create system_logs table if it doesn't exist (for logging)
CREATE TABLE IF NOT EXISTS system_logs (
    id BIGSERIAL PRIMARY KEY,
    level VARCHAR(10) NOT NULL DEFAULT 'INFO',
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);

-- Add updated_at trigger for oauth_accounts if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_oauth_accounts_updated_at ON oauth_accounts;
CREATE TRIGGER update_oauth_accounts_updated_at
    BEFORE UPDATE ON oauth_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add some useful views for monitoring
CREATE OR REPLACE VIEW oauth_accounts_summary AS
SELECT 
    provider,
    COUNT(*) as total_accounts,
    COUNT(*) FILTER (WHERE expires_at > NOW()) as active_accounts,
    COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired_accounts,
    COUNT(*) FILTER (WHERE expires_at <= NOW() + INTERVAL '1 hour') as expiring_soon,
    AVG(EXTRACT(EPOCH FROM (expires_at - NOW()))/3600) as avg_hours_until_expiry
FROM oauth_accounts
GROUP BY provider;

-- View for OAuth health monitoring
CREATE OR REPLACE VIEW oauth_health_status AS
SELECT 
    'oauth_accounts' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE expires_at > NOW()) as active_records,
    COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired_records,
    MAX(updated_at) as last_updated
FROM oauth_accounts
UNION ALL
SELECT 
    'oauth_states' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE expires_at > NOW()) as active_records,
    COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired_records,
    MAX(created_at) as last_updated
FROM oauth_states;

COMMIT;

-- Note: Run ANALYZE after migration to update table statistics
-- ANALYZE oauth_accounts;
-- ANALYZE oauth_states;