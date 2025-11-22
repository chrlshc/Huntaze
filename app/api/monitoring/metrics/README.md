# Monitoring Metrics API

## Endpoint

```
GET /api/monitoring/metrics
```

## Description

Fetches current monitoring metrics and CloudWatch alarm status for operational visibility. Includes automatic retry logic, structured error handling, and 30-second caching.

## Authentication

**Required**: No (public endpoint for monitoring dashboards)

**Note**: Consider adding authentication for production deployments to restrict access to monitoring data.

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
    "metrics": {
      "requests": {
        "total": 1247,
        "averageLatency": 145,
        "errorRate": 0.5
      },
      "connections": {
        "active": 42
      },
      "cache": {
        "hits": 850,
        "misses": 150
      },
      "database": {
        "queries": 320,
        "averageLatency": 25,
        "successRate": 99.8
      }
    },
    "alarms": [
      {
        "name": "HighErrorRate",
        "state": "ALARM",
        "reason": "Threshold Crossed: 1 datapoint [5.0] was greater than the threshold (2.0)",
        "updatedAt": "2024-11-19T10:25:00.000Z"
      }
    ],
    "timestamp": "2024-11-19T10:30:00.000Z"
  },
  "duration": 45
}
```

**Fields:**
- `success` (boolean): Always `true` for successful responses
- `data` (object): Metrics and alarm data
  - `metrics` (object): Golden signals metrics
    - `requests` (object): Request metrics
      - `total` (number): Total requests in last hour
      - `averageLatency` (number): Average request latency in ms
      - `errorRate` (number): Error rate percentage (0-100)
    - `connections` (object): Connection metrics
      - `active` (number): Current active connections
    - `cache` (object): Cache metrics
      - `hits` (number): Total cache hits
      - `misses` (number): Total cache misses
    - `database` (object): Database metrics
      - `queries` (number): Total queries in last hour
      - `averageLatency` (number): Average query latency in ms
      - `successRate` (number): Query success rate percentage (0-100)
  - `alarms` (array): CloudWatch alarm status
    - `name` (string): Alarm name
    - `state` (string): Alarm state (OK, ALARM, INSUFFICIENT_DATA)
    - `reason` (string): State change reason
    - `updatedAt` (string): Last state update timestamp
  - `timestamp` (string): Response generation timestamp
- `duration` (number): Request processing time in milliseconds

### Error Responses

#### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Failed to retrieve monitoring metrics. Please try again.",
  "correlationId": "metrics-1234567890-abc123",
  "retryable": false
}
```

**Cause**: Unexpected server error

**Action**: Check logs with correlation ID

#### 503 Service Unavailable

```json
{
  "success": false,
  "error": "Failed to retrieve monitoring metrics. Please try again.",
  "correlationId": "metrics-1234567890-abc123",
  "retryable": true
}
```

**Cause**: CloudWatch service temporarily unavailable

**Action**: Retry after delay (see `Retry-After` header)

**Headers:**
- `Retry-After: 60` - Retry after 60 seconds

## Response Headers

All responses include:

- `X-Correlation-Id`: Unique request identifier for debugging
- `X-Duration-Ms`: Request processing time in milliseconds (success only)
- `X-Cache-Status`: Cache hit/miss status (HIT or MISS)
- `Cache-Control`: Caching policy

## Features

### 1. Automatic Retry Logic

The API implements exponential backoff retry for CloudWatch API calls:

- **Max Retries**: 3 attempts
- **Initial Delay**: 100ms
- **Max Delay**: 2000ms
- **Backoff Factor**: 2x

**Retryable Errors:**
- Network connection errors (ECONNREFUSED, ETIMEDOUT, etc.)
- AWS SDK errors (NetworkingError, ServiceUnavailable)
- HTTP 5xx errors

### 2. Structured Error Handling

All errors include:
- User-friendly error message
- Correlation ID for tracking
- Retryable flag indicating if retry is recommended

### 3. Performance Monitoring

Each request is logged with:
- Correlation ID
- Duration
- Cache hit/miss status
- Error details (if applicable)

### 4. Caching

