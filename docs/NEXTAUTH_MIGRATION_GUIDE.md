# NextAuth v5 Migration Guide

## Overview

This guide documents the complete migration from the legacy localStorage-based authentication system to NextAuth v5 with unified session management across the entire Huntaze application.

## Table of Contents

- [Migration Summary](#migration-summary)
- [What Changed](#what-changed)
- [New Authentication Flow](#new-authentication-flow)
- [For Developers](#for-developers)
- [API Changes](#api-changes)
- [Component Updates](#component-updates)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Rollback Procedure](#rollback-procedure)

## Migration Summary

### Before Migration

The application had **two parallel authentication systems**:
- **NextAuth** for `/auth` and `/onboarding` pages
- **Legacy AuthProvider** with localStorage tokens for dashboard, analytics, and other pages

This caused users to be disconnected when navigating between different sections.

### After Migration

The application now uses **unified NextAuth v5** across all pages:
- ✅ Single authentication system
- ✅ Server-side session validation
- ✅ Database-backed sessions
- ✅ Seamless navigation across all pages
- ✅ No localStorage tokens
- ✅ Improved security

## What Changed

### Removed Components

- ❌ `components/auth/AuthProvider.tsx` - Legacy auth context
- ❌ `hooks/useAuth.ts` - Legacy auth hook
- ❌ `/api/auth/verify` - Legacy token verification endpoint
- ❌ All localStorage token management code

### New Components

- ✅ `components/auth/ProtectedRoute.tsx` - Reusable route protection
- ✅ `lib/auth/api-protection.ts` - API route protection utilities
- ✅ `hooks/useAuthSession.ts` - Enhanced session hook
- ✅ Unified SessionProvider in root layout

### Updated Components

- 🔄 All dashboard pages now use NextAuth
- 🔄 All analytics pages now use NextAuth
- 🔄 All API routes now validate NextAuth sessions
- 🔄 Root layout now provides SessionProvider globally

## New Authentication Flow

### User Registration Flow

```
1. User visits /auth
2. User fills registration form
3. POST /api/auth/register creates user
4. Auto-login via NextAuth signIn()
5. Redirect to /onboarding
6. User completes onboarding
7. POST /api/onboard/complete updates DB
8. Redirect to /dashboard
```

### User Login Flow

```
1. User visits /auth
2. User fills login form
3. NextAuth signIn() validates credentials
4. Session created in database
5. Check onboardingCompleted status
   ├─ false → Redirect to /onboarding
   └─ true → Redirect to /dashboard
```

### Protected Page Access

```
1. User navigates to protected page
2. ProtectedRoute checks session status
   ├─ unauthenticated → Redirect to /auth
   ├─ loading → Show loading state
   └─ authenticated → Render page content
```

### API Request Flow

```
1. Client makes API request
2. requireAuth() validates session
   ├─ No session → Return 401
   └─ Valid session → Process request
3. Return response
```

## For Developers

### Using Protected Routes

Wrap any page that requires authentication:

```typescript
// app/dashboard/page.tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
```

With onboarding requirement:

```typescript
<ProtectedRoute requireOnboarding={true}>
  <DashboardContent />
</ProtectedRoute>
```

### Accessing Session Data

In client components:

```typescript
import { useAuthSession } from '@/hooks/useAuthSession';

function MyComponent() {
  const { user, isAuthenticated, isLoading } = useAuthSession();
  
  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Not logged in</div>;
  
  return <div>Welcome {user.name}!</div>;
}
```

In server components:

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';

export default async function Page() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth');
  }
  
  return <div>Welcome {session.user.name}!</div>;
}
```

### Protecting API Routes

Use the `requireAuth` utility:

```typescript
import { requireAuth } from '@/lib/auth/api-protection';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  
  // If not authenticated, returns 401 Response
  if (authResult instanceof Response) {
    return authResult;
  }
  
  // Extract user data
  const { user } = authResult;
  
  // Use user.id, user.email, etc.
  const data = await fetchUserData(user.id);
  
  return NextResponse.json(data);
}
```

### Logging Out

In client components:

```typescript
import { useAuthSession } from '@/hooks/useAuthSession';

function LogoutButton() {
  const { logout } = useAuthSession();
  
  return (
    <button onClick={logout}>
      Logout
    </button>
  );
}
```

Or directly with NextAuth:

```typescript
import { signOut } from 'next-auth/react';

function LogoutButton() {
  return (
    <button onClick={() => signOut({ callbackUrl: '/auth' })}>
      Logout
    </button>
  );
}
```

## API Changes

### Removed Endpoints

| Endpoint | Status | Replacement |
|----------|--------|-------------|
| `POST /api/auth/login` | ❌ Removed | Use NextAuth `signIn()` |
| `GET /api/auth/verify` | ❌ Removed | Use `getServerSession()` |
| `POST /api/auth/logout` | ❌ Removed | Use NextAuth `signOut()` |

### Updated Endpoints

All protected API endpoints now:
- ✅ Validate NextAuth sessions instead of Bearer tokens
- ✅ Return 401 for unauthenticated requests
- ✅ Extract user data from session object

### Session Object Structure

```typescript
interface Session {
  user: {
    id: number;
    email: string;
    name: string;
    onboardingCompleted: boolean;
  };
  expires: string;
}
```

## Component Updates

### Root Layout

**Before:**
```typescript
<ThemeProvider>
  <AuthProvider>
    {children}
  </AuthProvider>
</ThemeProvider>
```

**After:**
```typescript
<ThemeProvider>
  <NextAuthProvider>
    {children}
  </NextAuthProvider>
</ThemeProvider>
```

### Dashboard Pages

**Before:**
```typescript
import { useAuth } from '@/hooks/useAuth';

function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    router.push('/auth');
    return null;
  }
  
  return <div>Welcome {user.name}</div>;
}
```

**After:**
```typescript
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuthSession } from '@/hooks/useAuthSession';

