# Instagram OAuth Service - Optimized

## 🚀 Quick Start

```typescript
import { instagramOAuth, instagramLogger } from '@/lib/services/instagram';

// Get authorization URL
const { url, state } = await instagramOAuth.getAuthorizationUrl();

// Exchange code for tokens
const tokens = await instagramOAuth.exchangeCodeForTokens(code);

// Get long-lived token
const longLived = await instagramOAuth.getLongLivedToken(tokens.access_token);
```

## 📦 New Features

### 1. Structured Error Types

```typescript
import { InstagramError, InstagramErrorType } from '@/lib/services/instagram';

try {
  const tokens = await instagramOAuth.exchangeCodeForTokens(code);
} catch (error) {
  const igError = error as InstagramError;
  
  console.log(igError.type); // InstagramErrorType.AUTH_ERROR
  console.log(igError.userMessage); // User-friendly message
  console.log(igError.correlationId); // For debugging
  console.log(igError.retryable); // Can retry?
}
```

### 2. Centralized Logger

```typescript
import { instagramLogger, LogLevel } from '@/lib/services/instagram';

// Set log level
instagramLogger.setLevel(LogLevel.DEBUG);

// Log with correlation ID
const correlationId = instagramLogger.generateCorrelationId();

instagramLogger.info('Token exchange started', {
  correlationId,
  userId: 'user_123',
});

instagramLogger.error('Token exchange failed', error, {
  correlationId,
  endpoint: '/oauth/access_token',
});
```

### 3. Circuit Breaker

```typescript
import { CircuitBreaker, CircuitState } from '@/lib/services/instagram';

const breaker = new CircuitBreaker({
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000,
  monitoringPeriod: 120000,
}, 'Instagram API');

// Execute with circuit breaker protection
try {
  const result = await breaker.execute(async () => {
    return await instagramOAuth.getAccountInfo(token);
  });
} catch (error) {
  if (breaker.getState() === CircuitState.OPEN) {
    console.log('Circuit breaker is OPEN - service unavailable');
  }
}

// Get statistics
const stats = breaker.getStats();
console.log(stats);
// {
//   state: 'CLOSED',
//   failures: 0,
//   successes: 10,
//   totalCalls: 10,
//   ...
// }
```

## 🔧 Configuration

### Environment Variables

```bash
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI=https://your-domain.com/api/instagram/callback
NODE_ENV=development # or production
```

### Log Levels

- `DEBUG`: All logs including debug info
- `INFO`: Info, warnings, and errors
- `WARN`: Warnings and errors only
- `ERROR`: Errors only

## 📊 Monitoring

### Check Circuit Breaker Status

```typescript
const stats = breaker.getStats();

if (stats.state === CircuitState.OPEN) {
  // Alert: Service is down
  console.error('Instagram API circuit breaker is OPEN');
}

if (stats.totalFailures / stats.totalCalls > 0.1) {
  // Alert: High error rate (>10%)
  console.warn('Instagram API error rate is high');
}
```

### Track API Performance

```typescript
const startTime = Date.now();
const correlationId = instagramLogger.generateCorrelationId();

try {
  const result = await instagramOAuth.exchangeCodeForTokens(code);
  const duration = Date.now() - startTime;
  
  instagramLogger.info('Token exchange successful', {
    correlationId,
    duration,
    endpoint: '/oauth/access_token',
  });
} catch (error) {
  const duration = Date.now() - startTime;
  
  instagramLogger.error('Token exchange failed', error as Error, {
    correlationId,
    duration,
    endpoint: '/oauth/access_token',
  });
}
```

## 🎯 Best Practices

### 1. Always Use Correlation IDs

```typescript
const correlationId = instagramLogger.generateCorrelationId();

// Pass through all operations
await operation1(correlationId);
await operation2(correlationId);
```

### 2. Handle Errors Gracefully

```typescript
try {
  const tokens = await instagramOAuth.exchangeCodeForTokens(code);
} catch (error) {
  const igError = error as InstagramError;
  
  if (igError.retryable) {
    // Retry logic
    await retry(() => instagramOAuth.exchangeCodeForTokens(code));
  } else {
    // Show user-friendly error
    showError(igError.userMessage);
  }
}
```

### 3. Use Circuit Breaker for External Calls

```typescript
const breaker = new CircuitBreaker();

// Wrap all external API calls
const result = await breaker.execute(() => 
  instagramOAuth.getAccountInfo(token)
);
```

### 4. Log Important Events

```typescript
// Log successful operations
instagramLogger.info('User connected Instagram account', {
  userId: user.id,
  instagramUsername: account.username,
});

// Log failures with context
instagramLogger.error('Failed to refresh token', error, {
  userId: user.id,
  tokenAge: tokenAge,
});
```

## 📚 API Reference

See [API_OPTIMIZATION_REPORT.md](../API_OPTIMIZATION_REPORT.md) for complete documentation.

## 🔗 Related Files

- `lib/services/instagramOAuth.ts` - Main service implementation
- `lib/services/instagram/types.ts` - Type definitions
- `lib/services/instagram/logger.ts` - Logging utilities
- `lib/services/instagram/circuit-breaker.ts` - Circuit breaker implementation
- `tests/unit/services/instagramOAuth-enhancements.test.ts` - Tests

## 📝 Migration Guide

### From Old to New Error Handling

**Before:**
```typescript
try {
  const tokens = await instagramOAuth.exchangeCodeForTokens(code);
} catch (error) {
  console.error('Error:', error.message);
}
```

**After:**
```typescript
import { InstagramError, InstagramErrorType } from '@/lib/services/instagram';

try {
  const tokens = await instagramOAuth.exchangeCodeForTokens(code);
} catch (error) {
  const igError = error as InstagramError;
  
  instagramLogger.error('Token exchange failed', error as Error, {
    correlationId: igError.correlationId,
    type: igError.type,
  });
  
  // Show user-friendly message
  showError(igError.userMessage);
}
```

## 🚨 Troubleshooting

### Circuit Breaker is OPEN

1. Check Instagram API status
2. Review error logs with correlation IDs
3. Verify credentials are valid
4. Check rate limits
5. Manually reset if needed: `breaker.reset()`

### High Error Rate

1. Enable DEBUG logging: `instagramLogger.setLevel(LogLevel.DEBUG)`
2. Check correlation IDs in logs
3. Verify token refresh is working
4. Check network connectivity
5. Review Facebook API status

### Token Refresh Failures

1. Check token expiration
2. Verify credentials are valid
3. Check if user revoked permissions
4. Review error code (190 = expired)
5. Prompt user to reconnect

---

**Last Updated:** 2025-11-14  
**Version:** 1.0.0
