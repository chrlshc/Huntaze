-- OnlyFans AI User Memory System - Rollback Migration
-- Created: 2024-11-12
-- Description: Rollback script to remove all AI user memory tables and functions

-- ============================================================================
-- DROP HELPER FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS cleanup_old_memories();
DROP FUNCTION IF EXISTS detect_disengagement(VARCHAR(255), VARCHAR(255));
DROP FUNCTION IF EXISTS calculate_engagement_score(VARCHAR(255), VARCHAR(255));
DROP FUNCTION IF EXISTS get_recent_fan_messages(VARCHAR(255), VARCHAR(255), INTEGER);

-- ============================================================================
-- DROP TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS update_emotional_states_updated_at ON emotional_states;
DROP TRIGGER IF EXISTS update_engagement_metrics_updated_at ON engagement_metrics;
DROP TRIGGER IF EXISTS update_fan_preferences_updated_at ON fan_preferences;

-- ============================================================================
-- DROP TABLES (in reverse order of dependencies)
-- ============================================================================

DROP TABLE IF EXISTS emotional_states CASCADE;
DROP TABLE IF EXISTS engagement_metrics CASCADE;
DROP TABLE IF EXISTS personality_profiles CASCADE;
DROP TABLE IF EXISTS fan_preferences CASCADE;
DROP TABLE IF EXISTS fan_memories CASCADE;

-- ============================================================================
-- CLEANUP
-- ============================================================================

-- Note: We don't drop the update_updated_at_column function as it may be used by other tables

COMMIT;
