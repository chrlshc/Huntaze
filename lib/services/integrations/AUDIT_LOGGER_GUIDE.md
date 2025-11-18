# Audit Logger Guide

## Overview

The Audit Logger provides comprehensive audit logging for all integration-related operations to support security monitoring, compliance, and debugging.

## Features

- ✅ **Structured Logging**: Consistent log format with correlation IDs
- ✅ **PII-Safe**: Automatic redaction of sensitive data (tokens, passwords, API keys)
- ✅ **Multi-Destination**: Console, database, and external service logging
- ✅ **Retry Logic**: Automatic retry for external service failures
- ✅ **Type-Safe**: Full TypeScript support with type definitions
- ✅ **Error Boundaries**: Graceful degradation on logging failures
- ✅ **Performance**: Non-blocking async operations

## Installation

```typescript
import { auditLogger, AuditEventType } from '@/lib/services/integrations/audit-logger';
```

## Basic Usage

### Log OAuth Events

```typescript
// OAuth initiation
await auditLogger.logOAuthInitiated(
  userId,
  'instagram',
  ipAddress,
  userAgent,
  correlationId
);

// OAuth completion
await auditLogger.logOAuthCompleted(
  userId,
  'instagram',
  accountId,
  ipAddress,
  userAgent,
  correlationId
);

// OAuth failure
await auditLogger.logOAuthFailed(
  userId,
  'instagram',
  'Invalid credentials',
  ipAddress,
  userAgent,
  correlationId,
  { errorCode: 'AUTH_001' }
);
```

### Log Token Events

```typescript
// Token refresh
await auditLogger.logTokenRefreshed(
  userId,
  'instagram',
  accountId,
  correlationId
);

// Token refresh failure
await auditLogger.logTokenRefreshFailed(
  userId,
  'instagram',
  accountId,
  'Token expired',
  correlationId
);
```

### Log Security Events

```typescript
// CSRF validation failure
await auditLogger.logCsrfValidationFailed(
  'instagram',
  state,
  ipAddress,
  userAgent,
  correlationId
);

// Invalid state detection
await auditLogger.logInvalidStateDetected(
  'instagram',
  'State expired',
  ipAddress,
  userAgent,
  correlationId
);

// Rate limit exceeded
await auditLogger.logRateLimitExceeded(
  userId,
  'instagram',
  ipAddress,
  userAgent,
  correlationId
);

// Unauthorized access
await auditLogger.logUnauthorizedAccess(
  userId,
  'instagram',
  accountId,
  'User does not own account',
  ipAddress,
  userAgent,
  correlationId
);
```

### Custom Audit Logs

```typescript
await auditLogger.log({
  eventType: AuditEventType.API_ERROR,
  userId: 123,
  provider: 'instagram',
  accountId: 'acc_123',
  correlationId: 'corr_123',
  timestamp: new Date(),
  success: false,
  errorMessage: 'API request failed',
  metadata: {
    endpoint: '/api/posts',
    statusCode: 500,
    // Sensitive data will be automatically redacted
    accessToken: 'token_123', // Will be [REDACTED]
  },
});
```

## Configuration

### Environment Variables

```bash
# Enable external logging service
AUDIT_LOG_ENDPOINT=https://logs.example.com/audit
AUDIT_LOG_API_KEY=your_api_key

# Enable database logging
ENABLE_AUDIT_DB=true

# Environment (affects console logging)
NODE_ENV=production  # Disables console logging in production
```

### Custom Configuration

```typescript
import { AuditLogger } from '@/lib/services/integrations/audit-logger';

const customLogger = new AuditLogger({
  enableExternalLogging: true,
  enableDatabaseLogging: true,
  enableConsoleLogging: false,
  retryAttempts: 5,
  retryDelay: 2000,
});
```

## Event Types

