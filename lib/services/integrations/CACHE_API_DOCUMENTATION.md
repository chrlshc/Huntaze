# Integration Cache API Documentation

## Overview

The Integration Cache module provides in-memory caching for integration status with TTL support, error handling, retry strategies, and structured logging.

## Features

✅ **5-minute TTL** for integration status  
✅ **Per-user cache isolation** with O(1) lookups  
✅ **Automatic cache invalidation** on TTL expiry  
✅ **Manual cache invalidation** support  
✅ **Memory-efficient** with automatic cleanup  
✅ **Error handling** with try-catch boundaries  
✅ **Retry strategies** with exponential backoff  
✅ **Structured logging** for debugging  
✅ **TypeScript types** for all responses  

## Installation

```typescript
import { 
  integrationCache, 
  getCachedIntegrations,
  getCachedIntegrationsWithFallback,
  CACHE_TTL,
  CacheError,
  CacheErrorType 
} from '@/lib/services/integrations/cache';
```

## API Reference

### Constants

#### `CACHE_TTL`

Default cache TTL: 5 minutes (300,000 milliseconds)

```typescript
export const CACHE_TTL = 5 * 60 * 1000;
```

#### `DEFAULT_RETRY_CONFIG`

Default retry configuration for fetch operations

```typescript
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 100,
  maxDelay: 2000,
  backoffFactor: 2,
};
```

### Types

#### `CacheErrorType`

Enum for cache error types

```typescript
enum CacheErrorType {
  FETCH_FAILED = 'FETCH_FAILED',
  CACHE_SET_FAILED = 'CACHE_SET_FAILED',
  CACHE_GET_FAILED = 'CACHE_GET_FAILED',
  CLEANUP_FAILED = 'CLEANUP_FAILED',
  RETRY_EXHAUSTED = 'RETRY_EXHAUSTED',
}
```

#### `CacheError`

Custom error class with retry information

```typescript
class CacheError extends Error {
  type: CacheErrorType;
  retryable: boolean;
  originalError?: Error;
}
```

#### `RetryConfig`

Configuration for retry logic

```typescript
interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
}
```

### Cache Instance Methods

#### `integrationCache.get(userId: number): Integration[] | null`

Get cached integrations for a user

**Parameters:**
- `userId` - User ID

**Returns:**
- `Integration[]` - Cached integrations
- `null` - Cache miss or expired

**Throws:**
- `CacheError` - If cache operation fails

**Example:**
```typescript
const cached = integrationCache.get(123);
if (cached) {
  console.log('Cache hit:', cached);
} else {
  console.log('Cache miss');
}
```

#### `integrationCache.set(userId: number, data: Integration[], ttl?: number): void`

Set cached integrations for a user

**Parameters:**
- `userId` - User ID
- `data` - Integration data to cache
- `ttl` - Time to live in milliseconds (optional, defaults to CACHE_TTL)

**Throws:**
- `CacheError` - If cache operation fails

**Example:**
```typescript
integrationCache.set(123, integrations);
// Or with custom TTL
integrationCache.set(123, integrations, 10 * 60 * 1000); // 10 minutes
```

#### `integrationCache.has(userId: number): boolean`

Check if cache has valid entry for user

**Parameters:**
- `userId` - User ID

**Returns:**
- `boolean` - True if cache has valid (non-expired) entry

**Example:**
```typescript
if (integrationCache.has(123)) {
  console.log('Cache has valid entry');
}
```

#### `integrationCache.invalidate(userId: number): void`

Invalidate cache for a specific user

**Parameters:**
- `userId` - User ID

**Example:**
```typescript
integrationCache.invalidate(123);
```

#### `integrationCache.clear(): void`

Clear all cache entries

**Example:**
```typescript
integrationCache.clear();
```

#### `integrationCache.size(): number`

Get cache size (number of entries)

**Returns:**
- `number` - Number of cached entries

**Example:**
```typescript
console.log('Cache size:', integrationCache.size());
```

#### `integrationCache.getStats(): { size: number; expired: number; active: number }`

Get cache statistics

**Returns:**
- Object with cache statistics

**Example:**
```typescript
const stats = integrationCache.getStats();
console.log('Active entries:', stats.active);
console.log('Expired entries:', stats.expired);
```

#### `integrationCache.getTimeToExpiry(userId: number): number | null`

Get time until cache entry expires

**Parameters:**
- `userId` - User ID

**Returns:**
- `number` - Milliseconds until expiry
- `null` - No entry found

**Example:**
```typescript
const ttl = integrationCache.getTimeToExpiry(123);
if (ttl) {
  console.log(`Expires in ${ttl}ms`);
}
```

### Public API Functions

#### `getCachedIntegrations(userId, fetchFn, retryConfig?): Promise<Integration[]>`

Get cached integrations with automatic fetch on miss

**Parameters:**
- `userId` - User ID
- `fetchFn` - Function to fetch integrations on cache miss
- `retryConfig` - Optional retry configuration

**Returns:**
- `Promise<Integration[]>` - Cached or freshly fetched integrations

