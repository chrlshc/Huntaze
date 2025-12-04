/**
 * AWS AI System Validation Types
 * 
 * Types and interfaces for validating the AI system components
 * including health checks, killer features, AWS connectivity, and resilience.
 */

// ============================================================================
// Token and Cost Types
// ============================================================================

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface CostBreakdown {
  model: string;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  usedDefaultPricing: boolean;
}

// ============================================================================
// Health Check Types
// ============================================================================

export interface HealthCheckResult {
  healthy: boolean;
  responseTimeMs: number;
  region: string;
  service: string;
  timestamp: Date;
  error?: string;
}

// ============================================================================
// Killer Features Validation Types
// ============================================================================

export interface InsightsValidationResult {
  success: boolean;
  responseTimeMs: number;
  model: string;
  hasRequiredFields: boolean;
  tokenUsage: TokenUsage | null;
  error?: string;
}

export interface CampaignValidationResult {
  success: boolean;
  responseTimeMs: number;
  hasSubjectLine: boolean;
  hasBodyContent: boolean;
  hasVariations: boolean;
  correlationId: string;
  engagementScores: number[];
  error?: string;
}


export type FanSegment = 'Whales' | 'Regulars' | 'At-risk' | 'New' | 'Dormant';

export const VALID_FAN_SEGMENTS: FanSegment[] = ['Whales', 'Regulars', 'At-risk', 'New', 'Dormant'];

export interface SegmentationValidationResult {
  success: boolean;
  responseTimeMs: number;
  model: string;
  validSegments: boolean;
  churnProbabilityValid: boolean;
  hasRecommendations: boolean;
  segments: FanSegment[];
  churnProbability?: number;
  error?: string;
}

// ============================================================================
// AWS Connectivity Types
// ============================================================================

export interface AWSConnectivityResult {
  rdsConnected: boolean;
  secretsManagerAccessible: boolean;
  cloudWatchWritable: boolean;
  routerAccessible: boolean;
  errors: string[];
  timestamp: Date;
}

// ============================================================================
// Resilience Validation Types
// ============================================================================

export interface FallbackValidationResult {
  fallbackTriggered: boolean;
  fallbackTimeMs: number;
  fallbackReason: string;
  legacyProviderUsed: boolean;
  metadata?: Record<string, unknown>;
  error?: string;
}

export interface CircuitBreakerValidationResult {
  circuitOpen: boolean;
  failureCount: number;
  blockedRequests: number;
  resetTimeMs: number;
  threshold: number;
  error?: string;
}

// ============================================================================
// Cost Tracking Types
// ============================================================================

export interface CostValidationResult {
  costCalculated: boolean;
  hasModelName: boolean;
  hasInputTokens: boolean;
  hasOutputTokens: boolean;
  hasTotalCostUsd: boolean;
  calculatedCost: number;
  breakdown?: CostBreakdown;
  error?: string;
}

// ============================================================================
// End-to-End Validation Types
// ============================================================================

export type RequestType = 'chat' | 'math' | 'coding' | 'creative';

export interface AIServiceResponseMetadata {
  model: string;
  deployment: string;
  region: string;
  requestType: RequestType;
}

export interface E2EValidationResult {
  success: boolean;
  responseTimeMs: number;
  metadata: AIServiceResponseMetadata | null;
  routedCorrectly: boolean;
  error?: string;
}

export interface CoordinatorValidationResult {
  success: boolean;
  responseTimeMs: number;
  agentsInvolved: string[];
  outputsCombined: boolean;
  error?: string;
}

// ============================================================================
// Aggregate Validation Report
// ============================================================================

export type ValidationStatus = 'PASS' | 'PARTIAL' | 'FAIL';

export interface ValidationReport {
  timestamp: Date;
  environment: string;
  routerHealth: HealthCheckResult;
  killerFeatures: {
    insights: InsightsValidationResult;
    campaignGenerator: CampaignValidationResult;
    fanSegmentation: SegmentationValidationResult;
  };
  awsConnectivity: AWSConnectivityResult;
  resilience: {
    fallback: FallbackValidationResult;
    circuitBreaker: CircuitBreakerValidationResult;
  };
  costTracking: CostValidationResult;
  e2e: {
    aiService: E2EValidationResult;
    coordinator: CoordinatorValidationResult;
  };
  overallStatus: ValidationStatus;
  errors: string[];
  summary: {
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
  };
}

// ============================================================================
// Validator Interfaces
// ============================================================================

export interface AIRouterHealthValidator {
  checkHealth(): Promise<HealthCheckResult>;
  checkEndpointAccessibility(): Promise<boolean>;
  getRouterUrl(): string;
}

export interface KillerFeaturesValidator {
  validateInsights(metrics: unknown): Promise<InsightsValidationResult>;
  validateCampaignGenerator(request: unknown): Promise<CampaignValidationResult>;
  validateFanSegmentation(fans: unknown[]): Promise<SegmentationValidationResult>;
}

export interface AWSConnectivityValidator {
  validateAll(): Promise<AWSConnectivityResult>;
  checkRDSConnection(): Promise<boolean>;
  checkSecretsManager(): Promise<boolean>;
  checkRouterEndpoint(): Promise<boolean>;
}

export interface ResilienceValidator {
  testFallbackMechanism(): Promise<FallbackValidationResult>;
  testCircuitBreaker(): Promise<CircuitBreakerValidationResult>;
}

export interface CostTrackingValidator {
  validateCostCalculation(usage: TokenUsage): Promise<CostValidationResult>;
  validateCostBreakdown(model: string, usage: TokenUsage): CostBreakdown;
}

export interface E2EValidator {
  validateAIServiceResponse(requestType: RequestType): Promise<E2EValidationResult>;
  validateCoordinatorOrchestration(): Promise<CoordinatorValidationResult>;
}

// ============================================================================
// Helper Functions
// ============================================================================

export function isValidFanSegment(segment: string): segment is FanSegment {
  return VALID_FAN_SEGMENTS.includes(segment as FanSegment);
}

export function isValidChurnProbability(probability: number): boolean {
  return typeof probability === 'number' && probability >= 0 && probability <= 1;
}

export function calculateValidationStatus(
  results: { success: boolean }[]
): ValidationStatus {
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  if (passed === total) return 'PASS';
  if (passed === 0) return 'FAIL';
  return 'PARTIAL';
}
