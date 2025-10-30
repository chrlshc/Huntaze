# Design Document - Auth.js v5 Migration

## Overview

Cette migration nettoie le codebase en supprimant tous les fichiers d'authentification obsolètes (NextAuth v4) et en standardisant l'utilisation d'Auth.js v5. Le système Auth.js v5 est déjà en place dans `auth.ts` et `middleware.ts`, cette migration consiste principalement à supprimer les anciens fichiers et créer des helpers modernes.

### Current State

**✅ Already Migrated:**
- `auth.ts` - Auth.js v5 configuration with providers (GitHub, Google, Credentials)
- `middleware.ts` - Auth.js v5 middleware wrapper
- `app/api/auth/[...nextauth]/route.ts` - Auth.js v5 route handlers
- Auth pages: `app/auth/login/page.tsx`, `app/auth/register/page.tsx`
- Auth components: `components/auth/LoginForm.tsx`, `components/auth/RegisterForm.tsx`

**❌ To Remove (Obsolete):**
- `lib/auth.ts` - Stub with obsolete `getServerSession()`
- `lib/server-auth.ts` - NextAuth v4 patterns
- `lib/middleware/api-auth.ts` - Obsolete `getToken()` usage
- `lib/middleware/auth-middleware.ts` - Obsolete middleware patterns
- `src/lib/platform-auth.ts` - NextAuth v4 configuration

**⚠️ To Preserve:**
- `lib/services/auth-service.ts` - Custom JWT system with refresh tokens (advanced features beyond Auth.js scope)

### Target State

Un système d'authentification unifié utilisant Auth.js v5 avec :
- Helpers modernes dans `lib/auth-helpers.ts`
- Documentation claire de migration
- Aucun fichier obsolète
- Coexistence propre avec le système JWT custom pour les cas d'usage avancés

## Architecture

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Auth.js v5 Core                         │
│                      (auth.ts)                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Providers: GitHub, Google, Credentials               │  │
│  │ Session Strategy: JWT                                │  │
│  │ Adapter: PrismaAdapter                               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ exports: auth(), handlers, signIn, signOut
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  Middleware  │   │   Helpers    │   │  API Routes  │
│              │   │              │   │              │
│ middleware.ts│   │auth-helpers  │   │ [...nextauth]│
│              │   │              │   │              │
│ - Route      │   │ - auth()     │   │ - handlers   │
│   protection │   │ - requireAuth│   │              │
└──────────────┘   └──────────────┘   └──────────────┘
                            │
                            │
                            ▼
                   ┌──────────────────┐
                   │  Server Actions  │
                   │  & Components    │
                   │                  │
                   │  - Use auth()    │
                   │  - Use           │
                   │    requireAuth() │
                   └──────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Custom JWT System (Preserved)                  │
│                (lib/services/auth-service.ts)               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Advanced Features:                                   │  │
│  │ - Refresh token rotation                            │  │
│  │ - Token hashing & storage                           │  │
│  │ - Custom JWT claims                                 │  │
│  │ - Manual token management                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Use Case: Advanced auth scenarios beyond Auth.js scope    │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Auth Helpers Module (`lib/auth-helpers.ts`)

**Purpose:** Provide convenient wrappers around Auth.js v5 core functions

```typescript
// lib/auth-helpers.ts
import { auth } from '@/auth';

/**
 * Get current session (can return null)
 * Use in Server Components, Server Actions, and API Routes
 */
export async function getSession() {
  return await auth();
}

/**
 * Require authentication (throws if not authenticated)
 * Use when you need to ensure user is authenticated
 */
export async function requireAuth() {
  const session = await auth();
  
  if (!session || !session.user) {
    throw new Error('Unauthorized');
  }
  
  return session;
}

/**
 * Get current user (can return null)
 * Convenience method to get user directly
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * Require current user (throws if not authenticated)
 * Convenience method to get user with auth check
 */
export async function requireUser() {
  const session = await requireAuth();
  return session.user;
}
```

### 2. Migration Mapping

| Old Pattern (NextAuth v4) | New Pattern (Auth.js v5) |
|---------------------------|--------------------------|
| `import { getServerSession } from 'next-auth/next'` | `import { auth } from '@/auth'` |
| `import { authOptions } from '@/lib/auth'` | Not needed - config in `auth.ts` |
| `await getServerSession(authOptions)` | `await auth()` |
| `import { getToken } from 'next-auth/jwt'` | `import { auth } from '@/auth'` |
| `await getToken({ req, secret })` | `await auth()` |
| Custom middleware with `getToken()` | Use `middleware.ts` with `auth()` wrapper |

### 3. Files to Remove

```
lib/
├── auth.ts                          ❌ Remove (obsolete stub)
├── server-auth.ts                   ❌ Remove (NextAuth v4)
├── middleware/
│   ├── api-auth.ts                  ❌ Remove (obsolete getToken)
│   └── auth-middleware.ts           ❌ Remove (replaced by middleware.ts)
└── services/
    └── auth-service.ts              ✅ Keep (custom JWT system)

src/lib/
└── platform-auth.ts                 ❌ Remove (NextAuth v4 config)
```

### 4. Preserved Custom JWT System

`lib/services/auth-service.ts` provides advanced features:

- **Refresh Token Rotation:** Automatic token rotation on refresh
- **Token Hashing:** Secure storage of refresh tokens with SHA-256
- **Custom Claims:** Subscription level, custom expiration
- **Manual Token Management:** Full control over token lifecycle

