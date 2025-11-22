# Logout API

## Endpoint

```
POST /api/auth/logout
```

## Description

Logs out the current user by clearing session cookies and invalidating user cache. Includes CSRF protection and comprehensive error handling.

## Authentication

**Required**: Yes (Bearer token or session cookie)

## CSRF Protection

**Required**: Yes (X-CSRF-Token header in production)

**Skipped**: In test environment (NODE_ENV=test)

## Request

### Headers

```
Content-Type: application/json
X-CSRF-Token: <csrf-token>
Authorization: Bearer <token> (optional, for test mode)
```

### Query Parameters

None

### Request Body

None (POST request with no body)

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Successfully logged out"
}
```

**Fields:**
- `success` (boolean): Always `true` for successful responses
- `message` (string): Success message

**Headers:**
- `X-Correlation-Id`: Unique request identifier
- `Set-Cookie`: Cleared auth cookies (access_token, auth_token, refresh_token, session)

### Error Responses

#### 401 Unauthorized

```json
{
  "success": false,
  "error": "Authentication required",
  "code": "UNAUTHORIZED",
  "correlationId": "logout-1234567890-abc123",
  "retryable": false
}
```

**Cause**: No valid session or authentication token

**Action**: User needs to be logged in to log out (edge case)

#### 403 Forbidden (CSRF Error)

```json
{
  "success": false,
  "error": "CSRF token is required",
  "code": "CSRF_ERROR",
  "correlationId": "logout-1234567890-abc123"
}
```

**Cause**: Missing or invalid CSRF token

**Action**: Obtain a valid CSRF token from `/api/csrf/token`

#### 500 Internal Server Error

```json
{
  "success": false,
  "error": "An unexpected error occurred during logout",
  "code": "INTERNAL_ERROR",
  "correlationId": "logout-1234567890-abc123",
  "retryable": true
}
```

**Cause**: Unexpected server error

**Action**: Retry the request

## Response Headers

All responses include:

- `X-Correlation-Id`: Unique request identifier for debugging

## Features

### 1. CSRF Protection

The API validates CSRF tokens to prevent cross-site request forgery attacks:

- **Production**: CSRF token required in `X-CSRF-Token` header
- **Test Environment**: CSRF validation skipped for easier testing

### 2. Cache Invalidation

On successful logout, the following cache entries are invalidated:

- `user:{userId}` - User profile data
- `user:session:{userId}` - User session data
- `integrations:status:{userId}` - Integration status

### 3. Cookie Clearing

All authentication cookies are cleared with `maxAge: 0`:

- `access_token`
- `auth_token`
- `refresh_token`
- `session`

### 4. Structured Logging

All requests are logged with:
- Correlation ID
- User ID
- Duration
- Error details (if applicable)

## Client-Side Integration

### React Component with Hook

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { logoutUser } from '@/app/api/auth/logout/client';
import { useCsrfToken } from '@/hooks/useCsrfToken';

export function LogoutButton() {
  const router = useRouter();
  const { token: csrfToken } = useCsrfToken();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    if (!csrfToken) {
      setError('CSRF token not available');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await logoutUser(csrfToken);

      if (result.success) {
        // Clear any client-side state
        localStorage.clear();
        sessionStorage.clear();

        // Redirect to login page
        router.push('/auth');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to logout. Please try again.');
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleLogout}
        disabled={isLoading}
        className="btn-secondary"
      >
        {isLoading ? 'Logging out...' : 'Logout'}
      </button>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
```

### Direct Fetch (No Retry)

```typescript
async function logout(csrfToken: string) {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      credentials: 'include',
    });

    const data = await response.json();

    if (data.success) {
      // Clear client-side state
      localStorage.clear();
      
      // Redirect to login
      window.location.href = '/auth';
    } else {
      console.error('Logout failed:', data.error);
    }
  } catch (error) {
    console.error('Logout error:', error);
  }
}
```

### With Automatic Retry

```typescript
import { logoutUser } from '@/app/api/auth/logout/client';

async function handleLogout(csrfToken: string) {
  try {
    const result = await logoutUser(csrfToken, {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 5000,
    });

    if (result.success) {
      console.log('Logged out successfully');
      window.location.href = '/auth';
    } else {
      console.error('Logout failed:', result.error);
    }
  } catch (error) {
    console.error('Logout failed after retries:', error);
  }
}
```

## Logging

All requests are logged with structured JSON format:

```json
{
  "correlationId": "logout-1234567890-abc123",
  "timestamp": "2024-11-20T10:30:00.000Z",
  "service": "auth-logout-api",
  "level": "info",
  "message": "Logout completed successfully",
  "metadata": {
    "userId": "123",
    "duration": 45
  }
}
```

## Security

- **CSRF Protection**: Required in production (X-CSRF-Token header)
- **Cookie Security**: HttpOnly, Secure (in production), SameSite=Lax
- **Cache Invalidation**: User cache cleared on logout
- **Correlation IDs**: All requests tracked for debugging

## Testing

### Unit Tests

```typescript
import { logoutUser } from '@/app/api/auth/logout/client';

describe('Logout Client', () => {
  it('should logout successfully', async () => {
    const result = await logoutUser('valid-csrf-token');
    expect(result.success).toBe(true);
  });

  it('should handle CSRF errors', async () => {
    const result = await logoutUser('invalid-csrf-token');
    expect(result.success).toBe(false);
    expect(result.code).toBe('CSRF_ERROR');
  });
});
```

### Integration Tests

See: `tests/integration/api/auth-logout.integration.test.ts`

## Requirements Mapping

- **3.1**: User authentication and session management
- **3.2**: Secure logout with cookie clearing
- **16.5**: CSRF protection for state-changing operations

## Troubleshooting

### Issue: CSRF validation failed

**Possible Causes:**
1. Missing CSRF token
2. Expired CSRF token
3. Invalid CSRF token format

**Solutions:**
1. Fetch a new CSRF token from `/api/csrf/token`
2. Ensure token is included in `X-CSRF-Token` header
3. Check that token hasn't expired (1 hour TTL)

### Issue: Logout succeeds but user still appears logged in

**Possible Causes:**
1. Client-side state not cleared
2. Browser cache issues
3. Multiple tabs with cached sessions

**Solutions:**
1. Clear localStorage and sessionStorage after logout
2. Force page reload after logout
3. Implement proper session synchronization across tabs

### Issue: Cookies not being cleared

**Possible Causes:**
1. Cookie domain mismatch
2. Cookie path mismatch
3. Browser security settings

**Solutions:**
1. Verify cookie domain matches application domain
2. Ensure cookie path is set to '/'
3. Check browser security settings

## Related Documentation

- [Login API](../login/README.md)
- [Register API](../register/README.md)
- [CSRF Token API](../../csrf/token/README.md)
- [Authentication Middleware](../../../../lib/api/middleware/auth.ts)
- [CSRF Middleware](../../../../lib/middleware/csrf.ts)

## Changelog

### v1.0.0 (2024-11-20)
- ✨ Initial implementation
- ✅ CSRF protection
- ✅ Cache invalidation
- ✅ Cookie clearing
- ✅ Structured error handling
- ✅ Correlation ID tracking
- ✅ Comprehensive documentation
- ✅ Client-side utilities with retry logic
