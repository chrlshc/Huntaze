# Redis Test API

## Endpoint

```
GET /api/test-redis
```

## Description

Tests ElastiCache Redis connectivity with comprehensive diagnostics. Includes automatic retry logic, structured error handling, and performance monitoring.

This endpoint is designed for:
- Validating ElastiCache configuration
- Diagnosing connectivity issues
- Performance testing
- Deployment verification

## Authentication

**Not Required** - This is a diagnostic endpoint

## Rate Limiting

Standard rate limiting applies (configured at application level).

## Request

### Headers

None required

### Query Parameters

None

### Request Body

None (GET request)

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "connection": {
    "host": "my-cluster.cache.amazonaws.com",
    "port": "6379",
    "redisVersion": "7.0.7"
  },
  "tests": {
    "ping": {
      "result": "PONG",
      "duration": "12ms"
    },
    "set": {
      "key": "test:connection:1700000000000",
      "duration": "8ms"
    },
    "get": {
      "value": "success",
      "duration": "6ms"
    },
    "delete": {
      "duration": "7ms"
    }
  },
  "performance": {
    "totalDuration": "145ms"
  },
  "meta": {
    "timestamp": "2024-11-21T10:30:00.000Z",
    "correlationId": "redis-test-1234567890-abc123"
  }
}
```

**Fields:**
- `success` (boolean): Always `true` for successful responses
- `connection` (object): Connection details
  - `host` (string): Redis host address
  - `port` (string): Redis port number
  - `redisVersion` (string): Redis server version
- `tests` (object): Test results
  - `ping` (object): PING command test
    - `result` (string): Response from Redis (should be "PONG")
    - `duration` (string): Time taken for PING command
  - `set` (object): SET command test
    - `key` (string): Test key used
    - `duration` (string): Time taken for SET command
  - `get` (object): GET command test
    - `value` (string): Retrieved value (should be "success")
    - `duration` (string): Time taken for GET command
  - `delete` (object): DELETE command test
    - `duration` (string): Time taken for DELETE command
- `performance` (object): Overall performance metrics
  - `totalDuration` (string): Total test duration
- `meta` (object): Request metadata
  - `timestamp` (string): ISO 8601 timestamp
  - `correlationId` (string): Unique request identifier

### Error Responses

#### 500 Internal Server Error (Configuration)

```json
{
  "success": false,
  "error": "ELASTICACHE_REDIS_HOST environment variable not set",
  "errorType": "CONFIGURATION_ERROR",
  "connection": {
    "host": "NOT_SET",
    "port": "6379"
  },
  "troubleshooting": {
    "possibleCauses": [
      "Environment variable not configured in Amplify",
      "Missing .env file in local development"
    ],
    "nextSteps": [
      "Set ELASTICACHE_REDIS_HOST in Amplify environment variables",
      "Verify .env file contains ELASTICACHE_REDIS_HOST",
      "Check deployment configuration"
    ]
  },
  "meta": {
    "timestamp": "2024-11-21T10:30:00.000Z",
    "correlationId": "redis-test-1234567890-abc123",
    "retryable": false
  }
}
```

**Cause**: Missing environment variable configuration

**Action**: Configure ELASTICACHE_REDIS_HOST in environment

#### 503 Service Unavailable (Connection)

```json
{
  "success": false,
  "error": "connect ETIMEDOUT",
  "errorType": "Error",
  "connection": {
    "host": "my-cluster.cache.amazonaws.com",
    "port": "6379"
  },
  "troubleshooting": {
    "possibleCauses": [
      "Security Group does not allow traffic from Amplify",
      "VPC access not configured in Amplify",
      "ElastiCache cluster is not available",
      "Network connectivity issues",
      "Redis authentication required but not provided",
      "Connection timeout due to network latency"
    ],
    "nextSteps": [
      "Check Security Group rules (allow port 6379 from Amplify)",
      "Verify VPC configuration in Amplify console",
      "Check ElastiCache cluster status in AWS console",
      "Review CloudWatch logs for connection errors",
      "Verify ELASTICACHE_REDIS_HOST is correct",
      "Test connectivity from EC2 instance in same VPC"
    ]
  },
  "meta": {
    "timestamp": "2024-11-21T10:30:00.000Z",
    "correlationId": "redis-test-1234567890-abc123",
    "retryable": true
  }
}
```

**Cause**: Cannot connect to ElastiCache

**Action**: Check network configuration and security groups

**Headers:**
- `Retry-After: 60` - Retry after 60 seconds

## Response Headers

All responses include:

- `X-Correlation-Id`: Unique request identifier for debugging
- `X-Duration-Ms`: Request processing time in milliseconds
- `Cache-Control`: No caching policy
- `Retry-After`: Retry delay in seconds (error responses only)

## Features

### 1. Automatic Retry Logic

The API implements exponential backoff retry for transient connection errors:

- **Max Retries**: 3 attempts
- **Initial Delay**: 100ms
- **Max Delay**: 2000ms
- **Backoff Factor**: 2x

**Retryable Errors:**
- Connection refused (ECONNREFUSED)
- Connection timeout (ETIMEDOUT)
- Network unreachable (ENETUNREACH)
- Connection reset (ECONNRESET)
- Redis connection closed

### 2. Structured Error Handling

All errors include:
- User-friendly error message
- Error type classification
- Correlation ID for tracking
- Retryable flag indicating if retry is recommended
- Troubleshooting guidance with possible causes and next steps

### 3. Performance Monitoring

Each operation is timed individually:
- PING command latency
- SET command latency
- GET command latency
- DELETE command latency
- Total test duration

### 4. Comprehensive Logging

All operations are logged with:
- Correlation ID
- Operation type
- Duration
- Error details (if applicable)
- Connection parameters

## Usage Examples

### cURL

```bash
# Test Redis connectivity
curl -X GET https://your-app.amplifyapp.com/api/test-redis

