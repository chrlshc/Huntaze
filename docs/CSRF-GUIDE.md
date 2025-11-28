# CSRF Protection Guide

Complete guide for CSRF (Cross-Site Request Forgery) protection implementation and troubleshooting.

## Overview

The application uses CSRF tokens to protect against cross-site request forgery attacks. This guide covers the implementation, common issues, and solutions.

## How It Works

### 1. Token Generation
- Client requests a CSRF token from `/api/csrf/token`
- Server generates a unique token and stores it in a cookie
- Token is returned to the client in the response

### 2. Token Validation
- Client includes the token in request headers (`x-csrf-token`)
- Server validates the token matches the cookie value
- Request is processed if validation succeeds

### 3. Token Lifecycle
- Tokens expire after 1 hour
- Tokens are regenerated on each request to `/api/csrf/token`
- Cookies are HttpOnly and Secure in production

## Implementation

### Client-Side (React Hook)

```typescript
// hooks/useCsrfToken.ts
import { useState, useEffect } from 'react';

export function useCsrfToken() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/csrf/token')
      .then(res => res.json())
      .then(data => {
        setToken(data.data.token);
        setLoading(false);
      });
  }, []);

  return { token, loading };
}
```

### Server-Side (Middleware)

```typescript
// lib/middleware/csrf.ts
import { cookies } from 'next/headers';

export function validateCsrfToken(request: Request): boolean {
  const headerToken = request.headers.get('x-csrf-token');
  const cookieStore = cookies();
  const cookieToken = cookieStore.get('csrf-token')?.value;

  return headerToken === cookieToken && headerToken !== null;
}
```

### API Route Protection

```typescript
// app/api/auth/signup/email/route.ts
import { validateCsrfToken } from '@/lib/middleware/csrf';

export async function POST(request: Request) {
  if (!validateCsrfToken(request)) {
    return Response.json(
      { error: 'CSRF token is required' },
      { status: 403 }
    );
  }

  // Process request...
}
```

## Common Issues & Solutions

### Issue 1: "CSRF token is required"

**Symptoms:**
- Error appears when submitting forms
- Token is generated but not validated

**Causes:**
1. Token not included in request headers
2. Cookie not sent with request
3. Token/cookie mismatch

**Solutions:**

**A. Verify Token is Loaded**
```typescript
const { token, loading } = useCsrfToken();

if (loading) {
  return <LoadingSpinner />;
}

if (!token) {
  console.error('CSRF token not loaded');
  return <ErrorMessage />;
}
```

**B. Include Credentials in Fetch**
```typescript
fetch('/api/auth/signup/email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-csrf-token': token,
  },
  credentials: 'include', // Important!
  body: JSON.stringify(data),
});
```

**C. Check Cookie Domain**
```typescript
// lib/middleware/csrf.ts
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 3600,
  domain: hostname, // Use exact domain, not wildcard
};
```

### Issue 2: Cookie Not Set

**Symptoms:**
- No `csrf-token` cookie in DevTools
- Token generated but cookie missing

**Causes:**
1. SameSite policy blocking cookie
2. Domain mismatch (localhost vs 127.0.0.1)
3. Secure flag required in production

**Solutions:**

**A. Check Cookie Configuration**
```typescript
// For local development
const cookieOptions = {
  httpOnly: true,
  secure: false, // Allow HTTP in development
  sameSite: 'lax' as const,
  path: '/',
};

// For production
const cookieOptions = {
  httpOnly: true,
  secure: true, // Require HTTPS
  sameSite: 'lax' as const,
  path: '/',
  domain: 'staging.huntaze.com', // Exact domain
};
```

**B. Verify Domain Matches**
- Use exact domain, not wildcard (`.huntaze.com`)
- Match the domain in the browser address bar
- For localhost, omit domain entirely

### Issue 3: Token Expired

**Symptoms:**
- Error: "CSRF token has expired"
- Works initially, fails after time

**Causes:**
- Token older than 1 hour
- Page left open too long

**Solutions:**

**A. Refresh Token on Focus**
```typescript
useEffect(() => {
  const handleFocus = () => {
    fetch('/api/csrf/token')
      .then(res => res.json())
      .then(data => setToken(data.data.token));
  };

  window.addEventListener('focus', handleFocus);
  return () => window.removeEventListener('focus', handleFocus);
}, []);
```

**B. Show Expiration Warning**
```typescript
const [expiresAt, setExpiresAt] = useState<number>(0);

useEffect(() => {
  const timer = setTimeout(() => {
    alert('Session expired. Please refresh the page.');
  }, expiresAt - Date.now());

  return () => clearTimeout(timer);
}, [expiresAt]);
```

### Issue 4: Works Locally, Fails in Production

**Symptoms:**
- CSRF works on localhost
- Fails on staging/production

**Causes:**
1. HTTPS required in production
2. Domain configuration incorrect
3. Cookie not sent cross-origin

**Solutions:**

**A. Environment-Specific Configuration**
```typescript
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  path: '/',
  domain: process.env.NODE_ENV === 'production' 
    ? process.env.COOKIE_DOMAIN 
    : undefined,
};
```

**B. Verify Environment Variables**
```bash
# .env.production
COOKIE_DOMAIN=staging.huntaze.com
NEXTAUTH_URL=https://staging.huntaze.com
```

## Debugging

### 1. Check Token Generation

```bash
# Test token endpoint
curl http://localhost:3000/api/csrf/token

# Expected response:
{
  "success": true,
  "data": {
    "token": "1234567890:abc...:def...",
    "expiresIn": 3600000
  }
}
```

