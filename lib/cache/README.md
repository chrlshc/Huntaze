# API Cache Middleware

Application-level caching for API routes with tag-based invalidation and LRU eviction.

## Features

- ✅ **Cache-first data fetching** - Check cache before DB queries
- ✅ **Tag-based invalidation** - Invalidate related cache entries
- ✅ **TTL-based expiration** - Automatic cache expiration
- ✅ **LRU eviction** - Evict least recently used entries when full
- ✅ **Cache statistics** - Monitor hit rate and performance
- ✅ **Zero configuration** - Works out of the box

## Quick Start

### Basic Usage

```typescript
import { withCache, CachePresets } from '@/lib/cache/api-cache';

// Wrap your DB query with cache
const userData = await withCache(
  async () => {
    return await prisma.user.findUnique({
      where: { id: userId },
    });
  },
  {
    key: `user:${userId}`,
    ttl: CachePresets.MEDIUM.ttl, // 5 minutes
    tags: ['user', `user:${userId}`],
  }
);
```

### Cache Invalidation

```typescript
import { invalidateCacheByTag } from '@/lib/cache/api-cache';

// After mutation, invalidate cache
await prisma.user.update({
  where: { id: userId },
  data: { name: 'New Name' },
});

// Invalidate all cache entries with this tag
invalidateCacheByTag(`user:${userId}`);
```

## Cache Presets

Use predefined TTL values based on data volatility:

```typescript
import { CachePresets } from '@/lib/cache/api-cache';

// High volatility: 30 seconds
CachePresets.HIGH.ttl

// Medium volatility: 5 minutes
CachePresets.MEDIUM.ttl

// Low volatility: 1 hour
CachePresets.LOW.ttl

// Static: 24 hours
CachePresets.STATIC.ttl
```

## API Routes Example

### GET with Cache

```typescript
import { withCache, CachePresets } from '@/lib/cache/api-cache';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  const userData = await withCache(
    async () => {
      return await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      });
    },
    {
      key: `user:${userId}`,
      ttl: CachePresets.MEDIUM.ttl,
      tags: ['user', `user:${userId}`],
    }
  );

  return NextResponse.json({ data: userData });
}
```

### POST with Invalidation

```typescript
import { invalidateCacheByTag } from '@/lib/cache/api-cache';

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Update database
  const updatedUser = await prisma.user.update({
    where: { id: body.userId },
    data: body,
  });

  // Invalidate cache
  invalidateCacheByTag(`user:${body.userId}`);

  return NextResponse.json({ data: updatedUser });
}
```

## Cache Statistics

Monitor cache performance:

```typescript
import { getCacheStats, getCacheHitRate } from '@/lib/cache/api-cache';

const stats = getCacheStats();
const hitRate = getCacheHitRate();

console.log('Cache Stats:', {
  hits: stats.hits,
  misses: stats.misses,
  size: stats.size,
  evictions: stats.evictions,
  hitRate: `${(hitRate * 100).toFixed(2)}%`,
});
```

## API Endpoints

### Get Cache Stats

```bash
GET /api/cache/stats
```

Response:
```json
{
  "stats": {
    "hits": 150,
    "misses": 50,
    "size": 42,
    "evictions": 5,
    "hitRate": "75.00%",
    "hitRateDecimal": 0.75
  },
  "timestamp": "2024-11-26T10:00:00.000Z"
}
```

### Invalidate Cache

```bash
POST /api/cache/invalidate
Content-Type: application/json

{
  "tag": "user:123"
}
```

Response:
```json
{
  "message": "Cache invalidated for tag: user:123",
  "invalidated": 3
}
```

## Configuration

### Cache Size

Default: 1000 entries

To change, modify the APICache constructor:

```typescript
const apiCache = new APICache(2000); // 2000 entries
```

### TTL Values

Customize TTL based on your needs:

```typescript
const customTTL = {
  ttl: 10 * 60 * 1000, // 10 minutes
  tags: ['custom'],
};
```

## Best Practices

### 1. Use Appropriate TTL

- **Real-time data** (user status): HIGH (30s)
- **User data** (profile, settings): MEDIUM (5min)
- **Reference data** (categories, tags): LOW (1h)
- **Static content** (terms, policies): STATIC (24h)

### 2. Tag Strategy

Use hierarchical tags for flexible invalidation:

```typescript
tags: [
  'user',              // Invalidate all users
  `user:${userId}`,    // Invalidate specific user
  `user:${userId}:profile`, // Invalidate user profile
]
```

### 3. Invalidate on Mutations

Always invalidate cache after POST/PUT/DELETE:

```typescript
// Update
await prisma.user.update({ ... });
invalidateCacheByTag(`user:${userId}`);

// Delete
await prisma.user.delete({ ... });
invalidateCacheByTag('user'); // Invalidate all users
```

### 4. Monitor Hit Rate

Aim for >70% hit rate. If lower:
- Increase TTL
- Check if data is too volatile
- Review cache key strategy

## Testing

Run the test suite:

```bash
npx tsx scripts/test-api-cache.ts
```

Tests validate:
- Cache-first fetching
- Tag-based invalidation
- TTL expiration
- LRU eviction
- Cache statistics

## Performance Impact

Expected improvements:
- **DB queries**: -60% to -80%
- **API response time**: -40% to -60%
- **Cache hit rate**: 70% to 90%

## Stale-While-Revalidate

Serve stale data immediately while fetching fresh data in background.

### Usage

```typescript
import { withStaleWhileRevalidate, SWRPresets } from '@/lib/cache/stale-while-revalidate';

const userData = await withStaleWhileRevalidate(
  async () => {
    return await prisma.user.findUnique({ where: { id } });
  },
  {
    key: `user:${id}`,
    ttl: SWRPresets.MEDIUM.ttl, // 5 minutes fresh
    staleWhileRevalidate: SWRPresets.MEDIUM.staleWhileRevalidate, // 5 minutes stale
    tags: ['user', `user:${id}`],
  }
);
```

### Behavior

1. **Fresh data (within TTL)**: Return cached data immediately
2. **Stale data (expired but within SWR window)**:
   - Return stale data immediately (fast response)
   - Fetch fresh data in background
   - Update cache when fresh data arrives
3. **Completely expired**: Fetch fresh data and wait

### Benefits

- **Instant responses**: Users always get immediate data
- **Fresh data**: Background updates keep cache current
- **Resilience**: Serves stale data if revalidation fails
- **Performance**: Reduces perceived latency

### Example Timeline

```
Time    | Action                    | Response Time
--------|---------------------------|---------------
0s      | First request             | 200ms (DB query)
30s     | Second request (fresh)    | 1ms (cache hit)
6min    | Third request (stale)     | 1ms (stale data)
        | Background revalidation   | 200ms (async)
7min    | Fourth request (fresh)    | 1ms (updated cache)
```

## Requirements Validated

- ✅ **4.1**: Cache-first data fetching
- ✅ **4.2**: Database results are cached
- ✅ **4.3**: Stale-while-revalidate behavior
- ✅ **4.4**: Cache invalidation on mutation
- ✅ **4.5**: LRU cache eviction
