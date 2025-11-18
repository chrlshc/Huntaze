# Cache Usage Examples

## Real-World Integration Examples

### Example 1: API Route with Cache

```typescript
// app/api/integrations/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/api-protection';
import { getCachedIntegrations, CacheError, CacheErrorType } from '@/lib/services/integrations/cache';
import { integrationsService } from '@/lib/services/integrations/integrations.service';

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) return authResult;
    
    const userId = authResult.user.id;
    
    // 2. Get integrations with cache
    const integrations = await getCachedIntegrations(
      parseInt(userId),
      async () => {
        // This function only runs on cache miss
        return await integrationsService.getUserIntegrations(parseInt(userId));
      }
    );
    
    // 3. Return response
    return NextResponse.json({
      success: true,
      data: integrations,
      cached: true, // Could check if from cache
    });
    
  } catch (error) {
    // Handle cache errors
    if (error instanceof CacheError) {
      if (error.type === CacheErrorType.FETCH_FAILED && error.retryable) {
        return NextResponse.json(
          { error: 'Service temporarily unavailable. Please try again.' },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    );
  }
}
```

### Example 2: React Hook with Cache

```typescript
// hooks/useIntegrations.ts
import { useEffect, useState } from 'react';
import { getCachedIntegrationsWithFallback } from '@/lib/services/integrations/cache';
import type { Integration } from '@/lib/services/integrations/types';

export function useIntegrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    let mounted = true;
    
    async function fetchIntegrations() {
      try {
        setLoading(true);
        
        // Get user ID from session
        const session = await fetch('/api/auth/session').then(r => r.json());
        const userId = parseInt(session.user.id);
        
        // Fetch with cache (never throws)
        const data = await getCachedIntegrationsWithFallback(
          userId,
          async () => {
            const response = await fetch('/api/integrations/status');
            if (!response.ok) throw new Error('Fetch failed');
            return response.json();
          }
        );
        
        if (mounted) {
          setIntegrations(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    
    fetchIntegrations();
    
    return () => {
      mounted = false;
    };
  }, []);
  
  return { integrations, loading, error };
}
```

### Example 3: Service Layer with Cache

```typescript
// lib/services/integrations/integrations.service.ts
import { getCachedIntegrations, integrationCache } from './cache';
import type { Integration } from './types';

export class IntegrationsService {
  /**
   * Get user integrations (with cache)
   */
  async getUserIntegrations(userId: number): Promise<Integration[]> {
    return getCachedIntegrations(
      userId,
      async () => {
        // Fetch from database
        const result = await query(
          'SELECT * FROM integrations WHERE user_id = $1',
          [userId]
        );
        return result.rows;
      }
    );
  }
  
  /**
   * Update integration (invalidate cache)
   */
  async updateIntegration(
    userId: number,
    integrationId: string,
    data: Partial<Integration>
  ): Promise<Integration> {
    // Update in database
    const result = await query(
      'UPDATE integrations SET ... WHERE id = $1 AND user_id = $2',
      [integrationId, userId]
    );
    
    // Invalidate cache to force fresh fetch
    integrationCache.invalidate(userId);
    
    return result.rows[0];
  }
  
  /**
   * Delete integration (invalidate cache)
   */
  async deleteIntegration(userId: number, integrationId: string): Promise<void> {
    await query(
      'DELETE FROM integrations WHERE id = $1 AND user_id = $2',
      [integrationId, userId]
    );
    
    // Invalidate cache
    integrationCache.invalidate(userId);
  }
}
```

### Example 4: Background Job with Cache

```typescript
// lib/workers/integration-sync.ts
import { integrationCache } from '@/lib/services/integrations/cache';
import { integrationsService } from '@/lib/services/integrations/integrations.service';

/**
 * Background job to sync integrations
 * Runs every 5 minutes
 */
export async function syncIntegrations() {
  try {
    // Get all users with integrations
    const users = await query('SELECT DISTINCT user_id FROM integrations');
    
    for (const user of users.rows) {
      const userId = user.user_id;
      
      try {
        // Fetch fresh data from providers
        const freshIntegrations = await integrationsService.syncUserIntegrations(userId);
        
        // Update cache with fresh data
        integrationCache.set(userId, freshIntegrations);
        
        console.log(`Synced integrations for user ${userId}`);
      } catch (error) {
        console.error(`Failed to sync user ${userId}:`, error);
        // Continue with next user
      }
    }
  } catch (error) {
    console.error('Integration sync job failed:', error);
  }
}
```

### Example 5: Server-Side Rendering with Cache

