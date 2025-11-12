# Onboarding API Route

## Overview

This API route implements the Shopify-style onboarding system with comprehensive error handling, caching, validation, and observability.

## Features

### ✅ Type Safety
- Full TypeScript types for requests and responses
- Exported interfaces for client-side usage
- Zod schema validation in tests

### ✅ Error Handling
- Structured error responses with correlation IDs
- Graceful degradation on cache failures
- Specific error messages for different failure modes
- Try-catch blocks around all critical operations

### ✅ Caching Strategy
- Redis caching with 5-minute TTL
- Automatic cache invalidation on POST
- Fallback to database on cache failures
- Cache key pattern: `onboarding:user:{userId}:market:{market}`

### ✅ Validation
- Market parameter validation (ISO 3166-1 alpha-2)
- Step parameter validation (alphanumeric + underscore/hyphen)
- JSON parsing with error handling
- Required field validation

### ✅ Logging
- Structured logging with correlation IDs
- Log levels: INFO, WARN, ERROR
- Request/response logging
- Cache hit/miss tracking
- Error logging with stack traces

### ✅ Authentication
- JWT token validation via `requireUser()`
- Unauthorized requests return 401
- User context in all logs

### ✅ Performance
- Redis caching for fast responses (~10-50ms)
- Database connection pooling
- Efficient query patterns
- Concurrent request support

## API Endpoints

### GET /api/onboarding

Fetch onboarding steps with user progress.

**Query Parameters:**
- `market` (optional): ISO country code (e.g., `FR`, `DE`, `US`)

**Response:**
```typescript
{
  progress: number;
  steps: OnboardingStep[];
}
```

### POST /api/onboarding

Update onboarding step data.

**Body:**
```typescript
{
  step: string;    // Required
  data?: object;   // Optional
}
```

**Response:**
```typescript
{
  ok: boolean;
}
```

## Error Responses

All errors include:
- `error`: Human-readable message
- `details`: Additional context (optional)
- `correlationId`: UUID for tracing

## Usage Examples

### Client-Side TypeScript

```typescript
import type { OnboardingResponse, OnboardingStep } from '@/app/api/onboarding/route';

async function fetchOnboarding(market?: string): Promise<OnboardingResponse> {
  const url = market 
    ? `/api/onboarding?market=${market}`
    : '/api/onboarding';
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  
  return response.json();
}

async function updateOnboarding(step: string, data?: any): Promise<void> {
  const response = await fetch('/api/onboarding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ step, data })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
}
```

### React Hook

```typescript
import { useState, useEffect } from 'react';
import type { OnboardingResponse } from '@/app/api/onboarding/route';

export function useOnboarding(market?: string) {
  const [data, setData] = useState<OnboardingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchOnboarding(market)
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [market]);
  
  const updateStep = async (step: string, data?: any) => {
    await updateOnboarding(step, data);
    // Refetch to get updated data
    const updated = await fetchOnboarding(market);
    setData(updated);
  };
  
  return { data, loading, error, updateStep };
}
```

## Testing

### Integration Tests

Located in `tests/integration/api/onboarding.test.ts`.

**Run tests:**
```bash
npm run test:integration tests/integration/api/onboarding.test.ts
```

**Coverage:**
- ✅ Authentication validation
- ✅ Response schema validation
- ✅ Market parameter validation
- ✅ Caching behavior
- ✅ Error handling
- ✅ POST validation
- ✅ Cache invalidation
- ✅ Performance benchmarks

### Manual Testing

```bash
# Start dev server
npm run dev

# Test GET (requires auth)
curl http://localhost:3000/api/onboarding

# Test GET with market
curl "http://localhost:3000/api/onboarding?market=FR"

# Test POST
curl -X POST http://localhost:3000/api/onboarding \
  -H "Content-Type: application/json" \
  -d '{"step": "email_verification", "data": {"verified": true}}'
```

