# API Response Utilities Guide

## Overview

The response utilities provide a standardized way to format API responses across all endpoints with built-in support for:

- ✅ Type-safe response structures
- ✅ Correlation ID tracking for debugging
- ✅ Performance metrics (request duration)
- ✅ Error handling with retry information
- ✅ Pagination support with navigation links
- ✅ Cache control headers
- ✅ Consistent error codes

## Quick Start

### Basic Success Response

```typescript
import { successResponse } from '@/lib/api/utils/response';

export async function GET(request: Request) {
  const data = { message: 'Hello, World!' };
  
  return Response.json(
    successResponse(data, {
      correlationId: 'req-123',
      startTime: Date.now(),
    })
  );
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Hello, World!"
  },
  "meta": {
    "timestamp": "2025-11-17T10:00:00.000Z",
    "requestId": "req-123",
    "duration": 45,
    "version": "1.0"
  }
}
```

### Basic Error Response

```typescript
import { errorResponse } from '@/lib/api/utils/response';

export async function POST(request: Request) {
  return Response.json(
    errorResponse(
      'VALIDATION_ERROR',
      'Invalid email format',
      { field: 'email', value: 'invalid' }
    ),
    { status: 400 }
  );
}
```

**Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "value": "invalid"
    },
    "retryable": false
  },
  "meta": {
    "timestamp": "2025-11-17T10:00:00.000Z",
    "requestId": "req_1234567890_abc123",
    "version": "1.0"
  }
}
```

## Convenience Methods

### Success Responses

```typescript
import { ok, created, accepted, noContent } from '@/lib/api/utils/response';

// 200 OK
return ok({ user: { id: '123', name: 'John' } });

// 201 Created
return created({ id: '123', status: 'created' });

// 202 Accepted
return accepted({ jobId: '456', status: 'processing' });

// 204 No Content
return noContent();
```

### Error Responses

```typescript
import {
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  unprocessableEntity,
  tooManyRequests,
  internalServerError,
  serviceUnavailable,
} from '@/lib/api/utils/response';

// 400 Bad Request
return badRequest('Invalid input', { field: 'email' });

// 401 Unauthorized
return unauthorized('Please sign in');

// 403 Forbidden
return forbidden('Insufficient permissions');

// 404 Not Found
return notFound('User');

// 409 Conflict
return conflict('Email already exists');

// 422 Unprocessable Entity
return unprocessableEntity('Validation failed', { errors: [...] });

// 429 Too Many Requests
return tooManyRequests(60); // Retry after 60 seconds

// 500 Internal Server Error
return internalServerError('Database connection failed');

// 503 Service Unavailable
return serviceUnavailable('Maintenance in progress');
```

## Pagination

```typescript
import { paginatedResponse } from '@/lib/api/utils/response';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const offset = parseInt(url.searchParams.get('offset') || '0');
  
  const { items, total } = await fetchUsers(limit, offset);
  
  return Response.json(
    paginatedResponse(
      items,
      total,
      limit,
      offset,
      '/api/users' // Base URL for navigation links
    )
  );
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    { "id": "1", "name": "John" },
    { "id": "2", "name": "Jane" }
  ],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "page": 1,
    "totalPages": 5,
    "hasMore": true,
    "nextPage": "/api/users?limit=20&offset=20",
    "prevPage": null
  },
  "meta": {
    "timestamp": "2025-11-17T10:00:00.000Z",
    "requestId": "req_1234567890_abc123",
    "version": "1.0"
  }
}
```

## Advanced Features

### Request Tracking

Track requests with correlation IDs for debugging:

```typescript
export async function POST(request: Request) {
  const startTime = Date.now();
  const correlationId = request.headers.get('X-Correlation-ID') || generateId();
  
  try {
    const data = await processRequest();
    
    return Response.json(
      successResponse(data, {
        correlationId,
        startTime,
      })
    );
  } catch (error) {
    return Response.json(
      errorResponse(
        'INTERNAL_ERROR',
        'Processing failed',
        { error: error.message },
        { correlationId, startTime }
      ),
      { status: 500 }
    );
  }
}
```

### Cache Control

Add cache headers to responses:

```typescript
import { ok } from '@/lib/api/utils/response';

export async function GET(request: Request) {
  const data = await fetchPublicData();
  
  return ok(data, {
    cache: {
      public: true,
      maxAge: 3600,              // 1 hour
      sMaxAge: 7200,             // 2 hours for CDN
      staleWhileRevalidate: 86400, // 24 hours
    },
  });
}
```

**Response Headers:**
```
Cache-Control: public, max-age=3600, s-maxage=7200, stale-while-revalidate=86400
```

### Custom Headers

Add custom headers to responses:

```typescript
import { ok } from '@/lib/api/utils/response';

export async function GET(request: Request) {
  const data = await fetchData();
  
  return ok(data, {
    headers: {
      'X-Custom-Header': 'value',
      'X-Rate-Limit-Remaining': '99',
    },
  });
}
```

### Retry Information

Errors automatically include retry information:

```typescript
import { errorResponse } from '@/lib/api/utils/response';

// Rate limit error with retry information
return Response.json(
  errorResponse('RATE_LIMIT_ERROR', 'Too many requests'),
  { status: 429 }
);
```

**Response:**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_ERROR",
    "message": "Too many requests",
    "retryable": true,
    "retryAfter": 60
  },
  "meta": {
    "timestamp": "2025-11-17T10:00:00.000Z",
    "requestId": "req_1234567890_abc123"
  }
}
```

