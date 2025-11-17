# Design Document

## Overview

This design document outlines the technical approach for migrating the Huntaze application from a dual authentication system (legacy localStorage + NextAuth) to a unified NextAuth v5 implementation. The migration will be performed incrementally to minimize disruption, with a focus on maintaining backward compatibility for existing users.

## Architecture

### Current State

```
┌─────────────────────────────────────────────────────────┐
│                     Root Layout                          │
│  ┌────────────────────────────────────────────────┐    │
│  │           ThemeProvider                         │    │
│  │  ┌──────────────────────────────────────────┐  │    │
│  │  │        AuthProvider (Legacy)             │  │    │
│  │  │  - localStorage tokens                   │  │    │
│  │  │  - useAuth hook                          │  │    │
│  │  │  - /api/auth/verify                      │  │    │
│  │  └──────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│          /auth and /onboarding pages                     │
│  ┌────────────────────────────────────────────────┐    │
│  │        SessionProvider (NextAuth)              │    │
│  │  - Server-side sessions                        │    │
│  │  - useSession hook                             │    │
│  │  - Database-backed                             │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Target State

```
┌─────────────────────────────────────────────────────────┐
│                     Root Layout                          │
│  ┌────────────────────────────────────────────────┐    │
│  │           ThemeProvider                         │    │
│  │  ┌──────────────────────────────────────────┐  │    │
│  │  │      SessionProvider (NextAuth)          │  │    │
│  │  │  - Unified authentication                 │  │    │
│  │  │  - useSession hook everywhere            │  │    │
│  │  │  - Database-backed sessions              │  │    │
│  │  │  - Server-side validation                │  │    │
│  │  └──────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Root Layout Modification

**File:** `app/layout.tsx`

**Changes:**
- Remove `AuthProvider` import and usage
- Add `SessionProvider` wrapper at root level (via NextAuthProvider component)
- Ensure SessionProvider wraps all children to provide session context globally

**Implementation:**
```typescript
import { NextAuthProvider } from '@/components/auth/NextAuthProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider>
          <NextAuthProvider>
            {children}
          </NextAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 2. Protected Route Wrapper

**File:** `components/auth/ProtectedRoute.tsx` (new)

**Purpose:** Reusable component to protect routes requiring authentication

**Interface:**
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
  redirectTo?: string;
}
```

**Behavior:**
- Check session status using `useSession()`
- Show loading state while session is being fetched
- Redirect to `/auth` if unauthenticated
- Optionally check onboarding status and redirect to `/onboarding` if incomplete
- Render children if authenticated (and onboarded if required)

### 3. API Route Protection Utility

**File:** `lib/auth/api-protection.ts` (new)

**Purpose:** Centralized utility for protecting API routes

**Interface:**
```typescript
interface AuthenticatedRequest {
  user: {
    id: number;
    email: string;
    name: string;
    onboardingCompleted: boolean;
  };
}

async function requireAuth(
  request: Request
): Promise<AuthenticatedRequest | Response>;
```

**Behavior:**
- Extract session using `getServerSession(authOptions)`
- Return 401 response if no session
- Return user data if authenticated
- Can be used in API route handlers

**Usage Example:**
```typescript
export async function GET(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  
  const { user } = authResult;
  // Use user.id, user.email, etc.
}
```

### 4. Session Hook Wrapper

**File:** `hooks/useAuthSession.ts` (new)

**Purpose:** Wrapper around useSession with additional utilities

**Interface:**
```typescript
interface UseAuthSessionReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}
```

**Behavior:**
- Wraps NextAuth's `useSession()` hook
- Provides convenient `isAuthenticated` boolean
- Includes `logout()` function that calls `signOut()`
- Includes `refreshSession()` to manually refresh session data

### 5. Legacy Code Removal

**Files to Modify:**
- `components/auth/AuthProvider.tsx` - Mark as deprecated, add migration notice
- `hooks/useAuth.ts` - Add deprecation warning, redirect to useAuthSession
- `app/api/auth/verify/route.ts` - Remove or return 410 Gone

**Migration Strategy:**
- Keep AuthProvider temporarily but make it a no-op wrapper
- Add console warnings when legacy hooks are used
- Provide clear migration path in warnings

## Data Models

### Session Data Structure

NextAuth session object (already defined in auth-onboarding-flow spec):

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

### Database Schema

No changes required - using existing schema from auth-onboarding-flow spec:
- `users` table with `onboarding_completed` column
- NextAuth session storage (handled by NextAuth adapter)

## Error Handling

### Client-Side Error Handling

**Session Expiration:**
```typescript
// In ProtectedRoute component
if (status === 'unauthenticated') {
  router.push('/auth?error=session_expired');
}
```

