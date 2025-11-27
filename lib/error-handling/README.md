# Error Handling and Graceful Degradation

Comprehensive error handling system with retry logic, circuit breakers, and graceful degradation strategies for the Huntaze performance optimization system.

## Features

- ✅ **Exponential Backoff Retry** - Automatic retry with configurable backoff
- ✅ **Circuit Breaker** - Prevent cascading failures
- ✅ **Graceful Degradation** - Fallback strategies for service failures
- ✅ **Structured Error Logging** - CloudWatch integration with categorization
- ✅ **Service Health Monitoring** - Track service health across requests
- ✅ **Stale Cache Fallback** - Use cached data when fresh fetch fails

## Quick Start

### Basic Error Handling

```typescript
import { getErrorHandler, DEFAULT_RETRY_OPTIONS } from '@/lib/error-handling';

const errorHandler = getErrorHandler();

// Retry with exponential backoff
const data = await errorHandler.retryWithBackoff(
  async () => {
    return await fetchData();
  },
  DEFAULT_RETRY_OPTIONS
);
```

### Circuit Breaker

```typescript
// Protect external service calls
const result = await errorHandler.circuitBreaker(
  'external-api',
  async () => {
    return await externalApiCall();
  },
  {
    failureThreshold: 5,
    resetTimeout: 60000,
    monitoringPeriod: 10000,
  }
);
```

### Graceful Degradation

```typescript
import { getDegradationManager } from '@/lib/error-handling';

const degradationManager = getDegradationManager();

// Execute with automatic fallback
const data = await degradationManager.executeWithDegradation(
  'data-service',
  {
    primary: async () => await fetchFromPrimary(),
    fallback: async () => await fetchFromCache(),
    onDegradation: (error) => {
      console.warn('Using fallback:', error.message);
    },
  },
  { operation: 'fetch_data' }
);
```

### Stale Cache Fallback

```typescript
// Use stale cache if fresh fetch fails
const data = await errorHandler.fallbackToStaleCache(
  'cache-key',
  async () => await fetchFreshData(),
  async (key) => await getCachedData(key)
);
```

## Architecture

### Error Handler

The `ErrorHandler` class provides:

- **Retry Logic**: Exponential backoff with configurable parameters
- **Circuit Breaker**: Prevent repeated calls to failing services
- **Error Categorization**: Automatic categorization into network, AWS, performance, cache, validation errors
- **Structured Logging**: CloudWatch integration with rich context

### Graceful Degradation Manager

The `GracefulDegradationManager` provides:

- **Service Health Tracking**: Monitor service health across requests
- **Automatic Fallback**: Execute fallback strategies on primary failure
- **Health Status**: Query service health and degradation status

## Error Categories

Errors are automatically categorized into:

- `NETWORK` - Connection, timeout, DNS errors
- `AWS_SERVICE` - CloudWatch, S3, CloudFront, Lambda errors
- `PERFORMANCE` - Slow responses, high memory usage
- `CACHE` - Redis connection, cache corruption
- `VALIDATION` - Invalid input, validation failures
- `UNKNOWN` - Uncategorized errors

## Retry Configuration

```typescript
interface RetryOptions {
  maxRetries: number;           // Maximum retry attempts
  initialDelay: number;         // Initial delay in ms
  maxDelay: number;             // Maximum delay in ms
  backoffMultiplier: number;    // Backoff multiplier (typically 2)
  retryableErrors?: string[];   // Custom retryable error patterns
}

// Default configuration
const DEFAULT_RETRY_OPTIONS = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};
```

## Circuit Breaker Configuration

```typescript
interface CircuitBreakerConfig {
  failureThreshold: number;     // Failures before opening circuit
  resetTimeout: number;         // Time before attempting reset (ms)
  monitoringPeriod: number;     // Monitoring window (ms)
}
```

### Circuit States

- **CLOSED**: Normal operation, requests pass through
- **OPEN**: Circuit tripped, requests fail immediately
- **HALF_OPEN**: Testing if service recovered

## Degradation Strategies

### CDN Degradation

```typescript
const data = await degradationManager.cdnDegradation(
  async () => await fetchFromCDN(),
  async () => await fetchFromOrigin()
);
```

### Cache Degradation

```typescript
const result = await degradationManager.cacheDegradation(
  async () => await getFromCache(),
  async () => await fetchFresh()
);

console.log(`From cache: ${result.fromCache}`);
console.log(`Latency: ${result.latency}ms`);
```

### Image Optimization Degradation

```typescript
const imageUrl = await degradationManager.imageOptimizationDegradation(
  'https://cdn.example.com/optimized.webp',
  'https://cdn.example.com/original.jpg'
);
```

### Lambda@Edge Degradation

```typescript
const response = await degradationManager.lambdaEdgeDegradation(
  async () => await edgeFunction(),
  async () => await directFetch()
);
```

## Error Logging

### Structured Error Context

