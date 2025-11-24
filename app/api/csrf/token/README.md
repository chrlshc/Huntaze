# CSRF Token API

## Endpoint

```
GET /api/csrf/token
```

## Description

Generates and returns a new CSRF (Cross-Site Request Forgery) token for the current authenticated session. This token must be included in all state-changing requests (POST, PUT, DELETE, PATCH) to protect against CSRF attacks.

The token is automatically set as an HTTP-only cookie and also returned in the response body for manual inclusion in request headers.

## Authentication

**Required**: Yes (NextAuth session)

## Rate Limiting

None (read-only endpoint)

## Request

### Headers

```
Content-Type: application/json
```

### Query Parameters

None

### Request Body

None (GET request)

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "token": "1234567890:abc123def456ghi789:jkl012mno345pqr678",
    "expiresIn": 3600000
  },
  "meta": {
    "timestamp": "2024-11-19T10:30:00.000Z",
    "requestId": "req_1234567890_abc123",
    "duration": 45
  }
}
```

**Fields:**
- `success` (boolean): Always `true` for successful responses
- `data` (object): Token data
  - `token` (string): CSRF token to include in requests
  - `expiresIn` (number): Token expiration time in milliseconds (1 hour)
- `meta` (object): Response metadata
  - `timestamp` (string): ISO 8601 timestamp
  - `requestId` (string): Unique request identifier for tracing
  - `duration` (number): Request processing time in milliseconds

### Error Responses

#### 401 Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required to generate CSRF token",
    "retryable": false
  },
  "meta": {
    "timestamp": "2024-11-19T10:30:00.000Z",
    "requestId": "csrf-1234567890-abc123",
    "duration": 12
  }
}
```

**Cause**: No valid session found

**Action**: User needs to log in

#### 500 Internal Server Error

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred. Please try again.",
    "retryable": true,
    "retryAfter": 5
  },
  "meta": {
    "timestamp": "2024-11-19T10:30:00.000Z",
    "requestId": "csrf-1234567890-abc123",
    "duration": 234
  }
}
```

**Cause**: Token generation failed or session retrieval error

**Action**: Retry the request after delay

**Headers:**
- `Retry-After: 5` - Retry after 5 seconds

## Response Headers

All responses include:

- `X-Correlation-Id`: Unique request identifier for debugging
- `X-Duration-Ms`: Request processing time in milliseconds (success only)
- `Cache-Control`: `private, no-cache, no-store, must-revalidate`
- `Set-Cookie`: `csrf-token` (HTTP-only, Secure, SameSite=Strict)

## Features

### 1. Automatic Retry Logic

The API implements exponential backoff retry for transient errors:

- **Max Retries**: 3 attempts
- **Initial Delay**: 100ms
- **Max Delay**: 2000ms
- **Backoff Factor**: 2x

**Retryable Errors:**
- Session retrieval failures
- Network errors
- JWT errors

### 2. Dual Token Delivery

The CSRF token is delivered in two ways:

1. **HTTP-Only Cookie**: Automatically included in subsequent requests
2. **Response Body**: For manual inclusion in request headers

This dual approach provides flexibility for different client implementations.

### 3. Token Security

- **Format**: `timestamp:signature:random`
- **Expiration**: 1 hour (3600000ms)
- **Cookie Attributes**:
  - `HttpOnly`: Prevents JavaScript access
  - `Secure`: HTTPS only (production)
  - `SameSite=Strict`: Prevents cross-site requests
  - `Path=/`: Available for all routes

### 4. Performance Monitoring

Each request is logged with:
- Correlation ID
- User ID
- Token length
- Duration
- Error details (if applicable)

## Client-Side Integration

### React Hook (Recommended)

```typescript
'use client';

import { useState, useEffect } from 'react';

interface CsrfToken {
  token: string;
  expiresIn: number;
}

export function useCsrfToken() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchToken() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/csrf/token', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch CSRF token');
        }

        const data = await response.json();
        
        if (data.success && data.data?.token) {
          setToken(data.data.token);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    fetchToken();
  }, []);

  return { token, isLoading, error };
}
```

### Using the Token in Requests

```typescript
import { useCsrfToken } from '@/hooks/useCsrfToken';

