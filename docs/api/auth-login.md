# Auth Login API Documentation

## Overview

The Login API provides a pre-authentication check before NextAuth.js handles the actual authentication. It validates email existence and verification status.

## Endpoint

```
POST /api/auth/login
```

## Authentication

None required (this is a pre-authentication endpoint)

## Rate Limiting

- **Limit**: 10 requests per minute per IP
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Request

### Headers

```
Content-Type: application/json
```

### Body

```typescript
{
  email: string;      // Required - User email address
  password: string;   // Required - User password (passed to NextAuth)
}
```

### Example

```bash
curl -X POST https://app.huntaze.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

## Response

### Success Response (200 OK)

```typescript
{
  success: true;
  emailVerified: boolean;
}
```

**Example:**

```json
{
  "success": true,
  "emailVerified": true
}
```

**Headers:**
- `X-Correlation-Id`: Unique request identifier
- `X-Duration-Ms`: Request processing time in milliseconds

### Error Responses

#### Validation Error (400 Bad Request)

```typescript
{
  error: string;
  type: 'VALIDATION_ERROR';
  correlationId: string;
  retryable: false;
}
```

**Example:**

```json
{
  "error": "Invalid email format",
  "type": "VALIDATION_ERROR",
  "correlationId": "login-1234567890-abc123",
  "retryable": false
}
```

#### Invalid Credentials (401 Unauthorized)

```typescript
{
  error: string;
  type: 'INVALID_CREDENTIALS';
  correlationId: string;
  retryable: false;
}
```

**Example:**

```json
{
  "error": "Invalid email or password",
  "type": "INVALID_CREDENTIALS",
  "correlationId": "login-1234567890-abc123",
  "retryable": false
}
```

#### Email Not Verified (403 Forbidden)

*Note: Currently disabled, but can be enabled*

```typescript
{
  error: string;
  type: 'EMAIL_NOT_VERIFIED';
  correlationId: string;
  retryable: false;
}
```

#### Internal Server Error (500)

```typescript
{
  error: string;
  type: 'INTERNAL_ERROR';
  correlationId: string;
  retryable: true;
}
```

**Example:**

```json
{
  "error": "An unexpected error occurred. Please try again.",
  "type": "INTERNAL_ERROR",
  "correlationId": "login-1234567890-abc123",
  "retryable": true
}
```

**Headers:**
- `X-Correlation-Id`: Unique request identifier
- `Retry-After`: Seconds to wait before retrying (60)

#### Service Unavailable (503)

```typescript
{
  error: string;
  type: 'DATABASE_ERROR';
  correlationId: string;
  retryable: true;
}
```

**Example:**

```json
{
  "error": "Service temporarily unavailable. Please try again.",
  "type": "DATABASE_ERROR",
  "correlationId": "login-1234567890-abc123",
  "retryable": true
}
```

**Headers:**
- `X-Correlation-Id`: Unique request identifier
- `Retry-After`: Seconds to wait before retrying (60)

## Error Types

| Type | Status | Description | Retryable |
|------|--------|-------------|-----------|
| `VALIDATION_ERROR` | 400 | Invalid request format or missing fields | No |
| `INVALID_CREDENTIALS` | 401 | User not found or incorrect credentials | No |
| `EMAIL_NOT_VERIFIED` | 403 | Email verification required (currently disabled) | No |
| `INTERNAL_ERROR` | 500 | Unexpected server error | Yes |
| `DATABASE_ERROR` | 503 | Database connection or query failure | Yes |

## Retry Logic

The API implements automatic retry with exponential backoff for transient failures:

- **Max Retries**: 3 attempts
- **Initial Delay**: 100ms
- **Max Delay**: 2000ms
- **Backoff Factor**: 2x

### Retryable Errors

- `ECONNREFUSED` - Connection refused
- `ETIMEDOUT` - Request timeout
- `ENOTFOUND` - DNS lookup failed
- `ENETUNREACH` - Network unreachable

## Client Implementation

### TypeScript/JavaScript

```typescript
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginSuccessResponse {
  success: true;
  emailVerified: boolean;
}

interface LoginErrorResponse {
  error: string;
  type: 'VALIDATION_ERROR' | 'INVALID_CREDENTIALS' | 'EMAIL_NOT_VERIFIED' | 'INTERNAL_ERROR' | 'DATABASE_ERROR';
  correlationId: string;
  retryable?: boolean;
}

type LoginResponse = LoginSuccessResponse | LoginErrorResponse;

async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  const data: LoginResponse = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error);
  }
  
  return data;
}

// Usage with retry
async function loginWithRetry(credentials: LoginRequest, maxRetries = 3): Promise<LoginResponse> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await login(credentials);
    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries;
      const isRetryable = error.retryable === true;
      
      if (isLastAttempt || !isRetryable) {
        throw error;
      }
      
      // Exponential backoff
      const delay = Math.min(100 * Math.pow(2, attempt - 1), 2000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
}
```

### React Hook

```typescript
import { useState } from 'react';

interface UseLoginResult {
  login: (email: string, password: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  emailVerified: boolean | null;
}

export function useLogin(): UseLoginResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setEmailVerified(data.emailVerified);
      
      // Continue with NextAuth sign in
      // ...
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading, error, emailVerified };
}
```

## Security Considerations

### 1. Timing Attack Prevention

The API uses constant-time responses to prevent timing attacks that could reveal whether an email exists in the database.

### 2. Rate Limiting

Aggressive rate limiting (10 req/min) prevents brute force attacks.

### 3. No Password Validation

This endpoint does NOT validate passwords. Password validation is handled by NextAuth.js to prevent information leakage.

### 4. Error Message Consistency

Generic error messages ("Invalid email or password") prevent user enumeration attacks.

### 5. Correlation IDs

All requests include correlation IDs for security audit trails.

## Monitoring

### Metrics

- Request count by status code
- Response time (p50, p95, p99)
- Error rate by type
- Retry attempts
- Database query duration

### Logs

All requests are logged with:
- Correlation ID
- User email (hashed in production)
- Request duration
- Error details (if any)
- Retry attempts

### Alerts

- Error rate > 5%
- Response time p95 > 1000ms
- Database connection failures
- Rate limit exceeded (potential attack)

## Testing

### Unit Tests

```bash
npm run test tests/unit/api/auth-login.test.ts
```

### Integration Tests

```bash
npm run test:integration tests/integration/auth/login-flow.integration.test.ts
```

### Load Tests

```bash
npm run test:load -- --endpoint /api/auth/login
```

## Related Documentation

- [NextAuth Configuration](../../lib/auth/config.ts)
- [Authentication Flow](../AUTH_FLOW.md)
- [API Authentication](./README.md#authentication)
- [Error Handling Guide](../ERROR_HANDLING_GUIDE.md)

## Changelog

### Version 1.1 (2025-01-16)
- Added retry logic with exponential backoff
- Added TypeScript types for request/response
- Improved error handling and logging
- Added correlation IDs
- Added performance metrics headers

### Version 1.0 (2024-11-16)
- Initial implementation
- Email verification check
- Basic error handling

---

**Last Updated**: January 16, 2025  
**Version**: 1.1  
**Status**: ✅ Production Ready
