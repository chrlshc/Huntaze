# OAuth Validation Health API

**Endpoint:** `GET /api/validation/health`  
**Version:** 1.0.0  
**Status:** ✅ Production Ready

---

## Overview

The Validation Health API provides real-time health status of OAuth credential validation for all integrated platforms (TikTok, Instagram, Reddit). It validates credentials, tests API connectivity, and provides detailed error reporting.

### Features

- ✅ **Validates all OAuth credentials** - Tests format and authenticity
- ✅ **Tests API connectivity** - Verifies actual API access
- ✅ **Detailed error reporting** - Provides actionable error messages
- ✅ **Retry logic with timeout** - Handles transient failures
- ✅ **Response caching** - 5-minute cache for performance
- ✅ **Correlation IDs** - Request tracing for debugging
- ✅ **TypeScript types** - Full type safety

---

## Request

### HTTP Method
```
GET /api/validation/health
```

### Headers
```
Content-Type: application/json
```

### Query Parameters
None

### Authentication
Not required (public endpoint)

---

## Response

### Success Response (200 OK)

#### Healthy Status
All platforms are properly configured and accessible.

```json
{
  "status": "healthy",
  "timestamp": "2025-11-14T10:30:45.123Z",
  "platforms": [
    {
      "platform": "tiktok",
      "status": "healthy",
      "credentialsSet": true,
      "formatValid": true,
      "apiConnectivity": true,
      "errors": 0,
      "warnings": 0
    },
    {
      "platform": "instagram",
      "status": "healthy",
      "credentialsSet": true,
      "formatValid": true,
      "apiConnectivity": true,
      "errors": 0,
      "warnings": 0
    },
    {
      "platform": "reddit",
      "status": "healthy",
      "credentialsSet": true,
      "formatValid": true,
      "apiConnectivity": true,
      "errors": 0,
      "warnings": 0
    }
  ],
  "summary": {
    "total": 3,
    "healthy": 3,
    "unhealthy": 0,
    "healthPercentage": 100
  },
  "correlationId": "vh-1736159823400-abc123",
  "duration": 245
}
```

#### Degraded Status
Some platforms are not properly configured.

```json
{
  "status": "degraded",
  "timestamp": "2025-11-14T10:30:45.123Z",
  "platforms": [
    {
      "platform": "tiktok",
      "status": "healthy",
      "credentialsSet": true,
      "formatValid": true,
      "apiConnectivity": true,
      "errors": 0,
      "warnings": 0
    },
    {
      "platform": "instagram",
      "status": "healthy",
      "credentialsSet": true,
      "formatValid": true,
      "apiConnectivity": true,
      "errors": 0,
      "warnings": 0
    },
    {
      "platform": "reddit",
      "status": "unhealthy",
      "credentialsSet": false,
      "formatValid": false,
      "apiConnectivity": false,
      "errors": 1,
      "warnings": 0
    }
  ],
  "summary": {
    "total": 3,
    "healthy": 2,
    "unhealthy": 1,
    "healthPercentage": 67
  },
  "correlationId": "vh-1736159823400-abc123",
  "duration": 245
}
```

#### Unhealthy Status
No platforms are properly configured.

```json
{
  "status": "unhealthy",
  "timestamp": "2025-11-14T10:30:45.123Z",
  "platforms": [
    {
      "platform": "tiktok",
      "status": "unhealthy",
      "credentialsSet": false,
      "formatValid": false,
      "apiConnectivity": false,
      "errors": 1,
      "warnings": 0
    },
    {
      "platform": "instagram",
      "status": "unhealthy",
      "credentialsSet": false,
      "formatValid": false,
      "apiConnectivity": false,
      "errors": 1,
      "warnings": 0
    },
    {
      "platform": "reddit",
      "status": "unhealthy",
      "credentialsSet": false,
      "formatValid": false,
      "apiConnectivity": false,
      "errors": 1,
      "warnings": 0
    }
  ],
  "summary": {
    "total": 3,
    "healthy": 0,
    "unhealthy": 3,
    "healthPercentage": 0
  },
  "correlationId": "vh-1736159823400-abc123",
  "duration": 245
}
```

