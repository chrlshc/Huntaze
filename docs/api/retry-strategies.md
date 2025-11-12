# API Retry Strategies

## Overview

This document describes retry strategies and error handling patterns used across API endpoints to ensure resilience and reliability.

## Retry Helper Function

### Implementation

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
  } = options;

  let lastError: Error | undefined;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }

      // Log retry attempt
      console.log(`Retry attempt ${attempt}/${maxAttempts}`, {
        delay,
        error: lastError.message
      });

      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * backoffFactor, maxDelay);
    }
  }

  throw lastError;
}
```

### Usage

```typescript
// In API route handler
const result = await retryWithBackoff(
  async () => {
    // Your operation that might fail transiently
    return await publishStore(userId);
  },
  {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 5000,
    backoffFactor: 2
  }
);
```

## Retry Patterns

### Pattern 1: Exponential Backoff

**Use Case**: Network requests, database operations, external API calls

**Configuration**:
- Max Attempts: 3
- Initial Delay: 1000ms
- Max Delay: 10000ms
- Backoff Factor: 2x

**Timing**:
```
Attempt 1: Immediate
Attempt 2: Wait 1000ms
Attempt 3: Wait 2000ms
Attempt 4: Wait 4000ms (if maxAttempts = 4)
```

**Example**:
```typescript
const data = await retryWithBackoff(
  () => fetchFromExternalAPI(),
  { maxAttempts: 3, initialDelay: 1000, backoffFactor: 2 }
);
```

### Pattern 2: Fixed Delay

**Use Case**: Rate-limited APIs, quota-based services

**Configuration**:
- Max Attempts: 5
- Initial Delay: 2000ms
- Max Delay: 2000ms
- Backoff Factor: 1x

**Timing**:
```
Attempt 1: Immediate
Attempt 2: Wait 2000ms
Attempt 3: Wait 2000ms
Attempt 4: Wait 2000ms
```

**Example**:
```typescript
const data = await retryWithBackoff(
  () => callRateLimitedAPI(),
  { maxAttempts: 5, initialDelay: 2000, maxDelay: 2000, backoffFactor: 1 }
);
```

### Pattern 3: Aggressive Retry

**Use Case**: Critical operations, high-priority requests

**Configuration**:
- Max Attempts: 5
- Initial Delay: 500ms
- Max Delay: 5000ms
- Backoff Factor: 1.5x

**Timing**:
```
Attempt 1: Immediate
Attempt 2: Wait 500ms
Attempt 3: Wait 750ms
Attempt 4: Wait 1125ms
Attempt 5: Wait 1687ms
```

**Example**:
```typescript
const result = await retryWithBackoff(
  () => processCriticalPayment(),
  { maxAttempts: 5, initialDelay: 500, backoffFactor: 1.5 }
);
```

### Pattern 4: Conservative Retry

**Use Case**: Non-critical operations, background jobs

**Configuration**:
- Max Attempts: 3
- Initial Delay: 5000ms
- Max Delay: 30000ms
- Backoff Factor: 3x

**Timing**:
```
Attempt 1: Immediate
Attempt 2: Wait 5000ms
Attempt 3: Wait 15000ms
```

**Example**:
```typescript
const result = await retryWithBackoff(
  () => sendNotificationEmail(),
  { maxAttempts: 3, initialDelay: 5000, backoffFactor: 3 }
);
```

## Error Classification

### Retryable Errors

Errors that should trigger a retry:

- **Network Errors**: Connection timeout, DNS resolution failure
- **Transient Errors**: 503 Service Unavailable, 429 Too Many Requests
- **Database Errors**: Connection pool exhausted, deadlock detected
- **External API Errors**: Rate limit exceeded, temporary unavailability

**Example**:
```typescript
function isRetryableError(error: Error): boolean {
  const retryableMessages = [
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'Connection pool exhausted',
    'Deadlock detected',
  ];
  
  return retryableMessages.some(msg => 
    error.message.includes(msg)
  );
}
```

### Non-Retryable Errors

Errors that should NOT trigger a retry:

- **Client Errors**: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found
- **Validation Errors**: Invalid input, schema validation failure
- **Business Logic Errors**: Insufficient funds, duplicate entry
- **Authentication Errors**: Invalid token, expired session

**Example**:
```typescript
function isNonRetryableError(error: Error): boolean {
  const nonRetryableMessages = [
    'Unauthorized',
    'Forbidden',
    'Not Found',
    'Invalid input',
    'Validation failed',
  ];
  
  return nonRetryableMessages.some(msg => 
    error.message.includes(msg)
  );
}
```

## Conditional Retry

### Smart Retry Logic

```typescript
async function retryWithCondition<T>(
  fn: () => Promise<T>,
  shouldRetry: (error: Error, attempt: number) => boolean,
  options: RetryOptions = {}
): Promise<T> {
  const { maxAttempts = 3, initialDelay = 1000, backoffFactor = 2 } = options;
  
  let lastError: Error | undefined;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Check if we should retry this error
      if (!shouldRetry(lastError, attempt) || attempt === maxAttempts) {
        throw lastError;
      }

      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= backoffFactor;
    }
  }

  throw lastError;
}
```

### Usage

```typescript
const result = await retryWithCondition(
  () => callExternalAPI(),
  (error, attempt) => {
    // Only retry on network errors
    if (isNetworkError(error)) {
      return true;
    }
    
    // Don't retry on client errors
    if (isClientError(error)) {
      return false;
    }
    
    // Retry up to 2 times for other errors
    return attempt < 2;
  },
  { maxAttempts: 3, initialDelay: 1000 }
);
```

## Circuit Breaker Pattern

### Implementation

```typescript
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failureCount = 0;
    this.state = 'closed';
  }
  
  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.threshold) {
      this.state = 'open';
    }
  }
}
```

### Usage

```typescript
const breaker = new CircuitBreaker(5, 60000);

