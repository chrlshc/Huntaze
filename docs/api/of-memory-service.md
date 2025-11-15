# OnlyFans AI Memory Service API Documentation

## Overview

The OnlyFans AI Memory Service provides intelligent memory management for fan interactions, enabling personalized AI responses based on conversation history, personality profiles, and engagement patterns.

**Base Module:** `@/lib/of-memory/services/user-memory-service`

## Features

- ✅ Cache-first strategy with Redis (1-hour TTL)
- ✅ Parallel data fetching for optimal performance
- ✅ Automatic retry with exponential backoff
- ✅ Timeout protection (3-5s per operation)
- ✅ Graceful degradation on errors
- ✅ GDPR compliance (data deletion)
- ✅ Comprehensive error logging with correlation IDs
- ✅ Bulk operations with concurrency control

## Quick Start

```typescript
import { getUserMemoryService } from '@/lib/of-memory/services/user-memory-service';

const memoryService = getUserMemoryService();

// Get complete memory context for a fan
const context = await memoryService.getMemoryContext(fanId, creatorId);

// Save a new interaction
await memoryService.saveInteraction({
  fanId,
  creatorId,
  type: 'message',
  content: 'Hello!',
  timestamp: new Date()
});

// Get engagement score
const score = await memoryService.getEngagementScore(fanId, creatorId);
```

## API Reference

### `getMemoryContext(fanId: string, creatorId: string): Promise<MemoryContext>`

Retrieves complete memory context for a fan, including recent messages, personality profile, preferences, emotional state, and engagement metrics.

**Parameters:**
- `fanId` (string, required): Fan identifier
- `creatorId` (string, required): Creator identifier

**Returns:** `Promise<MemoryContext>`

**Response Structure:**
```typescript
{
  fanId: string;
  creatorId: string;
  recentMessages: ConversationMessage[];
  personalityProfile: PersonalityProfile;
  preferences: FanPreferences;
  emotionalState: EmotionalState;
  engagementMetrics: EngagementMetrics;
  lastInteraction: Date;
}
```

**Caching:**
- Cache TTL: 1 hour
- Cache key: `memory:context:{fanId}:{creatorId}`
- Automatic invalidation on new interactions

**Performance:**
- First request: ~500-2000ms (database queries)
- Cached request: ~10-50ms (Redis lookup)
- Timeout: 5s per operation

**Error Handling:**
- Returns minimal context on database errors
- Throws `MemoryServiceException` on validation errors
- Logs all errors with correlation IDs

**Example:**
```typescript
try {
  const context = await memoryService.getMemoryContext(
    'fan-123',
    'creator-456'
  );
  
  console.log(`Fan has ${context.recentMessages.length} recent messages`);
  console.log(`Engagement score: ${context.engagementMetrics.engagementScore}`);
} catch (error) {
  if (error instanceof MemoryServiceException) {
    console.error('Memory service error:', error.type, error.message);
  }
}
```

---

### `saveInteraction(interaction: InteractionEvent): Promise<void>`

Saves a new interaction to memory and updates engagement metrics.

**Parameters:**
- `interaction` (InteractionEvent, required): Interaction event to save

**InteractionEvent Structure:**
```typescript
{
  fanId: string;
  creatorId: string;
  type: 'message' | 'purchase' | 'tip' | 'like' | 'view';
  content?: string;        // For message interactions
  amount?: number;         // For purchase/tip interactions
  timestamp: Date;
  metadata?: Record<string, any>;
}
```

**Side Effects:**
- Saves message to database (if type is 'message')
- Updates engagement metrics
- Invalidates memory context cache
- Increments message/purchase counters

**Performance:**
- Average duration: ~100-500ms
- Retry attempts: 3 (with exponential backoff)
- Cache invalidation: Non-blocking

**Error Handling:**
- Throws `MemoryServiceException` on validation errors
- Throws `MemoryServiceException` on database errors
- Retries transient failures automatically

**Example:**
```typescript
// Save a message interaction
await memoryService.saveInteraction({
  fanId: 'fan-123',
  creatorId: 'creator-456',
  type: 'message',
  content: 'I love your content!',
  timestamp: new Date(),
  metadata: { platform: 'onlyfans' }
});

// Save a purchase interaction
await memoryService.saveInteraction({
  fanId: 'fan-123',
  creatorId: 'creator-456',
  type: 'purchase',
  amount: 19.99,
  timestamp: new Date(),
  metadata: { productId: 'prod-789' }
});
```

---

### `clearMemory(fanId: string, creatorId: string): Promise<void>`

Clears all memory data for a fan (GDPR compliance).