## Monitoring

### Logs

All requests are logged with:
- User ID
- Market parameter
- Correlation ID
- Cache hit/miss
- Errors with stack traces

**Example:**
```
[Onboarding API] GET request { userId: "user123", market: "FR", correlationId: "..." }
[Onboarding API] Cache hit { userId: "user123", cacheKey: "...", correlationId: "..." }
[Onboarding API] GET request completed { userId: "user123", progress: 45, stepCount: 5, correlationId: "..." }
```

### Metrics (Future)

Planned metrics:
- Request count by endpoint
- Response time histogram
- Cache hit rate
- Error rate by type

## Architecture

### Request Flow

```
Client Request
    ↓
Authentication (requireUser)
    ↓
Parameter Validation
    ↓
Cache Lookup (Redis)
    ↓ (miss)
Database Query
    ↓
Response Formatting
    ↓
Cache Write (Redis)
    ↓
JSON Response
```

### Cache Strategy

**Cache Key Pattern:**
```
onboarding:user:{userId}:market:{market}
```

**TTL:** 5 minutes (300 seconds)

**Invalidation:**
- Automatic on POST requests
- Pattern-based deletion: `onboarding:user:{userId}:market:*`

**Fallback:**
- Cache read failure → Database query
- Cache write failure → Log warning, continue

## Dependencies

- `@/lib/server-auth` - Authentication
- `@/lib/db` - Database connection
- `@/lib/db/repositories/*` - Data access layer
- `@/lib/smart-onboarding/config/redis` - Redis client
- `@/lib/db/onboarding` - Legacy onboarding functions

## Related Files

- **Tests:** `tests/integration/api/onboarding.test.ts`
- **Documentation:** `docs/api/onboarding-endpoint.md`
- **Spec:** `.kiro/specs/shopify-style-onboarding/`
- **Database:** `lib/db/migrations/2024-11-11-shopify-style-onboarding.sql`
- **Repositories:**
  - `lib/db/repositories/onboarding-step-definitions.ts`
  - `lib/db/repositories/user-onboarding.ts`
  - `lib/db/repositories/onboarding-events.ts`

## Best Practices

### ✅ DO

- Use exported TypeScript types
- Handle errors with try-catch
- Log with correlation IDs
- Validate input parameters
- Use caching for performance
- Invalidate cache on updates
- Return structured error responses

### ❌ DON'T

- Don't fail on cache errors (degrade gracefully)
- Don't expose internal error details to clients
- Don't skip input validation
- Don't forget to invalidate cache on updates
- Don't use blocking operations

## Troubleshooting

### Cache Issues

**Problem:** Cache not working

**Solution:**
1. Check Redis connection
2. Verify `createRedisClient()` configuration
3. Check logs for cache errors
4. Fallback to database should work automatically

### Authentication Issues

**Problem:** 401 Unauthorized

**Solution:**
1. Verify JWT token is valid
2. Check `requireUser()` implementation
3. Ensure token is in `Authorization` header

### Performance Issues

**Problem:** Slow responses

**Solution:**
1. Check cache hit rate in logs
2. Verify Redis is running
3. Check database query performance
4. Consider increasing cache TTL

## Future Enhancements

- [ ] Rate limiting (20 POST/min, 60 GET/min)
- [ ] Prometheus metrics
- [ ] Request/response compression
- [ ] Batch operations
- [ ] WebSocket support for real-time updates
- [ ] GraphQL endpoint
- [ ] OpenAPI/Swagger documentation

## Changelog

### 2024-11-11 - Initial Implementation
- ✅ GET endpoint with caching
- ✅ POST endpoint with validation
- ✅ TypeScript types
- ✅ Error handling
- ✅ Structured logging
- ✅ Integration tests
- ✅ Documentation

---

**Maintainer:** Platform Team  
**Last Updated:** 2024-11-11  
**Status:** ✅ Production Ready
