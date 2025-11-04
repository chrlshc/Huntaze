-- Smart Onboarding System Database Migration
-- Created: 2024-11-03
-- Description: Creates all tables and indexes for the Smart Onboarding System

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- =============================================
-- CORE TABLES
-- =============================================

-- User Profiles for Smart Onboarding
CREATE TABLE smart_onboarding_user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    technical_proficiency VARCHAR(20) CHECK (technical_proficiency IN ('beginner', 'intermediate', 'advanced', 'expert')),
    learning_style VARCHAR(20) CHECK (learning_style IN ('visual', 'hands_on', 'guided', 'exploratory')),
    previous_experience VARCHAR(20) CHECK (previous_experience IN ('none', 'basic', 'intermediate', 'advanced')),
    social_connections JSONB DEFAULT '[]',
    content_creation_goals JSONB DEFAULT '[]',
    platform_preferences JSONB DEFAULT '[]',
    time_constraints JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Onboarding Journeys
CREATE TABLE smart_onboarding_journeys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_step_id UUID,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'abandoned')),
    personalized_path_id UUID,
    predicted_success_rate DECIMAL(5,4) DEFAULT 0.5,
    estimated_completion_time INTEGER DEFAULT 0, -- in minutes
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    completion_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning Paths
CREATE TABLE smart_onboarding_learning_paths (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target_persona VARCHAR(50),
    estimated_duration INTEGER DEFAULT 0, -- in minutes
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    steps_order JSONB DEFAULT '[]', -- Array of step IDs in order
    adaptation_rules JSONB DEFAULT '[]',
    effectiveness_score DECIMAL(5,4) DEFAULT 0.5,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Onboarding Steps
CREATE TABLE smart_onboarding_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('introduction', 'assessment', 'tutorial', 'practice', 'configuration', 'completion')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content JSONB DEFAULT '{}',
    estimated_duration INTEGER DEFAULT 0, -- in minutes
    prerequisites JSONB DEFAULT '[]',
    learning_objectives JSONB DEFAULT '[]',
    completion_criteria JSONB DEFAULT '{}',
    adaptation_rules JSONB DEFAULT '[]',
    difficulty_factors JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- BEHAVIORAL ANALYTICS TABLES
-- =============================================

-- Behavior Events (High-volume table for real-time tracking)
CREATE TABLE smart_onboarding_behavior_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL,
    journey_id UUID REFERENCES smart_onboarding_journeys(id) ON DELETE CASCADE,
    step_id UUID REFERENCES smart_onboarding_steps(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    interaction_data JSONB DEFAULT '{}',
    engagement_score DECIMAL(5,4),
    contextual_data JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partition the behavior_events table by month for better performance
CREATE TABLE smart_onboarding_behavior_events_y2024m11 PARTITION OF smart_onboarding_behavior_events
    FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');

-- Engagement Metrics (Aggregated data)
CREATE TABLE smart_onboarding_engagement_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    journey_id UUID REFERENCES smart_onboarding_journeys(id) ON DELETE CASCADE,
    step_id UUID REFERENCES smart_onboarding_steps(id) ON DELETE SET NULL,
    score DECIMAL(5,4) NOT NULL,
    factors JSONB DEFAULT '[]',
    trend VARCHAR(20) CHECK (trend IN ('increasing', 'stable', 'decreasing')),
    prediction JSONB DEFAULT '{}',
    time_window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    time_window_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Struggle Indicators
CREATE TABLE smart_onboarding_struggle_indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    journey_id UUID REFERENCES smart_onboarding_journeys(id) ON DELETE CASCADE,
    step_id UUID REFERENCES smart_onboarding_steps(id) ON DELETE SET NULL,
    overall_score DECIMAL(5,4) NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    duration INTEGER NOT NULL, -- in milliseconds
    indicators JSONB DEFAULT '[]',
    patterns JSONB DEFAULT '[]',
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_method VARCHAR(100)
);

-- =============================================
-- ML AND AI TABLES
-- =============================================

-- User Personas (ML-generated user classifications)
CREATE TABLE smart_onboarding_user_personas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    persona_type VARCHAR(50) NOT NULL,
    confidence_score DECIMAL(5,4) NOT NULL,
    characteristics JSONB DEFAULT '[]',
    predicted_behaviors JSONB DEFAULT '[]',
    recommended_approach JSONB DEFAULT '{}',
    model_version VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, model_version)
);

