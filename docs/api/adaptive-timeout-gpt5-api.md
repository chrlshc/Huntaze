# Adaptive Timeout GPT-5 API Documentation

## Overview

The Adaptive Timeout System provides intelligent timeout management for GPT-5 API calls with automatic retry logic, circuit breaker pattern, and real-time performance tracking.

## Features

- ✅ **Adaptive Timeouts**: Automatically adjusts timeouts based on historical performance
- ✅ **Circuit Breaker**: Prevents cascading failures with automatic recovery
- ✅ **Retry Logic**: Exponential backoff with configurable retry strategies
- ✅ **Performance Tracking**: Real-time percentile metrics (p50, p95, p99)
- ✅ **Multi-Model Support**: GPT-5, GPT-5-mini, GPT-5-nano
- ✅ **Type-Safe**: Full TypeScript support with comprehensive types
- ✅ **Production-Ready**: Comprehensive error handling and logging

## Installation

```typescript
import {
  createAdaptiveCircuitBreaker,
  createTimeoutCalculator,
  type TimeoutConfig,
  type Logger
} from '@/lib/services/adaptive-timeout-gpt5';
```

## Quick Start

### Basic Usage

```typescript
// Create circuit breaker
const breaker = createAdaptiveCircuitBreaker();

// Configure request
const config: TimeoutConfig = {
  model: 'gpt-5',
  reasoningEffort: 'high',
  tokenCount: 1500,
  systemLoad: 0.6
};

// Execute with automatic timeout and retry
const result = await breaker.execute(
  async () => await callGPT5API(prompt),
  config,
  {
    enableRetry: true,
    requestId: generateRequestId(),
    userId: currentUser.id
  }
);
```

### With Custom Logger

```typescript
const customLogger: Logger = {
  debug: (msg, meta) => winston.debug(msg, meta),
  info: (msg, meta) => winston.info(msg, meta),
  warn: (msg, meta) => winston.warn(msg, meta),
  error: (msg, err, meta) => winston.error(msg, { error: err, ...meta })
};

const breaker = createAdaptiveCircuitBreaker(customLogger);
```

## API Reference

### CircuitBreakerWithAdaptiveTimeout

Main class for executing requests with adaptive timeout and circuit breaker protection.

#### Methods

##### `execute<T>(fn, config, options): Promise<T>`

Execute a function with adaptive timeout, retry logic, and circuit breaker protection.

**Parameters:**
- `fn: () => Promise<T>` - Function to execute
- `config: TimeoutConfig` - Timeout configuration
- `options` (optional):
  - `enableRetry?: boolean` - Enable retry logic (default: true)
  - `requestId?: string` - Request identifier for logging
  - `userId?: string` - User identifier for tracking

**Returns:** `Promise<T>` - Result of function execution

**Throws:**
- `CircuitBreakerOpenError` - Circuit breaker is open
- `TimeoutExceededError` - Request timeout exceeded
- `AdaptiveTimeoutError` - General timeout system error

**Example:**
```typescript
try {
  const result = await breaker.execute(
    async () => await gpt5.complete(prompt),
    {
      model: 'gpt-5',
      reasoningEffort: 'high',
      tokenCount: estimateTokens(prompt),
      systemLoad: getSystemLoad()
    },
    {
      enableRetry: true,
      requestId: 'req-' + Date.now(),
      userId: user.id
    }
  );
  
  console.log('Success:', result);
} catch (error) {
  if (error instanceof CircuitBreakerOpenError) {
    console.error('Service unavailable, retry after:', error.context.retryAfter);
  } else if (error instanceof TimeoutExceededError) {
    console.error('Request timed out after:', error.context.timeout);
  }
}
```

##### `getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN'`

Get current circuit breaker state.

**Returns:** Current state

**Example:**
```typescript
const state = breaker.getState();
console.log('Circuit breaker state:', state);
```

##### `getHealthMetrics()`

Get circuit breaker health metrics.

**Returns:**
```typescript
{
  state: string;
  failureCount: number;
  successCount: number;
  lastFailureTime: number;
  isHealthy: boolean;
}
```

**Example:**
```typescript
const health = breaker.getHealthMetrics();
if (!health.isHealthy) {
  console.warn('Circuit breaker unhealthy:', health);
}
```

##### `reset(): void`

Reset circuit breaker to initial state.

**Example:**
```typescript
breaker.reset();
console.log('Circuit breaker reset');
```

### AdaptiveTimeoutCalculator

Standalone calculator for timeout optimization.

#### Methods

##### `calculateTimeout(config): AdaptiveTimeoutResult`

Calculate optimal timeout for a request.

**Parameters:**
- `config: TimeoutConfig` - Configuration object

**Returns:**
```typescript
{
  timeout: number;
  reasoning: {
    baseTimeout: number;
    tokenAdjustment: number;
    loadAdjustment: number;
    percentileBuffer: number;
    finalTimeout: number;
  };
  metrics: PercentileData;
  confidence: 'high' | 'medium' | 'low';
  recommendedRetryStrategy?: RetryStrategy;
}
```

