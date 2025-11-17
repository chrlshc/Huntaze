# NextAuth Migration Troubleshooting Guide

## Overview

This guide helps you diagnose and fix common issues encountered after the NextAuth v5 migration.

## Quick Diagnostics

Run these checks first to identify the issue:

```bash
# Check if NextAuth is configured
grep -r "NEXTAUTH_SECRET" .env

# Check if SessionProvider is in root layout
grep -r "SessionProvider" app/layout.tsx

# Check if legacy AuthProvider is removed
grep -r "AuthProvider" app/layout.tsx

# Run integration tests
npm run test:integration
```

## Common Issues

### 1. User Gets Logged Out When Navigating

#### Symptoms
- User logs in successfully at `/auth`
- Gets redirected to dashboard or onboarding
- Immediately gets logged out or redirected back to `/auth`

#### Diagnosis

```typescript
// Add logging to ProtectedRoute component
console.log('[ProtectedRoute] Status:', status);
console.log('[ProtectedRoute] Session:', session);
```

#### Possible Causes

**A. SessionProvider Not in Root Layout**

Check `app/layout.tsx`:
```typescript
// ❌ Wrong - SessionProvider missing
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

// ✅ Correct - SessionProvider present
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

**B. Page Not Wrapped with ProtectedRoute**

Check your page component:
```typescript
// ❌ Wrong - No protection
export default function DashboardPage() {
  return <DashboardContent />;
}

// ✅ Correct - Wrapped with ProtectedRoute
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
```

**C. Duplicate SessionProvider**

Check for multiple SessionProviders:
```bash
grep -r "SessionProvider" app/
```

Remove any duplicate SessionProviders from individual pages.

#### Solution

1. Ensure SessionProvider is in root layout
2. Remove duplicate SessionProviders from pages
3. Wrap protected pages with ProtectedRoute
4. Clear browser cache and cookies
5. Log in again

---

### 2. Session Not Persisting Across Refreshes

#### Symptoms
- User logs in successfully
- Refreshes the page
- Gets logged out

#### Diagnosis

```bash
# Check environment variables
echo $NEXTAUTH_SECRET
echo $NEXTAUTH_URL

# Check database sessions
psql -d huntaze -c "SELECT * FROM sessions ORDER BY created_at DESC LIMIT 5;"
```

#### Possible Causes

**A. NEXTAUTH_SECRET Not Set**

Check `.env` file:
```bash
# ❌ Wrong - Missing or empty
NEXTAUTH_SECRET=

# ✅ Correct - Has value
NEXTAUTH_SECRET=your-super-secret-key-here
```

Generate a new secret:
```bash
openssl rand -base64 32
```

**B. NEXTAUTH_URL Incorrect**

Check `.env` file:
```bash
# ❌ Wrong - Incorrect URL
NEXTAUTH_URL=http://localhost:3001

# ✅ Correct - Matches your app
NEXTAUTH_URL=http://localhost:3000
```

**C. Cookie Settings**

Check `lib/auth/config.ts`:
```typescript
export const authOptions: NextAuthOptions = {
  // ...
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
};
```

**D. Database Session Not Created**

Check database:
```sql
SELECT * FROM sessions WHERE user_id = YOUR_USER_ID;
```

If no sessions exist, check database connection.

#### Solution

1. Set NEXTAUTH_SECRET in `.env`
2. Verify NEXTAUTH_URL matches your app
3. Restart development server
4. Clear browser cookies
5. Log in again
6. Verify session in database

---

### 3. API Routes Returning 401

#### Symptoms
- User is logged in (can see dashboard)
- API requests fail with 401 Unauthorized
- Console shows authentication errors

#### Diagnosis

```typescript
// Add logging to API route
export async function GET(request: NextRequest) {
  console.log('[API] Headers:', request.headers);
  console.log('[API] Cookies:', request.cookies);
  
  const authResult = await requireAuth(request);
  console.log('[API] Auth result:', authResult);
  
  // ...
}
```

#### Possible Causes

**A. API Route Not Using requireAuth**

Check your API route:
```typescript
// ❌ Wrong - No authentication
export async function GET(request: NextRequest) {
  const data = await fetchData();
  return NextResponse.json(data);
}

// ✅ Correct - Uses requireAuth
import { requireAuth } from '@/lib/auth/api-protection';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  
  if (authResult instanceof Response) {
    return authResult;
  }
  
  const { user } = authResult;
  const data = await fetchData(user.id);
  return NextResponse.json(data);
}
```

**B. Cookies Not Being Sent**

Check fetch request:
```typescript
// ❌ Wrong - No credentials
fetch('/api/analytics');

