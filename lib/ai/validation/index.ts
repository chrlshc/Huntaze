/**
 * AWS AI System Validation Module
 * 
 * Exports all validation types, validators, and utilities for
 * validating the AI system components on AWS infrastructure.
 */

// Types
export * from './types';

// Phase 1 Validators
export { RouterHealthValidator, createHealthValidator, quickHealthCheck } from './health-validator';
export { InsightsValidator, createInsightsValidator } from './insights-validator';
export { CampaignValidator, createCampaignValidator } from './campaign-validator';
export { SegmentationValidator, createSegmentationValidator } from './segmentation-validator';

// Phase 2 Validators
export {
  AWSConnectivityValidatorService,
  getAWSConnectivityValidator,
  validateAWSConnectivity,
  createMockAWSConnectivityValidator,
} from './aws-connectivity-validator';

export {
  FallbackValidatorService,
  getFallbackValidator,
  testFallback,
  createMockFallbackResult,
  isValidFallbackResult,
} from './fallback-validator';
export type { FallbackReason } from './fallback-validator';

export {
  CircuitBreakerValidatorService,
  getCircuitBreakerValidator,
  testCircuitBreaker,
  createMockCircuitBreakerResult,
  isValidCircuitBreakerBehavior,
  simulateCircuitBreakerBehavior,
} from './circuit-breaker-validator';
export type { CircuitState, CircuitBreakerState } from './circuit-breaker-validator';

export {
  CostValidatorService,
  getCostValidator,
  validateCost,
  createMockCostResult,
  createMockTokenUsage,
  isValidCostBreakdown,
} from './cost-validator';

export {
  E2EValidatorService,
  getE2EValidator,
  validateMetadataFields,
  validateModelForRequestType,
  isValidRegion,
  isValidDeployment,
  createMockE2EResult,
  createMockCoordinatorResult,
  createMockMetadata,
  getValidModelsForRequestType,
  getAllRequestTypes,
} from './e2e-validator';

// Phase 3 - Validation Runner
export {
  ValidationRunner,
  getValidationRunner,
  runValidation,
  formatReport,
} from './validation-runner';
export type { ValidationRunnerConfig } from './validation-runner';

// Re-export types from validators
export type { MetricsData, InsightResponse, InsightsAPIResponse } from './insights-validator';
export type { CampaignRequest, CampaignVariation, CampaignAPIResponse } from './campaign-validator';
export type { Fan, SegmentedFan, SegmentationAPIResponse } from './segmentation-validator';
