# OAuth Integration Optimization Guide

## Overview

This guide provides best practices and optimization strategies for implementing OAuth integrations with comprehensive error handling, retry logic, and security measures.

## Table of Contents

1. [Error Handling](#error-handling)
2. [Retry Strategies](#retry-strategies)
3. [Type Safety](#type-safety)
4. [Logging & Debugging](#logging--debugging)
5. [Caching](#caching)
6. [Security](#security)
7. [Performance](#performance)

## Error Handling

### 1. Structured Error Types

Use typed error codes for better error handling:

```typescript
import { IntegrationErrorCode, createIntegrationError } from './types';

// ✅ Good: Typed error with metadata
throw createIntegrationError(
  IntegrationErrorCode.INVALID_STATE,
  'State parameter has invalid format',
  {
    provider: 'instagram',
    correlationId: 'int-123',
    metadata: { stateFormat: state.split(':').length },
  }
);

// ❌ Bad: Generic error
throw new Error('Invalid state');
```

### 2. Error Boundaries

Implement try-catch blocks with specific error handling:

```typescript
async handleOAuthCallback(provider: Provider, code: string, state: string) {
  try {
    // Validate state
    this.validateState(state);
    
    // Exchange code for tokens
    const tokens = await this.exchangeCode(code);
    
    return { success: true, tokens };
  } catch (error) {
    // Re-throw if already a service error
    if (isIntegrationError(error)) {
      throw error;
    }
    
    // Wrap unknown errors
    throw createIntegrationError(
      IntegrationErrorCode.OAUTH_CALLBACK_ERROR,
      `Failed to handle OAuth callback: ${error.message}`,
      { provider, cause: error }
    );
  }
}
```

### 3. Error Recovery

Implement graceful degradation:

```typescript
async getIntegrations(userId: number): Promise<Integration[]> {
  try {
    return await this.fetchFromDatabase(userId);
  } catch (error) {
    console.error('Failed to fetch integrations', { userId, error });
    
    // Return empty array instead of throwing
    return [];
  }
}
```

## Retry Strategies

### 1. Exponential Backoff

Implement exponential backoff for transient failures:

```typescript
async retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  operation: string
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Check if error is retryable
      const isRetryable = this.isRetryableError(error);
      
      if (!isRetryable || attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff: 100ms, 200ms, 400ms
      const delay = 100 * Math.pow(2, attempt - 1);
      
      console.warn(`${operation} failed, retrying`, {
        attempt,
        maxRetries,
        delay,
        error: lastError.message,
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

private isRetryableError(error: any): boolean {
  return (
    error.message?.includes('ECONNREFUSED') ||
    error.message?.includes('ETIMEDOUT') ||
    error.message?.includes('ENOTFOUND') ||
    error.code === IntegrationErrorCode.NETWORK_ERROR ||
    error.code === IntegrationErrorCode.TIMEOUT_ERROR
  );
}
```

### 2. Circuit Breaker Pattern

Prevent cascading failures:

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > 60000) {
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
    this.failures = 0;
    this.state = 'closed';
  }
  
  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= 5) {
      this.state = 'open';
    }
  }
}
```

### 3. Timeout Handling

Add timeouts to prevent hanging requests:

```typescript
async withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(createIntegrationError(
        IntegrationErrorCode.TIMEOUT_ERROR,
        `${operation} timed out after ${timeoutMs}ms`
      ));
    }, timeoutMs);
  });
  
  return Promise.race([promise, timeout]);
}

// Usage
const tokens = await this.withTimeout(
  adapter.exchangeCodeForToken(code),
  10000, // 10 seconds
  'Token exchange'
);
```

## Type Safety

### 1. Strict Type Definitions

Use TypeScript for compile-time safety:

```typescript
// ✅ Good: Strict types
interface OAuthCallbackParams {
  provider: Provider;
  code: string;
  state: string;
}

async handleCallback(params: OAuthCallbackParams): Promise<OAuthResult> {
  // TypeScript ensures all required fields are present
}

// ❌ Bad: Loose types
async handleCallback(provider: any, code: any, state: any): Promise<any> {
  // No type safety
}
```

### 2. Type Guards

Implement type guards for runtime validation:

```typescript
function isIntegrationError(error: any): error is IntegrationsServiceError {
  return (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    'retryable' in error &&
    'timestamp' in error
  );
}

