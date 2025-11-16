# Design Document

## Overview

This design outlines the complete rollback from Auth.js v5 (beta) to NextAuth v4 (stable) to resolve 28 build errors in the staging environment. The rollback will restore the working authentication system while maintaining all security features, error handling, and Next.js 16 compatibility.

## Architecture

### Current State (Broken)
```
┌─────────────────────────────────────────────────────────┐
│ Package: next-auth@5.0.0-beta.30 (Auth.js v5)          │
├─────────────────────────────────────────────────────────┤
│ Configuration: auth.ts (v5 style)                       │
│ Route Handler: Uses handlers.GET/POST                   │
│ Session Utils: Uses auth() function                     │
├─────────────────────────────────────────────────────────┤
│ Problem: 28 files still import v4 APIs                  │
│ - getServerSession (not exported in v5)                 │
│ - authOptions (not exported in v5)                      │
└─────────────────────────────────────────────────────────┘
```

### Target State (Working)
```
┌─────────────────────────────────────────────────────────┐
│ Package: next-auth@^4.24.11 (NextAuth v4)              │
├─────────────────────────────────────────────────────────┤
│ Configuration: Inline in route handler                  │
│ Route Handler: Exports authOptions + NextAuth handlers  │
│ Session Utils: Uses getServerSession(authOptions)       │
├─────────────────────────────────────────────────────────┤
│ Result: All 28 files can import v4 APIs                 │
│ - getServerSession ✓                                    │
│ - authOptions ✓                                         │
└─────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Package Configuration (package.json)

**Changes:**
```json
{
  "dependencies": {
    "next-auth": "^4.24.11"  // Downgrade from 5.0.0-beta.30
  }
}
```

**Rationale:** NextAuth v4 is stable, well-documented, and compatible with Next.js 16. Version 4.24.11 is the latest v4 release.

### 2. Authentication Route Handler (app/api/auth/[...nextauth]/route.ts)

**Interface:**
```typescript
// Exports
export const authOptions: AuthOptions;
export const GET: (req: NextRequest) => Promise<Response>;
export const POST: (req: NextRequest) => Promise<Response>;
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
```

**Structure:**
```typescript
import NextAuth, { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

// 1. Define authOptions (exported for use in other files)
export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({ /* config */ }),
    CredentialsProvider({ /* config */ })
  ],
  callbacks: {
    async jwt({ token, user, account }) { /* ... */ },
    async session({ session, token }) { /* ... */ }
  },
  pages: {
    signIn: '/auth',
    error: '/auth'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET
};

// 2. Create handlers
const handler = NextAuth(authOptions);

// 3. Export handlers with runtime config
export { handler as GET, handler as POST };
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
```

**Key Design Decisions:**
- Export `authOptions` so other files can import it
- Use `NextAuth()` function to create handlers (v4 API)
- Maintain Node.js runtime for database connections
- Keep all existing providers and callbacks
- Preserve error handling and logging

### 3. Session Management (lib/auth/session.ts)

**Interface:**
```typescript
// Core Functions
export async function getSession(): Promise<ExtendedSession | null>;
export async function getCurrentUser(): Promise<ExtendedUser | null>;
export async function getCurrentUserId(): Promise<string | null>;
export async function requireAuth(): Promise<ExtendedSession>;
export async function requireRole(roles: string[]): Promise<ExtendedSession>;
export async function isAuthenticated(): Promise<boolean>;

// Ownership Validation
export function validateOwnership(session: ExtendedSession | null, ownerId: string): boolean;
export async function requireOwnership(ownerId: string): Promise<void>;
```

**Implementation Pattern:**
```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function getSession(): Promise<ExtendedSession | null> {
  try {
    const session = await getServerSession(authOptions);
    return session as ExtendedSession | null;
  } catch (error) {
    logAuthError(AuthError.JWT_ERROR, { error });
    return null;
  }
}
```

**Key Design Decisions:**
- Import `getServerSession` from `next-auth` (v4 API)
- Import `authOptions` from route handler
- Pass `authOptions` to `getServerSession()` for configuration
- Maintain all existing helper functions
- Keep error handling and logging

### 4. Auth Configuration Cleanup

**Files to Remove/Rename:**
- `auth.ts` (root level) - Auth.js v5 configuration file

**Rationale:** This file uses v5 APIs and will conflict with v4 configuration. It should be removed or renamed to `auth.ts.v5-backup` for reference.

## Data Models

### Session Type (Unchanged)
```typescript
interface ExtendedSession extends Session {
  user: ExtendedUser;
  error?: AuthError;
}

