# Middleware Migration Guide

## Overview

This guide explains how to migrate API routes from the old middleware system (`lib/api/middleware/`) to the corrected middleware system (`lib/middleware/`) that is compatible with Next.js 16.0.3 App Router.

## Why Migrate?

The old middleware system had type incompatibilities with Next.js 16 App Router. The new middleware system:

- ✅ Uses correct `RouteHandler` types compatible with Next.js 16
- ✅ Properly composes middlewares without type errors
- ✅ Follows Next.js App Router best practices
- ✅ Eliminates double exports and type mismatches

## Migration Steps

### Step 1: Update Imports

**Before:**
```typescript
import { withAuth } from '@/lib/api/middleware/auth';
import { withRateLimit } from '@/lib/api/middleware/rate-limit';
```

**After:**
```typescript
import { withAuth } from '@/lib/middleware/auth';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { withCsrf } from '@/lib/middleware/csrf';
import type { RouteHandler } from '@/lib/middleware/types';
```

### Step 2: Convert Handler to Named Function

**Before:**
```typescript
export const GET = withAuth(async (req) => {
  // handler logic
  return NextResponse.json({ data });
});
```

**After:**
```typescript
const myHandler: RouteHandler = async (req) => {
  // handler logic
  return NextResponse.json({ data });
};

export const GET = withAuth(myHandler);
```

### Step 3: Apply Middleware Composition

**Before:**
```typescript
export const POST = withRateLimit(withAuth(async (req) => {
  // handler logic
}));
```

**After:**
```typescript
const myHandler: RouteHandler = async (req) => {
  // handler logic
};

export const POST = withRateLimit(
  withAuth(myHandler),
  {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  }
);
```

### Step 4: Access User from Authenticated Request

**Before:**
```typescript
export const GET = withAuth(async (req) => {
  const userId = req.user.id; // TypeScript knows about req.user
});
```

**After:**
```typescript
const myHandler: RouteHandler = async (req) => {
  // Cast to access user property added by auth middleware
  const user = (req as any).user;
  if (!user || !user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = user.id;
};

export const GET = withAuth(myHandler);
```

### Step 5: Add CSRF Protection (for non-GET routes)

**Before:**
```typescript
export const POST = withAuth(async (req) => {
  // handler logic
});
```

**After:**
```typescript
const myHandler: RouteHandler = async (req) => {
  // handler logic
};

export const POST = withCsrf(withAuth(myHandler));
```

## Complete Examples

### Example 1: Simple GET Route with Auth

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import type { RouteHandler } from '@/lib/middleware/types';

const handler: RouteHandler = async (req: NextRequest) => {
  const user = (req as any).user;
  
  return NextResponse.json({
    message: 'Hello',
    userId: user.id,
  });
};

export const GET = withAuth(handler);
```

### Example 2: POST Route with Auth, CSRF, and Rate Limiting

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { withCsrf } from '@/lib/middleware/csrf';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import type { RouteHandler } from '@/lib/middleware/types';

const handler: RouteHandler = async (req: NextRequest) => {
  const user = (req as any).user;
  const body = await req.json();
  
  // Process request
  
  return NextResponse.json({ success: true });
};

export const POST = withRateLimit(
  withCsrf(withAuth(handler)),
  {
    maxRequests: 10,
    windowMs: 60 * 1000,
  }
);
```

### Example 3: Admin-Only Route

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import type { RouteHandler } from '@/lib/middleware/types';

const handler: RouteHandler = async (req: NextRequest) => {
  const user = (req as any).user;
  
  // Admin-only logic
  
  return NextResponse.json({ success: true });
};

export const POST = withAuth(handler, { requireAdmin: true });
```

### Example 4: Using Middleware Composition Helper

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { withCsrf } from '@/lib/middleware/csrf';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { composeMiddleware } from '@/lib/middleware/types';
import type { RouteHandler } from '@/lib/middleware/types';

const handler: RouteHandler = async (req: NextRequest) => {
  // handler logic
  return NextResponse.json({ success: true });
};

// Compose all middlewares
const composed = composeMiddleware([
  withCsrf,
  withAuth,
  (h: RouteHandler) => withRateLimit(h, { maxRequests: 10, windowMs: 60000 }),
]);

export const POST = composed(handler);
```

## Middleware Order

The recommended order for middleware composition is:

1. **Rate Limiting** (outermost) - Protects against abuse before any processing
2. **CSRF Protection** - Validates tokens before authentication
3. **Authentication** (innermost) - Verifies user identity last

```typescript
export const POST = withRateLimit(
  withCsrf(
    withAuth(handler)
  ),
  { maxRequests: 10, windowMs: 60000 }
);
```

## Common Pitfalls

### ❌ Don't: Double Export

```typescript
// BAD - This causes type errors
export const GET = withAuth(async (req) => {
  return NextResponse.json({ data });
});
export const GET = withRateLimit(GET, { maxRequests: 10, windowMs: 60000 });
```

### ✅ Do: Single Export with Composition

```typescript
// GOOD
const handler: RouteHandler = async (req) => {
  return NextResponse.json({ data });
};

export const GET = withRateLimit(
  withAuth(handler),
  { maxRequests: 10, windowMs: 60000 }
);
```

### ❌ Don't: Inline Anonymous Functions

```typescript
// BAD - Harder to debug and test
export const GET = withAuth(async (req) => {
  // complex logic
});
```

### ✅ Do: Named Handler Functions

```typescript
// GOOD - Easier to debug and test
const getUserData: RouteHandler = async (req) => {
  // complex logic
};

export const GET = withAuth(getUserData);
```

## Testing

After migration, ensure:

1. ✅ TypeScript compiles without errors
2. ✅ All tests pass
3. ✅ Middleware is applied in correct order
4. ✅ Rate limiting works as expected
5. ✅ CSRF protection is active for non-GET routes
6. ✅ Authentication checks work correctly

## Routes to Migrate

The following routes need to be migrated:

- [ ] `app/api/analytics/trends/route.ts`
- [ ] `app/api/instagram/publish/route.ts`
- [ ] `app/api/marketing/campaigns/route.ts`
- [ ] `app/api/marketing/campaigns/[id]/route.ts`
- [ ] `app/api/ai/quota/route.ts`
- [ ] `app/api/onlyfans/stats/route.ts`
- [ ] `app/api/ai/analyze-performance/route.ts`
- [ ] `app/api/onlyfans/content/route.ts`
- [ ] `app/api/ai/chat/route.ts`
- [ ] `app/api/onlyfans/fans/route.ts`
- [ ] `app/api/ai/optimize-sales/route.ts`
- [ ] `app/api/ai/generate-caption/route.ts`
- [ ] `app/api/integrations/connect/[provider]/route.ts`
- [ ] `app/api/integrations/disconnect/[provider]/[accountId]/route.ts`
- [ ] `app/api/integrations/status/route.ts`
- [ ] `app/api/integrations/refresh/[provider]/[accountId]/route.ts`
- [ ] `app/api/content/[id]/route.ts`
- [ ] `app/api/content/route.ts`

## Completed Migrations

- [x] `app/api/auth/login/route.ts`
- [x] `app/api/analytics/overview/route.ts`
- [x] `app/api/admin/feature-flags/route.ts` - ✅ Optimized with full test suite (40+ tests)

## Questions?

If you encounter issues during migration, refer to:
- Design document: `.kiro/specs/production-critical-fixes/design.md`
- Requirements: `.kiro/specs/production-critical-fixes/requirements.md`
- Middleware types: `lib/middleware/types.ts`
