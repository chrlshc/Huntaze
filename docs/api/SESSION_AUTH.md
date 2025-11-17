# Session-Based Authentication API Reference

## Overview

All API endpoints in Huntaze now use NextAuth v5 session-based authentication. This document describes how to authenticate API requests and handle authentication errors.

## Authentication Method

### Session Cookies

Authentication is handled via HTTP-only session cookies automatically managed by NextAuth. No manual token management is required.

**Cookie Name**: `next-auth.session-token` (or `__Secure-next-auth.session-token` in production)

**Cookie Properties**:
- `HttpOnly`: true (not accessible via JavaScript)
- `Secure`: true (HTTPS only in production)
- `SameSite`: lax (CSRF protection)
- `Path`: /
- `Max-Age`: 2592000 (30 days) or 86400 (24 hours)

### No Authorization Header Required

Unlike the legacy system, you do NOT need to include an `Authorization` header. The session cookie is automatically included in requests.

## Making Authenticated Requests

### From Client Components

```typescript
// The session cookie is automatically included
const response = await fetch('/api/analytics/performance', {
  method: 'GET',
  credentials: 'include', // Important: include cookies
});

if (response.status === 401) {
  // User is not authenticated
  router.push('/auth');
  return;
}

const data = await response.json();
```

### From Server Components

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

export default async function Page() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth');
  }
  
  // Make API request with session context
  const data = await fetchData(session.user.id);
  
  return <div>{/* Render data */}</div>;
}
```

### From External Clients

For external API clients (mobile apps, third-party integrations), you'll need to:

1. Obtain a session by calling the login endpoint
2. Store the session cookie
3. Include the cookie in subsequent requests

```bash
# Login and get session cookie
curl -X POST https://huntaze.com/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  -c cookies.txt

# Use session cookie for authenticated requests
curl https://huntaze.com/api/analytics/performance \
  -b cookies.txt
```

## Protected Endpoints

### All Protected Endpoints

All endpoints under these paths require authentication:

- `/api/analytics/*` - Analytics data
- `/api/onlyfans/*` - OnlyFans integration
- `/api/instagram/*` - Instagram integration
- `/api/tiktok/*` - TikTok integration
- `/api/reddit/*` - Reddit integration
- `/api/billing/*` - Billing and payments
- `/api/onboard/complete` - Onboarding completion
- `/api/user/*` - User profile and settings

### Public Endpoints

These endpoints do NOT require authentication:

- `/api/auth/*` - Authentication endpoints (login, register, etc.)
- `/api/health` - Health check
- `/api/webhooks/*` - Webhook handlers (use webhook signatures)

## Response Codes

### 200 OK

Request successful, authenticated user has access.

```json
{
  "data": { /* response data */ }
}
```

### 401 Unauthorized

User is not authenticated or session has expired.

```json
{
  "error": "Unauthorized",
  "message": "You must be logged in to access this resource"
}
```

**Client Action**: Redirect to `/auth` for login.

### 403 Forbidden

User is authenticated but doesn't have permission to access the resource.

```json
{
  "error": "Forbidden",
  "message": "You don't have permission to access this resource"
}
```

**Client Action**: Show error message, don't redirect.

### 500 Internal Server Error

Server error occurred during authentication or request processing.

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

**Client Action**: Show error message, optionally retry.

## Implementing Protected API Routes

### Basic Protection

```typescript
import { requireAuth } from '@/lib/auth/api-protection';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Validate authentication
  const authResult = await requireAuth(request);
  
  // If not authenticated, returns 401 Response
  if (authResult instanceof Response) {
    return authResult;
  }
  
  // Extract user data
  const { user } = authResult;
  
  // Process request with user context
  const data = await fetchUserData(user.id);
  
  return NextResponse.json({ data });
}
```

### With Resource Ownership Validation

```typescript
import { requireAuth } from '@/lib/auth/api-protection';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const authResult = await requireAuth(request);
  
  if (authResult instanceof Response) {
    return authResult;
  }
  
  const { user } = authResult;
  
  // Verify user owns the resource
  if (user.id !== parseInt(params.userId)) {
    return NextResponse.json(
      { error: 'Forbidden', message: 'Access denied' },
      { status: 403 }
    );
  }
  
  // Process request
  const data = await fetchUserData(user.id);
  
  return NextResponse.json({ data });
}
```

### With Optional Authentication

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Get session without requiring it
  const session = await getServerSession(authOptions);
  
  // Provide different data based on authentication
  if (session) {
    const personalizedData = await fetchPersonalizedData(session.user.id);
    return NextResponse.json({ data: personalizedData });
  } else {
    const publicData = await fetchPublicData();
    return NextResponse.json({ data: publicData });
  }
}
```

## Session Object Structure

### Session Type

```typescript
interface Session {
  user: {
    id: number;
    email: string;
    name: string;
    onboardingCompleted: boolean;
  };
  expires: string; // ISO 8601 date string
}
```

### Accessing Session Properties