// ✅ Correct - Includes credentials
fetch('/api/analytics', {
  credentials: 'include',
});
```

**C. CORS Issues**

For cross-origin requests, ensure CORS is configured:
```typescript
// In API route
const response = NextResponse.json(data);
response.headers.set('Access-Control-Allow-Credentials', 'true');
response.headers.set('Access-Control-Allow-Origin', process.env.NEXTAUTH_URL);
return response;
```

#### Solution

1. Update API route to use `requireAuth()`
2. Add `credentials: 'include'` to fetch requests
3. Configure CORS if needed
4. Clear browser cache
5. Test API request again

---

### 4. Redirect Loop

#### Symptoms
- User bounces between pages infinitely
- Browser shows "Too many redirects" error
- Console shows multiple redirect logs

#### Diagnosis

```typescript
// Add logging to track redirects
useEffect(() => {
  console.log('[Page] Status:', status);
  console.log('[Page] Session:', session);
  console.log('[Page] Onboarding:', session?.user?.onboardingCompleted);
}, [status, session]);
```

#### Possible Causes

**A. Onboarding Status Check Logic Error**

Check redirect logic:
```typescript
// ❌ Wrong - Incorrect logic
if (session?.user?.onboardingCompleted) {
  router.push('/onboarding'); // Should go to dashboard!
} else {
  router.push('/dashboard'); // Should go to onboarding!
}

// ✅ Correct - Proper logic
if (session?.user?.onboardingCompleted) {
  router.push('/dashboard');
} else {
  router.push('/onboarding');
}
```

**B. ProtectedRoute on Auth Page**

Check `/auth` page:
```typescript
// ❌ Wrong - Auth page wrapped with ProtectedRoute
export default function AuthPage() {
  return (
    <ProtectedRoute>
      <AuthForm />
    </ProtectedRoute>
  );
}

// ✅ Correct - No ProtectedRoute on auth page
export default function AuthPage() {
  return <AuthForm />;
}
```

**C. Middleware Interfering**

Check `middleware.ts`:
```typescript
// Ensure auth pages are excluded
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|auth).*)',
  ],
};
```

#### Solution

1. Fix onboarding status check logic
2. Remove ProtectedRoute from `/auth` page
3. Update middleware matcher
4. Clear browser cache and cookies
5. Test navigation flow

---

### 5. TypeScript Errors

#### Symptoms
- Type errors about session properties
- `onboardingCompleted` is undefined
- Type mismatches in components

#### Diagnosis

```bash
# Check TypeScript errors
npm run type-check

# Check type definitions
cat lib/types/auth.ts
```

#### Possible Causes

**A. Type Definitions Not Updated**

Check `lib/types/auth.ts`:
```typescript
// ❌ Wrong - Missing onboardingCompleted
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
    };
  }
}

// ✅ Correct - Includes onboardingCompleted
declare module 'next-auth' {
  interface Session {
    user: {
      id: number;
      email: string;
      name: string;
      onboardingCompleted: boolean;
    };
  }
}
```

**B. Using Old Session Type**

Update component:
```typescript
// ❌ Wrong - Using default Session type
import { Session } from 'next-auth';

function MyComponent({ session }: { session: Session }) {
  // onboardingCompleted not available
}

// ✅ Correct - Using extended Session type
import { Session } from 'next-auth';

function MyComponent({ session }: { session: Session }) {
  // onboardingCompleted is available
  console.log(session.user.onboardingCompleted);
}
```

#### Solution

1. Update type definitions in `lib/types/auth.ts`
2. Restart TypeScript server (Cmd+Shift+P → "Restart TS Server")
3. Clear `.next` cache: `rm -rf .next`
4. Rebuild: `npm run build`

---

### 6. Onboarding Status Not Updating

#### Symptoms
- User completes onboarding
- Still redirected to `/onboarding` on next login
- Database shows `onboarding_completed = true`

#### Diagnosis

```sql
-- Check database
SELECT id, email, onboarding_completed FROM users WHERE email = 'user@example.com';

-- Check sessions
SELECT * FROM sessions WHERE user_id = YOUR_USER_ID;
```

#### Possible Causes

**A. Session Not Refreshed After Update**

Check onboarding completion:
```typescript
// ❌ Wrong - No session refresh
await fetch('/api/onboard/complete', { method: 'POST' });
router.push('/dashboard');

// ✅ Correct - Refresh session
import { useSession } from 'next-auth/react';

const { update } = useSession();

