# Multi-Account API Integration - Optimization Guide

**Date**: 2025-11-18  
**Status**: ✅ Complete  
**Related**: Property 7 - Multi-Account Support

## Executive Summary

This document provides comprehensive optimization guidelines for the multi-account integration API, covering error handling, retry strategies, TypeScript types, authentication, caching, logging, and documentation.

## 1. Error Handling & Boundaries

### Current Implementation ✅

The `useIntegrations` hook already implements:
- User-friendly error messages
- HTTP status code handling
- Network error detection
- Error state management

### Enhancements Needed

#### 1.1 Add Retry Logic with Exponential Backoff

```typescript
// hooks/useIntegrations.ts - Add retry utility

interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableStatusCodes: number[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 5000,
  backoffFactor: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

async function fetchWithRetry<T>(
  url: string,
  options: RequestInit = {},
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error | null = null;
  let delay = config.initialDelay;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // Success - return data
      if (response.ok) {
        return await response.json();
      }
      
      // Check if error is retryable
      if (!config.retryableStatusCodes.includes(response.status)) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || response.statusText);
      }
      
      // Retryable error - prepare for retry
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      
    } catch (error: any) {
      lastError = error;
      
      // Network errors are retryable
      if (!(error instanceof TypeError && error.message.includes('fetch'))) {
        throw error;
      }
    }
    
    // Don't wait after last attempt
    if (attempt < config.maxRetries) {
      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * config.backoffFactor, config.maxDelay);
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}
```

#### 1.2 Add Error Boundary for Multi-Account Operations

```typescript
// hooks/useIntegrations.ts - Enhanced error handling

interface IntegrationError extends Error {
  provider?: string;
  accountId?: string;
  statusCode?: number;
  retryable: boolean;
  correlationId?: string;
}

function createIntegrationError(
  message: string,
  provider?: string,
  accountId?: string,
  statusCode?: number,
  retryable: boolean = false
): IntegrationError {
  const error = new Error(message) as IntegrationError;
  error.provider = provider;
  error.accountId = accountId;
  error.statusCode = statusCode;
  error.retryable = retryable;
  error.correlationId = crypto.randomUUID();
  return error;
}
```

## 2. TypeScript Types for API Responses

### 2.1 Complete Type Definitions

```typescript
// lib/services/integrations/types.ts - Add API response types

/**
 * API Response wrapper
 */
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
  correlationId: string;
  timestamp: string;
}

/**
 * API Error structure
 */
export interface APIError {
  type: string;
  message: string;
  userMessage: string;
  statusCode: number;
  retryable: boolean;
  details?: Record<string, any>;
}

/**
 * Integration status response
 */
export interface IntegrationStatusResponse {
  integrations: IntegrationData[];
  summary: {
    total: number;
    connected: number;
    expired: number;
    byProvider: Record<Provider, number>;
  };
}

/**
 * Integration data from API
 */
export interface IntegrationData {
  id: number;
  provider: Provider;
  accountId: string;
  accountName: string;
  status: 'connected' | 'expired' | 'error';
  expiresAt?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Connect integration response
 */
export interface ConnectIntegrationResponse {
  authUrl: string;
  state: string;
  expiresAt: string;
}

/**
 * Disconnect integration response
 */
export interface DisconnectIntegrationResponse {
  success: boolean;
  provider: Provider;
  accountId: string;
  message: string;
}

/**
 * Refresh token response
 */
export interface RefreshTokenResponse {
  success: boolean;
  provider: Provider;
  accountId: string;
  expiresAt: string;
}
```

### 2.2 Type Guards