**Parameters:**
- `fanId` (string, required): Fan identifier
- `creatorId` (string, required): Creator identifier

**Side Effects:**
- Deletes all fan memory from database
- Clears all cache entries for the fan
- Irreversible operation

**Performance:**
- Average duration: ~200-1000ms

**Error Handling:**
- Throws `MemoryServiceException` on database errors
- Logs all operations with correlation IDs

**Example:**
```typescript
// GDPR data deletion request
await memoryService.clearMemory('fan-123', 'creator-456');
console.log('All fan data has been deleted');
```

---

### `getMemoriesForFans(fanIds: string[], creatorId: string): Promise<Map<string, MemoryContext>>`

Retrieves memory contexts for multiple fans in bulk (optimized for batch operations).

**Parameters:**
- `fanIds` (string[], required): Array of fan identifiers
- `creatorId` (string, required): Creator identifier

**Returns:** `Promise<Map<string, MemoryContext>>`

**Performance:**
- Batch size: 10 fans per batch
- Parallel processing within batches
- Average duration: ~100-200ms per fan

**Example:**
```typescript
const fanIds = ['fan-1', 'fan-2', 'fan-3', 'fan-4', 'fan-5'];
const contextsMap = await memoryService.getMemoriesForFans(
  fanIds,
  'creator-456'
);

fanIds.forEach(fanId => {
  const context = contextsMap.get(fanId);
  console.log(`${fanId}: ${context.engagementMetrics.engagementScore}`);
});
```

---

### `getEngagementScore(fanId: string, creatorId: string): Promise<number>`

Retrieves the engagement score for a fan (0.0 to 1.0).

**Parameters:**
- `fanId` (string, required): Fan identifier
- `creatorId` (string, required): Creator identifier

**Returns:** `Promise<number>` (0.0 to 1.0)

**Caching:**
- Cache TTL: 1 hour
- Cache key: `memory:engagement:{fanId}:{creatorId}`

**Default Values:**
- New fans: 0.5
- No data: 0.5

**Example:**
```typescript
const score = await memoryService.getEngagementScore('fan-123', 'creator-456');

if (score > 0.8) {
  console.log('Highly engaged fan');
} else if (score > 0.5) {
  console.log('Moderately engaged fan');
} else {
  console.log('Low engagement fan');
}
```

---

### `getMemoryStats(creatorId: string): Promise<MemoryStats>`

Retrieves memory statistics for a creator.

**Parameters:**
- `creatorId` (string, required): Creator identifier

**Returns:** `Promise<MemoryStats>`

**Response Structure:**
```typescript
{
  totalFans: number;
  fansWithMemory: number;
  totalMessages: number;
  totalInteractions: number;
  avgEngagementScore: number;
  calibratedProfiles: number;
  lastUpdated: Date;
}
```

**Example:**
```typescript
const stats = await memoryService.getMemoryStats('creator-456');

console.log(`Total fans: ${stats.totalFans}`);
console.log(`Average engagement: ${stats.avgEngagementScore}`);
console.log(`Calibrated profiles: ${stats.calibratedProfiles}`);
```

---

## Error Handling

### Error Types

```typescript
enum MemoryServiceError {
  CACHE_ERROR = 'CACHE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  TIMEOUT = 'TIMEOUT'
}
```

### MemoryServiceException

```typescript
class MemoryServiceException extends Error {
  type: MemoryServiceError;
  originalError?: Error;
  context?: Record<string, any>;
}
```

### Error Handling Pattern

```typescript
try {
  const context = await memoryService.getMemoryContext(fanId, creatorId);
} catch (error) {
  if (error instanceof MemoryServiceException) {
    switch (error.type) {
      case MemoryServiceError.VALIDATION_ERROR:
        // Handle validation error
        console.error('Invalid input:', error.message);
        break;
      case MemoryServiceError.DATABASE_ERROR:
        // Handle database error
        console.error('Database error:', error.message);
        break;
      case MemoryServiceError.TIMEOUT:
        // Handle timeout
        console.error('Operation timed out:', error.message);
        break;
      default:
        console.error('Unknown error:', error.message);
    }
  }
}
```

---

## Retry Strategy

The service implements automatic retry with exponential backoff for transient failures:

**Configuration:**
- Max attempts: 3
- Initial delay: 100ms
- Max delay: 2000ms
- Backoff factor: 2x
- Jitter: 30% of delay

**Retry Flow:**
```
Attempt 1 → Fail → Wait 100ms (+ jitter)
Attempt 2 → Fail → Wait 200ms (+ jitter)
Attempt 3 → Fail → Throw error
```

---

## Timeout Protection

