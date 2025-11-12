-- Shopify-Style Onboarding System Rollback Migration
-- Created: 2024-11-11
-- Description: Rollback script to safely remove Shopify-style onboarding tables

-- ============================================================================
-- DROP HELPER FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS can_transition_to(TEXT, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS calculate_onboarding_progress(UUID, TEXT);
DROP FUNCTION IF EXISTS has_step_done(UUID, TEXT);

-- ============================================================================
-- DROP TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS update_user_consent_updated_at ON user_consent;
DROP TRIGGER IF EXISTS update_user_onboarding_updated_at ON user_onboarding;
DROP TRIGGER IF EXISTS update_step_definitions_updated_at ON onboarding_step_definitions;

-- ============================================================================
-- DROP INDEXES
-- ============================================================================

-- User consent indexes
DROP INDEX IF EXISTS idx_user_consent_granted;
DROP INDEX IF EXISTS idx_user_consent_user_type;

-- Onboarding events indexes
DROP INDEX IF EXISTS idx_onboarding_events_step;
DROP INDEX IF EXISTS idx_onboarding_events_correlation;
DROP INDEX IF EXISTS idx_onboarding_events_type_created;
DROP INDEX IF EXISTS idx_onboarding_events_user_type_created;

-- User onboarding indexes
DROP INDEX IF EXISTS idx_user_onboarding_snooze;
DROP INDEX IF EXISTS idx_user_onboarding_step_version;
DROP INDEX IF EXISTS idx_user_onboarding_user_status;

-- Step definitions indexes
DROP INDEX IF EXISTS idx_step_definitions_required;
DROP INDEX IF EXISTS idx_step_definitions_market;
DROP INDEX IF EXISTS idx_step_definitions_active;

-- ============================================================================
-- DROP TABLES
-- ============================================================================

DROP TABLE IF EXISTS user_consent CASCADE;
DROP TABLE IF EXISTS onboarding_events CASCADE;
DROP TABLE IF EXISTS user_onboarding CASCADE;
DROP TABLE IF EXISTS onboarding_step_definitions CASCADE;

-- ============================================================================
-- CLEANUP
-- ============================================================================

-- Note: We don't drop the update_updated_at_column() function as it may be used by other tables

COMMIT;
