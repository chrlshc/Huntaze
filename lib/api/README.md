# API Infrastructure

This directory contains shared utilities and middleware for building consistent, secure API endpoints.

## Structure

```
lib/api/
├── middleware/
│   └── auth.ts          # Authentication middleware
├── utils/
│   ├── response.ts      # Standardized response formats
│   ├── errors.ts        # Error handling utilities
│   └── cache.ts         # Caching with Redis/memory fallback
└── index.ts             # Main exports
```

## Quick Start

### 1. Protected API Route

```typescript
// app/api/example/route.ts
import { withOnboarding, successResponse, errorResponse } from '@/lib/api';

export const GET = withOnboarding(async (req) => {
  try {
    const userId = req.user.id;
    const data = await fetchUserData(userId);
    
    return Response.json(successResponse(data));
  } catch (error) {
    return Response.json(
      errorResponse('INTERNAL_ERROR', 'Failed to fetch data'),
      { status: 500 }
    );
  }
});
```

### 2. Cached API Route

```typescript
import { withAuth, getCached, paginatedResponse } from '@/lib/api';

export const GET = withAuth(async (req) => {
  const userId = req.user.id;
  
  const data = await getCached(
    `user:${userId}:content`,
    async () => await fetchContent(userId),
    { ttl: 300, namespace: 'content' }
  );
  
  return Response.json(paginatedResponse(data.items, data.total, 50, 0));
});
```

### 3. Error Handling

```typescript
import { ApiError, ErrorCodes, createErrorResponse } from '@/lib/api';

export const POST = withAuth(async (req) => {
  try {
    const body = await req.json();
    
    if (!body.title) {
      throw new ApiError(
        ErrorCodes.MISSING_REQUIRED_FIELD,
        'Title is required',
        400
      );
    }
    
    // ... process request
  } catch (error) {
    if (error instanceof ApiError) {
      return createErrorResponse(error);
    }
    throw error;
  }
});
```

## Middleware

### `withAuth(handler)`

Validates NextAuth session and adds user context to request.

**Returns 401** if not authenticated.

```typescript
export const GET = withAuth(async (req) => {
  const userId = req.user.id; // User is authenticated
  // ...
});
```

### `withOnboarding(handler)`

Validates authentication AND onboarding completion.

**Returns 401** if not authenticated, **403** if onboarding not completed.

```typescript
export const GET = withOnboarding(async (req) => {
  const userId = req.user.id; // User is authenticated and onboarded
  // ...
});
```

### `withOptionalAuth(handler)`

Adds user context if authenticated, but doesn't require it.

```typescript
export const GET = withOptionalAuth(async (req) => {
  if (req.user) {
    // Authenticated user
  } else {
    // Anonymous user
  }
});
```

## Response Utilities

### `successResponse<T>(data, meta?)`

Creates a standardized success response.

```typescript
return Response.json(successResponse({ id: '123', name: 'Test' }));

// Output:
// {
//   "success": true,
//   "data": { "id": "123", "name": "Test" },
//   "meta": { "timestamp": "2024-01-01T00:00:00.000Z" }
// }
```

### `errorResponse(code, message, details?)`

Creates a standardized error response.

```typescript
return Response.json(
  errorResponse('NOT_FOUND', 'Resource not found'),
  { status: 404 }
);

// Output:
// {
//   "success": false,
//   "error": {
//     "code": "NOT_FOUND",
//     "message": "Resource not found",
//     "details": null
//   },
//   "meta": {
//     "timestamp": "2024-01-01T00:00:00.000Z",
//     "requestId": "uuid-here"
//   }
// }
```

### `paginatedResponse<T>(items, total, limit, offset)`

Creates a paginated response with metadata.

```typescript
return Response.json(paginatedResponse(items, 100, 50, 0));

// Output:
// {
//   "success": true,
//   "data": [...],
//   "pagination": {
//     "total": 100,
//     "limit": 50,
//     "offset": 0,
//     "hasMore": true
//   },
//   "meta": { "timestamp": "..." }
// }
```

## Error Handling

### Error Codes

Available error codes in `ErrorCodes`:

- **Authentication**: `UNAUTHORIZED`, `FORBIDDEN`, `ONBOARDING_REQUIRED`, `SESSION_EXPIRED`
- **Validation**: `VALIDATION_ERROR`, `INVALID_INPUT`, `MISSING_REQUIRED_FIELD`, `INVALID_FORMAT`
- **Resources**: `NOT_FOUND`, `ALREADY_EXISTS`, `CONFLICT`
- **Rate Limiting**: `RATE_LIMIT_EXCEEDED`, `TOO_MANY_REQUESTS`
- **Server**: `INTERNAL_ERROR`, `DATABASE_ERROR`, `EXTERNAL_API_ERROR`, `SERVICE_UNAVAILABLE`

### ApiError Class

Custom error class with correlation ID support.

```typescript
throw new ApiError(
  ErrorCodes.NOT_FOUND,
  'User not found',
  404,
  { userId: '123' }
);
```

### Error Logging

```typescript
import { logError } from '@/lib/api';

try {
  // ...
} catch (error) {
  logError(error as Error, { userId, operation: 'fetchData' });
  throw error;
}
```

## Caching

### `getCached<T>(key, fetcher, options?)`

Retrieves data from cache or fetches it.

**Options:**
- `ttl`: Time-to-live in seconds (default: 300)
- `forceRefresh`: Skip cache and fetch fresh data
- `namespace`: Prefix for cache keys

```typescript
const data = await getCached(
  `user:${userId}`,
  async () => await fetchFromDB(userId),
  { ttl: 600, namespace: 'users' }
);
```

### `invalidateCache(pattern)`

Invalidates cache entries matching a pattern.

```typescript
// Invalidate all user cache
await invalidateCache('users:*');

// Invalidate specific user
await invalidateCache('users:123');
```

### `invalidateCacheKey(key, namespace?)`

Invalidates a specific cache key.

```typescript
await invalidateCacheKey(`user:${userId}`, 'users');
```

### Cache Configuration

Set environment variables for Redis:

```env
REDIS_URL=https://your-redis-url.upstash.io
REDIS_TOKEN=your-redis-token
```

If Redis is not configured, the system automatically falls back to in-memory caching.

## Best Practices

1. **Always use middleware** - Protect routes with `withAuth` or `withOnboarding`
2. **Standardize responses** - Use `successResponse` and `errorResponse`
3. **Cache expensive operations** - Use `getCached` for database queries and external API calls
4. **Log errors properly** - Use `logError` with context for debugging
5. **Use typed errors** - Throw `ApiError` with appropriate error codes
6. **Invalidate cache** - Clear cache when data changes

## Examples

See the design document for complete examples of:
- Content API implementation
- Analytics API with caching
- Marketing campaigns API
- OnlyFans integration API
