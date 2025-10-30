/**
 * OnlyFans Gateway - Public API
 * 
 * @module lib/services/onlyfans
 */

export {
  // Gateway
  createOnlyFansGateway,
  OnlyFansGatewayImpl,
} from './gateway';

export {
  // Types
  type OnlyFansGateway,
  type OnlyFansGatewayConfig,
  type ApiResponse,
  type ApiError,
  type Conversation,
  type Message,
  type AuthToken,
  type AuthCredentials,
  type HealthStatus,
  type HumanApproval,
  type RetryConfig,
  type RetryContext,
  type CacheConfig,
  type CacheEntry,
  type RequestMetrics,
  
  // Enums
  ErrorCode,
  
  // Defaults
  DEFAULT_RETRY_CONFIG,
  DEFAULT_CACHE_CONFIG,
  DEFAULT_GATEWAY_CONFIG,
} from './types';
