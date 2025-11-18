# Analytics Overview API

## Endpoint

```
GET /api/analytics/overview
```

## Description

Returns comprehensive analytics overview with key business metrics for authenticated users. Data is cached for 5 minutes to optimize performance.

## Authentication

**Required**: Yes (NextAuth session)

## Rate Limiting

- **Limit**: 60 requests per minute per user
- **Headers**: 
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Unix timestamp when limit resets

## Request

### Headers

```http
Cookie: next-auth.session-token=<session-token>
```

### Query Parameters

None

## Response

### Success Response (200 OK)

```typescript
{
  success: true;
  data: {
    arpu: number;              // Average Revenue Per User (USD)
    ltv: number;               // Lifetime Value (USD)
    churnRate: number;         // Churn rate (percentage)
    activeSubscribers: number; // Current active subscribers count
    totalRevenue: number;      // Total revenue (USD)
    monthOverMonthGrowth: number; // MoM growth (percentage)
    timestamp: string;         // ISO 8601 timestamp
  };
  cached: boolean;             // Whether data came from cache
  correlationId: string;       // Request correlation ID for tracking
}
```

#### Example

```json
{
  "success": true,
  "data": {
    "arpu": 45.50,
    "ltv": 450.00,
    "churnRate": 5.2,
    "activeSubscribers": 1250,
    "totalRevenue": 56875.00,
    "monthOverMonthGrowth": 12.5,
    "timestamp": "2025-11-18T10:00:00Z"
  },
  "cached": true,
  "correlationId": "abc-123-def-456"
}
```

### Error Responses

#### 401 Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required. Please sign in to access this resource.",
    "correlationId": "abc-123-def-456",
    "retryable": false
  }
}
```

#### 429 Too Many Requests

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please try again later.",
    "correlationId": "abc-123-def-456",
    "retryable": true
  }
}
```

**Headers**:
- `Retry-After`: 60 (seconds to wait before retrying)

#### 500 Internal Server Error

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to fetch analytics overview",
    "correlationId": "abc-123-def-456",
    "retryable": true
  }
}
```

**Headers**:
- `Retry-After`: 60 (seconds to wait before retrying)

## Response Headers

All responses include:

- `X-Correlation-Id`: Unique request identifier for debugging
- `X-Cache-Status`: `HIT` or `MISS` (indicates if data came from cache)
- `X-Duration-Ms`: Request processing time in milliseconds

## Caching

- **Strategy**: In-memory cache with 5-minute TTL
- **Cache Key**: `analytics:overview:{userId}`
- **Invalidation**: Automatic after 5 minutes
- **Status**: Check `cached` field in response or `X-Cache-Status` header

## Retry Strategy

The endpoint implements automatic retry with exponential backoff for transient failures:

- **Max Retries**: 3 attempts
- **Initial Delay**: 1 second
- **Backoff**: Exponential (1s, 2s, 4s)
- **Retryable Errors**: Network timeouts, connection refused, DNS errors

## Error Handling

### Error Codes

| Code | Description | HTTP Status | Retryable |
|------|-------------|-------------|-----------|
| `UNAUTHORIZED` | Missing or invalid authentication | 401 | No |
| `VALIDATION_ERROR` | Invalid request parameters | 400 | No |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 | Yes |
| `INTERNAL_ERROR` | Server error | 500 | Yes |

### Retryable Errors

For errors with `retryable: true`, clients should:
1. Wait for the duration specified in `Retry-After` header
2. Implement exponential backoff for subsequent retries
3. Limit total retry attempts to avoid infinite loops

## Performance

- **Average Response Time**: < 100ms (cached)
- **Average Response Time**: < 500ms (uncached)
- **Cache Hit Rate**: ~85%
- **Timeout**: 10 seconds

## Usage Examples

### JavaScript/TypeScript (fetch)

```typescript
async function getAnalyticsOverview() {
  try {
    const response = await fetch('/api/analytics/overview', {
      method: 'GET',
      credentials: 'include', // Important for cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      
      // Handle retryable errors
      if (error.error?.retryable) {
        const retryAfter = response.headers.get('Retry-After');
        console.log(`Retrying after ${retryAfter} seconds`);
        // Implement retry logic
      }
      
      throw new Error(error.error?.message || 'Request failed');
    }

    const data = await response.json();
    console.log('Analytics:', data.data);
    console.log('Cached:', data.cached);
    
    return data;
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    throw error;
  }
}
```

### React Hook

```typescript
import { useState, useEffect } from 'react';

interface AnalyticsOverview {
  arpu: number;
  ltv: number;
  churnRate: number;
  activeSubscribers: number;
  totalRevenue: number;
  monthOverMonthGrowth: number;
  timestamp: string;
}

export function useAnalyticsOverview() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch('/api/analytics/overview', {
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Failed to fetch');
        }

        const result = await response.json();
        setData(result.data);
        setCached(result.cached);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return { data, loading, error, cached };
}
```

### cURL

```bash
curl -X GET https://app.huntaze.com/api/analytics/overview \
  -H "Cookie: next-auth.session-token=your-session-token" \
  -H "Content-Type: application/json"
```

## Monitoring & Debugging

### Correlation IDs

Every request includes a unique `correlationId` in the response. Use this ID to:
- Track requests across logs
- Debug issues with support team
- Correlate frontend errors with backend logs

### Logging

The endpoint logs the following events:
- Request start (INFO)
- Request completion (INFO)
- Retry attempts (WARN)
- Errors (ERROR)

All logs include:
- `correlationId`: Request identifier
- `userId`: Authenticated user ID
- `duration`: Request processing time
- `cached`: Whether data came from cache

### Example Log Entry

```json
{
  "level": "INFO",
  "message": "Analytics overview request completed",
  "correlationId": "abc-123-def-456",
  "userId": "12345",
  "cached": true,
  "duration": 45,
  "timestamp": "2025-11-18T10:00:00Z"
}
```

## Best Practices

### Client-Side

1. **Cache Responses**: Store data locally for 5 minutes to match server cache
2. **Handle Errors Gracefully**: Show user-friendly messages for errors
3. **Implement Retry Logic**: Respect `Retry-After` headers
4. **Use Correlation IDs**: Include in error reports for debugging

### Server-Side

1. **Monitor Cache Hit Rate**: Should be > 80%
2. **Track Response Times**: Alert if p95 > 1 second
3. **Monitor Error Rates**: Alert if > 1% of requests fail
4. **Review Logs**: Use correlation IDs to debug issues

## Related Endpoints

- `GET /api/analytics/trends` - Time-series analytics data
- `GET /api/analytics/performance` - Performance metrics
- `GET /api/analytics/top-hours` - Best posting times

## Changelog

### Version 1.1 (2025-11-18)
- ✅ Added TypeScript types for request/response
- ✅ Implemented retry logic with exponential backoff
- ✅ Added structured logging with correlation IDs
- ✅ Improved error handling with retryable flags
- ✅ Added response headers for debugging
- ✅ Enhanced documentation

### Version 1.0 (2025-11-17)
- Initial implementation with caching

---

**Last Updated**: November 18, 2025  
**Version**: 1.1  
**Status**: ✅ Production Ready