```typescript
// lib/services/integrations/types.ts - Add type guards

export function isAPIResponse<T>(value: any): value is APIResponse<T> {
  return (
    value &&
    typeof value === 'object' &&
    'success' in value &&
    'correlationId' in value
  );
}

export function isIntegrationData(value: any): value is IntegrationData {
  return (
    value &&
    typeof value === 'object' &&
    'provider' in value &&
    'accountId' in value &&
    'status' in value
  );
}

export function isMultiAccountProvider(
  provider: Provider,
  integrations: IntegrationData[]
): boolean {
  const providerIntegrations = integrations.filter(
    (int) => int.provider === provider
  );
  return providerIntegrations.length > 1;
}
```

## 3. Token & Authentication Management

### 3.1 Multi-Account Token Storage

```typescript
// lib/services/integrations/token-manager.ts

interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  provider: Provider;
  accountId: string;
}

class MultiAccountTokenManager {
  private tokens: Map<string, TokenData> = new Map();
  
  /**
   * Generate unique key for provider + account
   */
  private getKey(provider: Provider, accountId: string): string {
    return `${provider}:${accountId}`;
  }
  
  /**
   * Store token for specific account
   */
  setToken(provider: Provider, accountId: string, token: TokenData): void {
    const key = this.getKey(provider, accountId);
    this.tokens.set(key, token);
  }
  
  /**
   * Get token for specific account
   */
  getToken(provider: Provider, accountId: string): TokenData | undefined {
    const key = this.getKey(provider, accountId);
    return this.tokens.get(key);
  }
  
  /**
   * Check if token is expired
   */
  isTokenExpired(provider: Provider, accountId: string): boolean {
    const token = this.getToken(provider, accountId);
    if (!token) return true;
    return token.expiresAt < new Date();
  }
  
  /**
   * Get all tokens for a provider
   */
  getProviderTokens(provider: Provider): TokenData[] {
    return Array.from(this.tokens.values()).filter(
      (token) => token.provider === provider
    );
  }
  
  /**
   * Remove token for specific account
   */
  removeToken(provider: Provider, accountId: string): void {
    const key = this.getKey(provider, accountId);
    this.tokens.delete(key);
  }
  
  /**
   * Clear all tokens
   */
  clearAll(): void {
    this.tokens.clear();
  }
}

export const tokenManager = new MultiAccountTokenManager();
```

### 3.2 Automatic Token Refresh

```typescript
// hooks/useIntegrations.ts - Add token refresh logic

const refreshTokenIfNeeded = useCallback(async (
  provider: string,
  accountId: string
) => {
  try {
    // Check if token is expired or will expire soon (within 5 minutes)
    const integration = integrations.find(
      (int) => int.provider === provider && int.providerAccountId === accountId
    );
    
    if (!integration?.expiresAt) return;
    
    const expiresIn = integration.expiresAt.getTime() - Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    if (expiresIn < fiveMinutes) {
      console.log(`Refreshing token for ${provider}:${accountId}`);
      
      const response = await fetchWithRetry(
        `/api/integrations/refresh/${provider}/${accountId}`,
        { method: 'POST' }
      );
      
      // Update integration with new expiry
      await fetchIntegrations();
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Don't throw - let the user continue, they'll get an error on next API call
  }
}, [integrations, fetchIntegrations]);
```

## 4. Caching & Performance Optimization

### 4.1 SWR Configuration for Multi-Account

```typescript
// hooks/useIntegrations.ts - Add SWR for better caching

import useSWR from 'swr';

const SWR_CONFIG = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  refreshInterval: 5 * 60 * 1000, // 5 minutes
  dedupingInterval: 2000, // 2 seconds
  errorRetryCount: 3,
  errorRetryInterval: 5000,
};

export function useIntegrationsWithSWR(): UseIntegrationsReturn {
  const { data, error, mutate, isLoading } = useSWR<IntegrationStatusResponse>(
    '/api/integrations/status',
    fetchWithRetry,
    SWR_CONFIG
  );
  
  // ... rest of implementation
}
```

### 4.2 Debouncing for Rapid Operations