Metrics are cached for 30 seconds to reduce load on CloudWatch API:
- **TTL**: 30 seconds
- **Cache Key**: `monitoring:metrics:summary`
- **Invalidation**: Automatic expiration

### 5. Graceful Degradation

If CloudWatch alarms fail to fetch:
- Returns empty alarms array
- Logs warning with correlation ID
- Does not fail the entire request
- Metrics summary still returned

## Client-Side Integration

### React Component with SWR

```typescript
'use client';

import useSWR from 'swr';

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch');
  const data = await response.json();
  return data.data;
};

export function MetricsDashboard() {
  const { data, error, isLoading } = useSWR(
    '/api/monitoring/metrics',
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
    }
  );

  if (isLoading) return <Loading />;
  if (error) return <Error />;
  
  return (
    <div>
      <h2>System Metrics</h2>
      <div>
        <p>Total Requests: {data.metrics.requests.total}</p>
        <p>Average Latency: {data.metrics.requests.averageLatency}ms</p>
        <p>Error Rate: {data.metrics.requests.errorRate}%</p>
        <p>Active Connections: {data.metrics.connections.active}</p>
      </div>
      
      <h3>Alarms</h3>
      {data.alarms.length === 0 ? (
        <p>No active alarms</p>
      ) : (
        <ul>
          {data.alarms.map((alarm, i) => (
            <li key={i}>
              <strong>{alarm.name}</strong>: {alarm.state}
              <br />
              <small>{alarm.reason}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Fetch with Retry (Client-Side)

```typescript
async function fetchMetricsWithRetry(maxRetries = 3) {
  const baseDelay = 1000;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('/api/monitoring/metrics', {
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        const errorData = await response.json();
        const isRetryable = errorData.retryable || response.status >= 500;
        
        if (isRetryable && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        throw new Error(`HTTP ${response.status}: ${errorData.error}`);
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

### Server Component (Next.js)

```typescript
import { Suspense } from 'react';

async function getMetrics() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/monitoring/metrics`, {
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch metrics');
  }

  const data = await response.json();
  return data.data;
}

async function MetricsDisplay() {
  const metrics = await getMetrics();
  return <div>{/* Render metrics */}</div>;
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <MetricsDisplay />
    </Suspense>
  );
}
```

## Logging

All requests are logged with structured JSON format:

```json
{
  "correlationId": "metrics-1234567890-abc123",
  "timestamp": "2024-11-19T10:30:00.000Z",
  "service": "monitoring-metrics-api",
  "level": "info",
  "message": "Monitoring metrics fetched successfully",
  "metadata": {
    "duration": 45,
    "alarmsCount": 2,
    "cacheHit": false
  }
}
```

## Performance

- **Target Response Time**: < 100ms (cached), < 500ms (uncached)
- **Timeout**: 10 seconds (client-side recommended)
- **Cache TTL**: 30 seconds
- **CloudWatch API Calls**: 0-1 per request (cached/uncached)

## Caching Strategy

**Current Implementation:**
- In-memory cache with 30-second TTL
- Cache key: `monitoring:metrics:summary`
- Automatic expiration
- Cache warming on first request

**Cache Headers:**
- `Cache-Control: private, max-age=30`
- `X-Cache-Status: HIT` or `MISS`

## Security

- **Authentication**: Currently public (consider adding auth for production)
- **Rate Limiting**: Standard application rate limits apply
- **CORS**: Configured at application level
- **Headers**: Secure headers applied via middleware
- **Data Exposure**: Metrics are aggregated, no sensitive data exposed

## Monitoring

### Key Metrics to Track

1. **Response Time**: Should be < 100ms (cached), < 500ms (uncached)
2. **Error Rate**: Should be < 1%
3. **Cache Hit Rate**: Should be > 90%
4. **CloudWatch API Errors**: Should be < 0.1%

### Alerts

Consider setting up alerts for:
- Response time > 1000ms
- Error rate > 5%
- Cache hit rate < 50%
- CloudWatch API errors > 1%

## Troubleshooting

### Issue: 503 Service Unavailable

**Possible Causes:**
1. CloudWatch API rate limiting
2. AWS credentials invalid/expired
3. Network connectivity issues

**Solutions:**
1. Check AWS CloudWatch service status
2. Verify AWS credentials in environment variables
3. Check network connectivity to AWS
4. Review CloudWatch logs for correlation ID

### Issue: Empty alarms array

**Possible Causes:**
1. No alarms configured in CloudWatch
2. CloudWatch API error (logged as warning)
3. AWS credentials lack CloudWatch permissions

**Solutions:**
1. Verify alarms are configured in CloudWatch
2. Check logs for CloudWatch API errors
3. Verify IAM permissions include `cloudwatch:DescribeAlarms`

### Issue: High response times

**Possible Causes:**
1. Cache not working
2. CloudWatch API slow
3. High concurrent requests

**Solutions:**
1. Verify cache service is working
2. Check CloudWatch API latency
3. Increase cache TTL if appropriate
4. Consider implementing request queuing

### Issue: Stale metrics

**Possible Causes:**
1. Cache TTL too long
2. Metrics not being recorded

**Solutions:**
1. Reduce cache TTL (currently 30s)
2. Verify telemetry is recording metrics
3. Check `goldenSignals.getMetricsSummary()` output

## Related Documentation

- [CloudWatch Service](../../../lib/monitoring/cloudwatch.service.ts)
- [Golden Signals Telemetry](../../../lib/monitoring/telemetry.ts)
- [Cache Service](../../../lib/services/cache.service.ts)
- [Monitoring Middleware](../../../lib/middleware/monitoring.ts)

## API Integration Examples

### Grafana Dashboard

```javascript
// Grafana SimpleJSON datasource query
{
  "target": "monitoring_metrics",
  "type": "timeserie",
  "refId": "A"
}

// Fetch function
async function fetchMetrics() {
  const response = await fetch('https://app.huntaze.com/api/monitoring/metrics');
  const data = await response.json();
  
  return {
    target: 'requests',
    datapoints: [
      [data.data.metrics.requests.total, Date.now()],
      [data.data.metrics.requests.averageLatency, Date.now()],
    ]
  };
}
```

### Prometheus Exporter

```javascript
// Convert to Prometheus format
async function exportPrometheusMetrics() {
  const response = await fetch('/api/monitoring/metrics');
  const data = await response.json();
  
  const metrics = data.data.metrics;
  
  return `
# HELP requests_total Total number of requests
# TYPE requests_total counter
requests_total ${metrics.requests.total}

# HELP requests_latency_ms Average request latency in milliseconds
# TYPE requests_latency_ms gauge
requests_latency_ms ${metrics.requests.averageLatency}

# HELP requests_error_rate Error rate percentage
# TYPE requests_error_rate gauge
requests_error_rate ${metrics.requests.errorRate}

# HELP connections_active Active connections
# TYPE connections_active gauge
connections_active ${metrics.connections.active}

# HELP cache_hits_total Total cache hits
# TYPE cache_hits_total counter
cache_hits_total ${metrics.cache.hits}

# HELP cache_misses_total Total cache misses
# TYPE cache_misses_total counter
cache_misses_total ${metrics.cache.misses}

# HELP database_queries_total Total database queries
# TYPE database_queries_total counter
database_queries_total ${metrics.database.queries}

# HELP database_latency_ms Average database query latency in milliseconds
# TYPE database_latency_ms gauge
database_latency_ms ${metrics.database.averageLatency}

# HELP database_success_rate Database query success rate percentage
# TYPE database_success_rate gauge
database_success_rate ${metrics.database.successRate}
  `.trim();
}
```

## Changelog

### v1.0.0 (2024-11-19)
- ✨ Initial implementation with retry logic
- ✅ Structured error handling with correlation IDs
- ✅ 30-second caching for performance
- ✅ Graceful degradation for CloudWatch errors
- ✅ Comprehensive TypeScript types
- ✅ Structured logging
- ✅ Performance monitoring
- ✅ Comprehensive documentation

---

**Status**: ✅ Production Ready  
**Last Updated**: 2024-11-19
