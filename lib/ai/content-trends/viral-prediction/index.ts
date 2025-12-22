/**
 * Viral Prediction Module
 * 
 * Exports for the viral prediction engine and related components.
 * Provides viral mechanism detection, emotional analysis, and
 * replicability scoring for content analysis.
 */

// Types
export type {
  // Core types
  ViralMechanismType,
  EmotionalTriggerCategory,
  VisualElementType,
  // Mechanism analysis
  ViralMechanism,
  DissonanceAnalysis,
  // Emotional analysis
  EmotionalTrigger,
  // Visual analysis
  VisualElement,
  // Engagement
  EngagementMetrics,
  EngagementData,
  // Complete analysis
  ViralAnalysis,
  ActionableInsight,
  ReplicationRecommendation,
  // Input types
  MultimodalContent,
  ViralAnalysisConfig,
  // Scoring
  ReplicabilityScoreBreakdown,
  ViralPotentialPrediction,
} from './types';

// Mechanism Detector
export {
  MechanismDetector,
  createMechanismDetector,
} from './mechanism-detector';

// Emotional Analyzer
export {
  EmotionalAnalyzer,
  createEmotionalAnalyzer,
} from './emotional-analyzer';

// Replicability Scorer
export {
  ReplicabilityScorer,
  createReplicabilityScorer,
} from './replicability-scorer';

// Insight Generator
export {
  InsightGenerator,
  createInsightGenerator,
} from './insight-generator';

// Viral Prediction Engine (main orchestrator)
export {
  ViralPredictionEngine,
  getViralPredictionEngine,
  createViralPredictionEngine,
} from './viral-prediction-engine';
