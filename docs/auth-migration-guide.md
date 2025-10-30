# Auth.js v5 Migration Guide

## Overview

This guide documents the migration from NextAuth v4 to Auth.js v5 in the Huntaze application. The migration standardizes authentication across the codebase, removes obsolete files, and provides modern helper functions for easier authentication management.

### What Changed

The migration involved:

1. **Removed obsolete authentication files** - Cleaned up 5 legacy files that used NextAuth v4 patterns
2. **Created modern auth helpers** - New `lib/auth-helpers.ts` with convenient wrapper functions
3. **Standardized on Auth.js v5** - All authentication now uses the modern Auth.js v5 API
4. **Preserved custom JWT system** - Advanced JWT features in `lib/services/auth-service.ts` remain available

### Why Migrate to Auth.js v5?

Auth.js v5 (formerly NextAuth.js) brings significant improvements:

**Simplified API:**
- Single `auth()` function replaces multiple APIs (`getServerSession`, `getToken`, etc.)
- No need to pass configuration objects around
- Cleaner, more intuitive code

**Better Performance:**
- Edge-compatible middleware for faster route protection
- Optimized session handling
- Reduced bundle size

**Improved Developer Experience:**
- Better TypeScript support
- Clearer error messages
- More consistent behavior across different contexts

**Modern Architecture:**
- Built for Next.js App Router
- Server Components first
- Better integration with React Server Actions

**Enhanced Security:**
- Improved CSRF protection
- Better session management
- More secure defaults


## Breaking Changes

### Removed Files

The following files have been removed as part of the migration:

| File | Reason | Replacement |
|------|--------|-------------|
| `lib/auth.ts` | Obsolete `getServerSession()` stub | Use `auth()` from `@/auth` or helpers from `@/lib/auth-helpers` |
| `lib/server-auth.ts` | NextAuth v4 patterns | Use `auth()` or `requireAuth()` from `@/lib/auth-helpers` |
| `lib/middleware/api-auth.ts` | Obsolete `getToken()` usage | Use `auth()` from `@/auth` in API routes |
| `lib/middleware/auth-middleware.ts` | Obsolete middleware patterns | Use `middleware.ts` at root (already migrated) |
| `src/lib/platform-auth.ts` | NextAuth v4 configuration | Configuration now in `auth.ts` at root |

### API Changes

| Old Pattern (NextAuth v4) | New Pattern (Auth.js v5) |
|---------------------------|--------------------------|
| `import { getServerSession } from 'next-auth/next'` | `import { auth } from '@/auth'` |
| `import { authOptions } from '@/lib/auth'` | Not needed - config in `auth.ts` |
| `await getServerSession(authOptions)` | `await auth()` |
| `import { getToken } from 'next-auth/jwt'` | `import { auth } from '@/auth'` |
| `await getToken({ req, secret })` | `await auth()` |
| Custom middleware with `getToken()` | Use `middleware.ts` with `auth()` wrapper |
| `import { requireAuth } from '@/lib/server-auth'` | `import { requireAuth } from '@/lib/auth-helpers'` |

### Configuration Changes

**Before (NextAuth v4):**
```typescript
// lib/auth.ts or similar
import { NextAuthOptions } from 'next-auth';

export const authOptions: NextAuthOptions = {
  // configuration
};
```

**After (Auth.js v5):**
```typescript
// auth.ts (root)
import NextAuth from 'next-auth';

export const { auth, handlers, signIn, signOut } = NextAuth({
  // configuration
});
```


## Migration Steps

### Step 1: Update Imports

**Before:**
```typescript
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
```

**After:**
```typescript
import { auth } from '@/auth';
// or use helpers
import { getSession, requireAuth } from '@/lib/auth-helpers';
```

### Step 2: Update Session Retrieval

**Before:**
```typescript
// In Server Components or API Routes
const session = await getServerSession(authOptions);
if (!session) {
  redirect('/auth/login');
}
```

**After:**
```typescript
// Option 1: Direct auth() call
const session = await auth();
if (!session) {
  redirect('/auth/login');
}

// Option 2: Use helper
const session = await getSession();
if (!session) {
  redirect('/auth/login');
}

// Option 3: Use requireAuth (throws if not authenticated)
try {
  const session = await requireAuth();
  // session is guaranteed to exist here
} catch (error) {
  redirect('/auth/login');
}
```