**API Request Failures:**
```typescript
// In API client utility
if (response.status === 401) {
  // Clear any cached data
  // Redirect to login
  window.location.href = '/auth?error=unauthorized';
}
```

### Server-Side Error Handling

**API Route Protection:**
```typescript
// In requireAuth utility
if (!session) {
  return new Response(
    JSON.stringify({ error: 'Unauthorized' }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  );
}
```

**Error Logging:**
- Log authentication failures to console
- Include request path and timestamp
- Do not log sensitive information (passwords, tokens)

## Testing Strategy

### Unit Tests

1. **ProtectedRoute Component**
   - Test redirect when unauthenticated
   - Test rendering children when authenticated
   - Test onboarding check logic

2. **requireAuth Utility**
   - Test 401 response for missing session
   - Test successful authentication
   - Test user data extraction

3. **useAuthSession Hook**
   - Test isAuthenticated derivation
   - Test logout functionality
   - Test session refresh

### Integration Tests

1. **Login Flow**
   - Test successful login redirects to dashboard or onboarding
   - Test failed login shows error message
   - Test session persistence across page reloads

2. **Protected Routes**
   - Test unauthenticated access redirects to /auth
   - Test authenticated access renders content
   - Test navigation between protected routes maintains session

3. **API Routes**
   - Test authenticated API requests succeed
   - Test unauthenticated API requests return 401
   - Test session data is correctly passed to API handlers

4. **Logout Flow**
   - Test logout clears session
   - Test logout redirects to /auth
   - Test accessing protected route after logout redirects to /auth

### Manual Testing Checklist

- [ ] Register new account and complete onboarding
- [ ] Log in with existing account
- [ ] Navigate to dashboard, analytics, OnlyFans pages
- [ ] Verify no disconnections occur
- [ ] Test "Remember Me" functionality
- [ ] Test logout from different pages
- [ ] Test session expiration handling
- [ ] Test browser refresh maintains session
- [ ] Test opening app in new tab uses same session

## Migration Plan

### Phase 1: Preparation (No User Impact)
1. Create ProtectedRoute component
2. Create requireAuth utility
3. Create useAuthSession hook
4. Add SessionProvider to root layout (alongside existing AuthProvider)

### Phase 2: Protected Pages Migration (Incremental)
1. Migrate /dashboard page to use ProtectedRoute
2. Migrate /analytics pages to use ProtectedRoute
3. Migrate OnlyFans-related pages to use ProtectedRoute
4. Migrate remaining protected pages

### Phase 3: API Routes Migration
1. Update all API routes to use requireAuth
2. Remove Bearer token validation logic
3. Test all API endpoints

### Phase 4: Cleanup
1. Remove AuthProvider from root layout
2. Delete legacy auth code
3. Remove /api/auth/verify endpoint
4. Update documentation

### Rollback Strategy

If issues are discovered:
1. Revert root layout changes to restore AuthProvider
2. Revert individual page changes as needed
3. Keep NextAuth system intact for /auth and /onboarding
4. Investigate and fix issues before re-attempting migration

## Performance Considerations

### Session Validation

- NextAuth validates sessions server-side, which adds minimal latency
- Session data is cached in memory to reduce database queries
- Use `getServerSession()` in server components for zero client-side overhead

### Client-Side Performance

- SessionProvider uses React Context, which is efficient
- Session data is fetched once on mount and cached
- Avoid unnecessary session refreshes

### Database Impact

- NextAuth creates one session record per login
- Sessions are automatically cleaned up on expiry
- Minimal impact on database performance

## Security Considerations

### Session Security

- Sessions stored server-side in database (more secure than localStorage)
- Session IDs are cryptographically secure random strings
- HTTPS required for production (already configured)
- CSRF protection built into NextAuth

### Token Management

- No tokens stored in localStorage (eliminates XSS risk)
- Session cookies are httpOnly and secure
- SameSite=lax prevents CSRF attacks

### Password Security

- Passwords hashed with bcrypt (already implemented)
- No changes to password storage
- Existing password hashes remain valid

## Deployment Strategy

### Staging Deployment

1. Deploy to staging environment
2. Run full test suite
3. Perform manual testing
4. Monitor for errors in logs
5. Get user acceptance sign-off

### Production Deployment

1. Deploy during low-traffic period
2. Monitor error rates closely
3. Have rollback plan ready
4. Communicate with users about any expected downtime
5. Provide support for any login issues

### Post-Deployment Monitoring

- Monitor authentication success/failure rates
- Track session creation and expiration
- Watch for 401 errors in API routes
- Monitor user feedback channels