-- Success Predictions
CREATE TABLE smart_onboarding_success_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    journey_id UUID REFERENCES smart_onboarding_journeys(id) ON DELETE CASCADE,
    current_probability DECIMAL(5,4) NOT NULL,
    factors JSONB DEFAULT '[]',
    risk_factors JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    confidence DECIMAL(5,4) NOT NULL,
    model_version VARCHAR(50),
    prediction_horizon INTEGER DEFAULT 24, -- hours
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- ML Model Training Data
CREATE TABLE smart_onboarding_model_training_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_type VARCHAR(100) NOT NULL,
    input_features JSONB NOT NULL,
    target_output JSONB NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    journey_id UUID REFERENCES smart_onboarding_journeys(id) ON DELETE SET NULL,
    data_quality_score DECIMAL(5,4),
    is_validated BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ML Model Performance Metrics
CREATE TABLE smart_onboarding_model_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_type VARCHAR(100) NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    accuracy DECIMAL(5,4),
    precision_score DECIMAL(5,4),
    recall DECIMAL(5,4),
    f1_score DECIMAL(5,4),
    training_samples INTEGER,
    validation_samples INTEGER,
    training_duration INTEGER, -- in seconds
    deployment_status VARCHAR(20) DEFAULT 'training' CHECK (deployment_status IN ('training', 'validating', 'deployed', 'deprecated')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INTERVENTION TABLES
-- =============================================

-- Interventions
CREATE TABLE smart_onboarding_interventions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    journey_id UUID REFERENCES smart_onboarding_journeys(id) ON DELETE CASCADE,
    step_id UUID REFERENCES smart_onboarding_steps(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL,
    trigger_reason VARCHAR(100) NOT NULL,
    content JSONB NOT NULL,
    timing JSONB DEFAULT '{}',
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'accepted', 'dismissed', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Intervention Outcomes
CREATE TABLE smart_onboarding_intervention_outcomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    intervention_id UUID NOT NULL REFERENCES smart_onboarding_interventions(id) ON DELETE CASCADE,
    user_response VARCHAR(50) NOT NULL,
    engagement_change DECIMAL(5,4),
    completion_impact DECIMAL(5,4),
    time_to_resolution INTEGER, -- in seconds
    user_feedback JSONB DEFAULT '{}',
    effectiveness_score DECIMAL(5,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Help Content
CREATE TABLE smart_onboarding_help_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content JSONB NOT NULL,
    target_context JSONB DEFAULT '{}',
    effectiveness_metrics JSONB DEFAULT '{}',
    usage_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Escalation Tickets
CREATE TABLE smart_onboarding_escalation_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    journey_id UUID REFERENCES smart_onboarding_journeys(id) ON DELETE CASCADE,
    issue_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    assigned_to UUID,
    context_data JSONB DEFAULT '{}',
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- CONTENT AND PERSONALIZATION TABLES
-- =============================================

-- Content Variations
CREATE TABLE smart_onboarding_content_variations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    step_id UUID NOT NULL REFERENCES smart_onboarding_steps(id) ON DELETE CASCADE,
    variation_type VARCHAR(50) NOT NULL,
    content JSONB NOT NULL,
    target_persona JSONB DEFAULT '[]',
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    effectiveness_score DECIMAL(5,4) DEFAULT 0.5,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Personalized Content Assignments
CREATE TABLE smart_onboarding_personalized_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    step_id UUID NOT NULL REFERENCES smart_onboarding_steps(id) ON DELETE CASCADE,
    variation_id UUID NOT NULL REFERENCES smart_onboarding_content_variations(id) ON DELETE CASCADE,
    assignment_reason JSONB DEFAULT '{}',
    effectiveness_feedback JSONB DEFAULT '{}',
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, step_id)
);

-- Content Recommendations
CREATE TABLE smart_onboarding_content_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    step_id UUID REFERENCES smart_onboarding_steps(id) ON DELETE CASCADE,
    recommendations JSONB NOT NULL,
    reasoning JSONB DEFAULT '{}',
    confidence DECIMAL(5,4) NOT NULL,
    alternatives JSONB DEFAULT '[]',
    model_version VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Adaptation History
CREATE TABLE smart_onboarding_adaptation_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    journey_id UUID REFERENCES smart_onboarding_journeys(id) ON DELETE CASCADE,
    step_id UUID REFERENCES smart_onboarding_steps(id) ON DELETE SET NULL,
    adaptation_type VARCHAR(50) NOT NULL,
    from_state JSONB DEFAULT '{}',
    to_state JSONB DEFAULT '{}',
    trigger_reason VARCHAR(100),
    effectiveness DECIMAL(5,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ANALYTICS AND REPORTING TABLES
-- =============================================

-- Behavioral Insights (Aggregated analytics)
CREATE TABLE smart_onboarding_behavioral_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    time_window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    time_window_end TIMESTAMP WITH TIME ZONE NOT NULL,
    patterns JSONB DEFAULT '[]',
    preferences JSONB DEFAULT '[]',
    learning_style JSONB DEFAULT '{}',
    recommendations JSONB DEFAULT '[]',
    confidence DECIMAL(5,4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Path Performance Metrics
CREATE TABLE smart_onboarding_path_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    path_id UUID NOT NULL REFERENCES smart_onboarding_learning_paths(id) ON DELETE CASCADE,
    time_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    time_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    total_users INTEGER DEFAULT 0,
    completed_users INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,4),
    average_completion_time INTEGER, -- in minutes
    average_engagement_score DECIMAL(5,4),
    common_struggles JSONB DEFAULT '[]',
    improvement_suggestions JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A/B Test Experiments
CREATE TABLE smart_onboarding_experiments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    experiment_type VARCHAR(50) NOT NULL,
    variations JSONB NOT NULL,
    target_criteria JSONB DEFAULT '{}',
    success_metrics JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed', 'cancelled')),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    sample_size INTEGER,
    confidence_level DECIMAL(5,4) DEFAULT 0.95,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Experiment Results
CREATE TABLE smart_onboarding_experiment_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id UUID NOT NULL REFERENCES smart_onboarding_experiments(id) ON DELETE CASCADE,
    variation_id VARCHAR(100) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    metrics JSONB DEFAULT '{}',
    outcome VARCHAR(50),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Metrics (Performance monitoring)
CREATE TABLE smart_onboarding_system_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_type VARCHAR(100) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    value DECIMAL(10,4) NOT NULL,
    unit VARCHAR(20),
    tags JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Core table indexes
CREATE INDEX idx_user_profiles_user_id ON smart_onboarding_user_profiles(user_id);
CREATE INDEX idx_journeys_user_status ON smart_onboarding_journeys(user_id, status);
CREATE INDEX idx_journeys_status_active ON smart_onboarding_journeys(status, last_active_at) WHERE status = 'active';

-- Behavioral analytics indexes
CREATE INDEX idx_behavior_events_user_timestamp ON smart_onboarding_behavior_events(user_id, timestamp DESC);
CREATE INDEX idx_behavior_events_session ON smart_onboarding_behavior_events(session_id, timestamp);
CREATE INDEX idx_engagement_metrics_user_time ON smart_onboarding_engagement_metrics(user_id, time_window_start DESC);
CREATE INDEX idx_struggle_indicators_user_severity ON smart_onboarding_struggle_indicators(user_id, severity, detected_at DESC);

-- ML and AI indexes
CREATE INDEX idx_personas_user_confidence ON smart_onboarding_user_personas(user_id, confidence_score DESC);
CREATE INDEX idx_predictions_user_timestamp ON smart_onboarding_success_predictions(user_id, created_at DESC);
CREATE INDEX idx_training_data_model_type ON smart_onboarding_model_training_data(model_type, created_at DESC);

-- Intervention indexes
CREATE INDEX idx_interventions_user_status ON smart_onboarding_interventions(user_id, status);
CREATE INDEX idx_interventions_priority_created ON smart_onboarding_interventions(priority, created_at DESC) WHERE status = 'pending';
CREATE INDEX idx_escalation_tickets_status ON smart_onboarding_escalation_tickets(status, created_at DESC);

-- Content indexes
CREATE INDEX idx_content_variations_step ON smart_onboarding_content_variations(step_id, is_active);
CREATE INDEX idx_personalized_content_user ON smart_onboarding_personalized_content(user_id, assigned_at DESC);
CREATE INDEX idx_recommendations_user_expires ON smart_onboarding_content_recommendations(user_id, expires_at);

-- Analytics indexes
CREATE INDEX idx_path_performance_path_time ON smart_onboarding_path_performance(path_id, time_period_start DESC);
CREATE INDEX idx_experiments_status ON smart_onboarding_experiments(status, start_date);
CREATE INDEX idx_system_metrics_type_timestamp ON smart_onboarding_system_metrics(metric_type, timestamp DESC);

-- GIN indexes for JSONB columns (for complex queries)
CREATE INDEX idx_behavior_events_interaction_data ON smart_onboarding_behavior_events USING GIN(interaction_data);
CREATE INDEX idx_user_profiles_goals ON smart_onboarding_user_profiles USING GIN(content_creation_goals);
CREATE INDEX idx_personas_characteristics ON smart_onboarding_user_personas USING GIN(characteristics);

-- =============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON smart_onboarding_user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_journeys_updated_at BEFORE UPDATE ON smart_onboarding_journeys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_learning_paths_updated_at BEFORE UPDATE ON smart_onboarding_learning_paths FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_steps_updated_at BEFORE UPDATE ON smart_onboarding_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_personas_updated_at BEFORE UPDATE ON smart_onboarding_user_personas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_help_content_updated_at BEFORE UPDATE ON smart_onboarding_help_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_variations_updated_at BEFORE UPDATE ON smart_onboarding_content_variations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_experiments_updated_at BEFORE UPDATE ON smart_onboarding_experiments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update journey last_active_at when behavior events are inserted
CREATE OR REPLACE FUNCTION update_journey_last_active()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE smart_onboarding_journeys 
    SET last_active_at = NEW.timestamp 
    WHERE id = NEW.journey_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_journey_activity AFTER INSERT ON smart_onboarding_behavior_events FOR EACH ROW EXECUTE FUNCTION update_journey_last_active();

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- Active journeys with user information
CREATE VIEW smart_onboarding_active_journeys AS
SELECT 
    j.id,
    j.user_id,
    up.email,
    up.technical_proficiency,
    j.current_step_id,
    j.predicted_success_rate,
    j.started_at,
    j.last_active_at,
    EXTRACT(EPOCH FROM (NOW() - j.last_active_at))/3600 as hours_since_last_active
FROM smart_onboarding_journeys j
JOIN smart_onboarding_user_profiles up ON j.user_id = up.user_id
WHERE j.status = 'active';

-- User engagement summary
CREATE VIEW smart_onboarding_user_engagement_summary AS
SELECT 
    user_id,
    COUNT(*) as total_sessions,
    AVG(score) as average_engagement,
    MAX(score) as peak_engagement,
    MIN(score) as lowest_engagement,
    COUNT(*) FILTER (WHERE score < 0.4) as low_engagement_sessions,
    MAX(created_at) as last_engagement_recorded
FROM smart_onboarding_engagement_metrics
GROUP BY user_id;

-- System health dashboard
CREATE VIEW smart_onboarding_system_health AS
SELECT 
    metric_type,
    metric_name,
    AVG(value) as avg_value,
    MAX(value) as max_value,
    MIN(value) as min_value,
    COUNT(*) as data_points,
    MAX(timestamp) as last_recorded
FROM smart_onboarding_system_metrics
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY metric_type, metric_name;

-- =============================================
-- INITIAL DATA SETUP
-- =============================================

-- Insert default learning paths
INSERT INTO smart_onboarding_learning_paths (name, description, target_persona, estimated_duration, difficulty_level) VALUES
('Content Creator Fast Track', 'Optimized path for experienced content creators', 'content_creator', 15, 2),
('Business User Essentials', 'Streamlined onboarding for business users', 'business_user', 20, 1),
('Influencer Pro Setup', 'Advanced setup for influencers and agencies', 'influencer', 25, 3),
('Beginner Friendly Journey', 'Comprehensive introduction for new users', 'casual_user', 35, 1);

-- Insert default onboarding steps
INSERT INTO smart_onboarding_steps (type, title, description, estimated_duration) VALUES
('introduction', 'Welcome to Smart Onboarding', 'AI-powered personalized introduction', 2),
('assessment', 'Quick Proficiency Assessment', 'Determine your experience level', 3),
('tutorial', 'Platform Overview', 'Interactive platform tour', 5),
('configuration', 'Connect Your Accounts', 'Link social media accounts', 4),
('practice', 'Create Your First Content', 'Hands-on content creation', 8),
('completion', 'Journey Complete', 'Celebrate and next steps', 2);

-- Insert default help content
INSERT INTO smart_onboarding_help_content (type, title, content) VALUES
('tooltip', 'Getting Started', '{"text": "Click here to begin your personalized onboarding journey", "position": "bottom"}'),
('modal', 'Need Help?', '{"title": "We''re here to help!", "message": "Our AI assistant can guide you through any step", "actions": ["Get Help", "Continue"]}'),
('tutorial', 'Navigation Basics', '{"steps": [{"instruction": "Use the progress bar to track your journey", "target": ".progress-bar"}]}');

-- Create initial system metrics
INSERT INTO smart_onboarding_system_metrics (metric_type, metric_name, value, unit) VALUES
('performance', 'avg_response_time', 150.0, 'ms'),
('engagement', 'global_engagement_score', 0.75, 'score'),
('completion', 'journey_completion_rate', 0.82, 'rate'),
('system', 'active_users', 0, 'count');

COMMIT;