```typescript
const authResult = await requireAuth(request);

if (!(authResult instanceof Response)) {
  const { user } = authResult;
  
  console.log('User ID:', user.id);
  console.log('Email:', user.email);
  console.log('Name:', user.name);
  console.log('Onboarding:', user.onboardingCompleted);
}
```

## Error Handling

### Client-Side Error Handling

```typescript
async function fetchProtectedData() {
  try {
    const response = await fetch('/api/protected', {
      credentials: 'include',
    });
    
    if (response.status === 401) {
      // Session expired or user not logged in
      router.push('/auth?error=session_expired');
      return null;
    }
    
    if (response.status === 403) {
      // User doesn't have permission
      toast.error('You don\'t have permission to access this resource');
      return null;
    }
    
    if (!response.ok) {
      throw new Error('Request failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    toast.error('An unexpected error occurred');
    return null;
  }
}
```

### Server-Side Error Handling

```typescript
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    
    if (authResult instanceof Response) {
      return authResult;
    }
    
    const { user } = authResult;
    
    // Process request
    const data = await fetchData(user.id);
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('[API] Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}
```

## Session Management

### Session Expiration

Sessions expire based on the "Remember Me" setting:

- **With "Remember Me"**: 30 days
- **Without "Remember Me"**: 24 hours

### Session Refresh

Sessions are automatically refreshed when:
- User navigates to a new page
- User makes an API request
- Session is about to expire (within 1 hour)

### Manual Session Refresh

```typescript
import { useSession } from 'next-auth/react';

function MyComponent() {
  const { data: session, update } = useSession();
  
  const refreshSession = async () => {
    await update();
  };
  
  return <button onClick={refreshSession}>Refresh Session</button>;
}
```

### Checking Session Status

```typescript
import { useSession } from 'next-auth/react';

function MyComponent() {
  const { data: session, status } = useSession();
  
  if (status === 'loading') {
    return <div>Loading...</div>;
  }
  
  if (status === 'unauthenticated') {
    return <div>Please log in</div>;
  }
  
  return <div>Welcome {session.user.name}!</div>;
}
```

## Rate Limiting

Protected endpoints may be rate limited to prevent abuse:

- **Rate Limit**: 100 requests per minute per user
- **Response Code**: 429 Too Many Requests

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 60
}
```

## CORS Configuration

For cross-origin requests, ensure:

1. `credentials: 'include'` is set in fetch options
2. Server allows credentials in CORS headers
3. Origin is whitelisted in CORS configuration

```typescript
// Client-side
fetch('https://api.huntaze.com/analytics', {
  credentials: 'include', // Important!
});
```

## Security Best Practices

### Do's

✅ Always use `credentials: 'include'` in fetch requests  
✅ Check response status codes and handle 401/403 appropriately  
✅ Use HTTPS in production  
✅ Validate user ownership of resources  
✅ Log authentication failures for monitoring  

### Don'ts

❌ Don't store session tokens in localStorage  
❌ Don't send session cookies to third-party domains  
❌ Don't expose session data in client-side code  
❌ Don't skip authentication checks in API routes  
❌ Don't trust client-side authentication state  

## Migration from Legacy System

### Before (Legacy Bearer Token)

```typescript
const token = localStorage.getItem('auth_token');

const response = await fetch('/api/analytics', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

### After (Session Cookie)

```typescript
const response = await fetch('/api/analytics', {
  credentials: 'include', // Session cookie automatically included
});
```

## Testing

### Testing Protected Endpoints

```typescript
import { createMocks } from 'node-mocks-http';
import { getServerSession } from 'next-auth';

jest.mock('next-auth');

describe('GET /api/protected', () => {
  it('returns 401 when not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    
    const { req, res } = createMocks({
      method: 'GET',
    });
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(401);
  });
  
  it('returns data when authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        onboardingCompleted: true,
      },
    });
    
    const { req, res } = createMocks({
      method: 'GET',
    });
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toHaveProperty('data');
  });
});
```

## Troubleshooting

### Issue: 401 Errors on All Requests

**Cause**: Session cookie not being sent

**Solution**:
1. Ensure `credentials: 'include'` in fetch options
2. Check browser console for cookie errors
3. Verify NEXTAUTH_URL is correct
4. Clear cookies and log in again

### Issue: Session Expires Too Quickly

**Cause**: Session maxAge configuration

**Solution**:
1. Check "Remember Me" was selected during login
2. Verify session configuration in `lib/auth/config.ts`
3. Check database session expiration

### Issue: CORS Errors

**Cause**: Cross-origin request without proper configuration

**Solution**:
1. Add origin to CORS whitelist
2. Ensure `credentials: 'include'` is set
3. Verify server allows credentials in CORS headers

## Related Documentation

- [NextAuth Migration Guide](../NEXTAUTH_MIGRATION_GUIDE.md)
- [Authentication Flow](../AUTH_FLOW.md)
- [API Reference](./README.md)

---

**Last Updated**: November 16, 2025  
**Version**: 1.0  
**Status**: ✅ Production Ready