### OAuth Operations
- `OAUTH_INITIATED` - OAuth flow started
- `OAUTH_COMPLETED` - OAuth flow completed successfully
- `OAUTH_FAILED` - OAuth flow failed
- `OAUTH_CANCELLED` - OAuth flow cancelled by user

### Token Operations
- `TOKEN_REFRESHED` - Access token refreshed successfully
- `TOKEN_REFRESH_FAILED` - Token refresh failed
- `TOKEN_EXPIRED` - Token expired

### Connection Operations
- `INTEGRATION_CONNECTED` - Integration connected
- `INTEGRATION_DISCONNECTED` - Integration disconnected
- `INTEGRATION_RECONNECTED` - Integration reconnected

### Security Events
- `CSRF_VALIDATION_FAILED` - CSRF token validation failed
- `INVALID_STATE_DETECTED` - Invalid OAuth state detected
- `RATE_LIMIT_EXCEEDED` - Rate limit exceeded
- `UNAUTHORIZED_ACCESS` - Unauthorized access attempt

### Error Events
- `API_ERROR` - API request error
- `DATABASE_ERROR` - Database operation error
- `NETWORK_ERROR` - Network connectivity error

## PII Sanitization

The audit logger automatically redacts sensitive information from metadata:

### Redacted Fields
- `accessToken`, `access_token`
- `refreshToken`, `refresh_token`
- `password`
- `apiKey`, `api_key`
- `secret`
- `token`
- `sessionToken`, `session_token`
- `authorization`

### Example

```typescript
// Input
await auditLogger.log({
  eventType: AuditEventType.OAUTH_COMPLETED,
  userId: 123,
  provider: 'instagram',
  timestamp: new Date(),
  success: true,
  metadata: {
    accessToken: 'secret_token_123',  // Will be redacted
    username: 'testuser',             // Will be preserved
    refreshToken: 'refresh_123',      // Will be redacted
  },
});

// Logged output
{
  eventType: 'oauth_completed',
  userId: 123,
  provider: 'instagram',
  success: true,
  metadata: {
    accessToken: '[REDACTED]',
    username: 'testuser',
    refreshToken: '[REDACTED]',
  }
}
```

## Database Schema

To enable database logging, create the following table:

```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  user_id INTEGER NOT NULL,
  provider VARCHAR(50),
  account_id VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  correlation_id VARCHAR(100),
  metadata JSONB,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_correlation_id ON audit_logs(correlation_id);
```

## External Service Integration

### Request Format

```json
{
  "eventType": "oauth_completed",
  "userId": 123,
  "provider": "instagram",
  "accountId": "acc_123",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "correlationId": "corr_123",
  "metadata": {
    "key": "value"
  },
  "success": true,
  "errorMessage": null,
  "timestamp": "2024-01-16T10:00:00.000Z"
}
```

### Response Format

```json
{
  "success": true,
  "messageId": "msg_123"
}
```

### Retry Logic

The audit logger uses exponential backoff retry logic:
- **Max Retries**: 3 (configurable)
- **Initial Delay**: 1000ms (configurable)
- **Retry On**: 408, 429, 500, 502, 503, 504 status codes
- **Timeout**: 5000ms per request

## Error Handling

The audit logger is designed to never break the main application flow:

```typescript
try {
  // Your main logic
  await performOAuthFlow();
  
  // Audit logging (non-blocking, won't throw)
  await auditLogger.logOAuthCompleted(userId, provider, accountId);
} catch (error) {
  // Main logic error handling
  await auditLogger.logOAuthFailed(userId, provider, error.message);
  throw error;
}
```

## Performance Considerations

### Non-Blocking Operations

All logging operations are non-blocking:

```typescript
// Database and external service logging happen asynchronously
await auditLogger.log(entry);
// Returns immediately, logging continues in background
```

### Concurrent Logging

The audit logger handles concurrent operations efficiently:

