/**
 * Azure AI Foundry Integration Module
 * 
 * Provides TypeScript client for the Python AI Router service
 * that routes requests to Azure AI Foundry models.
 */

export {
  RouterClient,
  RouterError,
  RouterErrorCode,
  getRouterClient,
  createRouterClient,
  type RouterClientConfig,
  type RouterRequest,
  type RouterResponse,
  type RouterRouting,
  type RouterUsage,
  type HealthCheckResponse,
} from './router-client';

export {
  planToTier,
  agentTypeHint,
  detectFrenchLanguage,
  detectLanguage,
  mapping,
  type UserPlan,
  type ClientTier,
  type TypeHint,
  type LanguageHint,
  type AgentType,
} from './mapping';

export {
  calculateCost,
  calculateCostBreakdown,
  calculateCostSimple,
  convertRouterUsage,
  getModelPricing,
  isModelSupported,
  getSupportedModels,
  MODEL_PRICING,
  DEFAULT_PRICING,
  DEFAULT_MODEL,
  type ModelPricing,
  type UsageStatistics,
  type CostBreakdown,
} from './cost-calculator';

// Re-export agents that use Foundry
export {
  FoundryMessagingAgent,
  createFoundryMessagingAgent,
  type MessagingRequest,
  type MessagingResponseData,
  type MessagingUsage,
} from '../agents/messaging.foundry';

export {
  FoundryAnalyticsAgent,
  createFoundryAnalyticsAgent,
  type AnalyticsRequest,
  type AnalyticsResponseData,
  type AnalyticsUsage,
  type AnalyticsInsight,
  type AnalyticsPrediction,
  type AnalyticsRecommendation,
} from '../agents/analytics.foundry';

export {
  FoundrySalesAgent,
  createFoundrySalesAgent,
  type SalesRequest,
  type SalesResponseData,
  type SalesUsage,
} from '../agents/sales.foundry';

export {
  FoundryComplianceAgent,
  createFoundryComplianceAgent,
  type ComplianceRequest,
  type ComplianceResponseData,
  type ComplianceUsage,
  type ComplianceViolation,
} from '../agents/compliance.foundry';

// Agent Registry
export {
  FoundryAgentRegistry,
  getFoundryAgentRegistry,
  getInitializedRegistry,
  type FoundryAgentType,
  type FoundryAgent,
  type AgentRequestMap,
  type AgentResponseMap,
  type RegistryConfig,
} from './agent-registry';

// Retry utility
export {
  withRetry,
  retryWithThrow,
  createRetryWrapper,
  calculateDelay,
  isRetryableError,
  sleep,
  DEFAULT_RETRY_CONFIG,
  RETRYABLE_ERROR_CODES,
  RETRYABLE_HTTP_STATUS_CODES,
  type RetryConfig,
  type RetryResult,
} from './retry';

// Circuit Breaker
export {
  CircuitBreaker,
  CircuitBreakerRegistry,
  CircuitOpenError,
  getCircuitBreaker,
  getCircuitBreakerRegistry,
  DEFAULT_CIRCUIT_CONFIG,
  type CircuitState,
  type CircuitBreakerConfig,
  type CircuitStats,
} from './circuit-breaker';

// Provider Config
export {
  AIProviderConfig,
  getAIProviderConfig,
  shouldUseFoundry,
  type AIProvider,
  type AIProviderConfigOptions,
} from '../config/provider-config';
