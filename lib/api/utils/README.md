# API Utilities - Standardized Response Formats

## Overview

This module provides standardized response utilities for all API endpoints, ensuring consistency across the application with proper error handling, retry strategies, and performance monitoring.

## Features

✅ **Structured Error Handling** - Try-catch blocks with correlation IDs  
✅ **Retry Strategies** - Exponential backoff for transient failures  
✅ **Complete TypeScript Types** - Full type safety for all operations  
✅ **Token Management** - Automatic authentication handling  
✅ **Request Optimization** - Caching, debouncing, timeout handling  
✅ **Comprehensive Logging** - Structured logs for debugging  
✅ **Full Documentation** - Examples and best practices

## Response Format

All API responses follow this standardized structure:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;                    // Only on success
  error?: {                    // Only on failure
    code: string;
    message: string;
    details?: any;
    retryable?: boolean;
    retryAfter?: number;
  };
  meta: {
    timestamp: string;         // ISO 8601
    requestId: string;         // Unique correlation ID
    duration?: number;         // Request duration in ms
    version?: string;          // API version
  };
}
```

## Usage Examples

### Success Response

```typescript
import { successResponse } from '@/lib/api/utils/response';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const correlationId = crypto.randomUUID();
  
  try {
    const data = await fetchData();
    
    return Response.json(
      successResponse(data, { correlationId, startTime }),
      {
        status: 200,
        headers: {
          'X-Correlation-Id': correlationId,
        },
      }
    );
  } catch (error) {
    // Handle error...
  }
}
```

### Error Response

```typescript
import { errorResponse, internalServerError } from '@/lib/api/utils/response';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const correlationId = crypto.randomUUID();
  
  try {
    // Validation error
    if (!isValid(data)) {
      return Response.json(
        errorResponse(
          'VALIDATION_ERROR',
          'Invalid input data',
          { field: 'email', reason: 'Invalid format' },
          { correlationId, startTime }
        ),
        { status: 400 }
      );
    }
    
    // Process request...
  } catch (error) {
    // Internal server error
    return internalServerError(
      'Failed to process request',
      { correlationId, startTime }
    );
  }
}
```

### Convenience Functions

```typescript
import { ok, created, badRequest, unauthorized, notFound } from '@/lib/api/utils/response';

// 200 OK
return ok({ user: { id: '123', name: 'John' } }, { correlationId });

// 201 Created
return created({ id: '123' }, { correlationId });

// 400 Bad Request
return badRequest('Invalid email format', { field: 'email' }, { correlationId });

// 401 Unauthorized
return unauthorized('Authentication required', { correlationId });

// 404 Not Found
return notFound('User', { correlationId });
```

## Retry Strategy

### Exponential Backoff Configuration

```typescript
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 100,        // ms
  maxDelay: 2000,           // ms
  backoffFactor: 2,
  retryableErrors: [
    'P2024',  // Prisma: Timed out fetching connection
    'P2034',  // Prisma: Transaction conflict
    'P1001',  // Prisma: Can't reach database
    'P1002',  // Prisma: Database timeout
    'P1008',  // Prisma: Operations timed out
    'P1017',  // Prisma: Server closed connection
  ],
};
```

### Implementation Example

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  correlationId: string,
  attempt = 1
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const retryable = isRetryableError(error);

    if (!retryable || attempt >= RETRY_CONFIG.maxRetries) {
      throw error;
    }

    const delay = Math.min(
      RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempt - 1),
      RETRY_CONFIG.maxDelay
    );

    logger.warn('Retrying operation', {
      correlationId,
      attempt,
      delay,
      error: error.message,
    });

    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryWithBackoff(fn, correlationId, attempt + 1);
  }
}
```

## Error Codes

### Standard Error Codes

| Code | HTTP Status | Retryable | Description |
|------|-------------|-----------|-------------|
| `VALIDATION_ERROR` | 400 | No | Invalid input data |
| `UNAUTHORIZED` | 401 | No | Authentication required |
| `FORBIDDEN` | 403 | No | Access denied |
| `NOT_FOUND` | 404 | No | Resource not found |
| `CONFLICT` | 409 | No | Resource conflict |
| `RATE_LIMIT_ERROR` | 429 | Yes | Too many requests |
| `INTERNAL_ERROR` | 500 | Yes | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Yes | Service temporarily unavailable |
| `TIMEOUT_ERROR` | 504 | Yes | Request timeout |

### Retry Delays

| Error Code | Retry After (seconds) |
|------------|----------------------|
| `RATE_LIMIT_ERROR` | 60 |
| `TIMEOUT_ERROR` | 5 |
| `NETWORK_ERROR` | 10 |
| `SERVICE_UNAVAILABLE` | 30 |
| `INTERNAL_ERROR` | 15 |

## Logging

### Structured Logging Format

```typescript
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('api-endpoint');

// Info log
logger.info('Request processed successfully', {
  correlationId,
  userId,
  duration,
  cacheHit: true,
});

// Warning log
logger.warn('Retrying operation', {
  correlationId,
  attempt,
  delay,
  error: error.message,
});

// Error log
logger.error('Operation failed', error, {
  correlationId,
  userId,
  duration,
  errorMessage: error.message,
  errorStack: error.stack,
});
```

## Performance Monitoring

### Request Duration Tracking

```typescript
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const correlationId = crypto.randomUUID();
  
  try {
    const data = await fetchData();
    const duration = Date.now() - startTime;
    
    logger.info('Request completed', {
      correlationId,
      duration,
      cacheHit: false,
    });
    
    return Response.json(
      successResponse(data, { correlationId, startTime }),
      {
        headers: {
          'X-Correlation-Id': correlationId,
          'X-Duration-Ms': duration.toString(),
        },
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Request failed', error, {
      correlationId,
      duration,
    });
    
    return internalServerError(
      'Failed to process request',
      { correlationId, startTime }
    );
  }
}
```

