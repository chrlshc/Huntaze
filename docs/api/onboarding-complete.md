# Onboarding Complete API

## Overview

The Onboarding Complete API marks a user's onboarding as complete and saves their preferences.

**Endpoint**: `POST /api/onboarding/complete`

**Authentication**: Required (NextAuth session)

**Rate Limit**: None (single-use endpoint)

## Request

### Headers

```
Content-Type: application/json
Cookie: next-auth.session-token=<session-token>
```

### Body Schema

```typescript
{
  contentTypes?: ('photos' | 'videos' | 'stories' | 'ppv')[],
  goal?: 'grow-audience' | 'increase-revenue' | 'save-time' | 'all',
  revenueGoal?: number, // 0-1000000
  platform?: {
    username: string,
    password: string
  }
}
```

### Example Request

```bash
curl -X POST https://app.huntaze.com/api/onboarding/complete \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=your-session-token" \
  -d '{
    "contentTypes": ["photos", "videos"],
    "goal": "increase-revenue",
    "revenueGoal": 5000,
    "platform": {
      "username": "creator123",
      "password": "secure_password"
    }
  }'
```

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Onboarding completed successfully",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "duration": 245
}
```

**Headers**:
- `X-Correlation-Id`: Unique request identifier
- `X-Duration-Ms`: Request duration in milliseconds

### Error Responses

#### 401 Unauthorized

```json
{
  "error": "Authentication required",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "retryable": false,
  "statusCode": 401
}
```

**Cause**: Missing or invalid session cookie

**Solution**: Login again to get a fresh session

#### 400 Bad Request

```json
{
  "error": "Validation failed",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "retryable": false,
  "statusCode": 400
}
```

**Cause**: Invalid request body (e.g., invalid contentTypes, goal out of range)

**Solution**: Check request body against schema

#### 503 Service Unavailable

```json
{
  "error": "Failed to update user data after retries",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "retryable": true,
  "statusCode": 503
}
```

**Cause**: Database connection issues

**Solution**: Retry after 60 seconds (see `Retry-After` header)

**Headers**:
- `Retry-After`: 60

#### 500 Internal Server Error

```json
{
  "error": "Internal server error",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "retryable": true,
  "statusCode": 500
}
```

**Cause**: Unexpected server error

**Solution**: Retry after 60 seconds, contact support if persists

## Features

### 1. Input Validation

All inputs are validated using Zod schemas:

- `contentTypes`: Must be array of valid content types
- `goal`: Must be one of predefined goals
- `revenueGoal`: Must be between 0 and 1,000,000
- `platform.username`: Required if platform provided
- `platform.password`: Required if platform provided

### 2. Retry Logic

Database operations use exponential backoff retry:

- **Max retries**: 3
- **Initial delay**: 100ms
- **Max delay**: 2000ms
- **Backoff factor**: 2x

Retryable errors:
- `ECONNREFUSED`: Connection refused
- `ETIMEDOUT`: Connection timeout
- `ENOTFOUND`: DNS lookup failed

### 3. Credential Encryption

OnlyFans credentials are encrypted before storage:

- Uses AES-256-GCM encryption
- Encryption key from environment variable
- Stored in `oauth_accounts` table
- Failure to store credentials doesn't fail the request

### 4. Correlation ID Tracking

Every request gets a unique correlation ID:

- Generated using `crypto.randomUUID()`
- Included in all logs
- Returned in response headers
- Used for debugging and tracing

### 5. Performance Monitoring

Request duration is tracked and logged:

- Start time captured at request entry
- Duration calculated at response
- Included in success response
- Logged for all requests

## Data Storage

### Users Table

```sql
UPDATE users 
SET onboarding_completed = true,
    content_types = $2,
    goal = $3,
    revenue_goal = $4,
    updated_at = NOW()
WHERE id = $1
```

### OAuth Accounts Table (Optional)

```sql
INSERT INTO oauth_accounts (user_id, provider, provider_account_id, access_token, created_at, updated_at)
VALUES ($1, 'onlyfans', $2, $3, NOW(), NOW())
ON CONFLICT (provider, provider_account_id)
DO UPDATE SET access_token = $3, updated_at = NOW()
```

## Error Handling

### Error Types

1. **VALIDATION_ERROR** (400)
   - Invalid request body
   - Schema validation failed
   - Not retryable

2. **AUTHENTICATION_ERROR** (401)
   - Missing session
   - Invalid session
   - Not retryable

3. **DATABASE_ERROR** (503)
   - Connection failed after retries
   - Query timeout
   - Retryable

4. **ENCRYPTION_ERROR** (500)
   - Failed to encrypt credentials
   - Missing encryption key
   - Not retryable

5. **INTERNAL_ERROR** (500)
   - Unexpected error
   - Retryable

### Error Recovery

For retryable errors:

1. Check `Retry-After` header (60 seconds)
2. Wait specified duration
3. Retry request with same body
4. Check correlation ID in logs if issue persists

For non-retryable errors:

1. Fix request body or authentication
2. Don't retry automatically
3. Contact support if needed

## Security

### Authentication

- Requires valid NextAuth session
- Session validated on every request
- No API keys or tokens needed

### Credential Storage

- Passwords encrypted with AES-256-GCM
- Encryption key stored securely
- Never logged or exposed in responses
- Stored separately from user data

### Input Sanitization

- All inputs validated with Zod
- SQL injection prevented by parameterized queries
- XSS prevented by not rendering user input

## Performance

### Typical Response Times

- **Success**: 100-300ms
- **With credentials**: 200-500ms
- **With retry**: 300-1000ms

### Optimization

- Database queries use indexes
- Retry logic prevents cascading failures
- Credential storage is non-blocking
- Correlation IDs enable performance tracking

## Testing

### Unit Tests

```bash
npm run test:unit -- tests/unit/api/onboarding-complete.test.ts
```

### Integration Tests

```bash
npm run test:integration -- tests/integration/api/onboarding-complete.integration.test.ts
```

### Manual Testing

```bash
# 1. Register and login
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test User","email":"test@example.com","password":"SecurePassword123!"}'

# 2. Complete onboarding
curl -X POST http://localhost:3000/api/onboarding/complete \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=your-session-token" \
  -d '{"contentTypes":["photos"],"goal":"grow-audience"}'
```

## Monitoring

### Logs

All requests are logged with:

- Correlation ID
- User ID
- Request duration
- Success/failure status
- Error details (if any)

### Metrics

Track these metrics:

- Request count
- Success rate
- Average duration
- Error rate by type
- Retry count

### Alerts

Set up alerts for:

- Error rate > 5%
- Average duration > 1000ms
- Retry rate > 10%
- Database connection failures

## Related Documentation

- [Authentication Guide](../AUTH_SETUP.md)
- [Database Schema](../../prisma/schema.prisma)
- [Encryption Service](../../lib/services/integrations/encryption.ts)
- [API Overview](./README.md)

## Changelog

### Version 1.1 (November 18, 2025)
- Added retry logic with exponential backoff
- Added input validation with Zod
- Added correlation ID tracking
- Added typed responses
- Improved error handling
- Added credential encryption

### Version 1.0 (November 16, 2025)
- Initial implementation
- Basic onboarding completion
- Session-based authentication

---

**Last Updated**: November 18, 2025  
**Version**: 1.1  
**Status**: ✅ Production Ready
