-- Shopify-Style Onboarding System Database Migration
-- Created: 2024-11-11
-- Description: Non-blocking onboarding with flexible step management, gating middleware, and analytics

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- STEP DEFINITIONS TABLE
-- ============================================================================
-- Stores onboarding step definitions with versioning support
CREATE TABLE IF NOT EXISTS onboarding_step_definitions (
  id TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Step details
  title TEXT NOT NULL,
  description TEXT,
  
  -- Configuration
  required BOOLEAN NOT NULL DEFAULT FALSE,
  weight INTEGER NOT NULL DEFAULT 0,
  
  -- Role and market filtering
  role_visibility TEXT[] DEFAULT ARRAY['owner', 'staff', 'admin'],
  market_rule JSONB,
  
  -- Plan-based eligibility
  required_plan TEXT,
  
  -- Lifecycle management
  active_from TIMESTAMPTZ,
  active_to TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  PRIMARY KEY (id, version),
  UNIQUE(id, version)
);

-- ============================================================================
-- USER ONBOARDING TABLE
-- ============================================================================
-- Tracks user progress through onboarding steps
CREATE TABLE IF NOT EXISTS user_onboarding (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Status tracking
  status TEXT NOT NULL CHECK (status IN ('todo', 'done', 'skipped')),
  
  -- Snooze functionality
  snooze_until TIMESTAMPTZ,
  snooze_count INTEGER NOT NULL DEFAULT 0,
  
  -- Audit trail
  completed_by UUID REFERENCES users(id),
  completed_at TIMESTAMPTZ,
  
  -- Metadata
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  PRIMARY KEY (user_id, step_id, version),
  FOREIGN KEY (step_id, version) REFERENCES onboarding_step_definitions(id, version)
);

-- ============================================================================
-- ONBOARDING EVENTS TABLE
-- ============================================================================
-- Analytics events for onboarding interactions
CREATE TABLE IF NOT EXISTS onboarding_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Event details
  event_type TEXT NOT NULL,
  step_id TEXT,
  version INTEGER,
  
  -- Additional data
  metadata JSONB,
  
  -- Request tracing
  correlation_id UUID,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- USER CONSENT TABLE
-- ============================================================================
-- GDPR consent tracking for analytics
CREATE TABLE IF NOT EXISTS user_consent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Consent details
  consent_type TEXT NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Metadata
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, consent_type)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Step definitions indexes
CREATE INDEX idx_step_definitions_active ON onboarding_step_definitions(active_from, active_to) 
  WHERE active_to IS NULL OR active_to >= NOW();
CREATE INDEX idx_step_definitions_market ON onboarding_step_definitions USING GIN(market_rule);
CREATE INDEX idx_step_definitions_required ON onboarding_step_definitions(required) WHERE required = TRUE;

-- User onboarding indexes
CREATE INDEX idx_user_onboarding_user_status ON user_onboarding(user_id, status);
CREATE INDEX idx_user_onboarding_step_version ON user_onboarding(step_id, version);
CREATE INDEX idx_user_onboarding_snooze ON user_onboarding(user_id, snooze_until) 
  WHERE snooze_until IS NOT NULL;

-- Onboarding events indexes
CREATE INDEX idx_onboarding_events_user_type_created ON onboarding_events(user_id, event_type, created_at);
CREATE INDEX idx_onboarding_events_type_created ON onboarding_events(event_type, created_at);
CREATE INDEX idx_onboarding_events_correlation ON onboarding_events(correlation_id) 
  WHERE correlation_id IS NOT NULL;
CREATE INDEX idx_onboarding_events_step ON onboarding_events(step_id, created_at) 
  WHERE step_id IS NOT NULL;

-- User consent indexes
CREATE INDEX idx_user_consent_user_type ON user_consent(user_id, consent_type);
CREATE INDEX idx_user_consent_granted ON user_consent(granted) WHERE granted = TRUE;

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp (reuse existing if available)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Triggers for updated_at columns
DROP TRIGGER IF EXISTS update_step_definitions_updated_at ON onboarding_step_definitions;
CREATE TRIGGER update_step_definitions_updated_at
  BEFORE UPDATE ON onboarding_step_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_onboarding_updated_at ON user_onboarding;
CREATE TRIGGER update_user_onboarding_updated_at
  BEFORE UPDATE ON user_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_consent_updated_at ON user_consent;
CREATE TRIGGER update_user_consent_updated_at
  BEFORE UPDATE ON user_consent
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user has completed a step
CREATE OR REPLACE FUNCTION has_step_done(p_user_id UUID, p_step_id TEXT)
RETURNS BOOLEAN AS $
DECLARE
  v_status TEXT;
BEGIN
  SELECT status INTO v_status
  FROM user_onboarding
  WHERE user_id = p_user_id 
    AND step_id = p_step_id
  ORDER BY version DESC
  LIMIT 1;
  
  RETURN v_status = 'done';
END;
$ LANGUAGE plpgsql;

-- Function to calculate user progress
CREATE OR REPLACE FUNCTION calculate_onboarding_progress(p_user_id UUID, p_market TEXT DEFAULT NULL)
RETURNS INTEGER AS $
DECLARE
  v_total_weight INTEGER := 0;
  v_completed_weight INTEGER := 0;
  v_step RECORD;
  v_user_step RECORD;