function Dashboard() {
  const { user } = useAuthSession();
  
  return (
    <ProtectedRoute>
      <div>Welcome {user?.name}</div>
    </ProtectedRoute>
  );
}
```

### API Routes

**Before:**
```typescript
export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const user = await verifyToken(token);
  // ...
}
```

**After:**
```typescript
import { requireAuth } from '@/lib/auth/api-protection';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  
  if (authResult instanceof Response) {
    return authResult;
  }
  
  const { user } = authResult;
  // ...
}
```

## Testing

### Manual Testing Checklist

- [ ] Register new account → redirects to /onboarding
- [ ] Complete onboarding → redirects to /dashboard
- [ ] Login with existing account → redirects based on onboarding status
- [ ] Navigate between dashboard, analytics, OnlyFans pages → no disconnections
- [ ] Logout from any page → redirects to /auth
- [ ] Access protected route when logged out → redirects to /auth
- [ ] Refresh browser → session persists
- [ ] Close and reopen browser → session persists (if "Remember Me")
- [ ] Session expires → redirects to /auth with message

### Automated Tests

Run the integration test suite:

```bash
npm run test:integration
```

Key test files:
- `tests/integration/auth/nextauth-migration.test.ts` - Full migration tests
- `tests/unit/hooks/useAuthSession.test.ts` - Hook tests
- `tests/unit/components/ProtectedRoute.test.ts` - Component tests

## Troubleshooting

### Issue: User Gets Logged Out When Navigating

**Symptoms:**
- User logs in successfully
- Gets disconnected when navigating to dashboard or analytics

**Causes:**
- SessionProvider not in root layout
- Page not wrapped with ProtectedRoute
- API route not using requireAuth

**Solutions:**
1. Verify SessionProvider is in `app/layout.tsx`
2. Wrap page with `<ProtectedRoute>`
3. Update API routes to use `requireAuth()`

### Issue: Session Not Persisting Across Refreshes

**Symptoms:**
- User logs in
- Refreshes page
- Gets logged out

**Causes:**
- NEXTAUTH_SECRET not set
- Cookie settings incorrect
- Database session not being created

**Solutions:**
1. Check `.env` has `NEXTAUTH_SECRET`
2. Verify `NEXTAUTH_URL` is correct
3. Check database sessions table has records
4. Clear browser cookies and try again

### Issue: API Routes Returning 401

**Symptoms:**
- Authenticated user
- API requests fail with 401

**Causes:**
- API route not using requireAuth correctly
- Session not being passed to API
- CORS issues

**Solutions:**
1. Verify API route uses `requireAuth()`
2. Check browser network tab for cookies
3. Verify API route is not blocking cookies

### Issue: Redirect Loop

**Symptoms:**
- User bounces between pages infinitely
- Browser shows multiple redirects

**Causes:**
- ProtectedRoute logic error
- Onboarding status check incorrect
- Middleware interfering

**Solutions:**
1. Check ProtectedRoute implementation
2. Verify onboarding status in database
3. Check `middleware.ts` for conflicts
4. Add logging to track redirect decisions

### Issue: TypeScript Errors

**Symptoms:**
- Type errors about session properties
- Missing onboardingCompleted field

**Causes:**
- Type definitions not updated
- Using old session type

**Solutions:**
1. Check `lib/types/auth.ts` for correct types
2. Restart TypeScript server
3. Clear `.next` cache and rebuild

## Rollback Procedure

If critical issues are discovered, follow this rollback procedure:

### Step 1: Revert Root Layout

```typescript
// app/layout.tsx
import { AuthProvider } from '@/components/auth/AuthProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <NextAuthProvider>
              {children}
            </NextAuthProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Step 2: Restore Legacy Endpoints

