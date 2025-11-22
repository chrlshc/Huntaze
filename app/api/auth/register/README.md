# User Registration API

## Endpoint

```
POST /api/auth/register
```

## Description

Creates a new user account with email and password. Includes comprehensive validation, CSRF protection, automatic retry logic, and structured error handling.

## Authentication

**Required**: No (public endpoint)

## Rate Limiting

10 requests per 15 minutes per IP address

## Request

### Headers

```
Content-Type: application/json
X-CSRF-Token: <token> (required)
```

### Request Body

```json
{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "name": "John Doe" // optional
}
```

**Fields:**
- `email` (string, required): Valid email address
- `password` (string, required): Minimum 8 characters, must contain uppercase, lowercase, and numbers
- `name` (string, optional): User's display name

## Response

### Success Response (201 Created)

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "123",
      "email": "john@example.com",
      "name": "John Doe"
    }
  },
  "message": "Account created successfully",
  "duration": 245
}
```

**Fields:**
- `success` (boolean): Always `true` for successful responses
- `data.user` (object): Created user data
  - `id` (string): User ID
  - `email` (string): User email (lowercase)
  - `name` (string | null): User display name
- `message` (string): Success message
- `duration` (number): Request processing time in milliseconds

### Error Responses

#### 400 Bad Request - Missing Email

```json
{
  "success": false,
  "error": "Email is required",
  "code": "MISSING_EMAIL",
  "correlationId": "register-1234567890-abc123",
  "retryable": false
}
```

#### 400 Bad Request - Invalid Email

```json
{
  "success": false,
  "error": "Invalid email format",
  "code": "INVALID_EMAIL",
  "correlationId": "register-1234567890-abc123",
  "retryable": false
}
```

#### 400 Bad Request - Weak Password

```json
{
  "success": false,
  "error": "Password must be at least 8 characters",
  "code": "WEAK_PASSWORD",
  "correlationId": "register-1234567890-abc123",
  "retryable": false
}
```

#### 403 Forbidden - CSRF Error

```json
{
  "success": false,
  "error": "CSRF token is missing",
  "code": "CSRF_ERROR",
  "correlationId": "register-1234567890-abc123",
  "retryable": false
}
```

**Cause**: Missing or invalid CSRF token

**Action**: Get a new CSRF token from `/api/csrf/token`

#### 409 Conflict - User Exists

```json
{
  "success": false,
  "error": "An account with this email already exists",
  "code": "USER_EXISTS",
  "correlationId": "register-1234567890-abc123",
  "retryable": false
}
```

**Cause**: Email already registered

**Action**: User should log in or use password reset

#### 500 Internal Server Error

```json
{
  "success": false,
  "error": "An unexpected error occurred. Please try again.",
  "code": "INTERNAL_ERROR",
  "correlationId": "register-1234567890-abc123",
  "retryable": true
}
```

**Cause**: Unexpected server error

**Action**: Retry the request

#### 503 Service Unavailable

```json
{
  "success": false,
  "error": "Service temporarily unavailable. Please try again.",
  "code": "DATABASE_ERROR",
  "correlationId": "register-1234567890-abc123",
  "retryable": true
}
```

**Cause**: Database connection issues

**Action**: Retry after delay (see `Retry-After` header)

**Headers:**
- `Retry-After: 60` - Retry after 60 seconds

#### 504 Gateway Timeout

```json
{
  "success": false,
  "error": "Request timed out. Please try again.",
  "code": "TIMEOUT_ERROR",
  "correlationId": "register-1234567890-abc123",
  "retryable": true
}
```

**Cause**: Request exceeded 30 second timeout

**Action**: Retry the request

## Response Headers

All responses include:

- `X-Correlation-Id`: Unique request identifier for debugging
- `X-Duration-Ms`: Request processing time in milliseconds (success only)
- `Cache-Control`: Caching policy
- `Set-Cookie`: New CSRF token (success only)

## Features

### 1. CSRF Protection

All registration requests must include a valid CSRF token in the `X-CSRF-Token` header.

**Get CSRF Token:**
```typescript
const response = await fetch('/api/csrf/token');
const { token } = await response.json();
```

### 2. Automatic Retry Logic

The API implements exponential backoff retry for transient database errors:

- **Max Retries**: 3 attempts
- **Initial Delay**: 100ms
- **Max Delay**: 2000ms
- **Backoff Factor**: 2x

**Retryable Errors:**
- Database connection timeouts
- Transaction conflicts
- Network errors

### 3. Password Security

Passwords are hashed using bcrypt with 12 rounds before storage.

**Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

### 4. Email Normalization

Email addresses are automatically converted to lowercase before storage to prevent duplicate accounts.

### 5. Structured Error Handling

All errors include:
- User-friendly error message
- Error code for programmatic handling
- Correlation ID for tracking
- Retryable flag indicating if retry is recommended

### 6. Performance Monitoring

Each request is logged with:
- Correlation ID
- Email (without password)
- Duration
- Client IP and User Agent
- Error details (if applicable)

## Client-Side Integration

### React Component with CSRF

```typescript
'use client';

