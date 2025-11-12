# Admin Feature Flags - Client Integration Guide

Guide complet pour intégrer l'API Feature Flags côté client avec retry strategies, caching, et error handling.

## Installation

```bash
npm install @tanstack/react-query  # Pour caching et retry
```

## Client avec Retry Strategy

```typescript
// lib/api/feature-flags-client.ts

interface RetryConfig {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
}

interface FeatureFlags {
  enabled: boolean;
  rolloutPercentage: number;
  markets: string[];
  userWhitelist: string[];
}

interface FeatureFlagsResponse {
  flags: FeatureFlags;
  correlationId: string;
}

interface UpdateResponse {
  success: boolean;
  flags: FeatureFlags;
  correlationId: string;
}

class FeatureFlagsClient {
  private baseUrl: string;
  private getAuthToken: () => Promise<string>;

  constructor(baseUrl: string, getAuthToken: () => Promise<string>) {
    this.baseUrl = baseUrl;
    this.getAuthToken = getAuthToken;
  }

  /**
   * Retry with exponential backoff
   */
  private async retry<T>(
    fn: () => Promise<T>,
    config: RetryConfig = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      initialDelay = 1000,
      maxDelay = 10000,
      backoffFactor = 2,
    } = config;

    let lastError: Error | undefined;
    let delay = initialDelay;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx)
        if (error instanceof Response && error.status >= 400 && error.status < 500) {
          throw error;
        }

        if (attempt === maxAttempts) {
          throw lastError;
        }

        console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, {
          error: lastError.message,
        });

        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * backoffFactor, maxDelay);
      }
    }

    throw lastError;
  }

  /**
   * Make authenticated request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken();

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'Request failed',
        status: response.status,
      }));

      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get current feature flags
   */
  async getFlags(): Promise<FeatureFlagsResponse> {
    return this.retry(() =>
      this.request<FeatureFlagsResponse>('/api/admin/feature-flags')
    );
  }

  /**
   * Update feature flags
   */
  async updateFlags(
    updates: Partial<FeatureFlags>
  ): Promise<UpdateResponse> {
    return this.retry(
      () =>
        this.request<UpdateResponse>('/api/admin/feature-flags', {
          method: 'POST',
          body: JSON.stringify(updates),
        }),
      { maxAttempts: 2 } // Less retries for mutations
    );
  }

  /**
   * Enable feature globally
   */
  async enable(): Promise<UpdateResponse> {
    return this.updateFlags({ enabled: true });
  }

  /**
   * Disable feature globally
   */
  async disable(): Promise<UpdateResponse> {
    return this.updateFlags({ enabled: false });
  }

  /**
   * Set rollout percentage
   */
  async setRollout(percentage: number): Promise<UpdateResponse> {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Rollout percentage must be between 0 and 100');
    }
    return this.updateFlags({ rolloutPercentage: percentage });
  }

  /**
   * Set enabled markets
   */
  async setMarkets(markets: string[]): Promise<UpdateResponse> {
    // Validate market codes
    const invalidMarkets = markets.filter(m => !/^[A-Z]{2}$/.test(m));
    if (invalidMarkets.length > 0) {
      throw new Error(
        `Invalid market codes: ${invalidMarkets.join(', ')}. Must be 2-letter ISO codes.`
      );
    }
    return this.updateFlags({ markets });
  }

  /**
   * Add user to whitelist
   */
  async addToWhitelist(userId: string): Promise<UpdateResponse> {
    const current = await this.getFlags();
    const userWhitelist = [...current.flags.userWhitelist, userId];
    return this.updateFlags({ userWhitelist });
  }

  /**
   * Remove user from whitelist
   */
  async removeFromWhitelist(userId: string): Promise<UpdateResponse> {
    const current = await this.getFlags();
    const userWhitelist = current.flags.userWhitelist.filter(id => id !== userId);
    return this.updateFlags({ userWhitelist });
  }
}

// Export singleton instance
export const featureFlagsClient = new FeatureFlagsClient(
  process.env.NEXT_PUBLIC_API_URL || '',
  async () => {
    // Replace with your auth token retrieval logic
    const session = await getSession();
    return session?.accessToken || '';
  }
);
```

## React Query Integration

```typescript
// hooks/useFeatureFlags.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { featureFlagsClient } from '@/lib/api/feature-flags-client';

const QUERY_KEY = ['admin', 'feature-flags'];

export function useFeatureFlags() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => featureFlagsClient.getFlags(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useUpdateFeatureFlags() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Partial<FeatureFlags>) =>
      featureFlagsClient.updateFlags(updates),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    retry: 1, // Only retry once for mutations
  });
}

export function useEnableFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => featureFlagsClient.enable(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDisableFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => featureFlagsClient.disable(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useSetRollout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (percentage: number) =>
      featureFlagsClient.setRollout(percentage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
```

## React Component Example