Temporarily restore `/api/auth/verify` endpoint for legacy pages.

### Step 3: Revert Individual Pages

Revert pages one by one, starting with the most critical:
1. Dashboard pages
2. Analytics pages
3. OnlyFans pages

### Step 4: Monitor and Fix

- Monitor error rates
- Fix issues in development
- Re-attempt migration when ready

### Step 5: Keep NextAuth for /auth and /onboarding

Do not revert the `/auth` and `/onboarding` pages - they should continue using NextAuth.

## Session Management

### Session Duration

- **With "Remember Me"**: 30 days
- **Without "Remember Me"**: 24 hours

### Session Refresh

Sessions are automatically refreshed when:
- User navigates to a new page
- User makes an API request
- Session is about to expire (within 1 hour)

### Manual Session Refresh

```typescript
import { useAuthSession } from '@/hooks/useAuthSession';

function MyComponent() {
  const { refreshSession } = useAuthSession();
  
  const handleRefresh = async () => {
    await refreshSession();
  };
  
  return <button onClick={handleRefresh}>Refresh Session</button>;
}
```

## Security Improvements

### Before Migration

- ❌ Tokens stored in localStorage (XSS vulnerable)
- ❌ Client-side token validation
- ❌ No automatic token expiration
- ❌ Tokens sent in Authorization header

### After Migration

- ✅ Sessions stored server-side in database
- ✅ Server-side session validation
- ✅ Automatic session expiration
- ✅ HTTP-only cookies (XSS protected)
- ✅ Secure cookies in production (HTTPS only)
- ✅ SameSite=lax (CSRF protected)

## Performance Considerations

### Session Validation

- NextAuth validates sessions server-side with minimal latency
- Session data is cached in memory to reduce database queries
- Use `getServerSession()` in server components for zero client-side overhead

### Database Impact

- One session record per login
- Sessions automatically cleaned up on expiry
- Minimal impact on database performance

## Migration Timeline

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ Complete | Create utilities and components |
| Phase 2 | ✅ Complete | Migrate protected pages |
| Phase 3 | ✅ Complete | Migrate API routes |
| Phase 4 | ✅ Complete | Remove legacy code |
| Phase 5 | ✅ Complete | Session management features |
| Phase 6 | ✅ Complete | Update auth pages |
| Phase 7 | ✅ Complete | Testing and validation |
| Phase 8 | 🔄 In Progress | Documentation and deployment |

## Related Documentation

- [Authentication Flow](./AUTH_FLOW.md) - Complete auth flow documentation
- [Authentication Setup](./AUTH_SETUP.md) - Initial setup guide
- [API Reference](./api/README.md) - API documentation
- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Production deployment
- [Requirements](../.kiro/specs/nextauth-migration/requirements.md) - Feature requirements
- [Design Document](../.kiro/specs/nextauth-migration/design.md) - Technical design

## Support

For issues or questions:
1. Check this documentation
2. Review the [troubleshooting section](#troubleshooting)
3. Check application logs
4. Run integration tests
5. Contact the development team

---

**Migration Date**: November 16, 2025  
**Version**: 1.0  
**Status**: ✅ Complete
