# Onboarding Complete API

## Endpoint

```
POST /api/onboarding/complete
```

## Description

Marks user onboarding as complete and saves onboarding preferences including content types, goals, revenue targets, and optional OnlyFans credentials.

## Authentication

**Required**: Yes (NextAuth session)

## CSRF Protection

**Required**: Yes (X-CSRF-Token header)

## Rate Limiting

None (single-use endpoint per user)

## Request

### Headers

```
Content-Type: application/json
X-CSRF-Token: <token>
```

### Request Body

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

**All fields are optional**

### Example Request

```json
{
  "contentTypes": ["photos", "videos"],
  "goal": "increase-revenue",
  "revenueGoal": 5000,
  "platform": {
    "username": "creator123",
    "password": "securepassword"
  }
}
```

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Onboarding completed successfully",
  "user": {
    "id": 123,
    "email": "creator@example.com",
    "onboardingCompleted": true
  },
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "duration": 245
}
```

**Fields:**
- `success` (boolean): Always `true` for successful responses
- `message` (string): Success message
- `user` (object): Updated user data
  - `id` (number): User ID
  - `email` (string): User email
  - `onboardingCompleted` (boolean): Onboarding status (always `true`)
- `correlationId` (string): Unique request identifier
- `duration` (number): Request processing time in milliseconds

### Error Responses

#### 400 Bad Request

```json
{
  "error": "Validation failed",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "retryable": false,
  "statusCode": 400
}
```

**Causes:**
- Invalid JSON in request body
- Invalid field values (e.g., revenueGoal > 1000000)
- Onboarding already completed

**Action:** Fix request data and retry

#### 401 Unauthorized

```json
{
  "error": "Authentication required",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "retryable": false,
  "statusCode": 401
}
```

**Cause:** No valid session found

**Action:** User needs to log in

#### 403 Forbidden

```json
{
  "error": "CSRF validation failed",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "retryable": true,
  "statusCode": 403
}
```

**Cause:** Missing or invalid CSRF token

**Action:** Fetch new CSRF token and retry

#### 500 Internal Server Error

```json
{
  "error": "Internal server error",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "retryable": true,
  "statusCode": 500
}
```

**Cause:** Unexpected server error

**Action:** Retry the request

#### 503 Service Unavailable

```json
{
  "error": "Failed to update user data after retries",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "retryable": true,
  "statusCode": 503
}
```

**Cause:** Database connection issues or timeout

**Action:** Retry after delay (see `Retry-After` header)

**Headers:**
- `Retry-After: 60` - Retry after 60 seconds

## Response Headers

All responses include:

- `X-Correlation-Id`: Unique request identifier for debugging
- `X-Duration-Ms`: Request processing time in milliseconds (success only)
- `Retry-After`: Retry delay in seconds (error responses only)

## Features

### 1. Automatic Retry Logic

The API implements exponential backoff retry for transient database errors:

- **Max Retries**: 3 attempts
- **Initial Delay**: 100ms
- **Max Delay**: 2000ms
- **Backoff Factor**: 2x

**Retryable Errors:**
- Database connection timeouts
- Network errors
- Transaction conflicts

### 2. CSRF Protection

All requests must include a valid CSRF token in the `X-CSRF-Token` header. Get a token from `/api/csrf/token`.

### 3. Password Encryption

OnlyFans passwords are encrypted using AES-256-GCM before storage. Encryption keys are managed securely via environment variables.

### 4. Structured Error Handling

All errors include:
- User-friendly error message
- Correlation ID for tracking
- Retryable flag indicating if retry is recommended
- HTTP status code

### 5. Performance Monitoring

Each request is logged with:
- Correlation ID
- User ID
- Duration
- Onboarding data summary
- Error details (if applicable)

## Client-Side Integration

### React Component with Type Safety

```typescript
'use client';

import { useState } from 'react';
import { completeOnboarding } from '@/app/api/onboarding/complete/client';
import { useCsrfToken } from '@/hooks/useCsrfToken';
import type { OnboardingCompleteRequest } from '@/app/api/onboarding/complete/types';