```typescript
// Multiple logs can be processed simultaneously
await Promise.all([
  auditLogger.logOAuthCompleted(userId1, 'instagram', accountId1),
  auditLogger.logOAuthCompleted(userId2, 'tiktok', accountId2),
  auditLogger.logTokenRefreshed(userId3, 'reddit', accountId3),
]);
```

## Best Practices

### 1. Always Include Correlation IDs

```typescript
const correlationId = crypto.randomUUID();

await auditLogger.logOAuthInitiated(
  userId,
  provider,
  ipAddress,
  userAgent,
  correlationId  // ✅ Include correlation ID
);
```

### 2. Log Both Success and Failure

```typescript
try {
  await performOAuthFlow();
  await auditLogger.logOAuthCompleted(userId, provider, accountId);
} catch (error) {
  await auditLogger.logOAuthFailed(userId, provider, error.message);
  throw error;
}
```

### 3. Include Relevant Metadata

```typescript
await auditLogger.log({
  eventType: AuditEventType.API_ERROR,
  userId,
  provider,
  timestamp: new Date(),
  success: false,
  metadata: {
    endpoint: '/api/posts',
    method: 'POST',
    statusCode: 500,
    duration: 1234,
    // Don't include sensitive data - it will be redacted anyway
  },
});
```

### 4. Use Specific Event Types

```typescript
// ✅ Good - specific event type
await auditLogger.logTokenRefreshed(userId, provider, accountId);

// ❌ Avoid - generic event type
await auditLogger.log({
  eventType: AuditEventType.API_ERROR,
  // ...
});
```

## Troubleshooting

### Logs Not Appearing

1. Check console logging is enabled:
   ```bash
   NODE_ENV=development  # Enables console logging
   ```

2. Check database logging is enabled:
   ```bash
   ENABLE_AUDIT_DB=true
   ```

3. Verify audit_logs table exists:
   ```sql
   SELECT * FROM audit_logs LIMIT 1;
   ```

### External Service Failures

1. Check endpoint configuration:
   ```bash
   echo $AUDIT_LOG_ENDPOINT
   echo $AUDIT_LOG_API_KEY
   ```

2. Check network connectivity:
   ```bash
   curl -X POST $AUDIT_LOG_ENDPOINT \
     -H "Authorization: Bearer $AUDIT_LOG_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```

3. Review error logs:
   ```typescript
   // Errors are logged but don't break the flow
   // Check application logs for audit logger errors
   ```

## Testing

### Unit Tests

```typescript
import { AuditLogger, AuditEventType } from '@/lib/services/integrations/audit-logger';

describe('AuditLogger', () => {
  it('should redact sensitive data', async () => {
    const logger = new AuditLogger({
      enableConsoleLogging: true,
      enableDatabaseLogging: false,
      enableExternalLogging: false,
    });

    await logger.log({
      eventType: AuditEventType.OAUTH_COMPLETED,
      userId: 123,
      provider: 'instagram',
      timestamp: new Date(),
      success: true,
      metadata: {
        accessToken: 'secret',
        username: 'testuser',
      },
    });

    // Verify accessToken was redacted
  });
});
```

### Integration Tests

```typescript
describe('Audit Logger Integration', () => {
  it('should log to database', async () => {
    await auditLogger.logOAuthCompleted(123, 'instagram', 'acc_123');

    const logs = await prisma.$queryRaw`
      SELECT * FROM audit_logs 
      WHERE user_id = 123 
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    expect(logs[0].event_type).toBe('oauth_completed');
  });
});
```

## Related Documentation

- [Integration Service](./README.md)
- [Security Implementation](./SECURITY.md)
- [OAuth Optimization Guide](./OAUTH_OPTIMIZATION_GUIDE.md)
- [Error Handling](../../ERROR_HANDLING_IMPLEMENTATION.md)

## Support

For issues or questions:
1. Check the [troubleshooting section](#troubleshooting)
2. Review application logs
3. Open an issue on GitHub

---

**Last Updated**: 2024-01-16  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