// Usage
try {
  await service.handleCallback(params);
} catch (error) {
  if (isIntegrationError(error)) {
    console.error('Integration error:', error.code);
  } else {
    console.error('Unknown error:', error);
  }
}
```

### 3. Discriminated Unions

Use discriminated unions for API responses:

```typescript
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: IntegrationsServiceError };

async function fetchData(): Promise<ApiResponse<Integration[]>> {
  try {
    const data = await fetchIntegrations();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error as IntegrationsServiceError };
  }
}

// Usage with type narrowing
const response = await fetchData();
if (response.success) {
  console.log(response.data); // TypeScript knows data exists
} else {
  console.error(response.error); // TypeScript knows error exists
}
```

## Logging & Debugging

### 1. Structured Logging

Use structured logs with consistent format:

```typescript
interface LogContext {
  operation: string;
  provider?: Provider;
  userId?: number;
  duration?: number;
  correlationId?: string;
  [key: string]: any;
}

function log(level: 'info' | 'warn' | 'error', message: string, context: LogContext) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level: level.toUpperCase(),
    message,
    ...context,
  };
  
  console[level](JSON.stringify(logEntry));
}

// Usage
log('info', 'OAuth callback completed', {
  operation: 'handleOAuthCallback',
  provider: 'instagram',
  userId: 12345,
  duration: 1234,
  correlationId: 'int-123',
});
```

### 2. Correlation IDs

Track requests across services:

```typescript
class IntegrationsService {
  private generateCorrelationId(): string {
    return `int-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
  
  async handleCallback(provider: Provider, code: string, state: string) {
    const correlationId = this.generateCorrelationId();
    const startTime = Date.now();
    
    try {
      log('info', 'OAuth callback started', {
        operation: 'handleOAuthCallback',
        provider,
        correlationId,
      });
      
      // Process callback...
      
      log('info', 'OAuth callback completed', {
        operation: 'handleOAuthCallback',
        provider,
        correlationId,
        duration: Date.now() - startTime,
      });
    } catch (error) {
      log('error', 'OAuth callback failed', {
        operation: 'handleOAuthCallback',
        provider,
        correlationId,
        error: error.message,
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }
}
```

### 3. Debug Mode

Add debug logging for development:

```typescript
const DEBUG = process.env.DEBUG === 'true';

function debug(message: string, context: any) {
  if (DEBUG) {
    console.debug(`[DEBUG] ${message}`, context);
  }
}

// Usage
debug('State validation', {
  state,
  parts: state.split(':'),
  userId: extractedUserId,
});
```

## Caching

### 1. Token Caching

Cache tokens to reduce database queries:

```typescript
class TokenCache {
  private cache = new Map<string, CacheEntry<string>>();
  
  get(key: string): string | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt.getTime()) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  set(key: string, value: string, ttl: number) {
    this.cache.set(key, {
      data: value,
      expiresAt: new Date(Date.now() + ttl * 1000),
      createdAt: new Date(),
    });
  }
}

// Usage
const tokenCache = new TokenCache();

async getAccessToken(userId: number, provider: Provider): Promise<string> {
  const cacheKey = `token:${userId}:${provider}`;
  
  // Check cache first
  const cached = tokenCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Fetch from database
  const token = await this.fetchTokenFromDb(userId, provider);
  
  // Cache for 5 minutes
  tokenCache.set(cacheKey, token, 300);
  
  return token;
}
```

### 2. Response Caching

Cache API responses:

```typescript
async getIntegrations(userId: number): Promise<Integration[]> {
  const cacheKey = `integrations:${userId}`;
  
  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Fetch from database
  const integrations = await this.fetchIntegrations(userId);
  
  // Cache for 1 minute
  await redis.setex(cacheKey, 60, JSON.stringify(integrations));
  
  return integrations;
}
```

## Security

### 1. State Parameter Security

Generate cryptographically secure state parameters:

```typescript
import crypto from 'crypto';

// ✅ Good: Cryptographically secure
function generateState(userId: number): string {
  const timestamp = Date.now();
  const randomToken = crypto.randomBytes(16).toString('hex');
  return `${userId}:${timestamp}:${randomToken}`;
}

// ❌ Bad: Predictable
function generateState(userId: number): string {
  return `${userId}:${Date.now()}:${userId}`;
}
```

### 2. Token Encryption

Always encrypt tokens at rest:

```typescript
import { encryptToken, decryptToken } from './encryption';

// Store encrypted
const encryptedToken = encryptToken(accessToken);
await db.saveToken(userId, encryptedToken);

// Retrieve and decrypt
const encryptedToken = await db.getToken(userId);
const accessToken = decryptToken(encryptedToken);
```

### 3. Input Validation

Validate all inputs:

```typescript
function validateState(state: string): void {
  if (!state || typeof state !== 'string') {
    throw createIntegrationError(
      IntegrationErrorCode.INVALID_STATE,
      'State parameter is required'
    );
  }
  
  const parts = state.split(':');
  if (parts.length !== 3) {
    throw createIntegrationError(
      IntegrationErrorCode.INVALID_STATE,
      'State parameter has invalid format'
    );
  }
  
  const [userIdStr, timestampStr, randomToken] = parts;
  
  const userId = parseInt(userIdStr, 10);
  if (isNaN(userId) || userId <= 0) {
    throw createIntegrationError(
      IntegrationErrorCode.INVALID_STATE,
      'State contains invalid user ID'
    );
  }
  
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) {
    throw createIntegrationError(
      IntegrationErrorCode.INVALID_STATE,
      'State contains invalid timestamp'
    );
  }
  
  const stateAge = Date.now() - timestamp;
  if (stateAge > 3600000) {
    throw createIntegrationError(
      IntegrationErrorCode.INVALID_STATE,
      'State parameter has expired'
    );
  }
  
  if (!randomToken || randomToken.length < 5) {
    throw createIntegrationError(
      IntegrationErrorCode.INVALID_STATE,
      'State contains invalid random token'
    );
  }
}
```

## Performance

### 1. Parallel Operations

Use Promise.all for parallel operations:

```typescript
// ✅ Good: Parallel
const [tokens, profile] = await Promise.all([
  adapter.exchangeCodeForToken(code),
  adapter.getUserProfile(accessToken),
]);

// ❌ Bad: Sequential
const tokens = await adapter.exchangeCodeForToken(code);
const profile = await adapter.getUserProfile(accessToken);
```

### 2. Database Optimization

Use upsert to reduce queries:

```typescript
// ✅ Good: Single query
await prisma.oAuthAccount.upsert({
  where: { provider_providerAccountId: { provider, providerAccountId } },
  create: { ...data },
  update: { ...data },
});

// ❌ Bad: Multiple queries
const existing = await prisma.oAuthAccount.findUnique({ where: { ... } });
if (existing) {
  await prisma.oAuthAccount.update({ where: { ... }, data: { ... } });
} else {
  await prisma.oAuthAccount.create({ data: { ... } });
}
```

### 3. Connection Pooling

Reuse database connections:

```typescript
// ✅ Good: Singleton pattern
const prisma = new PrismaClient();

export class IntegrationsService {
  constructor() {
    // Reuse global prisma instance
  }
}

// ❌ Bad: New connection per instance
export class IntegrationsService {
  private prisma: PrismaClient;
  
  constructor() {
    this.prisma = new PrismaClient(); // Creates new connection
  }
}
```

## Testing

### Property-Based Testing

Use property-based testing for comprehensive coverage:

```typescript
import * as fc from 'fast-check';

it('should reject invalid state parameters', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.string({ minLength: 1, maxLength: 50 }),
      async (invalidState) => {
        await expect(
          service.handleCallback('instagram', 'code', invalidState)
        ).rejects.toThrow('INVALID_STATE');
      }
    ),
    { numRuns: 100 }
  );
});
```

## Related Documentation

- [OAuth State Validation API](../../../docs/api/integrations-oauth-state-validation.md)
- [Integrations Service](./integrations.service.ts)
- [Type Definitions](./types.ts)
- [Property-Based Tests](../../../tests/unit/services/oauth-state-validation.property.test.ts)

---

**Last Updated**: 2024-01-16  
**Version**: 1.0