await fetch('/api/onboard/complete', { method: 'POST' });
await update(); // Refresh session
router.push('/dashboard');
```

**B. JWT Callback Not Refreshing**

Check `lib/auth/config.ts`:
```typescript
callbacks: {
  async jwt({ token, user, trigger }) {
    if (user) {
      token.id = user.id;
      token.onboardingCompleted = user.onboardingCompleted;
    }
    
    // ✅ Important: Refresh on update trigger
    if (trigger === 'update') {
      const result = await query(
        'SELECT onboarding_completed FROM users WHERE id = $1',
        [token.id]
      );
      token.onboardingCompleted = result.rows[0].onboarding_completed;
    }
    
    return token;
  },
}
```

#### Solution

1. Add session refresh after onboarding completion
2. Verify JWT callback handles update trigger
3. Clear browser cookies
4. Log in again

---

### 7. "Cannot read property 'user' of null"

#### Symptoms
- Runtime error: "Cannot read property 'user' of null"
- App crashes when accessing session.user
- Error in ProtectedRoute or page components

#### Diagnosis

```typescript
// Add null checks
console.log('Session:', session);
console.log('Session user:', session?.user);
console.log('User ID:', session?.user?.id);
```

#### Possible Causes

**A. Missing Null Checks**

```typescript
// ❌ Wrong - No null check
function MyComponent() {
  const { data: session } = useSession();
  return <div>{session.user.name}</div>; // Crashes if session is null
}

// ✅ Correct - Proper null checks
function MyComponent() {
  const { data: session, status } = useSession();
  
  if (status === 'loading') return <div>Loading...</div>;
  if (!session) return <div>Not logged in</div>;
  
  return <div>{session.user.name}</div>;
}
```

**B. Accessing Session Before Load**

```typescript
// ❌ Wrong - Accessing session immediately
function MyComponent() {
  const { data: session } = useSession();
  
  useEffect(() => {
    fetchData(session.user.id); // Crashes on first render
  }, []);
}

// ✅ Correct - Wait for session
function MyComponent() {
  const { data: session, status } = useSession();
  
  useEffect(() => {
    if (status === 'authenticated' && session) {
      fetchData(session.user.id);
    }
  }, [status, session]);
}
```

#### Solution

1. Add null checks before accessing session
2. Check status before using session data
3. Use optional chaining: `session?.user?.id`
4. Add loading states

---

## Debugging Tools

### Enable Debug Logging

Add to `.env.local`:
```env
NEXTAUTH_DEBUG=true
```

This will log:
- Session creation/validation
- JWT token operations
- Callback executions
- Authentication attempts

### Check Session in Browser

Open browser console:
```javascript
// Get current session
fetch('/api/auth/session')
  .then(r => r.json())
  .then(console.log);
```

### Check Cookies

Open browser DevTools → Application → Cookies:
- Look for `next-auth.session-token`
- Verify it's not expired
- Check HttpOnly and Secure flags

### Database Queries

```sql
-- Check user
SELECT * FROM users WHERE email = 'user@example.com';

-- Check sessions
SELECT s.*, u.email 
FROM sessions s 
JOIN users u ON s.user_id = u.id 
WHERE u.email = 'user@example.com';

-- Check expired sessions
SELECT COUNT(*) FROM sessions WHERE expires_at < NOW();

-- Clean up expired sessions
DELETE FROM sessions WHERE expires_at < NOW();
```

## Testing Checklist

Use this checklist to verify everything works:

- [ ] User can register new account
- [ ] User redirected to onboarding after registration
- [ ] User can complete onboarding
- [ ] User redirected to dashboard after onboarding
- [ ] User can log in with existing account
- [ ] User redirected based on onboarding status
- [ ] User can navigate between protected pages
- [ ] Session persists across page refreshes
- [ ] Session persists across browser restarts (with "Remember Me")
- [ ] API requests work when authenticated
- [ ] API requests return 401 when not authenticated
- [ ] User can log out
- [ ] User redirected to /auth after logout
- [ ] Accessing protected route when logged out redirects to /auth

## Getting Help

If you're still stuck:

1. **Check the logs**: Look for errors in browser console and server logs
2. **Run tests**: `npm run test:integration`
3. **Review documentation**: See [NextAuth Migration Guide](./NEXTAUTH_MIGRATION_GUIDE.md)
4. **Check database**: Verify user and session records
5. **Clear everything**: Clear cache, cookies, and restart server
6. **Ask for help**: Contact the development team with:
   - Error messages
   - Steps to reproduce
   - Browser console logs
   - Server logs
   - Database state

## Related Documentation

- [NextAuth Migration Guide](./NEXTAUTH_MIGRATION_GUIDE.md)
- [Authentication Flow](./AUTH_FLOW.md)
- [Session Auth API](./api/SESSION_AUTH.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)

---

**Last Updated**: November 16, 2025  
**Version**: 1.0  
**Status**: ✅ Production Ready
