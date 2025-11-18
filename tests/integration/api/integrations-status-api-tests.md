# Integrations Status API - Test Documentation

## Overview

This document describes the integration tests for the `GET /api/integrations/status` endpoint.

**Endpoint**: `GET /api/integrations/status`  
**Authentication**: Required (NextAuth session)  
**Rate Limit**: 60 requests per minute per user  
**Requirements**: 1.1, 1.2, 3.1, 3.2

## Test Categories

### 1. HTTP Status Codes

Tests all possible HTTP status codes returned by the endpoint.

#### Test Cases

| Test Case | Expected Status | Description |
|-----------|----------------|-------------|
| Authenticated request with no integrations | 200 OK | Returns empty integrations array |
| Authenticated request with integrations | 200 OK | Returns integrations with status |
| Unauthenticated request | 401 Unauthorized | Missing session cookie |
| Invalid session token | 401 Unauthorized | Malformed or expired session |
| Invalid user ID | 400 Bad Request | User ID cannot be parsed |
| Rate limit exceeded | 429 Too Many Requests | More than 60 requests per minute |
| Database connection error | 500 Internal Server Error | Database unavailable |
| Database query error | 500 Internal Server Error | Query execution failed |

### 2. Response Schema Validation

Tests that responses conform to expected schemas using Zod validation.

#### Success Response Schema

```typescript
{
  success: true,
  data: {
    integrations: [
      {
        id: number,
        provider: string,
        accountId: string,
        accountName: string,
        status: 'connected' | 'expired',
        expiresAt: string | null,
        createdAt: string,
        updatedAt: string
      }
    ]
  },
  duration: number
}
```

#### Error Response Schema

```typescript
{
  success: false,
  error: {
    code: string,
    message: string
  },
  duration: number
}
```

#### Test Cases

- ✅ Success response matches schema
- ✅ Error response matches schema
- ✅ All integration fields are present
- ✅ Field types are correct
- ✅ No sensitive data exposed (tokens, passwords)

### 3. Response Headers

Tests that appropriate headers are included in responses.

#### Required Headers

| Header | Description | Example |
|--------|-------------|---------|
| `X-Correlation-Id` | Unique request identifier | `550e8400-e29b-41d4-a716-446655440000` |
| `X-Duration-Ms` | Request processing time | `45` |
| `Cache-Control` | Cache directives | `private, no-cache, no-store, must-revalidate` |
| `X-RateLimit-Limit` | Rate limit maximum | `60` |
| `X-RateLimit-Remaining` | Remaining requests | `59` |
| `X-RateLimit-Reset` | Reset timestamp | `1705420800` |

#### Error-Specific Headers

| Header | When Included | Example |
|--------|---------------|---------|
| `Retry-After` | 429 or 500 errors | `60` |

#### Test Cases

- ✅ Correlation ID is present and valid UUID
- ✅ Duration is present and positive number
- ✅ Cache-Control prevents caching
- ✅ Rate limit headers are present
- ✅ Retry-After header on errors

### 4. Status Calculation

Tests the logic for determining integration status (connected vs expired).

#### Status Rules

| Condition | Status | Description |
|-----------|--------|-------------|
| `expiresAt` is null | `connected` | No expiry = always valid |
| `expiresAt` > now | `connected` | Token is still valid |
| `expiresAt` <= now | `expired` | Token has expired |

#### Test Cases

- ✅ Valid token marked as "connected"
- ✅ Expired token marked as "expired"
- ✅ No expiry marked as "connected"
- ✅ Multiple integrations with mixed statuses
- ✅ Edge case: expiry exactly at current time

### 5. Data Filtering

Tests that only appropriate data is returned.

#### Test Cases

- ✅ Empty array when user has no integrations
- ✅ Only authenticated user's integrations returned
- ✅ Other users' integrations not included
- ✅ All integration types supported (instagram, tiktok, reddit, onlyfans)
- ✅ Deleted integrations not included

### 6. Authentication & Authorization

Tests authentication and authorization requirements.

#### Test Cases

- ✅ Requires valid session cookie
- ✅ Rejects missing session
- ✅ Rejects invalid session
- ✅ Rejects expired session
- ✅ Validates user ID from session
- ✅ Prevents access to other users' data

### 7. Rate Limiting

Tests rate limiting behavior.

#### Configuration

- **Limit**: 60 requests per minute per user
- **Window**: 60 seconds
- **Scope**: Per user (based on session)

#### Test Cases

- ✅ Allows requests within limit
- ✅ Blocks requests exceeding limit
- ✅ Returns 429 when limit exceeded
- ✅ Includes rate limit headers
- ✅ Decrements remaining count
- ✅ Resets after window expires
- ✅ Includes Retry-After header

### 8. Error Handling

Tests error handling and recovery.

#### Test Cases

- ✅ Invalid user ID returns 400
- ✅ Database connection error returns 500
- ✅ Database query error returns 500
- ✅ Malformed session handled gracefully
- ✅ User-friendly error messages
- ✅ No sensitive data in errors
- ✅ Correlation ID in all errors
- ✅ Errors logged with context