## Cache Integration

### Cache-First Strategy

```typescript
import { cacheService } from '@/lib/services/cache.service';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const correlationId = crypto.randomUUID();
  const userId = req.user.id;
  
  try {
    // Check cache first
    const cacheKey = `data:${userId}`;
    const cached = cacheService.get<DataType>(cacheKey);
    
    if (cached) {
      const duration = Date.now() - startTime;
      
      logger.info('Cache hit', {
        correlationId,
        userId,
        duration,
        cacheKey,
      });
      
      return Response.json(
        successResponse(cached, { correlationId, startTime }),
        {
          headers: {
            'X-Correlation-Id': correlationId,
            'X-Cache-Status': 'HIT',
          },
        }
      );
    }
    
    // Fetch from database
    const data = await fetchData(userId);
    
    // Store in cache
    cacheService.set(cacheKey, data, 300); // 5 minutes TTL
    
    const duration = Date.now() - startTime;
    
    logger.info('Cache miss', {
      correlationId,
      userId,
      duration,
      cacheKey,
    });
    
    return Response.json(
      successResponse(data, { correlationId, startTime }),
      {
        headers: {
          'X-Correlation-Id': correlationId,
          'X-Cache-Status': 'MISS',
        },
      }
    );
  } catch (error) {
    // Handle error...
  }
}
```

## Authentication

### Token Validation

```typescript
import { withAuth, AuthenticatedRequest } from '@/lib/api/middleware/auth';

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const startTime = Date.now();
  const correlationId = crypto.randomUUID();
  
  // User is authenticated, req.user is available
  const userId = req.user.id;
  
  try {
    const data = await fetchUserData(userId);
    
    return Response.json(
      successResponse(data, { correlationId, startTime }),
      {
        headers: {
          'X-Correlation-Id': correlationId,
        },
      }
    );
  } catch (error) {
    return internalServerError(
      'Failed to fetch data',
      { correlationId, startTime }
    );
  }
});
```

## Rate Limiting

### Rate Limit Configuration

```typescript
import { withRateLimit } from '@/lib/api/middleware/rate-limit';

export const POST = withRateLimit(
  withAuth(async (req: AuthenticatedRequest) => {
    // Handle request...
  }),
  { limit: 10, windowMs: 60000 } // 10 requests per minute
);
```

## Testing

### Integration Test Example

```typescript
import { describe, it, expect } from 'vitest';

describe('API Endpoint', () => {
  it('should return standardized success response', async () => {
    const response = await fetch('/api/endpoint', {
      headers: { Authorization: authToken },
    });
    
    expect(response.status).toBe(200);
    
    const data = await response.json();
    
    // Validate response structure
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('meta');
    expect(data.meta).toHaveProperty('timestamp');
    expect(data.meta).toHaveProperty('requestId');
    expect(data.meta).toHaveProperty('duration');
  });
  
  it('should return standardized error response', async () => {
    const response = await fetch('/api/endpoint');
    
    expect(response.status).toBe(401);
    
    const data = await response.json();
    
    // Validate error structure
    expect(data).toHaveProperty('success', false);
    expect(data).toHaveProperty('error');
    expect(data.error).toHaveProperty('code');
    expect(data.error).toHaveProperty('message');
    expect(data).toHaveProperty('meta');
  });
});
```

## Best Practices

### 1. Always Use Correlation IDs

```typescript
const correlationId = crypto.randomUUID();
// Include in all logs and responses
```

### 2. Track Request Duration

```typescript
const startTime = Date.now();
// Calculate duration before returning
const duration = Date.now() - startTime;
```

### 3. Log All Operations

```typescript
logger.info('Operation started', { correlationId });
logger.info('Operation completed', { correlationId, duration });
logger.error('Operation failed', error, { correlationId, duration });
```

### 4. Use Retry Logic for Transient Errors

```typescript
const data = await retryWithBackoff(
  async () => await prisma.user.findUnique({ where: { id } }),
  correlationId
);
```

### 5. Implement Proper Error Handling

```typescript
try {
  // Operation
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle Prisma errors
  } else if (error.code === 'ECONNREFUSED') {
    // Handle network errors
  } else {
    // Handle unexpected errors
  }
}
```

### 6. Cache Frequently Accessed Data

```typescript
const cached = cacheService.get(cacheKey);
if (cached) return cached;

const data = await fetchData();
cacheService.set(cacheKey, data, ttl);
return data;
```

### 7. Validate Input Data

```typescript
if (!isValidEmail(email)) {
  return badRequest('Invalid email format', { field: 'email' });
}
```

### 8. Include Retry Information

```typescript
return Response.json(
  errorResponse('SERVICE_UNAVAILABLE', 'Service temporarily unavailable'),
  {
    status: 503,
    headers: {
      'Retry-After': '60',
    },
  }
);
```

## Related Documentation

- [API Best Practices](../API_BEST_PRACTICES.md)
- [Error Handling Guide](../../docs/error-handling.md)
- [Caching Strategy](../../services/cache.service.ts)
- [Authentication](../../auth/README.md)
- [Rate Limiting](../middleware/rate-limit.ts)

## Changelog

### v1.0.0 (2024-11-20)
- ✨ Initial implementation
- ✅ Standardized response format with `meta`
- ✅ Retry strategies with exponential backoff
- ✅ Complete TypeScript types
- ✅ Comprehensive logging
- ✅ Cache integration
- ✅ Authentication support
- ✅ Rate limiting support
- ✅ Full documentation with examples