#### Cached Response
Response served from cache (includes cache metadata).

```json
{
  "status": "healthy",
  "timestamp": "2025-11-14T10:30:45.123Z",
  "platforms": [...],
  "summary": {...},
  "correlationId": "vh-1736159823400-abc123",
  "duration": 245,
  "cached": true,
  "cacheAge": 120
}
```

### Error Response (500 Internal Server Error)

```json
{
  "status": "error",
  "error": "VALIDATION_FAILED",
  "message": "Validation timeout after 15000ms",
  "timestamp": "2025-11-14T10:30:45.123Z",
  "correlationId": "vh-1736159823400-abc123"
}
```

---

## Response Fields

### Root Level

| Field | Type | Description |
|-------|------|-------------|
| `status` | `string` | Overall health status: `healthy`, `degraded`, `unhealthy`, or `error` |
| `timestamp` | `string` | ISO 8601 timestamp of the validation |
| `platforms` | `array` | Array of platform health details |
| `summary` | `object` | Summary statistics |
| `correlationId` | `string` | Unique request identifier for tracing |
| `duration` | `number` | Request duration in milliseconds |
| `cached` | `boolean` | (Optional) Whether response is from cache |
| `cacheAge` | `number` | (Optional) Cache age in seconds |

### Platform Object

| Field | Type | Description |
|-------|------|-------------|
| `platform` | `string` | Platform name: `tiktok`, `instagram`, or `reddit` |
| `status` | `string` | Platform status: `healthy` or `unhealthy` |
| `credentialsSet` | `boolean` | Whether credentials are configured |
| `formatValid` | `boolean` | Whether credential format is valid |
| `apiConnectivity` | `boolean` | Whether API is accessible |
| `errors` | `number` | Number of errors detected |
| `warnings` | `number` | Number of warnings detected |

### Summary Object

| Field | Type | Description |
|-------|------|-------------|
| `total` | `number` | Total number of platforms |
| `healthy` | `number` | Number of healthy platforms |
| `unhealthy` | `number` | Number of unhealthy platforms |
| `healthPercentage` | `number` | Percentage of healthy platforms (0-100) |

---

## Status Codes

| Code | Description |
|------|-------------|
| `200` | Success - Health check completed |
| `500` | Internal Server Error - Validation failed |

---

## Caching

### Cache Strategy
- **TTL:** 5 minutes (300 seconds)
- **Cache-Control:** `public, max-age=300`
- **Invalidation:** Automatic after TTL expires

### Cache Headers
```
Cache-Control: public, max-age=300
X-Correlation-ID: vh-1736159823400-abc123
```

---

## Error Handling

### Timeout
If validation takes longer than 15 seconds, the request times out:

```json
{
  "status": "error",
  "error": "VALIDATION_FAILED",
  "message": "Validation timeout after 15000ms",
  "timestamp": "2025-11-14T10:30:45.123Z",
  "correlationId": "vh-1736159823400-abc123"
}
```

### Network Errors
Network errors are caught and returned as error responses:

```json
{
  "status": "error",
  "error": "VALIDATION_FAILED",
  "message": "Network error: Failed to fetch",
  "timestamp": "2025-11-14T10:30:45.123Z",
  "correlationId": "vh-1736159823400-abc123"
}
```

---

## Usage Examples

### cURL

```bash
# Basic request
curl -X GET https://api.huntaze.com/api/validation/health

# With verbose output
curl -v -X GET https://api.huntaze.com/api/validation/health

# Save response to file
curl -X GET https://api.huntaze.com/api/validation/health -o health.json
```

### JavaScript/TypeScript