export function OnboardingForm() {
  const { token: csrfToken } = useCsrfToken();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(data: OnboardingCompleteRequest) {
    setLoading(true);
    setError(null);

    const result = await completeOnboarding(data, csrfToken);

    if (result.success) {
      console.log('Onboarding completed:', result.data.user);
      // Redirect to dashboard
      window.location.href = '/home';
    } else {
      setError(result.error.error);
      console.error('Error:', result.error);
    }

    setLoading(false);
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      handleSubmit({
        contentTypes: formData.getAll('contentTypes') as any,
        goal: formData.get('goal') as any,
        revenueGoal: parseInt(formData.get('revenueGoal') as string),
      });
    }}>
      {/* Form fields */}
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Completing...' : 'Complete Onboarding'}
      </button>
    </form>
  );
}
```

### Fetch with Manual Retry

```typescript
async function completeOnboardingManual(
  data: OnboardingCompleteRequest,
  csrfToken: string
) {
  const maxRetries = 3;
  const baseDelay = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return result;
      }

      // Check if retryable
      if (result.retryable && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      throw new Error(result.error);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

## Security

- **Authentication**: Required (session-based)
- **CSRF Protection**: Required (token-based)
- **Password Encryption**: AES-256-GCM for OnlyFans credentials
- **Rate Limiting**: None (single-use per user)
- **Input Validation**: Zod schema validation
- **SQL Injection**: Protected via Prisma ORM

## Data Storage

### User Table Updates

```sql
UPDATE users SET
  onboarding_completed = true,
  content_types = ARRAY['photos', 'videos'],
  goal = 'increase-revenue',
  revenue_goal = 5000
WHERE id = 123;
```

### OAuth Account Storage (Optional)

```sql
INSERT INTO oauth_accounts (
  user_id,
  provider,
  provider_account_id,
  access_token
) VALUES (
  123,
  'onlyfans',
  'creator123',
  'encrypted_password'
);
```

## Logging

All requests are logged with structured JSON format:

```json
{
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-11-20T10:30:00.000Z",
  "service": "onboarding-complete",
  "level": "info",
  "message": "Onboarding completed successfully",
  "metadata": {
    "userId": 123,
    "email": "creator@example.com",
    "hasContentTypes": true,
    "hasGoal": true,
    "hasRevenueGoal": true,
    "hasPlatform": true,
    "duration": 245
  }
}
```

## Performance

- **Target Response Time**: < 1000ms (p95)
- **Timeout**: 30 seconds (client-side)
- **Database Queries**: 2-3 queries per request
  - Check onboarding status
  - Update user data
  - Store credentials (optional)

## Testing

See test files:
- Integration tests: `tests/integration/api/onboarding-complete.integration.test.ts`
- Client tests: `tests/unit/onboarding/complete-client.test.ts`

## Requirements Mapping

- **5.4**: Save content types and goals
- **5.6**: Save revenue goals
- **5.9**: Store OnlyFans credentials (encrypted)
- **16.2**: Password encryption for credentials
- **16.5**: CSRF protection

## Troubleshooting

### Issue: 403 CSRF Error

**Possible Causes:**
1. Missing CSRF token
2. Expired CSRF token
3. Invalid token format

**Solutions:**
1. Fetch new token from `/api/csrf/token`
2. Include token in `X-CSRF-Token` header
3. Ensure cookies are enabled

### Issue: 503 Service Unavailable

**Possible Causes:**
1. Database connection pool exhausted
2. Database server timeout
3. Network issues

**Solutions:**
1. Check database connection pool settings
2. Verify database server is running
3. Check network connectivity
4. Review CloudWatch logs for correlation ID

### Issue: Credentials not saved

**Possible Causes:**
1. Encryption key not configured
2. Database constraint violation
3. Invalid username format

**Solutions:**
1. Set `ENCRYPTION_KEY` environment variable
2. Check database logs for errors
3. Validate username format (alphanumeric)

## Related Documentation

- [Onboarding Flow](../../../onboarding/README.md)
- [CSRF Protection](../../../../lib/middleware/csrf.ts)
- [Encryption Service](../../../../lib/services/integrations/encryption.ts)
- [User Model](../../../../prisma/schema.prisma)

## Changelog

### v1.0.0 (2024-11-20)
- ✨ Initial implementation
- ✅ Automatic retry with exponential backoff
- ✅ CSRF protection
- ✅ Password encryption
- ✅ Structured error handling
- ✅ Performance monitoring
- ✅ Correlation ID tracking
- ✅ Type-safe client
- ✅ Comprehensive documentation