```typescript
// app/(app)/integrations/page.tsx
import { auth } from '@/lib/auth/config';
import { getCachedIntegrationsWithFallback } from '@/lib/services/integrations/cache';
import { integrationsService } from '@/lib/services/integrations/integrations.service';
import { IntegrationsList } from '@/components/integrations/IntegrationsList';

export default async function IntegrationsPage() {
  // Get session
  const session = await auth();
  if (!session) {
    redirect('/auth');
  }
  
  const userId = parseInt(session.user.id);
  
  // Fetch integrations with cache (SSR)
  const integrations = await getCachedIntegrationsWithFallback(
    userId,
    async () => {
      return await integrationsService.getUserIntegrations(userId);
    }
  );
  
  return (
    <div>
      <h1>Your Integrations</h1>
      <IntegrationsList integrations={integrations} />
    </div>
  );
}
```

### Example 6: API Client with Cache

```typescript
// lib/api/client/integrations-client.ts
import { getCachedIntegrations, CacheError } from '@/lib/services/integrations/cache';
import type { Integration } from '@/lib/services/integrations/types';

export class IntegrationsClient {
  private baseUrl: string;
  
  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }
  
  /**
   * Get integrations with automatic caching
   */
  async getIntegrations(userId: number): Promise<Integration[]> {
    return getCachedIntegrations(
      userId,
      async () => {
        const response = await fetch(`${this.baseUrl}/integrations/status`, {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.data || [];
      },
      {
        maxRetries: 3,
        initialDelay: 100,
        maxDelay: 2000,
        backoffFactor: 2,
      }
    );
  }
  
  /**
   * Refresh integrations (bypass cache)
   */
  async refreshIntegrations(userId: number): Promise<Integration[]> {
    // Invalidate cache first
    integrationCache.invalidate(userId);
    
    // Fetch fresh data
    return this.getIntegrations(userId);
  }
}
```

### Example 7: Testing with Cache

```typescript
// tests/integration/api/integrations-status.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { integrationCache } from '@/lib/services/integrations/cache';

describe('GET /api/integrations/status', () => {
  beforeEach(() => {
    // Clear cache before each test
    integrationCache.clear();
  });
  
  afterEach(() => {
    // Cleanup
    integrationCache.clear();
  });
  
  it('should return cached integrations on second request', async () => {
    const userId = 123;
    
    // First request (cache miss)
    const response1 = await fetch('/api/integrations/status', {
      headers: { Cookie: `userId=${userId}` },
    });
    const data1 = await response1.json();
    
    expect(data1.success).toBe(true);
    expect(data1.data).toHaveLength(3);
    
    // Second request (cache hit)
    const response2 = await fetch('/api/integrations/status', {
      headers: { Cookie: `userId=${userId}` },
    });
    const data2 = await response2.json();
    
    expect(data2.success).toBe(true);
    expect(data2.data).toEqual(data1.data);
    
    // Verify cache was used
    expect(integrationCache.has(userId)).toBe(true);
  });
  
  it('should invalidate cache after update', async () => {
    const userId = 123;
    
    // Populate cache
    await fetch('/api/integrations/status', {
      headers: { Cookie: `userId=${userId}` },
    });
    
    expect(integrationCache.has(userId)).toBe(true);
    
    // Update integration
    await fetch('/api/integrations/connect/instagram', {
      method: 'POST',
      headers: { Cookie: `userId=${userId}` },
    });
    
    // Cache should be invalidated
    expect(integrationCache.has(userId)).toBe(false);
  });
});
```

### Example 8: Monitoring Cache Health

```typescript
// lib/monitoring/cache-monitor.ts
import { integrationCache } from '@/lib/services/integrations/cache';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('cache-monitor');

/**
 * Monitor cache health
 * Run this periodically (e.g., every 5 minutes)
 */
export function monitorCacheHealth() {
  const stats = integrationCache.getStats();
  
  // Log statistics
  logger.info('Cache health check', {
    size: stats.size,
    active: stats.active,
    expired: stats.expired,
    hitRate: calculateHitRate(),
  });
  
  // Alert if too many expired entries
  if (stats.expired > stats.active) {
    logger.warn('High number of expired cache entries', {
      expired: stats.expired,
      active: stats.active,
      ratio: stats.expired / stats.size,
    });
  }
  
  // Alert if cache is too large
  if (stats.size > 10000) {
    logger.warn('Cache size exceeds threshold', {
      size: stats.size,
      threshold: 10000,
    });
  }
}

// Track cache hits/misses for hit rate calculation
let cacheHits = 0;
let cacheMisses = 0;

function calculateHitRate(): number {
  const total = cacheHits + cacheMisses;
  return total > 0 ? cacheHits / total : 0;
}

// Run monitor every 5 minutes
setInterval(monitorCacheHealth, 5 * 60 * 1000);
```