```typescript
interface ErrorContext {
  operation: string;            // Operation being performed
  userId?: string;              // User ID if available
  sessionId: string;            // Session identifier
  url: string;                  // Current URL
  userAgent: string;            // User agent string
  timestamp: Date;              // Error timestamp
  metadata?: Record<string, any>; // Additional context
}
```

### Log Error

```typescript
await errorHandler.logError(error, {
  operation: 'fetch_user_data',
  userId: 'user-123',
  sessionId: 'session-456',
  url: window.location.href,
  userAgent: navigator.userAgent,
  timestamp: new Date(),
  metadata: {
    endpoint: '/api/users',
    method: 'GET',
  },
});
```

## Service Health Monitoring

### Check Service Health

```typescript
const health = degradationManager.getServiceHealth('external-api');

console.log(`Healthy: ${health.healthy}`);
console.log(`Degraded: ${health.degraded}`);
console.log(`Consecutive Failures: ${health.consecutiveFailures}`);
console.log(`Last Check: ${health.lastCheck}`);
```

### Get All Services Health

```typescript
const allHealth = degradationManager.getAllServicesHealth();

allHealth.forEach((health) => {
  console.log(`${health.service}: ${health.healthy ? '✅' : '❌'}`);
});
```

### Check for Degraded Services

```typescript
if (degradationManager.isAnyServiceDegraded()) {
  console.warn('Some services are degraded');
}
```

## Alert Thresholds

Predefined thresholds for monitoring and alerting:

```typescript
export const ALERT_THRESHOLDS = {
  // Performance
  pageLoadTime: 3000,        // 3 seconds
  apiResponseTime: 2000,     // 2 seconds
  lcp: 2500,                 // 2.5 seconds
  fid: 100,                  // 100ms
  cls: 0.1,                  // 0.1 score

  // Resources
  memoryUsage: 0.85,         // 85% of available
  cpuUsage: 0.80,            // 80% of available

  // Errors
  errorRate: 0.05,           // 5% error rate
  cacheHitRate: 0.70,        // 70% minimum

  // Availability
  uptime: 0.999,             // 99.9% uptime
};
```

## Testing

### Run Property-Based Tests

```bash
npm test tests/unit/properties/error-handling.property.test.ts
```

### Run Integration Tests

```bash
npx tsx scripts/test-error-handling.ts
```

## Best Practices

1. **Always Use Retry for Network Operations**
   ```typescript
   const data = await errorHandler.retryWithBackoff(
     async () => await fetch('/api/data'),
     DEFAULT_RETRY_OPTIONS
   );
   ```

2. **Protect External Services with Circuit Breaker**
   ```typescript
   const result = await errorHandler.circuitBreaker(
     'external-service',
     async () => await externalCall()
   );
   ```

3. **Provide Fallbacks for Critical Operations**
   ```typescript
   const data = await degradationManager.executeWithDegradation(
     'critical-service',
     {
       primary: async () => await fetchLive(),
       fallback: async () => await fetchCached(),
     },
     { operation: 'critical_fetch' }
   );
   ```

4. **Log Errors with Rich Context**
   ```typescript
   await errorHandler.logError(error, {
     operation: 'user_action',
     userId: user.id,
     sessionId: session.id,
     url: window.location.href,
     userAgent: navigator.userAgent,
     timestamp: new Date(),
     metadata: { action: 'submit_form' },
   });
   ```

5. **Monitor Service Health**
   ```typescript
   // Periodically check service health
   setInterval(() => {
     const health = degradationManager.getAllServicesHealth();
     health.filter(h => h.degraded).forEach(h => {
       console.warn(`Service ${h.service} is degraded`);
     });
   }, 60000);
   ```

## Integration with CloudWatch

All errors are automatically logged to CloudWatch with:

- Error category and code
- Full stack trace
- User and session context
- Custom metadata
- Severity level (LOW, MEDIUM, HIGH, CRITICAL)

CloudWatch logs can be queried using:

```
fields @timestamp, context.category, context.severity, message
| filter context.operation = "fetch_data"
| sort @timestamp desc
```

## Examples

See `scripts/test-error-handling.ts` for comprehensive examples of all features.

## API Reference

### ErrorHandler

- `retryWithBackoff<T>(operation, options)` - Retry with exponential backoff
- `circuitBreaker<T>(service, operation, config)` - Circuit breaker pattern
- `fallbackToStaleCache<T>(key, fetcher, cacheGetter)` - Stale cache fallback
- `logError(error, context)` - Log structured error to CloudWatch

### GracefulDegradationManager

- `executeWithDegradation<T>(service, strategy, context)` - Execute with fallback
- `cdnDegradation<T>(cdnFetcher, originFetcher)` - CDN fallback
- `cacheDegradation<T>(cacheGetter, freshFetcher)` - Cache fallback
- `imageOptimizationDegradation(optimizedUrl, originalUrl)` - Image fallback
- `lambdaEdgeDegradation<T>(edgeFunction, directFetch)` - Lambda@Edge fallback
- `getServiceHealth(service)` - Get service health status
- `getAllServicesHealth()` - Get all services health
- `isAnyServiceDegraded()` - Check if any service is degraded

## License

MIT