try {
  const result = await breaker.execute(() => callUnreliableService());
} catch (error) {
  if (error.message === 'Circuit breaker is open') {
    // Service is down, use fallback
    return getFallbackData();
  }
  throw error;
}
```

## Best Practices

### 1. Log Retry Attempts

Always log retry attempts for debugging:

```typescript
console.log(`Retry attempt ${attempt}/${maxAttempts}`, {
  operation: 'publishStore',
  userId,
  delay,
  error: error.message,
  correlationId
});
```

### 2. Set Reasonable Timeouts

Don't retry indefinitely:

```typescript
// Good: Max 3 attempts, max 10 seconds total
await retryWithBackoff(fn, {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 5000
});

// Bad: Too many attempts, too long
await retryWithBackoff(fn, {
  maxAttempts: 10,
  initialDelay: 5000,
  maxDelay: 60000
});
```

### 3. Use Jitter

Add randomness to prevent thundering herd:

```typescript
function addJitter(delay: number, jitterFactor: number = 0.1): number {
  const jitter = delay * jitterFactor * Math.random();
  return delay + jitter;
}

// Usage
await new Promise(resolve => 
  setTimeout(resolve, addJitter(delay))
);
```

### 4. Implement Idempotency

Ensure operations can be safely retried:

```typescript
// Use idempotency keys
const idempotencyKey = crypto.randomUUID();

await retryWithBackoff(() => 
  processPayment({
    amount: 1000,
    idempotencyKey
  })
);
```

### 5. Monitor Retry Metrics

Track retry rates and success rates:

```typescript
const metrics = {
  totalAttempts: 0,
  successfulAttempts: 0,
  failedAttempts: 0,
  retryAttempts: 0
};

// Increment in retry logic
metrics.totalAttempts++;
if (attempt > 1) metrics.retryAttempts++;
```

## Testing Retry Logic

### Unit Test

```typescript
describe('retryWithBackoff', () => {
  it('should retry on failure', async () => {
    let attempts = 0;
    const fn = async () => {
      attempts++;
      if (attempts < 3) throw new Error('Transient error');
      return 'success';
    };
    
    const result = await retryWithBackoff(fn, { maxAttempts: 3 });
    
    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });
  
  it('should throw after max attempts', async () => {
    const fn = async () => {
      throw new Error('Permanent error');
    };
    
    await expect(
      retryWithBackoff(fn, { maxAttempts: 3 })
    ).rejects.toThrow('Permanent error');
  });
});
```

### Integration Test

```typescript
it('should retry on network errors', async () => {
  let attempts = 0;
  
  // Mock fetch to fail twice, then succeed
  global.fetch = jest.fn().mockImplementation(() => {
    attempts++;
    if (attempts < 3) {
      return Promise.reject(new Error('ECONNREFUSED'));
    }
    return Promise.resolve(new Response('OK'));
  });
  
  const result = await retryWithBackoff(
    () => fetch('/api/endpoint'),
    { maxAttempts: 3 }
  );
  
  expect(attempts).toBe(3);
  expect(result.ok).toBe(true);
});
```

## Related Documentation

- [Error Handling Guide](./error-handling.md)
- [API Integration Tests](../tests/integration/api/README.md)
- [Store Publish Endpoint](./store-publish-endpoint.md)

## References

- [AWS Architecture Blog - Exponential Backoff and Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
- [Google Cloud - Retry Strategy](https://cloud.google.com/iot/docs/how-tos/exponential-backoff)
- [Martin Fowler - Circuit Breaker](https://martinfowler.com/bliki/CircuitBreaker.html)