BEGIN
  -- Get active steps for market
  FOR v_step IN 
    SELECT id, version, required, weight
    FROM onboarding_step_definitions
    WHERE (active_from IS NULL OR active_from <= NOW())
      AND (active_to IS NULL OR active_to >= NOW())
      AND (p_market IS NULL OR market_rule IS NULL OR market_rule @> jsonb_build_object('markets', jsonb_build_array(p_market)))
  LOOP
    -- Get user's status for this step
    SELECT status INTO v_user_step
    FROM user_onboarding
    WHERE user_id = p_user_id 
      AND step_id = v_step.id 
      AND version = v_step.version;
    
    -- Include in total if required OR not skipped
    IF v_step.required OR (v_user_step.status IS NULL OR v_user_step.status != 'skipped') THEN
      v_total_weight := v_total_weight + v_step.weight;
      
      IF v_user_step.status = 'done' THEN
        v_completed_weight := v_completed_weight + v_step.weight;
      END IF;
    END IF;
  END LOOP;
  
  IF v_total_weight = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND((v_completed_weight::DECIMAL / v_total_weight) * 100);
END;
$ LANGUAGE plpgsql;

-- Function to check if step can transition to new status
CREATE OR REPLACE FUNCTION can_transition_to(
  p_current_status TEXT,
  p_new_status TEXT,
  p_is_required BOOLEAN
)
RETURNS BOOLEAN AS $
BEGIN
  -- Cannot skip required steps
  IF p_new_status = 'skipped' AND p_is_required THEN
    RETURN FALSE;
  END IF;
  
  -- Can always mark as done
  IF p_new_status = 'done' THEN
    RETURN TRUE;
  END IF;
  
  -- Can skip from todo if not required
  IF p_current_status = 'todo' AND p_new_status = 'skipped' AND NOT p_is_required THEN
    RETURN TRUE;
  END IF;
  
  -- Cannot transition from done to skipped
  IF p_current_status = 'done' AND p_new_status = 'skipped' THEN
    RETURN FALSE;
  END IF;
  
  RETURN FALSE;
END;
$ LANGUAGE plpgsql;

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert core onboarding steps
INSERT INTO onboarding_step_definitions (id, version, title, description, required, weight, role_visibility) VALUES
  ('email_verification', 1, 'Vérifier votre email', 'Confirmez votre adresse email pour sécuriser votre compte', TRUE, 20, ARRAY['owner', 'staff', 'admin']),
  ('payments', 1, 'Configurer les paiements', 'Ajoutez vos informations de paiement pour encaisser', TRUE, 30, ARRAY['owner']),
  ('theme', 1, 'Personnaliser le thème', 'Choisissez et personnalisez votre thème', FALSE, 15, ARRAY['owner', 'admin']),
  ('product', 1, 'Ajouter un produit', 'Créez votre premier produit', FALSE, 20, ARRAY['owner', 'staff', 'admin']),
  ('domain', 1, 'Connecter un domaine', 'Ajoutez votre nom de domaine personnalisé', FALSE, 15, ARRAY['owner'])
ON CONFLICT (id, version) DO NOTHING;

-- Insert market-specific steps
INSERT INTO onboarding_step_definitions (id, version, title, description, required, weight, role_visibility, market_rule) VALUES
  ('impressum', 1, 'Ajouter Impressum', 'Mentions légales obligatoires en Allemagne', TRUE, 10, ARRAY['owner'], '{"markets": ["DE"]}'::jsonb),
  ('mentions_legales', 1, 'Mentions légales', 'Informations légales obligatoires en France', TRUE, 10, ARRAY['owner'], '{"markets": ["FR"]}'::jsonb),
  ('politique_retours', 1, 'Politique de retours', 'Définissez votre politique de retours', TRUE, 10, ARRAY['owner'], '{"markets": ["FR"]}'::jsonb)
ON CONFLICT (id, version) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE onboarding_step_definitions IS 'Defines onboarding steps with versioning and market-specific rules';
COMMENT ON TABLE user_onboarding IS 'Tracks user progress through onboarding steps';
COMMENT ON TABLE onboarding_events IS 'Analytics events for onboarding interactions and tracking';
COMMENT ON TABLE user_consent IS 'GDPR consent tracking for analytics and data processing';

COMMENT ON COLUMN onboarding_step_definitions.required IS 'Whether step is required (enforced by gating middleware)';
COMMENT ON COLUMN onboarding_step_definitions.weight IS 'Weight for progress calculation';
COMMENT ON COLUMN onboarding_step_definitions.market_rule IS 'JSONB rules for market-specific requirements';
COMMENT ON COLUMN onboarding_step_definitions.role_visibility IS 'Array of roles that can see this step';

COMMENT ON COLUMN user_onboarding.status IS 'Step status: todo, done, or skipped';
COMMENT ON COLUMN user_onboarding.snooze_until IS 'Timestamp until which nudges are snoozed';
COMMENT ON COLUMN user_onboarding.snooze_count IS 'Number of times user has snoozed (max 3)';

COMMENT ON COLUMN onboarding_events.event_type IS 'Event type: step_completed, step_skipped, nudge_snoozed, gating.blocked, etc.';
COMMENT ON COLUMN onboarding_events.correlation_id IS 'UUID for request tracing and debugging';

COMMIT;