All database operations have timeout protection to prevent hanging:

| Operation | Timeout |
|-----------|---------|
| getRecentMessages | 5s |
| getPersonalityProfile | 3s |
| getPreferences | 3s |
| getEmotionalState | 3s |
| getEngagementMetrics | 3s |

---

## Caching Strategy

### Cache Keys

```
memory:context:{fanId}:{creatorId}     → Full memory context
memory:engagement:{fanId}:{creatorId}  → Engagement score
```

### Cache TTLs

| Data Type | TTL |
|-----------|-----|
| Memory Context | 1 hour |
| Engagement Score | 1 hour |
| Personality Profile | 2 hours |
| Preferences | 2 hours |

### Cache Invalidation

Cache is automatically invalidated when:
- New interaction is saved
- Memory is cleared (GDPR)
- Engagement metrics are updated

---

## Performance Benchmarks

| Operation | First Request | Cached Request | Target |
|-----------|--------------|----------------|--------|
| getMemoryContext | 500-2000ms | 10-50ms | <3s |
| saveInteraction | 100-500ms | N/A | <1s |
| getEngagementScore | 50-200ms | 5-20ms | <500ms |
| clearMemory | 200-1000ms | N/A | <2s |
| getMemoriesForFans (10) | 1000-3000ms | 100-500ms | <5s |

---

## Best Practices

### 1. Always Handle Errors

```typescript
try {
  const context = await memoryService.getMemoryContext(fanId, creatorId);
  // Use context
} catch (error) {
  // Always have a fallback
  console.error('Failed to get memory context:', error);
  // Use default values or show error to user
}
```

### 2. Use Bulk Operations for Multiple Fans

```typescript
// ❌ Bad: Sequential requests
for (const fanId of fanIds) {
  const context = await memoryService.getMemoryContext(fanId, creatorId);
}

// ✅ Good: Bulk operation
const contextsMap = await memoryService.getMemoriesForFans(fanIds, creatorId);
```

### 3. Validate Input Before Calling

```typescript
// ✅ Good: Validate before calling
if (!fanId || !creatorId) {
  throw new Error('fanId and creatorId are required');
}

const context = await memoryService.getMemoryContext(fanId, creatorId);
```

### 4. Don't Block on Cache Invalidation

The service handles cache invalidation asynchronously. Don't wait for it:

```typescript
// ✅ Good: Service handles cache invalidation internally
await memoryService.saveInteraction(interaction);
// Cache is invalidated in background
```

### 5. Use Correlation IDs for Debugging

All operations log correlation IDs. Use them to trace requests:

```typescript
// Logs include correlation IDs automatically
const context = await memoryService.getMemoryContext(fanId, creatorId);
// Check logs: [UserMemoryService] Getting memory context { fanId, creatorId, correlationId }
```

---

## Testing

### Unit Tests

```bash
npm run test tests/unit/services/user-memory-service.test.ts
```

### Integration Tests

```bash
npm run test:integration tests/integration/api/of-memory.test.ts
```

### Test Coverage

- ✅ Memory context retrieval
- ✅ Interaction saving
- ✅ Cache hit/miss scenarios
- ✅ Error handling and recovery
- ✅ Retry logic
- ✅ Timeout protection
- ✅ GDPR compliance
- ✅ Bulk operations
- ✅ Performance benchmarks

---

## Monitoring

### Logs

All operations are logged with structured metadata:

```typescript
[UserMemoryService] Getting memory context {
  fanId: "fan-123",
  creatorId: "creator-456",
  correlationId: "550e8400-e29b-41d4-a716-446655440000"
}

[UserMemoryService] Cache hit for memory context {
  fanId: "fan-123",
  creatorId: "creator-456",
  duration: 15,
  correlationId: "550e8400-e29b-41d4-a716-446655440000"
}
```

### Metrics

Track these metrics in production:
- Cache hit rate
- Average response time
- Error rate by type
- Retry attempts
- Timeout occurrences

---

## Related Documentation

- [OnlyFans AI Memory Spec](../../.kiro/specs/onlyfans-ai-user-memory/)
- [Database Schema](../../lib/db/migrations/2024-11-12-onlyfans-ai-user-memory.sql)
- [Repository Documentation](../../lib/of-memory/repositories/memory-repository.ts)
- [Cache Documentation](../../lib/of-memory/cache/redis-cache.ts)

---

## Support

For issues or questions:
1. Check logs for correlation IDs
2. Review error types and messages
3. Consult integration tests for examples
4. Contact platform team with correlation ID

---

**Last Updated:** 2024-11-12  
**Status:** ✅ Production Ready  
**Maintainer:** Platform Team