export function MyComponent() {
  const { token, isLoading, error } = useCsrfToken();

  async function handleSubmit(data: any) {
    if (!token) {
      console.error('CSRF token not available');
      return;
    }

    const response = await fetch('/api/some-endpoint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': token,
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    // Handle response...
  }

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <form onSubmit={handleSubmit}>{/* Form fields */}</form>;
}
```

### Fetch with Retry (Client-Side)

```typescript
async function fetchCsrfTokenWithRetry(maxRetries = 3): Promise<string> {
  const baseDelay = 1000;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('/api/csrf/token', {
        credentials: 'include',
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        const isRetryable = response.status >= 500;
        
        if (isRetryable && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data?.token) {
        return data.data.token;
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Failed to fetch CSRF token after retries');
}
```

### Server-Side Usage (API Routes)

```typescript
import { NextRequest } from 'next/server';
import { validateCsrfToken } from '@/lib/middleware/csrf';

export async function POST(request: NextRequest) {
  // Validate CSRF token
  const validation = await validateCsrfToken(request);
  
  if (!validation.valid) {
    return Response.json(
      { error: validation.error },
      { status: 403 }
    );
  }

  // Process request...
}
```

## Token Lifecycle

### 1. Token Generation

```
Client Request → Authentication Check → Generate Token → Set Cookie → Return Token
```

### 2. Token Usage

```
Client Request → Include Token (Header or Cookie) → Server Validates → Process Request
```

### 3. Token Expiration

- **Expiry Time**: 1 hour from generation
- **Automatic Refresh**: Client should fetch new token before expiry
- **Validation**: Server checks timestamp and signature

## Security Considerations

### 1. Token Format

The token consists of three parts separated by colons:

```
timestamp:signature:random
```

- **Timestamp**: Unix timestamp in milliseconds
- **Signature**: HMAC-SHA256 signature
- **Random**: Cryptographically secure random bytes

### 2. Validation Process

Server validates:
1. Token format (3 parts)
2. Timestamp (not expired)
3. Signature (matches expected value)

### 3. Cookie Security

- **HttpOnly**: Prevents XSS attacks
- **Secure**: HTTPS only in production
- **SameSite=Strict**: Prevents CSRF attacks
- **Path=/**: Available for all routes

### 4. Best Practices

- ✅ Always fetch token on page load
- ✅ Include token in all state-changing requests
- ✅ Refresh token before expiry
- ✅ Handle token validation errors gracefully
- ✅ Never expose token in URLs or logs

## Logging

All requests are logged with structured JSON format:

```json
{
  "correlationId": "csrf-1234567890-abc123",
  "timestamp": "2024-11-19T10:30:00.000Z",
  "service": "csrf-token-api",
  "level": "info",
  "message": "CSRF token generated successfully",
  "metadata": {
    "userId": "123",
    "tokenLength": 64,
    "duration": 45
  }
}
```

## Performance

- **Target Response Time**: < 100ms (p95)
- **Timeout**: 10 seconds (client-side recommended)
- **Token Generation**: < 10ms
- **Session Retrieval**: < 50ms

## Testing

### Manual Testing

```bash
# Fetch CSRF token (requires authentication)
curl -X GET http://localhost:3000/api/csrf/token \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -v

# Response includes Set-Cookie header with csrf-token
```

### Integration Tests

See test files:
- `tests/integration/api/csrf-token.integration.test.ts`

## Requirements Mapping

- **16.5**: CSRF protection for all state-changing requests

## Troubleshooting

### Issue: 401 Unauthorized

**Possible Causes:**
1. User not logged in
2. Session expired
3. Invalid session token

**Solutions:**
1. Redirect to login page
2. Refresh session
3. Clear cookies and re-authenticate

### Issue: Token validation fails

**Possible Causes:**
1. Token expired (> 1 hour old)
2. Token signature invalid
3. Token format incorrect

**Solutions:**
1. Fetch new token
2. Check server secret configuration
3. Verify token format

### Issue: Slow response times

**Possible Causes:**
1. Session retrieval slow
2. Network latency
3. High concurrent requests

**Solutions:**
1. Check database performance
2. Implement connection pooling
3. Add caching for session data

## Related Documentation

- [CSRF Middleware](../../../lib/middleware/csrf.README.md)
- [CSRF Client Utilities](../../../lib/utils/csrf-client.ts)
- [Authentication](../../../lib/auth/README.md)
- [API Response Utilities](../../../lib/api/utils/response.ts)

## Changelog

### v1.0.0 (2024-11-19)
- ✨ Initial implementation
- ✅ Automatic retry with exponential backoff
- ✅ Structured error handling
- ✅ Performance monitoring
- ✅ Correlation ID tracking
- ✅ Dual token delivery (cookie + body)
- ✅ Comprehensive documentation
- ✅ TypeScript types
- ✅ Security best practices

## Support

For issues or questions:
1. Check this README
2. Review CSRF middleware documentation
3. Check correlation ID in logs
4. Contact development team

---

**Version**: 1.0.0  
**Status**: ✅ Production Ready  
**Last Updated**: 2024-11-19