### Step 3: Update Protected Routes

**Before:**
```typescript
// In API routes
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }
  // ... rest of handler
}
```

**After:**
```typescript
// In API routes
import { requireAuth } from '@/lib/auth-helpers';

export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    // ... rest of handler
  } catch (error) {
    return new Response('Unauthorized', { status: 401 });
  }
}
```

### Step 4: Update Middleware (if custom)

**Before:**
```typescript
// Custom middleware file
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }
  return NextResponse.next();
}
```

**After:**
```typescript
// Use the root middleware.ts (already configured)
// No custom middleware needed - Auth.js v5 handles it
import { auth } from '@/auth';

export default auth((req) => {
  const isAuthenticated = !!req.auth;
  // ... your logic
});
```

### Step 5: Update User Access

**Before:**
```typescript
const session = await getServerSession(authOptions);
const userId = session?.user?.id;
const userEmail = session?.user?.email;
```

**After:**
```typescript
// Option 1: Get user directly
import { getCurrentUser, requireUser } from '@/lib/auth-helpers';

const user = await getCurrentUser();
const userId = user?.id;

// Option 2: Require user (throws if not authenticated)
const user = await requireUser();
const userId = user.id; // guaranteed to exist
```


## New Patterns

### Auth Helpers (`lib/auth-helpers.ts`)

The migration introduces four convenient helper functions:

#### `getSession()`
Returns the current session or null if not authenticated.

```typescript
import { getSession } from '@/lib/auth-helpers';

const session = await getSession();
if (!session) {
  return { error: 'Not authenticated' };
}
console.log(session.user.email);
```

**Use when:** You want to check authentication but handle the null case yourself.

#### `requireAuth()`
Returns the session or throws an error if not authenticated.

```typescript
import { requireAuth } from '@/lib/auth-helpers';

try {
  const session = await requireAuth();
  // session is guaranteed to exist
} catch (error) {
  redirect('/auth/login');
}
```

**Use when:** You want to fail fast if the user is not authenticated.

#### `getCurrentUser()`
Returns the user object directly or null if not authenticated.

```typescript
import { getCurrentUser } from '@/lib/auth-helpers';

const user = await getCurrentUser();
if (!user) {
  return { error: 'Not authenticated' };
}
console.log(user.email);
```

**Use when:** You only need the user object, not the full session.

#### `requireUser()`
Returns the user object or throws an error if not authenticated.

```typescript
import { requireUser } from '@/lib/auth-helpers';

const user = await requireUser();
// user is guaranteed to exist
console.log(user.email);
```

**Use when:** You need the user object and want to fail fast if not authenticated.

### When to Use Auth.js v5 vs Custom JWT System

The application maintains two authentication systems:

#### Use Auth.js v5 (`auth.ts` + helpers) for:

✅ **Standard authentication flows**
- Login/logout
- Session management
- OAuth providers (GitHub, Google)
- Protected routes
- User session access

✅ **Most use cases**
- Server Components
- Server Actions
- API Routes
- Middleware

**Example:**
```typescript
import { requireAuth } from '@/lib/auth-helpers';

export async function POST(req: Request) {
  const session = await requireAuth();
  // Standard authentication check
}
```

#### Use Custom JWT System (`lib/services/auth-service.ts`) for:

⚠️ **Advanced JWT features**
- Refresh token rotation
- Custom JWT claims (subscription level, etc.)
- Manual token management
- Token hashing and secure storage

⚠️ **Specific scenarios**
- Building custom authentication flows
- Need explicit control over token lifecycle
- Require features beyond Auth.js scope

**Example:**
```typescript
import { AuthService } from '@/lib/services/auth-service';

// Custom login with refresh tokens
const result = await AuthService.signIn(email, password);
if (result) {
  AuthService.setAuthCookies({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    expiresAt: result.expiresAt
  });
}
```

### Decision Tree