import { useState } from 'react';

export function RegisterForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Get CSRF token
      const csrfResponse = await fetch('/api/csrf/token');
      const { token } = await csrfResponse.json();

      // Register user
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': token,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error);
        return;
      }

      // Registration successful
      console.log('User created:', data.data.user);
      // Redirect to login or onboarding
      window.location.href = '/auth/login';
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
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
        minLength={8}
      />
      
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Name (optional)"
      />
      
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating Account...' : 'Create Account'}
      </button>
    </form>
  );
}
```

### Fetch with Retry (Client-Side)

```typescript
async function registerWithRetry(
  email: string,
  password: string,
  name?: string,
  maxRetries = 3
) {
  const baseDelay = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Get CSRF token
      const csrfResponse = await fetch('/api/csrf/token');
      const { token } = await csrfResponse.json();

      // Register
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': token,
        },
        body: JSON.stringify({ email, password, name }),
        signal: AbortSignal.timeout(30000), // 30s timeout
      });

      const data = await response.json();

      if (!data.success) {
        // Check if error is retryable
        if (data.retryable && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        throw new Error(data.error);
      }

      return data.data.user;
    } catch (error) {
      if (attempt === maxRetries) throw error;

      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
```

## Security

- **Password Hashing**: bcrypt with 12 rounds
- **CSRF Protection**: Required for all requests
- **Email Normalization**: Lowercase to prevent duplicates
- **Rate Limiting**: 10 requests per 15 minutes per IP
- **Input Validation**: Email format and password strength
- **Secure Headers**: Applied via middleware
- **No Sensitive Data in Logs**: Passwords never logged

## Performance

- **Target Response Time**: < 500ms (p95)
- **Timeout**: 30 seconds
- **Database Queries**: 2-3 queries per request
  - Check existing user
  - Create user
  - (Retry logic if needed)

## Testing

See test files:
- Integration tests: `tests/integration/api/auth-register.integration.test.ts`
- Property tests: Coming in Phase 10

## Requirements Mapping

- **3.1**: User registration with email and password
- **3.2**: Email and password validation
- **16.1**: Password hashing with bcrypt
- **16.5**: CSRF protection

## Troubleshooting

### Issue: 403 CSRF Error

**Possible Causes:**
1. Missing CSRF token
2. Invalid CSRF token
3. Expired CSRF token

**Solutions:**
1. Get a new CSRF token from `/api/csrf/token`
2. Include token in `X-CSRF-Token` header
3. Ensure token is fresh (< 1 hour old)

### Issue: 409 User Exists

**Possible Causes:**
1. Email already registered
2. Race condition (multiple simultaneous registrations)

**Solutions:**
1. User should log in instead
2. Use password reset if forgotten
3. Check for typos in email

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

## Related Documentation

- [Login API](../login/README.md)
- [CSRF Token API](../../csrf/token/README.md)
- [Authentication Guide](../../../../docs/api/auth.md)
- [User Model](../../../../prisma/schema.prisma)

## Changelog

### v1.0.0 (2024-11-19)
- ✨ Complete rewrite with optimizations
- ✅ Automatic retry with exponential backoff
- ✅ Structured error handling
- ✅ CSRF protection
- ✅ Performance monitoring
- ✅ Correlation ID tracking
- ✅ Comprehensive validation
- ✅ TypeScript types
- ✅ Comprehensive documentation

---

**Status**: ✅ Production Ready  
**Last Updated**: 2024-11-19
