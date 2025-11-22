# Login API

## Endpoint

```
POST /api/auth/login
```

## Description

Pre-authentication check for user login. Validates credentials and email verification status before allowing login through NextAuth.js.

## Authentication

**Required**: No (this is the login endpoint)

## Rate Limiting

10 requests per minute per IP address

## Request

### Headers

```
Content-Type: application/json
```

### Request Body

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Fields:**
- `email` (string, required): User email address (valid email format)
- `password` (string, required): User password (minimum 1 character)

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Fields:**
- `success` (boolean): Always `true` for successful responses
- `message` (string): Success message
- `user` (object): User information
  - `id` (number): User ID
  - `email` (string): User email
  - `name` (string | null): User display name

### Error Responses

#### 400 Bad Request - Validation Error

```json
{
  "error": "Invalid email format",
  "type": "VALIDATION_ERROR",
  "correlationId": "login-1234567890-abc123",
  "retryable": false
}
```

**Cause**: Invalid request body (missing fields, invalid email format)

**Action**: Fix request body and retry

#### 401 Unauthorized - Invalid Credentials

```json
{
  "error": "Invalid email or password",
  "type": "INVALID_CREDENTIALS",
  "correlationId": "login-1234567890-abc123",
  "retryable": false
}
```

**Cause**: User doesn't exist or password is incorrect

**Action**: Check credentials and retry

#### 403 Forbidden - Email Not Verified (Optional)

```json
{
  "error": "Please verify your email before logging in",
  "type": "EMAIL_NOT_VERIFIED",
  "correlationId": "login-1234567890-abc123",
  "retryable": false
}
```

**Cause**: User email is not verified

**Action**: Verify email before attempting login

**Note**: Currently disabled - users can login with unverified email

#### 500 Internal Server Error

```json
{
  "error": "An unexpected error occurred. Please try again.",
  "type": "INTERNAL_ERROR",
  "correlationId": "login-1234567890-abc123",
  "retryable": true
}
```

**Cause**: Unexpected server error

**Action**: Retry the request

#### 503 Service Unavailable

```json
{
  "error": "Service temporarily unavailable. Please try again.",
  "type": "DATABASE_ERROR",
  "correlationId": "login-1234567890-abc123",
  "retryable": true
}
```

**Cause**: Database connection issues or timeout

**Action**: Retry after delay (see `Retry-After` header)

**Headers:**
- `Retry-After: 60` - Retry after 60 seconds

## Response Headers

All responses include:

- `X-Correlation-Id`: Unique request identifier for debugging
- `X-Duration-Ms`: Request processing time in milliseconds (success only)

Success responses also set:
- `Set-Cookie`: CSRF token cookie for subsequent requests

## Features

### 1. Automatic Retry Logic

The API implements exponential backoff retry for transient database errors:

- **Max Retries**: 3 attempts
- **Initial Delay**: 100ms
- **Max Delay**: 2000ms
- **Backoff Factor**: 2x

**Retryable Errors:**
- Database connection timeouts
- Network errors (ECONNREFUSED, ETIMEDOUT, etc.)

### 2. Structured Error Handling

All errors include:
- User-friendly error message
- Error type for client-side handling
- Correlation ID for tracking
- Retryable flag indicating if retry is recommended

### 3. Security Features

- **Password Hashing**: bcrypt with 12 rounds
- **Timing Attack Protection**: Same response time for invalid user/password
- **CSRF Protection**: CSRF token set on successful login
- **Secure Cookies**: httpOnly, secure, sameSite cookies (via NextAuth)
- **Rate Limiting**: 10 requests per minute per IP

### 4. Performance Monitoring

Each request is logged with:
- Correlation ID
- User ID (on success)
- Duration
- Error details (if applicable)

### 5. Email Verification Check

Currently logs unverified email logins but allows them. Can be enforced by uncommenting the verification check in the code.

## Client-Side Integration

### React Component with Error Handling

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface LoginFormData {
  email: string;
  password: string;
}