**Example:**
```typescript
const calculator = createTimeoutCalculator();
const result = calculator.calculateTimeout({
  model: 'gpt-5',
  reasoningEffort: 'medium',
  tokenCount: 1000,
  systemLoad: 0.5
});

console.log('Recommended timeout:', result.timeout);
console.log('Confidence:', result.confidence);
console.log('Reasoning:', result.reasoning);
```

##### `recordCompletion(metric): void`

Record request completion for learning.

**Parameters:**
- `metric: LatencyMetric` - Completion metric

**Example:**
```typescript
calculator.recordCompletion({
  timestamp: Date.now(),
  latency: 2500,
  model: 'gpt-5',
  tokenCount: 1500,
  success: true,
  reasoningEffort: 'high',
  requestId: 'req-123',
  userId: 'user-456'
});
```

##### `getHealthMetrics()`

Get system health metrics.

**Returns:**
```typescript
{
  currentLoad: number;
  buckets: Record<string, PercentileData>;
  config: typeof CONFIG;
}
```

### RetryExecutor

Standalone retry executor with exponential backoff.

#### Methods

##### `executeWithRetry<T>(fn, strategy, context): Promise<T>`

Execute function with retry logic.

**Parameters:**
- `fn: () => Promise<T>` - Function to execute
- `strategy: RetryStrategy` - Retry configuration
- `context?: Record<string, any>` - Context for logging

**Example:**
```typescript
const executor = new RetryExecutor(logger);

const result = await executor.executeWithRetry(
  async () => await apiCall(),
  {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    retryableErrors: ['TIMEOUT_EXCEEDED', '503', '429']
  },
  { requestId: 'req-123' }
);
```

## Types

### TimeoutConfig

```typescript
interface TimeoutConfig {
  model: 'gpt-5' | 'gpt-5-mini' | 'gpt-5-nano';
  reasoningEffort: 'high' | 'medium' | 'minimal';
  tokenCount: number;
  systemLoad: number; // 0-1
}
```

### LatencyMetric

```typescript
interface LatencyMetric {
  timestamp: number;
  latency: number;
  model: 'gpt-5' | 'gpt-5-mini' | 'gpt-5-nano';
  tokenCount: number;
  success: boolean;
  reasoningEffort?: 'high' | 'medium' | 'minimal';
  errorCode?: string;
  errorMessage?: string;
  retryCount?: number;
  userId?: string;
  requestId?: string;
}
```

### RetryStrategy

```typescript
interface RetryStrategy {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}
```

### Logger

```typescript
interface Logger {
  debug(message: string, meta?: Record<string, any>): void;
  info(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  error(message: string, error?: Error, meta?: Record<string, any>): void;
}
```

## Error Handling

### Error Types

#### AdaptiveTimeoutError

Base error class for all timeout-related errors.

```typescript
class AdaptiveTimeoutError extends Error {
  code: string;
  retryable: boolean;
  context?: Record<string, any>;
}
```

#### TimeoutExceededError

Thrown when request exceeds calculated timeout.

```typescript
class TimeoutExceededError extends AdaptiveTimeoutError {
  // Automatically retryable
  retryable: true;
  context: { timeout: number; ... };
}
```

#### CircuitBreakerOpenError

Thrown when circuit breaker is open.

```typescript
class CircuitBreakerOpenError extends AdaptiveTimeoutError {
  // Not retryable
  retryable: false;
  resetTime: number;
  context: { retryAfter: number; ... };
}
```

### Error Handling Example

```typescript
try {
  const result = await breaker.execute(apiCall, config, options);
} catch (error) {
  if (error instanceof CircuitBreakerOpenError) {
    // Service is down, wait before retry
    const retryAfter = error.context.retryAfter;
    console.error(`Service unavailable, retry after ${retryAfter}ms`);
    
  } else if (error instanceof TimeoutExceededError) {
    // Request timed out, may retry automatically
    console.error(`Timeout after ${error.context.timeout}ms`);
    
  } else if (error instanceof AdaptiveTimeoutError) {
    // Other timeout system error
    console.error(`Timeout error: ${error.code}`, error.context);
    
  } else {
    // Unexpected error
    console.error('Unexpected error:', error);
  }
}
```

## Configuration

### Default Configuration

```typescript
const CONFIG = {
  baseTimeouts: {
    'gpt-5': {
      high: 45000,      // 45s
      medium: 30000,    // 30s
      minimal: 15000    // 15s
    },
    'gpt-5-mini': {
      high: 30000,
      medium: 20000,
      minimal: 10000
    },
    'gpt-5-nano': {
      high: 15000,
      medium: 10000,
      minimal: 5000
    }
  },
  minTimeout: 5000,   // 5s minimum
  maxTimeout: 120000  // 2min maximum
};
```