```
Need authentication?
│
├─ Standard login/session? → Use Auth.js v5
│  └─ Use auth() or helpers from @/lib/auth-helpers
│
├─ OAuth providers? → Use Auth.js v5
│  └─ Already configured in auth.ts
│
├─ Refresh token rotation? → Use Custom JWT System
│  └─ Use AuthService from @/lib/services/auth-service
│
├─ Custom JWT claims? → Use Custom JWT System
│  └─ Use AuthService from @/lib/services/auth-service
│
└─ Not sure? → Use Auth.js v5
   └─ It covers 95% of use cases
```


## Troubleshooting

### Common Issues

#### Issue: "Cannot find module '@/lib/auth'"

**Cause:** Trying to import from the old `lib/auth.ts` file that was removed.

**Solution:** Update your import to use the new location:
```typescript
// ❌ Old
import { authOptions } from '@/lib/auth';

// ✅ New
import { auth } from '@/auth';
// or
import { getSession, requireAuth } from '@/lib/auth-helpers';
```

#### Issue: "getServerSession is not defined"

**Cause:** Using the old NextAuth v4 API.

**Solution:** Replace with Auth.js v5 API:
```typescript
// ❌ Old
const session = await getServerSession(authOptions);

// ✅ New
const session = await auth();
// or
const session = await getSession();
```

#### Issue: "Cannot find module '@/lib/server-auth'"

**Cause:** Trying to import from the removed `lib/server-auth.ts` file.

**Solution:** Use the new auth helpers:
```typescript
// ❌ Old
import { requireAuth } from '@/lib/server-auth';

// ✅ New
import { requireAuth } from '@/lib/auth-helpers';
```

#### Issue: "getToken is not defined"

**Cause:** Using the old NextAuth v4 JWT API.

**Solution:** Use Auth.js v5 auth() function:
```typescript
// ❌ Old
const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

// ✅ New
const session = await auth();
// Access token data through session
```

#### Issue: Middleware not protecting routes

**Cause:** Using old custom middleware instead of the root `middleware.ts`.

**Solution:** Ensure you're using the `middleware.ts` file at the project root, which is already configured with Auth.js v5.

#### Issue: Session is null in Server Components

**Cause:** Possible configuration issue or not authenticated.

**Solution:**
1. Verify `NEXTAUTH_SECRET` is set in environment variables
2. Check that the user is actually logged in
3. Verify cookies are being sent (check browser dev tools)
4. Try clearing cookies and logging in again

#### Issue: TypeScript errors with session.user

**Cause:** TypeScript doesn't know about custom user properties.

**Solution:** Extend the session type in `types/next-auth.d.ts`:
```typescript
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}
```

### Getting Help

If you encounter issues not covered here:

1. Check the [Auth.js v5 documentation](https://authjs.dev/)
2. Review the `auth.ts` configuration file
3. Check the `middleware.ts` implementation
4. Verify environment variables are set correctly
5. Look at the test files for usage examples

### Files Reference

**Current Auth.js v5 Files:**
- `auth.ts` - Main Auth.js v5 configuration
- `middleware.ts` - Route protection middleware
- `lib/auth-helpers.ts` - Convenient helper functions
- `app/api/auth/[...nextauth]/route.ts` - Auth API handlers
- `lib/services/auth-service.ts` - Custom JWT system (preserved)

**Removed Files (No longer available):**
- ~~`lib/auth.ts`~~ - Removed (obsolete stub)
- ~~`lib/server-auth.ts`~~ - Removed (NextAuth v4)
- ~~`lib/middleware/api-auth.ts`~~ - Removed (obsolete)
- ~~`lib/middleware/auth-middleware.ts`~~ - Removed (obsolete)
- ~~`src/lib/platform-auth.ts`~~ - Removed (NextAuth v4)

## Summary

The migration to Auth.js v5 provides:

✅ Cleaner, more maintainable code
✅ Better performance and security
✅ Simplified API with helper functions
✅ Modern architecture for Next.js App Router
✅ Preserved advanced JWT features when needed

All authentication now flows through Auth.js v5, with the custom JWT system available for advanced use cases. The new helper functions in `lib/auth-helpers.ts` make authentication checks simple and consistent across the application.