```typescript
// components/admin/FeatureFlagsPanel.tsx

import { useState } from 'react';
import {
  useFeatureFlags,
  useUpdateFeatureFlags,
  useSetRollout,
} from '@/hooks/useFeatureFlags';

export function FeatureFlagsPanel() {
  const { data, isLoading, error } = useFeatureFlags();
  const updateFlags = useUpdateFeatureFlags();
  const setRollout = useSetRollout();
  const [rolloutValue, setRolloutValue] = useState(0);

  if (isLoading) {
    return <div>Loading feature flags...</div>;
  }

  if (error) {
    return (
      <div className="error">
        Failed to load feature flags: {error.message}
      </div>
    );
  }

  const flags = data?.flags;

  return (
    <div className="feature-flags-panel">
      <h2>Feature Flags</h2>

      {/* Global Enable/Disable */}
      <div className="control-group">
        <label>
          <input
            type="checkbox"
            checked={flags?.enabled}
            onChange={e =>
              updateFlags.mutate({ enabled: e.target.checked })
            }
            disabled={updateFlags.isPending}
          />
          Feature Enabled
        </label>
      </div>

      {/* Rollout Percentage */}
      <div className="control-group">
        <label>
          Rollout Percentage: {flags?.rolloutPercentage}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={rolloutValue || flags?.rolloutPercentage}
          onChange={e => setRolloutValue(Number(e.target.value))}
          onMouseUp={() => setRollout.mutate(rolloutValue)}
          disabled={setRollout.isPending}
        />
      </div>

      {/* Markets */}
      <div className="control-group">
        <label>Enabled Markets:</label>
        <div className="markets-list">
          {flags?.markets.map(market => (
            <span key={market} className="market-badge">
              {market}
            </span>
          ))}
        </div>
      </div>

      {/* User Whitelist */}
      <div className="control-group">
        <label>Whitelisted Users: {flags?.userWhitelist.length}</label>
      </div>

      {/* Status */}
      {updateFlags.isPending && <div>Updating...</div>}
      {updateFlags.isError && (
        <div className="error">
          Update failed: {updateFlags.error.message}
        </div>
      )}
      {updateFlags.isSuccess && (
        <div className="success">Updated successfully!</div>
      )}
    </div>
  );
}
```

## Error Handling Best Practices

```typescript
// utils/error-handler.ts

export class FeatureFlagsError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public correlationId?: string
  ) {
    super(message);
    this.name = 'FeatureFlagsError';
  }
}

export function handleFeatureFlagsError(error: unknown): never {
  if (error instanceof FeatureFlagsError) {
    // Already formatted
    throw error;
  }

  if (error instanceof Response) {
    throw new FeatureFlagsError(
      `HTTP ${error.status}: ${error.statusText}`,
      error.status
    );
  }

  if (error instanceof Error) {
    throw new FeatureFlagsError(error.message);
  }

  throw new FeatureFlagsError('Unknown error occurred');
}

// Usage in component
try {
  await featureFlagsClient.updateFlags({ enabled: true });
} catch (error) {
  handleFeatureFlagsError(error);
}
```

## Debouncing Updates

```typescript
// hooks/useDebouncedFeatureFlags.ts

import { useState, useEffect } from 'react';
import { useUpdateFeatureFlags } from './useFeatureFlags';

export function useDebouncedRollout(initialValue: number, delay = 500) {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  const updateFlags = useUpdateFeatureFlags();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  useEffect(() => {
    if (debouncedValue !== initialValue) {
      updateFlags.mutate({ rolloutPercentage: debouncedValue });
    }
  }, [debouncedValue]);

  return [value, setValue] as const;
}

// Usage
function RolloutSlider({ initialValue }: { initialValue: number }) {
  const [value, setValue] = useDebouncedRollout(initialValue);

  return (
    <input
      type="range"
      min="0"
      max="100"
      value={value}
      onChange={e => setValue(Number(e.target.value))}
    />
  );
}
```

## Optimistic Updates

```typescript
// hooks/useOptimisticFeatureFlags.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { featureFlagsClient } from '@/lib/api/feature-flags-client';

const QUERY_KEY = ['admin', 'feature-flags'];

export function useOptimisticUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Partial<FeatureFlags>) =>
      featureFlagsClient.updateFlags(updates),
    
    // Optimistically update cache before request completes
    onMutate: async (updates) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });

      // Snapshot previous value
      const previous = queryClient.getQueryData(QUERY_KEY);

      // Optimistically update cache
      queryClient.setQueryData(QUERY_KEY, (old: any) => ({
        ...old,
        flags: {
          ...old.flags,
          ...updates,
        },
      }));

      return { previous };
    },
    
    // Rollback on error
    onError: (err, updates, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous);
      }
    },
    
    // Refetch on success or error
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
```

## Monitoring & Logging

```typescript
// utils/feature-flags-logger.ts

interface LogEntry {
  timestamp: string;
  action: string;
  userId?: string;
  updates?: any;
  correlationId?: string;
  error?: string;
}

class FeatureFlagsLogger {
  private logs: LogEntry[] = [];

  log(entry: Omit<LogEntry, 'timestamp'>) {
    const logEntry: LogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    this.logs.push(logEntry);
    console.log('[Feature Flags]', logEntry);

    // Send to analytics
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.track('Feature Flags Action', logEntry);
    }
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }
}

export const logger = new FeatureFlagsLogger();

// Usage
logger.log({
  action: 'update',
  updates: { enabled: true },
  correlationId: 'abc-123',
});
```

## Testing

```typescript
// __tests__/feature-flags-client.test.ts

import { describe, it, expect, vi } from 'vitest';
import { FeatureFlagsClient } from '@/lib/api/feature-flags-client';

describe('FeatureFlagsClient', () => {
  it('should retry on network errors', async () => {
    const mockFetch = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ flags: { enabled: true } }),
      });

    global.fetch = mockFetch;

    const client = new FeatureFlagsClient(
      'http://localhost:3000',
      async () => 'token'
    );

    const result = await client.getFlags();

    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(result.flags.enabled).toBe(true);
  });

  it('should not retry on 4xx errors', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Bad request' }),
    });

    global.fetch = mockFetch;

    const client = new FeatureFlagsClient(
      'http://localhost:3000',
      async () => 'token'
    );

    await expect(client.getFlags()).rejects.toThrow();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
```

## Related Documentation

- [Feature Flags API](./admin-feature-flags.md) - API endpoint documentation
- [Retry Strategies](./retry-strategies.md) - General retry patterns
- [React Query Docs](https://tanstack.com/query/latest) - Caching and state management

---

**Last Updated:** 2024-11-11
