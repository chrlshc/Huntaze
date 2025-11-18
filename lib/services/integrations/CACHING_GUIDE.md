# Integration Caching Quick Reference

## Overview

The Integrations Management System uses in-memory caching to improve performance and reduce database load.

## How It Works

### Automatic Caching

The `IntegrationsService.getConnectedIntegrations()` method automatically uses caching:

```typescript
// This call is automatically cached for 5 minutes
const integrations = await integrationsService.getConnectedIntegrations(userId);
```

**First call**: Fetches from database and caches result  
**Subsequent calls**: Returns cached data (within 5 minutes)  
**After 5 minutes**: Cache expires, fetches fresh data

### Cache Invalidation

Cache is automatically invalidated when integrations change:

- ✅ After connecting new integration
- ✅ After disconnecting integration
- ✅ After refreshing token

This ensures users always see up-to-date data after making changes.

## Using the Cache Directly

### Import

```typescript
import { integrationCache, getCachedIntegrations } from '@/lib/services/integrations/cache';
```

### Get Cached Data

```typescript
// Returns cached integrations or null if cache miss/expired
const cached = integrationCache.get(userId);

if (cached) {
  console.log('Cache hit!', cached);
} else {
  console.log('Cache miss, need to fetch');
}
```

### Set Cache

```typescript
const integrations = await fetchIntegrations(userId);

// Cache for 5 minutes (default)
integrationCache.set(userId, integrations);

// Or with custom TTL (in milliseconds)
integrationCache.set(userId, integrations, 60 * 1000); // 1 minute
```

### Check Cache

```typescript
if (integrationCache.has(userId)) {
  console.log('Valid cache exists');
}
```

### Invalidate Cache

```typescript
// Invalidate specific user
integrationCache.invalidate(userId);

// Clear all cache
integrationCache.clear();
```

### Helper Function

```typescript
// Automatically handles cache hit/miss
const integrations = await getCachedIntegrations(userId, async () => {
  // This function only called on cache miss
  return await fetchFromDatabase(userId);
});
```

## Cache Statistics

### Get Stats

```typescript
const stats = integrationCache.getStats();
console.log(stats);
// {
//   size: 150,      // Total entries
//   active: 145,    // Valid entries
//   expired: 5      // Expired entries
// }
```

### Check Size

```typescript
const size = integrationCache.size();
console.log(`Cache has ${size} entries`);
```

### Time to Expiry

```typescript
const ttl = integrationCache.getTimeToExpiry(userId);
if (ttl) {
  console.log(`Cache expires in ${ttl}ms`);
}
```

## Best Practices

### ✅ DO

- Use `getConnectedIntegrations()` - it handles caching automatically
- Invalidate cache after mutations (connect/disconnect/refresh)
- Monitor cache hit rate in production
- Use cache statistics for debugging

### ❌ DON'T

- Don't bypass the cache for read operations
- Don't forget to invalidate cache after mutations
- Don't set very short TTLs (defeats the purpose)
- Don't cache sensitive data like raw tokens (we cache integration metadata only)

## Performance Tips

### Cache Hit Rate

Monitor cache effectiveness:

```typescript
let hits = 0;
let misses = 0;

const cached = integrationCache.get(userId);
if (cached) {
  hits++;
} else {
  misses++;
}

const hitRate = hits / (hits + misses);
console.log(`Cache hit rate: ${(hitRate * 100).toFixed(1)}%`);
```

### Optimal TTL

The default 5-minute TTL balances:
- **Freshness**: Data is never more than 5 minutes old
- **Performance**: Reduces database queries by ~95%
- **Memory**: Reasonable memory usage

Adjust TTL based on your needs:
- **More frequent updates**: Lower TTL (1-2 minutes)
- **Less frequent updates**: Higher TTL (10-15 minutes)

## Troubleshooting

### Cache Not Working

**Symptom**: Every request hits database

**Check**:
1. Is caching enabled? (It should be by default)
2. Is cache being invalidated too frequently?
3. Are you using `getConnectedIntegrations()`?

**Debug**:
```typescript
console.log('Cache size:', integrationCache.size());
console.log('Has cache for user:', integrationCache.has(userId));
```

### Stale Data

**Symptom**: UI shows old data after changes

**Cause**: Cache not invalidated after mutation

**Fix**: Ensure cache invalidation after:
- `handleOAuthCallback()` - ✅ Already done
- `refreshToken()` - ✅ Already done
- `disconnectIntegration()` - ✅ Already done

### High Memory Usage

**Symptom**: Application using too much memory

**Check**:
```typescript
const stats = integrationCache.getStats();
console.log('Cache entries:', stats.size);
```

**Solutions**:
1. Lower TTL to expire entries faster
2. Implement cache size limit
3. Clear cache periodically: `integrationCache.clear()`

## Examples

### Basic Usage

```typescript
import { integrationsService } from '@/lib/services/integrations/integrations.service';

// Automatically cached
const integrations = await integrationsService.getConnectedIntegrations(userId);
```

### Manual Cache Control

```typescript
import { integrationCache } from '@/lib/services/integrations/cache';

// Check cache first
let integrations = integrationCache.get(userId);

if (!integrations) {
  // Cache miss - fetch from database
  integrations = await fetchFromDatabase(userId);
  
  // Cache the result
  integrationCache.set(userId, integrations);
}

// Use integrations
console.log(integrations);
```

### Cache Invalidation Pattern

```typescript
async function updateIntegration(userId: number, data: any) {
  // Update database
  await database.update(data);
  
  // Invalidate cache so next read gets fresh data
  integrationCache.invalidate(userId);
}
```

### Monitoring Cache Health

```typescript
setInterval(() => {
  const stats = integrationCache.getStats();
  
  console.log('Cache Health:', {
    total: stats.size,
    active: stats.active,
    expired: stats.expired,
    hitRate: calculateHitRate(), // Your implementation
  });
}, 60000); // Every minute
```

## Configuration

### Cache TTL

Default: 5 minutes (300,000 ms)

Change in `lib/services/integrations/cache.ts`:

```typescript
export const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
```

### Cleanup Interval

Default: 1 minute

Change in `IntegrationCache` constructor:

```typescript
this.cleanupInterval = setInterval(() => {
  this.cleanupExpired();
}, 60 * 1000); // 1 minute
```

## Testing

### Unit Tests

Run cache tests:

```bash
npm test -- tests/unit/services/integration-cache.test.ts --run
```

### Integration Tests

Run integration tests:

```bash
npm test -- tests/unit/services/integration-cache-integration.test.ts --run
```

### All Tests

```bash
npm test -- tests/unit/services/integration-cache --run
```

## Related Documentation

- [Connection Pooling Guide](./CONNECTION_POOLING.md)
- [Caching Implementation](../../.kiro/specs/integrations-management/CACHING_IMPLEMENTATION.md)
- [Design Document](../../.kiro/specs/integrations-management/design.md)

## Support

For issues or questions:
1. Check cache statistics: `integrationCache.getStats()`
2. Review logs for cache hit/miss messages
3. Verify cache invalidation is working
4. Check TTL configuration
