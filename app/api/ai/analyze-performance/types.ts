/**
 * Type definitions for AI Analyze Performance API
 */

/**
 * Performance metrics for analysis
 */
export interface PerformanceMetrics {
  platforms?: string[];
  contentTypes?: string[];
  timeframe?: string;
  engagementData?: any;
  revenueData?: any;
  audienceData?: any;
}

/**
 * Request body for POST /api/ai/analyze-performance
 */
export interface AnalyzePerformanceRequest {
  metrics: PerformanceMetrics;
}

/**
 * Performance insight
 */
export interface PerformanceInsight {
  type: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  data?: any;
}

/**
 * Performance recommendation
 */
export interface PerformanceRecommendation {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  expectedImpact: string;
  actionItems: string[];
}

/**
 * Performance pattern
 */
export interface PerformancePattern {
  name: string;
  description: string;
  frequency: string;
  confidence: number;
}

/**
 * Performance prediction
 */
export interface PerformancePrediction {
  metric: string;
  prediction: string;
  confidence: number;
  timeframe: string;
}

/**
 * Response data from POST /api/ai/analyze-performance
 */
export interface AnalyzePerformanceResponse {
  insights: PerformanceInsight[];
  recommendations: PerformanceRecommendation[];
  patterns: PerformancePattern[];
  predictions: PerformancePrediction[];
  confidence: number;
  agentsInvolved: string[];
  usage: {
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCostUsd: number;
  };
}