**Throws:**
- `CacheError` - If fetch fails after all retries

**Example:**
```typescript
const integrations = await getCachedIntegrations(
  userId,
  async () => {
    const response = await fetch('/api/integrations/status');
    if (!response.ok) throw new Error('Fetch failed');
    return response.json();
  }
);
```

**With custom retry config:**
```typescript
const integrations = await getCachedIntegrations(
  userId,
  fetchFn,
  {
    maxRetries: 5,
    initialDelay: 200,
    maxDelay: 5000,
    backoffFactor: 2,
  }
);
```

#### `getCachedIntegrationsWithFallback(userId, fetchFn, retryConfig?): Promise<Integration[]>`

Get cached integrations with fallback to empty array

**Parameters:**
- `userId` - User ID
- `fetchFn` - Function to fetch integrations on cache miss
- `retryConfig` - Optional retry configuration

**Returns:**
- `Promise<Integration[]>` - Cached, fresh, or empty array if all fails

**Never throws** - Always returns an array

**Example:**
```typescript
const integrations = await getCachedIntegrationsWithFallback(
  userId,
  async () => {
    const response = await fetch('/api/integrations/status');
    return response.json();
  }
);
// Always returns an array, never throws
```

## Error Handling

### Error Types

All errors thrown by the cache module are instances of `CacheError` with the following properties:

- `type: CacheErrorType` - Error type enum
- `message: string` - Error message
- `retryable: boolean` - Whether the operation can be retried
- `originalError?: Error` - Original error that caused the failure

### Handling Errors

```typescript
try {
  const integrations = await getCachedIntegrations(userId, fetchFn);
} catch (error) {
  if (error instanceof CacheError) {
    console.error('Cache error:', error.type);
    console.error('Retryable:', error.retryable);
    console.error('Original error:', error.originalError);
    
    if (error.retryable) {
      // Retry the operation
    } else {
      // Handle non-retryable error
    }
  }
}
```

### Error Types and Retryability

| Error Type | Retryable | Description |
|------------|-----------|-------------|
| `FETCH_FAILED` | ✅ Yes | Network fetch failed |
| `CACHE_SET_FAILED` | ❌ No | Failed to set cache |
| `CACHE_GET_FAILED` | ❌ No | Failed to get cache |
| `CLEANUP_FAILED` | ✅ Yes | Failed to cleanup expired entries |
| `RETRY_EXHAUSTED` | ❌ No | All retries exhausted |

## Retry Strategy

The cache module implements exponential backoff for retry logic:

### Retry Configuration

```typescript
interface RetryConfig {
  maxRetries: number;      // Maximum number of retries (default: 3)
  initialDelay: number;    // Initial delay in ms (default: 100)
  maxDelay: number;        // Maximum delay in ms (default: 2000)
  backoffFactor: number;   // Backoff multiplier (default: 2)
}
```

### Retry Behavior

1. **Attempt 1**: Immediate
2. **Attempt 2**: Wait 100ms (initialDelay)
3. **Attempt 3**: Wait 200ms (initialDelay * backoffFactor)
4. **Attempt 4**: Wait 400ms (initialDelay * backoffFactor²)

Maximum delay is capped at `maxDelay` (2000ms by default).

### Retryable Errors

The following network errors trigger retries:

- `ECONNREFUSED` - Connection refused
- `ETIMEDOUT` - Connection timeout
- `ENOTFOUND` - DNS lookup failed
- `ENETUNREACH` - Network unreachable
- `fetch failed` - Generic fetch failure

## Logging

The cache module uses structured logging for all operations:

### Log Levels

- **INFO**: Normal operations (cache hit, cache miss, cache set, cleanup)
- **WARN**: Retry exhausted, non-retryable errors
- **ERROR**: Operation failures

### Log Format

```typescript
{
  level: 'info' | 'warn' | 'error',
  message: string,
  metadata: {
    userId?: number,
    itemCount?: number,
    duration?: number,
    attempt?: number,
    error?: string,
    // ... other context
  }
}
```

### Example Logs

```
[INFO] Cache hit { userId: 123, itemCount: 3, duration: 2 }
[INFO] Cache miss, fetching fresh data { userId: 123 }
[INFO] Retry attempt { attempt: 2, maxRetries: 3, userId: 123 }
[INFO] Fresh data fetched and cached { userId: 123, itemCount: 3, duration: 245 }
[ERROR] Failed to get cached integrations { userId: 123, duration: 1523, error: 'Network error' }
```

## Performance

### Cache Performance

- **Lookup**: O(1) - Uses Map for constant-time lookups
- **Set**: O(1) - Constant-time insertion
- **Cleanup**: O(n) - Linear scan of all entries (runs every minute)

### Memory Usage

- **Per entry**: ~1KB (depends on integration data size)
- **Automatic cleanup**: Runs every 60 seconds
- **TTL**: 5 minutes (configurable)

### Benchmarks

- Cache hit: < 1ms
- Cache miss + fetch: 100-500ms (depends on API)
- Cache set: < 1ms
- Cleanup: < 10ms for 1000 entries