```typescript
// Using fetch
const response = await fetch('/api/validation/health');
const health = await response.json();

console.log('Status:', health.status);
console.log('Healthy platforms:', health.summary.healthy);

// Using axios
import axios from 'axios';

const { data } = await axios.get('/api/validation/health');
console.log('Health:', data);
```

### React Hook

```tsx
import { useValidationHealth } from '@/hooks/useValidationHealth';

function HealthDashboard() {
  const { health, isLoading, error, refresh } = useValidationHealth();

  if (isLoading) return <Spinner />;
  if (error) return <Error error={error} />;

  return (
    <div>
      <h1>Status: {health.status}</h1>
      <p>Healthy: {health.summary.healthy}/{health.summary.total}</p>
      
      {health.platforms.map(platform => (
        <div key={platform.platform}>
          <h2>{platform.platform}</h2>
          <p>Status: {platform.status}</p>
          <p>Errors: {platform.errors}</p>
        </div>
      ))}
      
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```

### Python

```python
import requests

response = requests.get('https://api.huntaze.com/api/validation/health')
health = response.json()

print(f"Status: {health['status']}")
print(f"Healthy: {health['summary']['healthy']}/{health['summary']['total']}")
```

---

## Performance

### Benchmarks

| Metric | Target | Typical |
|--------|--------|---------|
| Response Time (cached) | < 50ms | ~10ms |
| Response Time (uncached) | < 5s | ~2s |
| Timeout | 15s | N/A |
| Cache TTL | 5 min | 5 min |

### Optimization Tips

1. **Use caching** - Responses are cached for 5 minutes
2. **Check cache age** - Use `cacheAge` field to determine freshness
3. **Handle timeouts** - Implement retry logic for timeout errors
4. **Monitor correlation IDs** - Use for debugging and tracing

---

## Monitoring

### Logs

All requests are logged with correlation IDs:

```
[Validation Health] [vh-1736159823400-abc123] Request received
[Validation Health] [vh-1736159823400-abc123] Starting validation...
[Validation Health] [vh-1736159823400-abc123] Validation completed in 245ms
[Validation Health] [vh-1736159823400-abc123] Status: healthy, Healthy: 3/3
```

### Metrics to Track

- **Response time** - Monitor p50, p95, p99
- **Error rate** - Track validation failures
- **Cache hit rate** - Monitor cache effectiveness
- **Platform health** - Track individual platform status

---

## Troubleshooting

### Issue: All platforms show unhealthy

**Cause:** OAuth credentials not configured

**Solution:**
1. Check environment variables:
   - `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`
   - `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`
   - `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`
2. Verify credentials are correct
3. Check API connectivity

### Issue: Timeout errors

**Cause:** Slow network or API issues

**Solution:**
1. Check network connectivity
2. Verify API endpoints are accessible
3. Increase timeout if needed (default: 15s)

### Issue: Cached stale data

**Cause:** Cache not invalidated

**Solution:**
1. Wait for cache TTL to expire (5 minutes)
2. Clear cache manually (restart server)
3. Use `cacheAge` field to check freshness

---

## Related Documentation

- [OAuth Validators](../../lib/security/oauth-validators.ts)
- [Validation Health Hook](../../hooks/useValidationHealth.ts)
- [Production Security Guide](../PRODUCTION_ENV_SECURITY_COMPLETION.md)
- [OAuth Configuration](../PRODUCTION_DEPLOYMENT_GUIDE.md)

---

## Changelog

### Version 1.0.0 (2025-11-14)
- ✅ Initial release
- ✅ Support for TikTok, Instagram, Reddit
- ✅ Response caching (5 minutes)
- ✅ Timeout handling (15 seconds)
- ✅ Correlation IDs for tracing
- ✅ Comprehensive error handling

---

**Last Updated:** November 14, 2025  
**Status:** ✅ Production Ready  
**Maintainer:** Kiro AI