**Response Headers:**
```
Retry-After: 60
```

## Error Codes

### Standard Error Codes

| Code | Description | Retryable | HTTP Status |
|------|-------------|-----------|-------------|
| `VALIDATION_ERROR` | Invalid input data | No | 400, 422 |
| `UNAUTHORIZED` | Authentication required | No | 401 |
| `FORBIDDEN` | Insufficient permissions | No | 403 |
| `NOT_FOUND` | Resource not found | No | 404 |
| `CONFLICT` | Resource conflict | No | 409 |
| `RATE_LIMIT_ERROR` | Too many requests | Yes | 429 |
| `INTERNAL_ERROR` | Server error | Yes | 500 |
| `SERVICE_UNAVAILABLE` | Service down | Yes | 503 |
| `TIMEOUT_ERROR` | Request timeout | Yes | 504 |
| `NETWORK_ERROR` | Network issue | Yes | - |

### Custom Error Codes

You can define custom error codes for your domain:

```typescript
// Define custom error codes
const ErrorCodes = {
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  SUBSCRIPTION_EXPIRED: 'SUBSCRIPTION_EXPIRED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
} as const;

// Use in responses
return Response.json(
  errorResponse(
    ErrorCodes.PAYMENT_FAILED,
    'Payment processing failed',
    { provider: 'stripe', code: 'card_declined' }
  ),
  { status: 402 }
);
```

## Best Practices

### 1. Always Include Correlation IDs

```typescript
export async function POST(request: Request) {
  const correlationId = request.headers.get('X-Correlation-ID') || crypto.randomUUID();
  
  // Use correlationId in all responses
  return ok(data, { correlationId });
}
```

### 2. Track Request Duration

```typescript
export async function GET(request: Request) {
  const startTime = Date.now();
  
  try {
    const data = await fetchData();
    return ok(data, { startTime });
  } catch (error) {
    return internalServerError('Failed to fetch data', { startTime });
  }
}
```

### 3. Provide Detailed Error Information

```typescript
// ❌ Bad: Generic error
return badRequest('Invalid input');

// ✅ Good: Specific error with details
return badRequest('Invalid email format', {
  field: 'email',
  value: email,
  expected: 'user@example.com',
});
```

### 4. Use Appropriate Status Codes

```typescript
// ❌ Bad: Wrong status code
return Response.json(errorResponse('NOT_FOUND', 'User not found'), { status: 400 });

// ✅ Good: Correct status code
return notFound('User');
```

### 5. Include Pagination Metadata

```typescript
// ✅ Always include total count and navigation links
return Response.json(
  paginatedResponse(items, total, limit, offset, baseUrl)
);
```

## TypeScript Types

### ApiResponse<T>

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    retryable?: boolean;
    retryAfter?: number;
  };
  meta: {
    timestamp: string;
    requestId: string;
    duration?: number;
    version?: string;
  };
}
```

### PaginatedResponse<T>

```typescript
interface PaginatedResponse<T> extends ApiResponse<T[]> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    page: number;
    totalPages: number;
    hasMore: boolean;
    nextPage?: string;
    prevPage?: string;
  };
}
```

### ResponseOptions

```typescript
interface ResponseOptions {
  correlationId?: string;
  startTime?: number;
  version?: string;
  cache?: {
    maxAge?: number;
    sMaxAge?: number;
    staleWhileRevalidate?: number;
    public?: boolean;
  };
  headers?: Record<string, string>;
}
```

## Testing

### Unit Tests

```typescript
import { successResponse, errorResponse } from '@/lib/api/utils/response';

describe('Response Utilities', () => {
  it('should create success response', () => {
    const response = successResponse({ id: '123' });
    
    expect(response.success).toBe(true);
    expect(response.data).toEqual({ id: '123' });
    expect(response.meta.requestId).toBeDefined();
    expect(response.meta.timestamp).toBeDefined();
  });
  
  it('should create error response', () => {
    const response = errorResponse('VALIDATION_ERROR', 'Invalid input');
    
    expect(response.success).toBe(false);
    expect(response.error?.code).toBe('VALIDATION_ERROR');
    expect(response.error?.retryable).toBe(false);
  });
});
```

### Integration Tests

```typescript
describe('API Endpoint', () => {
  it('should return paginated response', async () => {
    const response = await fetch('/api/users?limit=10&offset=0');
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.data).toBeInstanceOf(Array);
    expect(data.pagination).toBeDefined();
    expect(data.pagination.total).toBeGreaterThan(0);
    expect(data.meta.requestId).toBeDefined();
  });
});
```

## Migration Guide

### From Old Response Format

```typescript
// ❌ Old format
return Response.json({
  data: { id: '123' },
  message: 'Success',
});

// ✅ New format
return ok({ id: '123' });
```

### From Custom Error Format

```typescript
// ❌ Old format
return Response.json({
  error: 'User not found',
}, { status: 404 });

// ✅ New format
return notFound('User');
```

## Related Documentation

- [API Error Handling](./errors.ts)
- [API Caching](./cache.ts)
- [Authentication Middleware](../middleware/auth.ts)
- [Base API Client](../base-client.ts)

## Support

For questions or issues:
1. Check the [API Documentation](../../docs/api/README.md)
2. Review [Integration Tests](../../../tests/integration/api/)
3. Open an issue on GitHub

---

**Last Updated**: November 17, 2025  
**Version**: 1.0  
**Status**: ✅ Production Ready