## Best Practices

### 1. Use Fallback for Non-Critical Data

```typescript
// Good: Graceful degradation
const integrations = await getCachedIntegrationsWithFallback(userId, fetchFn);

// Bad: Throws error if fetch fails
const integrations = await getCachedIntegrations(userId, fetchFn);
```

### 2. Handle Errors Appropriately

```typescript
try {
  const integrations = await getCachedIntegrations(userId, fetchFn);
} catch (error) {
  if (error instanceof CacheError && error.retryable) {
    // Retry with exponential backoff
    await new Promise(resolve => setTimeout(resolve, 1000));
    return getCachedIntegrations(userId, fetchFn);
  }
  // Handle non-retryable error
  throw error;
}
```

### 3. Invalidate Cache on Updates

```typescript
// After updating integration
await updateIntegration(userId, integrationId, data);

// Invalidate cache to force fresh fetch
integrationCache.invalidate(userId);
```

### 4. Monitor Cache Statistics

```typescript
// Periodically check cache health
setInterval(() => {
  const stats = integrationCache.getStats();
  console.log('Cache stats:', stats);
  
  if (stats.expired > stats.active) {
    console.warn('High number of expired entries');
  }
}, 60000);
```

### 5. Use Custom TTL for Different Data

```typescript
// Short TTL for frequently changing data
integrationCache.set(userId, integrations, 1 * 60 * 1000); // 1 minute

// Long TTL for stable data
integrationCache.set(userId, integrations, 30 * 60 * 1000); // 30 minutes
```

## Testing

### Unit Tests

```typescript
import { integrationCache, getCachedIntegrations } from './cache';

describe('Integration Cache', () => {
  beforeEach(() => {
    integrationCache.clear();
  });

  it('should cache integrations', () => {
    const integrations = [{ id: '1', provider: 'instagram' }];
    integrationCache.set(123, integrations);
    
    const cached = integrationCache.get(123);
    expect(cached).toEqual(integrations);
  });

  it('should return null on cache miss', () => {
    const cached = integrationCache.get(999);
    expect(cached).toBeNull();
  });

  it('should expire after TTL', async () => {
    const integrations = [{ id: '1', provider: 'instagram' }];
    integrationCache.set(123, integrations, 100); // 100ms TTL
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    const cached = integrationCache.get(123);
    expect(cached).toBeNull();
  });
});
```

### Integration Tests

```typescript
describe('getCachedIntegrations', () => {
  it('should fetch and cache on miss', async () => {
    const mockFetch = vi.fn().mockResolvedValue([
      { id: '1', provider: 'instagram' }
    ]);
    
    const integrations = await getCachedIntegrations(123, mockFetch);
    
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(integrations).toHaveLength(1);
    
    // Second call should use cache
    const cached = await getCachedIntegrations(123, mockFetch);
    expect(mockFetch).toHaveBeenCalledTimes(1); // Not called again
  });

  it('should retry on network error', async () => {
    const mockFetch = vi.fn()
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockResolvedValueOnce([{ id: '1', provider: 'instagram' }]);
    
    const integrations = await getCachedIntegrations(123, mockFetch);
    
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(integrations).toHaveLength(1);
  });
});
```

## Troubleshooting

### Cache Not Working

**Problem**: Cache always returns null

**Solution**: Check if TTL has expired or cache was cleared

```typescript
const ttl = integrationCache.getTimeToExpiry(userId);
console.log('Time to expiry:', ttl);
```

### High Memory Usage

**Problem**: Cache consuming too much memory

**Solution**: Reduce TTL or implement size limits

```typescript
const stats = integrationCache.getStats();
if (stats.size > 1000) {
  integrationCache.clear();
}
```

### Fetch Failures

**Problem**: Fetch always fails even with retries

**Solution**: Check network connectivity and API availability

```typescript
try {
  const integrations = await getCachedIntegrations(userId, fetchFn);
} catch (error) {
  if (error instanceof CacheError) {
    console.error('Error type:', error.type);
    console.error('Original error:', error.originalError);
  }
}
```

## Migration Guide

### From Old Cache Implementation

```typescript
// Old
const cached = cache[userId];
if (!cached || Date.now() > cached.expires) {
  const fresh = await fetch('/api/integrations');
  cache[userId] = { data: fresh, expires: Date.now() + 300000 };
}

// New
const integrations = await getCachedIntegrations(
  userId,
  async () => {
    const response = await fetch('/api/integrations');
    return response.json();
  }
);
```

## Related Documentation

- [Integration Service](./README.md)
- [Caching Guide](./CACHING_GUIDE.md)
- [Error Handling](./ERROR_HANDLING.md)
- [Testing Guide](../../tests/unit/services/integration-cache.test.ts)

## Support

For issues or questions:
- Check the [troubleshooting section](#troubleshooting)
- Review [test examples](../../tests/unit/services/integration-cache.test.ts)
- Open an issue on GitHub

---

**Last Updated**: November 18, 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