**When to use:**
- Need refresh token rotation
- Need custom JWT claims beyond Auth.js defaults
- Need manual token management
- Building custom authentication flows

**When NOT to use:**
- Standard authentication flows → Use Auth.js v5
- Session management → Use Auth.js v5
- OAuth providers → Use Auth.js v5

## Data Models

### Auth.js v5 Session Structure

```typescript
// Provided by Auth.js v5
interface Session {
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  };
  expires: string;
}
```

### Custom JWT Payload (auth-service.ts)

```typescript
// Custom JWT system (preserved)
interface JWTPayload {
  sub: string; // userId
  email: string;
  subscription: 'free' | 'pro' | 'enterprise';
  iat: number;
  exp: number;
}

interface RefreshTokenPayload {
  sub: string; // userId
  jti: string; // JWT ID
  iat: number;
  exp: number;
}
```

## Error Handling

### Auth.js v5 Error Handling

```typescript
// In Server Components or Server Actions
try {
  const session = await requireAuth();
  // Use session
} catch (error) {
  // Handle unauthorized
  redirect('/auth/login');
}

// Or check manually
const session = await auth();
if (!session) {
  redirect('/auth/login');
}
```

### Custom JWT Error Handling

```typescript
// When using auth-service.ts
const result = await AuthService.signIn(email, password);
if (!result) {
  // Invalid credentials
  return { error: 'Invalid credentials' };
}

// Token verification
const payload = await AuthService.verifyAccessToken(token);
if (!payload) {
  // Invalid or expired token
  return { error: 'Invalid token' };
}
```

## Testing Strategy

### Unit Tests

1. **Auth Helpers Tests** (`tests/unit/lib/auth-helpers.test.ts`)
   - Test `getSession()` returns session when authenticated
   - Test `getSession()` returns null when not authenticated
   - Test `requireAuth()` returns session when authenticated
   - Test `requireAuth()` throws when not authenticated
   - Test `getCurrentUser()` returns user when authenticated
   - Test `requireUser()` throws when not authenticated

2. **Migration Validation Tests** (`tests/unit/auth-migration-validation.test.ts`)
   - Verify obsolete files are removed
   - Verify no imports from `next-auth/next`
   - Verify no imports from `next-auth/jwt`
   - Verify no usage of `getServerSession`
   - Verify no usage of `getToken`

### Integration Tests

1. **Auth Flow Tests** (`tests/integration/auth-flow.test.ts`)
   - Test login flow with credentials
   - Test OAuth flow (GitHub, Google)
   - Test session persistence
   - Test logout flow
   - Test protected route access

2. **Middleware Tests** (`tests/integration/middleware.test.ts`)
   - Test public route access without auth
   - Test protected route redirect to login
   - Test authenticated access to protected routes
   - Test redirect from auth pages when authenticated

### Regression Tests

1. **Auth Compatibility Tests** (`tests/regression/auth-compatibility.test.ts`)
   - Verify existing auth flows still work
   - Verify custom JWT system still works
   - Verify no breaking changes to API
   - Verify session data structure unchanged

## Migration Checklist

- [ ] Create `lib/auth-helpers.ts` with modern helpers
- [ ] Remove `lib/auth.ts` (obsolete stub)
- [ ] Remove `lib/server-auth.ts` (NextAuth v4)
- [ ] Remove `lib/middleware/api-auth.ts` (obsolete)
- [ ] Remove `lib/middleware/auth-middleware.ts` (obsolete)
- [ ] Remove `src/lib/platform-auth.ts` (NextAuth v4)
- [ ] Verify no imports from removed files
- [ ] Create migration documentation
- [ ] Add unit tests for auth helpers
- [ ] Add migration validation tests
- [ ] Update any code using old patterns

## Documentation

### Migration Guide Structure

1. **Overview**
   - What changed and why
   - Benefits of Auth.js v5

2. **Breaking Changes**
   - Removed files and their replacements
   - API changes

3. **Migration Steps**
   - Step-by-step guide
   - Code examples

4. **New Patterns**
   - How to use `auth()`
   - How to use helpers
   - When to use custom JWT system

5. **Troubleshooting**
   - Common issues
   - Solutions

## Security Considerations

1. **Session Security**
   - Auth.js v5 handles JWT signing automatically
   - Session tokens are httpOnly cookies
   - CSRF protection built-in

2. **Custom JWT System**
   - Refresh tokens are hashed before storage
   - Token rotation prevents replay attacks
   - Separate secrets for access and refresh tokens

3. **Environment Variables**
   - `NEXTAUTH_SECRET` - Auth.js v5 secret
   - `JWT_SECRET` - Custom JWT access token secret
   - `REFRESH_SECRET` - Custom JWT refresh token secret

## Performance Considerations

1. **Auth.js v5**
   - JWT strategy = no database lookups for session
   - Middleware runs on edge = fast route protection
   - Session caching handled automatically

2. **Custom JWT System**
   - Refresh token lookups require database access
   - Token rotation adds overhead
   - Use only when advanced features are needed

## Future Enhancements

1. **Potential Improvements**
   - Add more OAuth providers
   - Implement 2FA with Auth.js v5
   - Add session management UI
   - Migrate custom JWT features to Auth.js v5 when possible

2. **Deprecation Path**
   - Consider migrating custom JWT system to Auth.js v5 in future
   - Evaluate if refresh token rotation can be handled by Auth.js v5
   - Monitor Auth.js v5 feature additions