### Retry Configuration

```typescript
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  retryableErrors: [
    'TIMEOUT_EXCEEDED',
    'NETWORK_ERROR',
    '429', // Rate limit
    '500', // Internal server error
    '502', // Bad gateway
    '503', // Service unavailable
    '504'  // Gateway timeout
  ]
};
```

## Best Practices

### 1. Token Estimation

Always provide accurate token counts for better timeout prediction:

```typescript
import { encode } from 'gpt-tokenizer';

const tokenCount = encode(prompt).length;
const config: TimeoutConfig = {
  model: 'gpt-5',
  reasoningEffort: 'high',
  tokenCount,
  systemLoad: getSystemLoad()
};
```

### 2. System Load Monitoring

Track system load for adaptive timeout adjustment:

```typescript
function getSystemLoad(): number {
  const activeRequests = getActiveRequestCount();
  const maxCapacity = 100;
  return Math.min(activeRequests / maxCapacity, 1.0);
}
```

### 3. Request Tracking

Always provide request IDs for debugging:

```typescript
const result = await breaker.execute(
  apiCall,
  config,
  {
    requestId: `req-${Date.now()}-${Math.random().toString(36)}`,
    userId: user.id
  }
);
```

### 4. Health Monitoring

Regularly check circuit breaker health:

```typescript
setInterval(() => {
  const health = breaker.getHealthMetrics();
  if (!health.isHealthy) {
    alertOpsTeam('Circuit breaker unhealthy', health);
  }
}, 60000); // Every minute
```

### 5. Metrics Export

Export metrics for monitoring dashboards:

```typescript
app.get('/metrics/adaptive-timeout', (req, res) => {
  const calculator = breaker.getCalculator();
  const metrics = calculator.getHealthMetrics();
  res.json(metrics);
});
```

## Performance Considerations

### Memory Usage

The system maintains a rolling window of 1000 metrics per model/effort combination. Memory usage is approximately:

- Per metric: ~100 bytes
- Per bucket: ~100KB (1000 metrics)
- Total (3 models × 3 efforts): ~900KB

### CPU Usage

- Timeout calculation: < 1ms
- Percentile calculation: < 5ms (with 1000 samples)
- Negligible impact on request latency

### Accuracy

- **Low confidence** (< 20 samples): ±30% accuracy
- **Medium confidence** (20-100 samples): ±15% accuracy
- **High confidence** (> 100 samples): ±5% accuracy

## Monitoring & Observability

### Events

The system emits events for monitoring:

```typescript
calculator.on('timeout-calculated', (data) => {
  console.log('Timeout calculated:', data);
});

calculator.on('latency-recorded', (metric) => {
  console.log('Latency recorded:', metric);
});
```

### Metrics Endpoint

```typescript
app.get('/api/metrics/adaptive-timeout', (req, res) => {
  const health = breaker.getCalculator().getHealthMetrics();
  const circuitHealth = breaker.getHealthMetrics();
  
  res.json({
    calculator: health,
    circuitBreaker: circuitHealth,
    timestamp: new Date()
  });
});
```

## Troubleshooting

### High Timeout Values

If timeouts are consistently high:

1. Check system load - reduce concurrent requests
2. Review token counts - ensure accurate estimation
3. Verify model selection - consider using faster models
4. Check historical metrics - may need more data

### Circuit Breaker Opens Frequently

If circuit breaker opens too often:

1. Increase failure threshold
2. Check upstream service health
3. Review retry strategy
4. Verify timeout calculations

### Low Confidence Scores

If confidence remains low:

1. Ensure metrics are being recorded
2. Check for sufficient request volume
3. Verify model/effort combinations match
4. Review data retention settings

## Migration Guide

### From Fixed Timeouts

```typescript
// Before
const timeout = 30000;
const result = await Promise.race([
  apiCall(),
  new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout')), timeout)
  )
]);

// After
const breaker = createAdaptiveCircuitBreaker();
const result = await breaker.execute(
  apiCall,
  {
    model: 'gpt-5',
    reasoningEffort: 'medium',
    tokenCount: estimateTokens(prompt),
    systemLoad: getSystemLoad()
  }
);
```

### From Manual Retry Logic

```typescript
// Before
let retries = 0;
while (retries < 3) {
  try {
    return await apiCall();
  } catch (error) {
    retries++;
    if (retries === 3) throw error;
    await sleep(1000 * Math.pow(2, retries));
  }
}

// After
const breaker = createAdaptiveCircuitBreaker();
const result = await breaker.execute(
  apiCall,
  config,
  { enableRetry: true }
);
```

## Support

For issues or questions:
- GitHub Issues: [huntaze/issues](https://github.com/huntaze/issues)
- Documentation: [docs.huntaze.com](https://docs.huntaze.com)
- Email: support@huntaze.com
