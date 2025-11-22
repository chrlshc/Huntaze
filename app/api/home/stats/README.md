# Home Stats API

## Endpoint

```
GET /api/home/stats
```

## Description

Fetches user statistics for the home page dashboard. Includes automatic retry logic, structured error handling, and performance monitoring.

## Authentication

**Required**: Yes (NextAuth session)

## Rate Limiting

Standard rate limiting applies (configured at application level).

## Request

### Headers

```
Content-Type: application/json
```

### Query Parameters

None

### Request Body

None (GET request)

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "messagesSent": 1247,
    "messagesTrend": 12.5,
    "responseRate": 94.2,
    "responseRateTrend": 3.1,
    "revenue": 8450,
    "revenueTrend": 15.8,
    "activeChats": 42,
    "activeChatsTrend": -2.3
  },
  "duration": 145
}
```

**Fields:**
- `success` (boolean): Always `true` for successful responses
- `data` (object): Statistics data
  - `messagesSent` (number): Total messages sent in last 7 days
  - `messagesTrend` (number): Percentage change from previous period
  - `responseRate` (number): Response rate percentage (0-100)
  - `responseRateTrend` (number): Percentage change in response rate
  - `revenue` (number): Total revenue this month
  - `revenueTrend` (number): Percentage change in revenue
  - `activeChats` (number): Number of active conversations
  - `activeChatsTrend` (number): Percentage change in active chats
- `duration` (number): Request processing time in milliseconds

### Error Responses

#### 401 Unauthorized

```json
{
  "error": "Unauthorized",
  "correlationId": "stats-1234567890-abc123",
  "retryable": false
}
```

**Cause**: No valid session found

**Action**: User needs to log in

#### 404 Not Found

```json
{
  "error": "User not found",
  "correlationId": "stats-1234567890-abc123",
  "retryable": false
}
```

**Cause**: User account doesn't exist in database

**Action**: Contact support or re-register

#### 500 Internal Server Error

```json
{
  "error": "An unexpected error occurred. Please try again.",
  "correlationId": "stats-1234567890-abc123",
  "retryable": true
}
```

**Cause**: Unexpected server error

**Action**: Retry the request

#### 503 Service Unavailable

```json
{
  "error": "Service temporarily unavailable. Please try again.",
  "correlationId": "stats-1234567890-abc123",
  "retryable": true
}
```

**Cause**: Database connection issues or timeout

**Action**: Retry after delay (see `Retry-After` header)

**Headers:**
- `Retry-After: 60` - Retry after 60 seconds

## Response Headers

All responses include:

- `X-Correlation-Id`: Unique request identifier for debugging
- `X-Duration-Ms`: Request processing time in milliseconds (success only)
- `Cache-Control`: Caching policy

## Features

### 1. Automatic Retry Logic

The API implements exponential backoff retry for transient database errors:

- **Max Retries**: 3 attempts
- **Initial Delay**: 100ms
- **Max Delay**: 2000ms
- **Backoff Factor**: 2x

**Retryable Errors:**
- Database connection timeouts
- Transaction conflicts
- Network errors

### 2. Structured Error Handling

All errors include:
- User-friendly error message
- Correlation ID for tracking
- Retryable flag indicating if retry is recommended

### 3. Performance Monitoring

Each request is logged with:
- Correlation ID
- User ID
- Duration
- Error details (if applicable)

### 4. Default Stats Creation

If a user has no stats record, the API automatically creates one with default values (all zeros).

## Client-Side Integration

### React Server Component (Recommended)

```typescript
import { Suspense } from 'react';

async function getHomeStats() {
  const response = await fetch('/api/home/stats', {
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch stats');
  }

  const data = await response.json();
  return data.data; // Extract data from success response
}

async function StatsDisplay() {
  const stats = await getHomeStats();
  return <div>{/* Render stats */}</div>;
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <StatsDisplay />
    </Suspense>
  );
}
```

### Client Component with SWR

```typescript
'use client';

import useSWR from 'swr';

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch');
  const data = await response.json();
  return data.data;
};

export function StatsDisplay() {
  const { data, error, isLoading } = useSWR('/api/home/stats', fetcher, {
    refreshInterval: 60000, // Refresh every minute
    revalidateOnFocus: true,
  });

  if (isLoading) return <Loading />;
  if (error) return <Error />;
  return <Stats data={data} />;
}
```

### Fetch with Retry (Client-Side)

```typescript
async function fetchStatsWithRetry(maxRetries = 3) {
  const baseDelay = 1000;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('/api/home/stats', {
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        const isRetryable = response.status >= 500;
        
        if (isRetryable && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

## Logging

All requests are logged with structured JSON format:

```json
{
  "correlationId": "stats-1234567890-abc123",
  "timestamp": "2024-11-18T10:30:00.000Z",
  "service": "home-stats-api",
  "level": "info",
  "message": "Home stats fetched successfully",
  "metadata": {
    "userId": 123,
    "duration": 145
  }
}
```

## Performance

- **Target Response Time**: < 500ms (p95)
- **Timeout**: 10 seconds (client-side recommended)
- **Database Queries**: 2-3 queries per request
  - Find user by email
  - Find or create user stats

## Security

- **Authentication**: Required (session-based)
- **Authorization**: Users can only access their own stats
- **Rate Limiting**: Standard application rate limits apply
- **CORS**: Configured at application level
- **Headers**: Secure headers applied via middleware

## Caching

**Current**: No caching (`Cache-Control: private, no-cache, no-store`)

**Future** (Task 22): Will implement caching with 1-minute TTL

## Testing

See test files:
- Unit tests: `tests/unit/home/home-page-layout.test.tsx`
- Property tests: `tests/unit/home/stats-display-completeness.property.test.tsx`
- Integration tests: Coming in Phase 10

## Requirements Mapping

- **7.2**: Display messages sent with trend
- **7.3**: Display response rate with trend
- **7.4**: Display revenue with trend
- **7.5**: Display active chats with trend
- **7.6**: Implement hover effects (handled in UI layer)

## Troubleshooting

### Issue: 503 Service Unavailable

**Possible Causes:**
1. Database connection pool exhausted
2. Database server timeout
3. Network issues

**Solutions:**
1. Check database connection pool settings
2. Verify database server is running
3. Check network connectivity
4. Review CloudWatch logs for correlation ID

### Issue: Stats not updating

**Possible Causes:**
1. Stats update job not running
2. Caching issue (after Task 22)

**Solutions:**
1. Verify background jobs are running
2. Check cache invalidation logic
3. Manually update stats in database

### Issue: Slow response times

**Possible Causes:**
1. Database query performance
2. High concurrent requests
3. Network latency

**Solutions:**
1. Add database indexes (already present)
2. Implement caching (Task 22)
3. Scale database resources

## Related Documentation

- [Home Page Components](../../../(app)/home/README.md)
- [User Stats Model](../../../../prisma/schema.prisma)
- [Authentication](../../../lib/auth.ts)
- [Logging Utility](../../../lib/utils/logger.ts)

## Changelog

### v1.0.0 (2024-11-18)
- ✨ Initial implementation
- ✅ Automatic retry with exponential backoff
- ✅ Structured error handling
- ✅ Performance monitoring
- ✅ Correlation ID tracking
- ✅ Default stats creation
- ✅ Comprehensive documentation