### Example 9: Cache Warming

```typescript
// lib/services/integrations/cache-warmer.ts
import { integrationCache } from './cache';
import { integrationsService } from './integrations.service';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('cache-warmer');

/**
 * Warm cache for active users
 * Run this on application startup or periodically
 */
export async function warmCache() {
  try {
    // Get active users (logged in within last 24 hours)
    const result = await query(`
      SELECT DISTINCT user_id 
      FROM user_sessions 
      WHERE last_activity > NOW() - INTERVAL '24 hours'
      LIMIT 1000
    `);
    
    logger.info('Starting cache warming', {
      userCount: result.rows.length,
    });
    
    // Warm cache for each user
    const promises = result.rows.map(async (row) => {
      const userId = row.user_id;
      
      try {
        const integrations = await integrationsService.getUserIntegrations(userId);
        integrationCache.set(userId, integrations);
      } catch (error) {
        logger.warn('Failed to warm cache for user', {
          userId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
    
    await Promise.all(promises);
    
    logger.info('Cache warming completed', {
      warmed: result.rows.length,
    });
  } catch (error) {
    logger.error('Cache warming failed', error as Error);
  }
}
```

### Example 10: Custom TTL per Integration Type

```typescript
// lib/services/integrations/cache-strategies.ts
import { integrationCache, CACHE_TTL } from './cache';
import type { Integration } from './types';

/**
 * Cache strategies with different TTLs based on integration type
 */
export const CACHE_STRATEGIES = {
  // Social media: 5 minutes (default)
  instagram: CACHE_TTL,
  tiktok: CACHE_TTL,
  reddit: CACHE_TTL,
  
  // Payment: 1 minute (more frequent updates)
  stripe: 1 * 60 * 1000,
  paypal: 1 * 60 * 1000,
  
  // Analytics: 15 minutes (less frequent updates)
  google_analytics: 15 * 60 * 1000,
  mixpanel: 15 * 60 * 1000,
};

/**
 * Set cache with strategy-based TTL
 */
export function setCacheWithStrategy(
  userId: number,
  integrations: Integration[]
): void {
  // Group integrations by provider
  const byProvider = integrations.reduce((acc, integration) => {
    const provider = integration.provider;
    if (!acc[provider]) acc[provider] = [];
    acc[provider].push(integration);
    return acc;
  }, {} as Record<string, Integration[]>);
  
  // Cache each group with appropriate TTL
  for (const [provider, items] of Object.entries(byProvider)) {
    const ttl = CACHE_STRATEGIES[provider as keyof typeof CACHE_STRATEGIES] || CACHE_TTL;
    
    // Create a cache key that includes provider
    const cacheKey = `${userId}:${provider}`;
    integrationCache.set(parseInt(cacheKey), items, ttl);
  }
}
```

---

## Common Patterns

### Pattern 1: Cache-Aside (Lazy Loading)

```typescript
async function getIntegrations(userId: number) {
  // Try cache first
  const cached = integrationCache.get(userId);
  if (cached) return cached;
  
  // Fetch from source
  const fresh = await fetchFromDatabase(userId);
  
  // Store in cache
  integrationCache.set(userId, fresh);
  
  return fresh;
}
```

### Pattern 2: Write-Through

```typescript
async function updateIntegration(userId: number, data: Integration) {
  // Update source
  await updateDatabase(userId, data);
  
  // Update cache immediately
  const fresh = await fetchFromDatabase(userId);
  integrationCache.set(userId, fresh);
  
  return fresh;
}
```

### Pattern 3: Write-Behind (Invalidate)

```typescript
async function updateIntegration(userId: number, data: Integration) {
  // Update source
  await updateDatabase(userId, data);
  
  // Invalidate cache (will be refreshed on next read)
  integrationCache.invalidate(userId);
}
```

---

## Best Practices Summary

1. **Always use fallback for non-critical data**
2. **Invalidate cache after updates**
3. **Monitor cache health regularly**
4. **Use appropriate TTL for data type**
5. **Handle errors gracefully**
6. **Test cache behavior**
7. **Log cache operations**
8. **Warm cache for active users**
9. **Clear cache in tests**
10. **Document cache strategy**

---

**Last Updated**: November 18, 2025  
**Version**: 1.0.0