```typescript
// hooks/useIntegrations.ts - Add debouncing

import { useMemo, useCallback } from 'react';

function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// In useIntegrations hook
const debouncedRefresh = useMemo(
  () => debounce(fetchIntegrations, 1000),
  [fetchIntegrations]
);
```

## 5. Logging & Debugging

### 5.1 Structured Logging

```typescript
// hooks/useIntegrations.ts - Add comprehensive logging

import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useIntegrations');

// In fetchIntegrations
logger.info('Fetching integrations', {
  timestamp: new Date().toISOString(),
});

// On success
logger.info('Integrations fetched successfully', {
  count: parsedIntegrations.length,
  providers: [...new Set(parsedIntegrations.map(i => i.provider))],
  multiAccountProviders: getMultiAccountProviders(parsedIntegrations),
  duration: Date.now() - startTime,
});

// On error
logger.error('Failed to fetch integrations', error, {
  statusCode: error.status,
  retryable: isRetryableError(error),
  correlationId: error.correlationId,
});

function getMultiAccountProviders(integrations: Integration[]): string[] {
  const providerCounts = integrations.reduce((acc, int) => {
    acc[int.provider] = (acc[int.provider] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(providerCounts)
    .filter(([_, count]) => count > 1)
    .map(([provider]) => provider);
}
```

### 5.2 Performance Monitoring

```typescript
// hooks/useIntegrations.ts - Add performance tracking

const trackPerformance = useCallback((
  operation: string,
  startTime: number,
  success: boolean,
  metadata?: Record<string, any>
) => {
  const duration = Date.now() - startTime;
  
  logger.info(`Operation: ${operation}`, {
    duration,
    success,
    ...metadata,
  });
  
  // Send to analytics if available
  if (typeof window !== 'undefined' && (window as any).analytics) {
    (window as any).analytics.track('Integration Operation', {
      operation,
      duration,
      success,
      ...metadata,
    });
  }
}, []);
```

## 6. API Documentation

### 6.1 Endpoint Documentation

```typescript
/**
 * GET /api/integrations/status
 * 
 * Retrieves all integrations for the authenticated user, including multiple
 * accounts per provider.
 * 
 * @authentication Required - NextAuth session
 * @rateLimit 60 requests per minute
 * 
 * @returns {IntegrationStatusResponse}
 * {
 *   integrations: [
 *     {
 *       id: 1,
 *       provider: "instagram",
 *       accountId: "account_123",
 *       accountName: "@user1",
 *       status: "connected",
 *       expiresAt: "2025-12-01T00:00:00Z",
 *       metadata: { followers: 10000 },
 *       createdAt: "2025-11-01T00:00:00Z",
 *       updatedAt: "2025-11-18T00:00:00Z"
 *     },
 *     {
 *       id: 2,
 *       provider: "instagram",
 *       accountId: "account_456",
 *       accountName: "@user2",
 *       status: "connected",
 *       ...
 *     }
 *   ],
 *   summary: {
 *     total: 2,
 *     connected: 2,
 *     expired: 0,
 *     byProvider: { instagram: 2 }
 *   }
 * }
 * 
 * @example
 * const response = await fetch('/api/integrations/status');
 * const data = await response.json();
 * console.log(`Total integrations: ${data.summary.total}`);
 */
```

### 6.2 Hook Usage Documentation