### 2. Inspect Cookies

**Browser DevTools:**
1. Open DevTools (F12)
2. Go to Application → Cookies
3. Look for `csrf-token` cookie
4. Verify domain, path, and expiration

### 3. Check Request Headers

**Browser DevTools:**
1. Open DevTools (F12)
2. Go to Network tab
3. Submit form
4. Click on POST request
5. Check Headers tab:
   - `x-csrf-token` header present
   - `Cookie` contains `csrf-token`

### 4. Enable Debug Logging

```typescript
// lib/middleware/csrf.ts
export function validateCsrfToken(request: Request): boolean {
  const headerToken = request.headers.get('x-csrf-token');
  const cookieToken = cookies().get('csrf-token')?.value;

  console.log('[CSRF DEBUG]', {
    hasHeaderToken: !!headerToken,
    hasCookieToken: !!cookieToken,
    tokensMatch: headerToken === cookieToken,
  });

  return headerToken === cookieToken && headerToken !== null;
}
```

### 5. Test with curl

```bash
# 1. Get token and save cookies
curl -c /tmp/cookies.txt \
  http://localhost:3000/api/csrf/token

# 2. Extract token from response
TOKEN=$(curl -s http://localhost:3000/api/csrf/token | jq -r '.data.token')

# 3. Make authenticated request
curl -b /tmp/cookies.txt \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: $TOKEN" \
  -X POST \
  -d '{"email":"test@example.com"}' \
  http://localhost:3000/api/auth/signup/email
```

## Temporary Bypass (Development Only)

For debugging purposes, you can temporarily disable CSRF validation:

### Environment Variable

```bash
# .env.local
CSRF_BYPASS=true
```

### Middleware Check

```typescript
export function validateCsrfToken(request: Request): boolean {
  if (process.env.CSRF_BYPASS === 'true') {
    console.warn('[CSRF] Validation bypassed - development only!');
    return true;
  }

  // Normal validation...
}
```

**⚠️ WARNING**: Never enable bypass in production!

## Security Best Practices

### 1. Cookie Configuration
- ✅ Use `HttpOnly` to prevent JavaScript access
- ✅ Use `Secure` in production (HTTPS only)
- ✅ Use `SameSite=Lax` or `Strict`
- ✅ Set appropriate `maxAge` (1 hour recommended)

### 2. Token Generation
- ✅ Use cryptographically secure random values
- ✅ Include timestamp for expiration
- ✅ Sign tokens to prevent tampering

### 3. Validation
- ✅ Validate on every state-changing request (POST, PUT, DELETE)
- ✅ Check both header and cookie
- ✅ Verify token hasn't expired
- ✅ Return 403 Forbidden on validation failure

### 4. Error Handling
- ✅ Don't expose internal details in error messages
- ✅ Log validation failures for monitoring
- ✅ Rate limit failed attempts

## Testing

### Unit Tests

```typescript
// __tests__/csrf.test.ts
import { validateCsrfToken } from '@/lib/middleware/csrf';

describe('CSRF Validation', () => {
  it('should validate matching tokens', () => {
    const request = new Request('http://localhost:3000/api/test', {
      method: 'POST',
      headers: {
        'x-csrf-token': 'test-token',
        'Cookie': 'csrf-token=test-token',
      },
    });

    expect(validateCsrfToken(request)).toBe(true);
  });

  it('should reject mismatched tokens', () => {
    const request = new Request('http://localhost:3000/api/test', {
      method: 'POST',
      headers: {
        'x-csrf-token': 'token-1',
        'Cookie': 'csrf-token=token-2',
      },
    });

    expect(validateCsrfToken(request)).toBe(false);
  });
});
```

### Integration Tests

```typescript
// __tests__/signup-flow.test.ts
describe('Signup Flow with CSRF', () => {
  it('should complete signup with valid CSRF token', async () => {
    // 1. Get CSRF token
    const tokenRes = await fetch('/api/csrf/token');
    const { data } = await tokenRes.json();

    // 2. Submit signup with token
    const signupRes = await fetch('/api/auth/signup/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': data.token,
      },
      credentials: 'include',
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    expect(signupRes.status).toBe(200);
  });
});
```

## Monitoring

### CloudWatch Logs

Monitor CSRF validation failures:

```typescript
import { logger } from '@/lib/logging/cloudwatch';

export function validateCsrfToken(request: Request): boolean {
  const isValid = /* validation logic */;

  if (!isValid) {
    logger.warn('CSRF validation failed', {
      path: request.url,
      hasHeader: !!request.headers.get('x-csrf-token'),
      hasCookie: !!cookies().get('csrf-token'),
    });
  }

  return isValid;
}
```

### Metrics

Track CSRF-related metrics:
- Token generation rate
- Validation success/failure rate
- Token expiration rate
- Bypass usage (should be 0 in production)

## Troubleshooting Checklist

- [ ] Token is generated successfully
- [ ] Cookie is set in browser
- [ ] Cookie domain matches current domain
- [ ] Token is included in request header
- [ ] Cookie is sent with request
- [ ] Token and cookie values match
- [ ] Token hasn't expired
- [ ] `credentials: 'include'` in fetch
- [ ] HTTPS in production
- [ ] No CORS issues

## References

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [MDN: Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie)
- [Next.js: Cookies](https://nextjs.org/docs/app/api-reference/functions/cookies)

---

**Last Updated**: November 27, 2025  
**Status**: ✅ Implemented and tested