interface ExtendedUser extends User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role?: string;
  creatorId?: string;
  emailVerified?: Date;
}
```

### AuthOptions Configuration
```typescript
interface AuthOptions {
  providers: Provider[];
  callbacks?: {
    jwt?: (params: JWTParams) => Promise<JWT>;
    session?: (params: SessionParams) => Promise<Session>;
  };
  pages?: {
    signIn?: string;
    error?: string;
  };
  session?: {
    strategy: 'jwt' | 'database';
    maxAge?: number;
  };
  secret?: string;
}
```

## Error Handling

### Error Types (Preserved)
```typescript
export enum AuthError {
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  JWT_ERROR = 'JWT_ERROR',
  ACCESS_DENIED = 'ACCESS_DENIED',
  SESSION_REQUIRED = 'SESSION_REQUIRED'
}
```

### Error Handling Strategy
1. **Route Handler Level**: Wrap NextAuth handlers with try-catch for logging
2. **Session Utility Level**: Catch errors in getSession() and return null
3. **Application Level**: Use requireAuth() to throw errors for protected routes
4. **Logging**: Maintain correlation IDs and structured logging

## Testing Strategy

### 1. Build Verification
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Build test
npm run build

# Expected: 0 errors, successful build
```

### 2. Type Checking
```bash
# Check for TypeScript errors
npx tsc --noEmit

# Expected: 0 errors
```

### 3. Import Verification
```bash
# Search for v5 imports (should find none)
grep -r "from '@/auth'" app/ lib/

# Search for v4 imports (should find all)
grep -r "from 'next-auth'" app/ lib/
grep -r "authOptions" app/ lib/
```

### 4. Runtime Testing
```bash
# Start dev server
npm run dev

# Test endpoints:
# 1. GET /api/auth/session - Should return session or null
# 2. GET /api/auth/providers - Should return provider list
# 3. POST /api/auth/signin - Should authenticate user
# 4. GET /auth - Should display sign-in page
```

### 5. Integration Testing
- Test credential sign-in flow
- Test Google OAuth flow
- Test protected route access
- Test session persistence
- Test sign-out flow

## Migration Path

### Phase 1: Package Downgrade
1. Update package.json to `next-auth@^4.24.11`
2. Delete node_modules and package-lock.json
3. Run `npm install`
4. Verify correct version installed

### Phase 2: Route Handler Restoration
1. Backup current route handler
2. Restore NextAuth v4 route handler structure
3. Export authOptions configuration
4. Export GET/POST handlers from NextAuth()
5. Maintain all providers and callbacks

### Phase 3: Session Utilities Update
1. Update imports to use getServerSession
2. Import authOptions from route handler
3. Pass authOptions to getServerSession()
4. Verify all helper functions work

### Phase 4: Configuration Cleanup
1. Rename auth.ts to auth.ts.v5-backup
2. Remove any remaining v5 imports
3. Update any middleware if needed

### Phase 5: Verification
1. Run build and verify success
2. Run type checking
3. Test authentication flows
4. Deploy to staging
5. Verify production functionality

## Security Considerations

### Preserved Security Features
1. **NEXTAUTH_SECRET**: Environment variable for JWT signing
2. **NEXTAUTH_URL**: Canonical URL for OAuth callbacks
3. **Secure Cookies**: httpOnly, secure, sameSite settings
4. **CSRF Protection**: Built into NextAuth
5. **Rate Limiting**: Integration with rate limiter middleware
6. **Session Expiry**: 30-day JWT expiration
7. **Password Hashing**: bcrypt for credentials

### Security Validation Checklist
- [ ] NEXTAUTH_SECRET is set in all environments
- [ ] NEXTAUTH_URL matches deployment URL
- [ ] OAuth credentials are valid
- [ ] Session cookies are secure
- [ ] CSRF tokens are validated
- [ ] Rate limiting is active
- [ ] Error messages don't leak sensitive data

## Performance Considerations

### Expected Performance
- **Build Time**: Should remain similar (~30-40 seconds)
- **Runtime Performance**: NextAuth v4 is mature and optimized
- **Session Retrieval**: ~10-50ms (JWT validation)
- **Authentication**: ~100-500ms (database lookup)

### Optimization Opportunities
- Session caching (if needed)
- Database connection pooling (already implemented)
- JWT token optimization (already configured)

## Rollback Plan

If this rollback fails, we can:
1. Restore from git: `git checkout HEAD~1`
2. Reinstall dependencies: `npm install`
3. Investigate specific errors
4. Consider completing v5 migration instead (28 file updates)

## Success Criteria

✅ Build completes with 0 errors
✅ All 28 files can import authOptions and getServerSession
✅ Authentication flows work (credentials + OAuth)
✅ Protected routes enforce authentication
✅ Session management functions correctly
✅ Error handling and logging preserved
✅ Security features maintained
✅ Staging deployment succeeds
