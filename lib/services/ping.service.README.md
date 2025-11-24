# Cold Start Prevention Service (PingService)

A service that prevents cold starts on staging environments by periodically pinging the server to keep it warm and responsive.

## Overview

The PingService implements automated health checks that prevent serverless cold starts by maintaining regular traffic to your staging environment. It includes comprehensive monitoring, alerting, and timeout handling.

## Features

- ✅ Configurable ping intervals (default: 10 minutes)
- ✅ Timeout handling (default: 3 seconds)
- ✅ Failure monitoring and alerting
- ✅ Consecutive failure tracking
- ✅ Response time statistics
- ✅ Automatic retry on failures
- ✅ Graceful error handling

## Requirements

Validates the following requirements:
- **5.1**: Automated ping mechanism every 10 minutes
- **5.2**: Response within 3 seconds maximum
- **5.3**: Monitoring and alerting for ping failures
- **5.4**: Timeout handling

## Basic Usage

```typescript
import { PingService, createStagingPingService } from '@/lib/services/ping.service';

// Quick setup for staging environment
const service = createStagingPingService('https://staging.example.com');
service.start();

// Custom configuration
const customService = new PingService({
  url: 'https://staging.example.com',
  interval: 10 * 60 * 1000, // 10 minutes
  method: 'HEAD',
  timeout: 3000, // 3 seconds
  enabled: true,
  onSuccess: (response) => {
    console.log(`Ping successful: ${response.status} (${response.responseTime}ms)`);
  },
  onFailure: (error) => {
    console.error(`Ping failed: ${error.error.message}`);
  },
});

customService.start();
```

## Configuration Options

### PingServiceConfig

```typescript
interface PingServiceConfig {
  url: string;           // URL to ping (required)
  interval: number;      // Ping interval in milliseconds (required)
  method: 'GET' | 'HEAD'; // HTTP method (default: 'HEAD')
  timeout: number;       // Request timeout in milliseconds (required)
  enabled: boolean;      // Whether the service is enabled (required)
  onSuccess?: (response: PingResponse) => void;  // Success callback
  onFailure?: (error: PingError) => void;        // Failure callback
}
```

### Validation Rules

- URL must be a valid HTTP or HTTPS URL
- Interval must be greater than 0
- Timeout must be greater than 0
- Timeout cannot exceed interval

## API Reference

### Methods

#### `start(): void`
Starts the ping service. Performs an immediate ping, then continues at the configured interval.

```typescript
service.start();
```

#### `stop(): void`
Stops the ping service and clears the interval.

```typescript
service.stop();
```

#### `isRunning(): boolean`
Checks if the service is currently running.

```typescript
if (service.isRunning()) {
  console.log('Service is active');
}
```

#### `getStats(): PingServiceStats`
Returns current service statistics.

```typescript
const stats = service.getStats();
console.log(`Total pings: ${stats.totalPings}`);
console.log(`Success rate: ${(stats.successfulPings / stats.totalPings * 100).toFixed(2)}%`);
console.log(`Average response time: ${stats.averageResponseTime}ms`);
```

#### `resetStats(): void`
Resets all service statistics to zero.

```typescript
service.resetStats();
```

#### `updateConfig(config: Partial<PingServiceConfig>): void`
Updates the service configuration. If the service is running, it will be restarted with the new configuration.

```typescript
service.updateConfig({
  interval: 5 * 60 * 1000, // Change to 5 minutes
  timeout: 5000, // Change to 5 seconds
});
```

#### `getConfig(): Required<PingServiceConfig>`
Returns the current service configuration.

```typescript
const config = service.getConfig();
console.log(`Pinging ${config.url} every ${config.interval}ms`);
```

## Statistics

The service tracks comprehensive statistics:

```typescript
interface PingServiceStats {
  totalPings: number;              // Total number of pings attempted
  successfulPings: number;         // Number of successful pings
  failedPings: number;             // Number of failed pings
  consecutiveFailures: number;     // Current consecutive failure count
  lastPingTime: Date | null;       // Timestamp of last ping attempt
  lastSuccessTime: Date | null;    // Timestamp of last successful ping
  lastFailureTime: Date | null;    // Timestamp of last failed ping
  averageResponseTime: number;     // Average response time in milliseconds
}
```

## Monitoring and Alerting

### Failure Tracking

The service tracks consecutive failures and automatically alerts after 3 consecutive failures:

