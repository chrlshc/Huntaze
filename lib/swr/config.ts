/**
 * SWR Configuration for Optimal Performance
 * 
 * Configures SWR with appropriate deduplication intervals and revalidation
 * strategies based on data volatility.
 * 
 * Requirements: 3.1, 3.3, 3.4
 */

import { SWRConfiguration } from 'swr';

/**
 * Data volatility categories determine cache and revalidation strategies
 */
export enum DataVolatility {
  /** Data changes frequently (< 1 minute) - Real-time data */
  HIGH = 'high',
  /** Data changes occasionally (1-10 minutes) - User-specific data */
  MEDIUM = 'medium',
  /** Data changes rarely (> 10 minutes) - Static/reference data */
  LOW = 'low',
  /** Data never changes - Immutable data */
  STATIC = 'static',
}

/**
 * SWR configuration presets based on data volatility
 */
export const SWR_CONFIGS: Record<DataVolatility, SWRConfiguration> = {
  [DataVolatility.HIGH]: {
    // Real-time data: messages, notifications, live metrics
    dedupingInterval: 2000, // 2 seconds - dedupe rapid requests
    revalidateOnFocus: true, // Refresh when user returns
    revalidateOnReconnect: true, // Refresh on reconnect
    refreshInterval: 30000, // Poll every 30 seconds
    errorRetryInterval: 5000, // Retry errors quickly
    errorRetryCount: 3,
    shouldRetryOnError: true,
  },
  
  [DataVolatility.MEDIUM]: {
    // User-specific data: dashboard stats, content lists, integrations
    dedupingInterval: 30000, // 30 seconds - dedupe for half a minute
    revalidateOnFocus: false, // Don't refresh on focus (too expensive)
    revalidateOnReconnect: true, // Refresh on reconnect
    refreshInterval: 60000, // Poll every minute
    errorRetryInterval: 10000,
    errorRetryCount: 2,
    shouldRetryOnError: true,
  },
  
  [DataVolatility.LOW]: {
    // Reference data: settings, templates, categories
    dedupingInterval: 300000, // 5 minutes - long deduplication
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 0, // No automatic refresh
    errorRetryInterval: 30000,
    errorRetryCount: 1,
    shouldRetryOnError: false,
  },
  
  [DataVolatility.STATIC]: {
    // Immutable data: user profile, app config
    dedupingInterval: 3600000, // 1 hour - very long deduplication
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 0, // Never refresh automatically
    errorRetryInterval: 60000,
    errorRetryCount: 1,
    shouldRetryOnError: false,
  },
};

/**
 * Get SWR configuration for a specific endpoint based on its volatility
 */
export function getSWRConfig(volatility: DataVolatility): SWRConfiguration {
  return SWR_CONFIGS[volatility];
}

/**
 * Endpoint volatility mapping
 * Maps API endpoints to their data volatility level
 */
export const ENDPOINT_VOLATILITY: Record<string, DataVolatility> = {
  // High volatility - Real-time data
  '/api/messages': DataVolatility.HIGH,
  '/api/notifications': DataVolatility.HIGH,
  '/api/analytics/live': DataVolatility.HIGH,
  '/api/onlyfans/messages': DataVolatility.HIGH,
  
  // Medium volatility - User-specific data that changes occasionally
  '/api/dashboard': DataVolatility.MEDIUM,
  '/api/content': DataVolatility.MEDIUM,
  '/api/content/drafts': DataVolatility.MEDIUM,
  '/api/integrations/status': DataVolatility.MEDIUM,
  '/api/analytics': DataVolatility.MEDIUM,
  '/api/revenue': DataVolatility.MEDIUM,
  
  // Low volatility - Reference data
  '/api/settings': DataVolatility.LOW,
  '/api/templates': DataVolatility.LOW,
  '/api/categories': DataVolatility.LOW,
  '/api/content/metrics': DataVolatility.LOW,
  
  // Static - Immutable data
  '/api/user/profile': DataVolatility.STATIC,
  '/api/config': DataVolatility.STATIC,
};

/**
 * Get volatility for an endpoint
 * Supports pattern matching for dynamic routes
 */
export function getEndpointVolatility(endpoint: string): DataVolatility {
  // Exact match
  if (ENDPOINT_VOLATILITY[endpoint]) {
    return ENDPOINT_VOLATILITY[endpoint];
  }
  
  // Pattern matching for dynamic routes
  for (const [pattern, volatility] of Object.entries(ENDPOINT_VOLATILITY)) {
    if (endpoint.startsWith(pattern)) {
      return volatility;
    }
  }
  
  // Default to medium volatility for unknown endpoints
  return DataVolatility.MEDIUM;
}

/**
 * Get SWR configuration for a specific endpoint
 */
export function getConfigForEndpoint(endpoint: string): SWRConfiguration {
  const volatility = getEndpointVolatility(endpoint);
  return getSWRConfig(volatility);
}

/**
 * Development-only configuration
 * Disables automatic revalidation to reduce noise during development
 */
export const DEV_SWR_CONFIG: SWRConfiguration = {
  dedupingInterval: 60000, // 1 minute
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  refreshInterval: 0,
  errorRetryCount: 1,
  shouldRetryOnError: false,
};

/**
 * Get SWR configuration based on environment
 */
export function getEnvironmentConfig(endpoint: string): SWRConfiguration {
  if (process.env.NODE_ENV === 'development') {
    return DEV_SWR_CONFIG;
  }
  
  return getConfigForEndpoint(endpoint);
}