### 9. Retry Logic

Tests automatic retry behavior for transient errors.

#### Configuration

- **Max Retries**: 3
- **Initial Delay**: 100ms
- **Max Delay**: 2000ms
- **Backoff Factor**: 2 (exponential)

#### Retryable Errors

- `ECONNREFUSED` - Connection refused
- `ETIMEDOUT` - Connection timeout
- `ENOTFOUND` - DNS lookup failed
- `ENETUNREACH` - Network unreachable

#### Test Cases

- ✅ Retries on transient errors
- ✅ Does not retry on validation errors
- ✅ Uses exponential backoff (100ms, 200ms, 400ms)
- ✅ Succeeds after retries
- ✅ Fails after max retries
- ✅ Logs retry attempts

### 10. Performance

Tests performance characteristics.

#### Performance Targets

| Scenario | Target | Description |
|----------|--------|-------------|
| Empty result | < 500ms | No integrations to process |
| 10 integrations | < 500ms | Typical user scenario |
| 50 integrations | < 1000ms | Power user scenario |
| 10 concurrent requests | < 2000ms | All requests complete |

#### Test Cases

- ✅ Completes within 500ms for empty result
- ✅ Completes within 500ms with 10 integrations
- ✅ Includes duration in response
- ✅ Handles concurrent requests efficiently
- ✅ No performance degradation under load

### 11. Concurrent Access

Tests behavior under concurrent access.

#### Test Cases

- ✅ Handles 10 concurrent requests
- ✅ Handles 50 concurrent requests
- ✅ Maintains data consistency
- ✅ No race conditions
- ✅ No deadlocks
- ✅ All requests complete successfully

### 12. Database Integration

Tests database interactions.

#### Test Cases

- ✅ Queries integrations correctly
- ✅ Uses correct indexes
- ✅ Handles query errors
- ✅ Handles connection errors
- ✅ Returns consistent data
- ✅ Filters by user ID correctly

### 13. Logging

Tests logging behavior.

#### Log Events

| Event | Level | Fields |
|-------|-------|--------|
| Request start | INFO | correlationId, userId |
| Request success | INFO | correlationId, userId, count, expired, duration |
| Request error | ERROR | correlationId, userId, error, stack, duration |
| Retry attempt | WARN | correlationId, attempt, delay, error |

#### Test Cases

- ✅ Logs request start
- ✅ Logs successful response
- ✅ Logs errors with context
- ✅ Logs retry attempts
- ✅ Includes correlation ID in all logs

### 14. Security

Tests security measures.

#### Test Cases

- ✅ Requires authentication
- ✅ Validates session token
- ✅ Prevents access to other users' data
- ✅ Does not expose sensitive tokens
- ✅ Does not expose passwords
- ✅ Does not expose encryption keys
- ✅ Sanitizes error messages

## Running Tests

### Run All Integration Tests

```bash
npm run test:integration
```

### Run Integrations Status Tests Only

```bash
npm run test:integration -- integrations-status
```

### Run with Coverage

```bash
npm run test:integration:coverage
```

### Run in Watch Mode

```bash
npm run test:integration:watch
```

## Test Data Setup

### Prerequisites

1. PostgreSQL database running
2. Test database initialized
3. Environment variables configured

### Test User Creation

Tests automatically create and cleanup test users:

```typescript
const email = `test-integrations-${Date.now()}@example.com`;
// Register user
// Create integrations
// Run tests
// Cleanup
```

### Test Integration Creation

Tests create integrations with various states:

```typescript
// Valid integration
await createTestIntegration(userId, 'instagram', futureDate);

// Expired integration
await createTestIntegration(userId, 'tiktok', pastDate);

// No expiry integration
await createTestIntegration(userId, 'reddit', null);
```

## Fixtures

Test fixtures are available in `fixtures/integrations-fixtures.ts`:

```typescript
import {
  validIntegration,
  expiredIntegration,
  successResponseWithIntegrations,
  generateRandomIntegration,
} from './fixtures/integrations-fixtures';
```

## Troubleshooting

### Tests Failing Due to Rate Limiting

If tests fail due to rate limiting, increase the delay between requests or reduce the number of concurrent requests.

### Database Connection Errors

Ensure the test database is running and environment variables are correctly configured:

```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/test_db
```

### Session Cookie Issues

Tests use mock session cookies. Ensure the authentication middleware is properly configured for test environment.

## Coverage Goals

- **Line Coverage**: > 90%
- **Branch Coverage**: > 85%
- **Function Coverage**: > 90%
- **Statement Coverage**: > 90%

## Related Documentation

- [API Documentation](../../../docs/api/integrations-status.md)
- [Requirements](../../../.kiro/specs/integrations-management/requirements.md)
- [Design Document](../../../.kiro/specs/integrations-management/design.md)
- [Integration Tests Guide](./TESTING_GUIDE.md)

## Changelog

### 2025-01-16
- Initial test suite created
- All test categories implemented
- Fixtures and documentation added

---

**Last Updated**: 2025-01-16  
**Version**: 1.0  
**Status**: ✅ Complete