```typescript
const service = new PingService({
  url: 'https://staging.example.com',
  interval: 600000,
  timeout: 3000,
  enabled: true,
  onFailure: (error) => {
    console.error(`Ping failed: ${error.error.message}`);
    console.error(`Consecutive failures: ${error.consecutiveFailures}`);
    
    // Alert after 3 consecutive failures
    if (error.consecutiveFailures >= 3) {
      // Send alert to monitoring system
      sendAlert('Staging server is not responding!');
    }
  },
});
```

### Response Time Monitoring

Monitor response times to detect performance degradation:

```typescript
const service = new PingService({
  url: 'https://staging.example.com',
  interval: 600000,
  timeout: 3000,
  enabled: true,
  onSuccess: (response) => {
    if (response.responseTime > 2000) {
      console.warn(`Slow response: ${response.responseTime}ms`);
    }
    
    // Track metrics
    trackMetric('staging.ping.response_time', response.responseTime);
  },
});
```

## Deployment

### Environment Variables

```bash
# .env
STAGING_URL=https://staging.example.com
PING_INTERVAL=600000  # 10 minutes
PING_TIMEOUT=3000     # 3 seconds
```

### Usage in Application

```typescript
import { createStagingPingService } from '@/lib/services/ping.service';

// In your server startup
if (process.env.NODE_ENV === 'production' && process.env.STAGING_URL) {
  const pingService = createStagingPingService(process.env.STAGING_URL);
  pingService.start();
  
  console.log('Cold start prevention service started');
}
```

### External CRON Setup

Alternatively, use an external CRON service (recommended for production):

```bash
# Using cron-job.org or similar service
# Schedule: Every 10 minutes
# URL: https://staging.example.com
# Method: HEAD
# Timeout: 3 seconds
```

## Error Handling

The service handles various error scenarios:

### Timeout Errors
```typescript
// Automatically aborts requests that exceed the timeout
// Error name: 'AbortError'
```

### Network Errors
```typescript
// Handles connection refused, DNS errors, etc.
// Tracks consecutive failures for alerting
```

### Invalid Configuration
```typescript
// Throws errors immediately on invalid configuration
try {
  const service = new PingService({
    url: 'invalid-url',
    interval: 1000,
    timeout: 2000, // Error: timeout exceeds interval
    enabled: true,
  });
} catch (error) {
  console.error('Configuration error:', error.message);
}
```

## Best Practices

1. **Use HEAD requests**: More efficient than GET, doesn't transfer response body
2. **Set appropriate timeouts**: 3 seconds is recommended for staging environments
3. **Monitor consecutive failures**: Alert after 3+ consecutive failures
4. **Track response times**: Detect performance degradation early
5. **Use external CRON for production**: More reliable than in-process pinging
6. **Disable in development**: Only enable for staging/production environments

## Testing

The service includes comprehensive unit tests covering:
- Configuration validation
- Interval configuration
- Timeout handling
- Failure monitoring
- Service lifecycle
- Statistics tracking

Run tests:
```bash
npm test tests/unit/services/ping-service.test.ts
```

## Performance Considerations

- Uses HEAD requests by default (minimal overhead)
- Tracks only last 100 response times (bounded memory)
- Non-blocking async operations
- Automatic cleanup on stop

## Troubleshooting

### Service not starting
```typescript
// Check if enabled
const config = service.getConfig();
console.log('Enabled:', config.enabled);

// Check if already running
console.log('Running:', service.isRunning());
```

### High failure rate
```typescript
// Check statistics
const stats = service.getStats();
console.log('Failure rate:', (stats.failedPings / stats.totalPings * 100).toFixed(2) + '%');

// Increase timeout if needed
service.updateConfig({ timeout: 5000 });
```

### Slow response times
```typescript
// Monitor average response time
const stats = service.getStats();
if (stats.averageResponseTime > 2000) {
  console.warn('Server is responding slowly');
  // Consider scaling up resources
}
```

## Related

- [Cold Start Prevention Design](../../.kiro/specs/linear-ui-performance-refactor/design.md#cold-start-prevention-service)
- [Requirements](../../.kiro/specs/linear-ui-performance-refactor/requirements.md#requirement-5)
- [Task List](../../.kiro/specs/linear-ui-performance-refactor/tasks.md#5-set-up-cold-start-prevention-infrastructure)