export function LoginForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle different error types
        switch (data.type) {
          case 'VALIDATION_ERROR':
            setError(data.error);
            break;
          case 'INVALID_CREDENTIALS':
            setError('Invalid email or password');
            break;
          case 'EMAIL_NOT_VERIFIED':
            setError('Please verify your email first');
            break;
          case 'DATABASE_ERROR':
          case 'INTERNAL_ERROR':
            setError('Service temporarily unavailable. Please try again.');
            break;
          default:
            setError('An error occurred. Please try again.');
        }
        return;
      }

      // Success - redirect to home
      router.push('/home');
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="Email"
        required
      />
      
      <input
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        placeholder="Password"
        required
      />
      
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

### Fetch with Retry (Client-Side)

```typescript
async function loginWithRetry(
  email: string,
  password: string,
  maxRetries = 3
): Promise<{ success: boolean; user?: any; error?: string }> {
  const baseDelay = 1000;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if error is retryable
        const isRetryable = data.retryable === true;
        
        if (isRetryable && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        return { success: false, error: data.error };
      }

      return { success: true, user: data.user };
    } catch (error) {
      if (attempt === maxRetries) {
        return { success: false, error: 'Network error' };
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return { success: false, error: 'Max retries exceeded' };
}
```

## Logging

All requests are logged with structured JSON format:

```json
{
  "correlationId": "login-1234567890-abc123",
  "timestamp": "2024-11-18T10:30:00.000Z",
  "service": "auth-login",
  "level": "info",
  "message": "Login successful",
  "metadata": {
    "userId": 123,
    "emailVerified": true,
    "duration": 145
  }
}
```

## Security Considerations

### Password Security
- Passwords are hashed with bcrypt (12 rounds)
- Never logged or exposed in responses
- Compared using constant-time comparison

### Timing Attack Protection
- Same response time for invalid user vs invalid password
- Generic error message: "Invalid email or password"

### Rate Limiting
- 10 requests per minute per IP
- Prevents brute force attacks
- Returns 429 Too Many Requests when exceeded

### CSRF Protection
- CSRF token set on successful login
- Required for subsequent authenticated requests
- Prevents cross-site request forgery

### Session Security
- Secure, httpOnly cookies (via NextAuth)
- SameSite=Lax for CSRF protection
- Automatic session expiration

## Testing

See test files:
- Integration tests: `tests/integration/api/auth-login.integration.test.ts`
- Unit tests: Coming in Phase 10

## Requirements Mapping

- **4.5**: User login with email and password
- **16.4**: Secure authentication with bcrypt

## Troubleshooting

### Issue: 503 Service Unavailable

**Possible Causes:**
1. Database connection pool exhausted
2. Database server timeout
3. Network issues

**Solutions:**
1. Check database connection pool settings
2. Verify database server is running
3. Check network connectivity
4. Review logs for correlation ID

### Issue: Login fails but credentials are correct

**Possible Causes:**
1. Email case sensitivity mismatch
2. Password encoding issues
3. Database query error

**Solutions:**
1. Verify email is stored in lowercase
2. Check password encoding (UTF-8)
3. Check database logs

### Issue: Slow response times

**Possible Causes:**
1. Database query performance
2. bcrypt hashing overhead
3. Network latency

**Solutions:**
1. Add database indexes (already present)
2. Consider bcrypt work factor (currently 12)
3. Scale database resources

## Related Documentation

- [Registration API](../register/README.md)
- [NextAuth Configuration](../../../../lib/auth/config.ts)
- [CSRF Protection](../../../../lib/middleware/csrf.README.md)
- [Integration Tests](../../../../tests/integration/api/auth-login.integration.test.ts)

## Changelog

### v1.0.0 (2024-11-19)
- ✨ Initial implementation
- ✅ Automatic retry with exponential backoff
- ✅ Structured error handling with error types
- ✅ Zod validation for request body
- ✅ Performance monitoring with correlation IDs
- ✅ CSRF token generation on login
- ✅ Comprehensive documentation
- ✅ Security best practices (timing attack protection, rate limiting)

---

**Status**: ✅ Production Ready