```typescript
/**
 * useIntegrations Hook
 * 
 * Manages multiple social media integrations with support for multiple
 * accounts per provider.
 * 
 * @returns {UseIntegrationsReturn}
 * 
 * @example Basic usage
 * ```tsx
 * function IntegrationsPage() {
 *   const { integrations, loading, error, connect, disconnect } = useIntegrations();
 *   
 *   if (loading) return <Loading />;
 *   if (error) return <Error message={error} />;
 *   
 *   return (
 *     <div>
 *       {integrations.map(integration => (
 *         <IntegrationCard
 *           key={`${integration.provider}-${integration.providerAccountId}`}
 *           integration={integration}
 *           onDisconnect={() => disconnect(
 *             integration.provider,
 *             integration.providerAccountId
 *           )}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example Multi-account handling
 * ```tsx
 * // Group integrations by provider
 * const groupedIntegrations = integrations.reduce((acc, int) => {
 *   if (!acc[int.provider]) acc[int.provider] = [];
 *   acc[int.provider].push(int);
 *   return acc;
 * }, {} as Record<string, Integration[]>);
 * 
 * // Display multiple accounts per provider
 * Object.entries(groupedIntegrations).map(([provider, accounts]) => (
 *   <ProviderSection key={provider} provider={provider}>
 *     {accounts.map(account => (
 *       <AccountCard key={account.providerAccountId} account={account} />
 *     ))}
 *   </ProviderSection>
 * ));
 * ```
 */
```

## 7. Testing Recommendations

### 7.1 Integration Tests

```typescript
// tests/integration/api/multi-account-integrations.test.ts

describe('Multi-Account Integration API', () => {
  it('should handle multiple accounts for same provider', async () => {
    // Connect first account
    const account1 = await connectIntegration('instagram');
    
    // Connect second account
    const account2 = await connectIntegration('instagram');
    
    // Fetch status
    const status = await fetchIntegrationStatus();
    
    // Verify both accounts are present
    const instagramAccounts = status.integrations.filter(
      (int) => int.provider === 'instagram'
    );
    
    expect(instagramAccounts).toHaveLength(2);
    expect(instagramAccounts[0].accountId).not.toBe(instagramAccounts[1].accountId);
  });
  
  it('should disconnect specific account without affecting others', async () => {
    // Setup: 2 Instagram accounts
    const account1 = await connectIntegration('instagram');
    const account2 = await connectIntegration('instagram');
    
    // Disconnect first account
    await disconnectIntegration('instagram', account1.accountId);
    
    // Verify only second account remains
    const status = await fetchIntegrationStatus();
    const instagramAccounts = status.integrations.filter(
      (int) => int.provider === 'instagram'
    );
    
    expect(instagramAccounts).toHaveLength(1);
    expect(instagramAccounts[0].accountId).toBe(account2.accountId);
  });
});
```

### 7.2 Property-Based Tests (Already Implemented ✅)

The file `tests/unit/services/multi-account-support.property.test.ts` already implements comprehensive property-based tests covering:
- Multiple accounts per provider with unique IDs
- Independent metadata for each account
- Filtering without affecting other accounts
- Different expiry times per account
- Independence between providers
- Unique account ID enforcement

## 8. Implementation Checklist

- [x] Error handling with user-friendly messages
- [ ] Retry logic with exponential backoff
- [ ] Complete TypeScript types for API responses
- [ ] Type guards for runtime validation
- [ ] Multi-account token management
- [ ] Automatic token refresh
- [ ] SWR caching configuration
- [ ] Debouncing for rapid operations
- [ ] Structured logging with correlation IDs
- [ ] Performance monitoring
- [ ] Comprehensive API documentation
- [ ] Hook usage examples
- [x] Property-based tests
- [ ] Integration tests for multi-account scenarios

## 9. Next Steps

1. **Implement retry logic** in `hooks/useIntegrations.ts`
2. **Add token manager** in `lib/services/integrations/token-manager.ts`
3. **Enhance logging** with correlation IDs and performance tracking
4. **Add integration tests** for multi-account scenarios
5. **Update API documentation** with multi-account examples
6. **Add monitoring** for multi-account operations

## References

- Property Test: `tests/unit/services/multi-account-support.property.test.ts`
- Hook Implementation: `hooks/useIntegrations.ts`
- API Routes: `app/api/integrations/`
- Type Definitions: `lib/services/integrations/types.ts`
- Requirements: `.kiro/specs/integrations-management/requirements.md` (12.1, 12.2, 12.4)