# With verbose output
curl -v -X GET https://your-app.amplifyapp.com/api/test-redis
```

### JavaScript/TypeScript (Fetch)

```typescript
async function testRedisConnection() {
  try {
    const response = await fetch('/api/test-redis');
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Redis connected:', data.connection);
      console.log('Performance:', data.performance);
    } else {
      console.error('❌ Redis connection failed:', data.error);
      console.log('Troubleshooting:', data.troubleshooting);
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
}
```

### React Component

```typescript
'use client';

import { useState } from 'react';

export function RedisTestButton() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-redis');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, error: 'Request failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={testConnection} disabled={loading}>
        {loading ? 'Testing...' : 'Test Redis Connection'}
      </button>
      
      {result && (
        <pre>{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  );
}
```

## Troubleshooting

### Issue: Connection Timeout

**Symptoms:**
- Error: "connect ETIMEDOUT"
- Status: 503

**Possible Causes:**
1. Security Group doesn't allow traffic from Amplify
2. VPC access not configured
3. ElastiCache cluster not available

**Solutions:**
1. Update Security Group to allow inbound traffic on port 6379 from Amplify
2. Configure VPC access in Amplify console
3. Verify ElastiCache cluster is running in AWS console

### Issue: Environment Variable Not Set

**Symptoms:**
- Error: "ELASTICACHE_REDIS_HOST environment variable not set"
- Status: 500

**Solutions:**
1. Set ELASTICACHE_REDIS_HOST in Amplify environment variables
2. Add to .env file for local development
3. Redeploy application after setting variables

### Issue: Slow Performance

**Symptoms:**
- Total duration > 500ms
- Individual operations > 100ms

**Possible Causes:**
1. Network latency between Amplify and ElastiCache
2. ElastiCache cluster under load
3. Suboptimal ElastiCache instance type

**Solutions:**
1. Ensure Amplify and ElastiCache are in same region
2. Monitor ElastiCache metrics in CloudWatch
3. Consider upgrading ElastiCache instance type

## Performance Benchmarks

**Expected Performance:**
- PING: < 20ms
- SET: < 15ms
- GET: < 10ms
- DELETE: < 10ms
- Total: < 100ms

**Acceptable Performance:**
- PING: < 50ms
- SET: < 30ms
- GET: < 25ms
- DELETE: < 25ms
- Total: < 200ms

**Poor Performance (investigate):**
- Any operation > 100ms
- Total > 500ms

## Security Considerations

1. **No Authentication Required**: This is a diagnostic endpoint
2. **No Sensitive Data**: Only tests basic connectivity
3. **Rate Limited**: Standard application rate limits apply
4. **Temporary Keys**: Test keys expire after 60 seconds
5. **Cleanup**: All test data is deleted after testing

## Deployment Checklist

Before deploying to production:

- [ ] Set ELASTICACHE_REDIS_HOST environment variable
- [ ] Set ELASTICACHE_REDIS_PORT environment variable (optional, defaults to 6379)
- [ ] Configure VPC access in Amplify
- [ ] Update Security Group to allow Amplify traffic
- [ ] Test endpoint in staging environment
- [ ] Verify performance meets benchmarks
- [ ] Review CloudWatch logs for errors

## Related Documentation

- [ElastiCache Deployment Guide](../../../docs/ELASTICACHE_DEPLOYMENT_GUIDE.md)
- [ElastiCache Migration](../../../lib/ai/MIGRATION_TO_ELASTICACHE.md)
- [Redis Options](../../../lib/ai/REDIS_OPTIONS.md)
- [Verify ElastiCache Setup Script](../../../scripts/verify-elasticache-setup.sh)

## Changelog

### v1.0.0 (2024-11-21)
- ✨ Initial implementation
- ✅ Automatic retry with exponential backoff
- ✅ Structured error handling
- ✅ Performance monitoring
- ✅ Correlation ID tracking
- ✅ Comprehensive logging
- ✅ TypeScript types
- ✅ Troubleshooting guidance
- ✅ OPTIONS handler for CORS
