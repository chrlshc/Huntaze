# Middleware Integration Guide

This guide shows how to integrate the new middleware system into API routes.

## Requirements

- **1.5**: API routes use middlewares correctly without double exports
- **3.1**: Protected routes use withAuth middleware
- **4.1**: State-changing routes use withCsrf middleware
- **5.1**: Public endpoints use withRateLimit middleware

## Middleware Types

### 1. withAuth - Authentication Middleware

Protects routes that require user authentication. Optionally requires admin role.

```typescript
import { withAuth } from '@/lib/middleware/auth';

// Basic authentication
export const GET = withAuth(handler);

// Admin-only authentication
export const POST = withAuth(handler, { requireAdmin: true });
```

### 2. withCsrf - CSRF Protection Middleware

Protects state-changing operations (POST, PUT, PATCH, DELETE) from CSRF attacks.
Automatically skips GET requests.

```typescript
import { withCsrf } from '@/lib/middleware/csrf';

export const POST = withCsrf(handler);
```

### 3. withRateLimit - Rate Limiting Middleware

Limits the number of requests per IP address to prevent abuse.

```typescript
import { withRateLimit } from '@/lib/middleware/rate-limit';

export const GET = withRateLimit(handler, {
  maxRequests: 60,
  windowMs: 60000, // 1 minute
});
```

### 4. composeMiddleware - Compose Multiple Middlewares

Combines multiple middlewares into a single wrapper. Middlewares are applied
in order from left to right (outer to inner).

```typescript
import { composeMiddleware } from '@/lib/middleware/types';

export const POST = composeMiddleware([
  (handler) => withRateLimit(handler, { maxRequests: 20, windowMs: 60000 }),
  withCsrf,
  withAuth,
])(handler);
```

## Integration Patterns

### Pattern 1: Public Endpoint (Rate Limiting Only)

For public endpoints that don't require authentication:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import type { RouteHandler } from '@/lib/middleware/types';

const handler: RouteHandler = async (req: NextRequest) => {
  return NextResponse.json({ data: 'public data' });
};

export const GET = withRateLimit(handler, {
  maxRequests: 100,
  windowMs: 60000,
});
```

### Pattern 2: Protected Read Endpoint (Auth + Rate Limiting)

For GET endpoints that require authentication:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/middleware/auth';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { composeMiddleware } from '@/lib/middleware/types';
import type { RouteHandler } from '@/lib/middleware/types';

const handler: RouteHandler = async (req: NextRequest) => {
  const userId = (req as AuthenticatedRequest).user?.id;
  return NextResponse.json({ userId, data: 'protected data' });
};

export const GET = composeMiddleware([
  (handler) => withRateLimit(handler, { maxRequests: 60, windowMs: 60000 }),
  withAuth,
])(handler);
```

### Pattern 3: Protected Write Endpoint (Auth + CSRF + Rate Limiting)

For POST/PUT/PATCH/DELETE endpoints that require authentication and CSRF protection:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/middleware/auth';
import { withCsrf } from '@/lib/middleware/csrf';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { composeMiddleware } from '@/lib/middleware/types';
import type { RouteHandler } from '@/lib/middleware/types';

const handler: RouteHandler = async (req: NextRequest) => {
  const userId = (req as AuthenticatedRequest).user?.id;
  const body = await req.json();
  
  // Process the request
  return NextResponse.json({ success: true });
};

export const POST = composeMiddleware([
  (handler) => withRateLimit(handler, { maxRequests: 20, windowMs: 60000 }),
  withCsrf,
  withAuth,
])(handler);
```

### Pattern 4: Admin-Only Endpoint (Admin Auth + CSRF + Rate Limiting)

For admin-only endpoints:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { withCsrf } from '@/lib/middleware/csrf';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { composeMiddleware } from '@/lib/middleware/types';
import type { RouteHandler } from '@/lib/middleware/types';

const getHandler: RouteHandler = async (req: NextRequest) => {
  return NextResponse.json({ data: 'admin data' });
};

const postHandler: RouteHandler = async (req: NextRequest) => {
  const body = await req.json();
  return NextResponse.json({ success: true });
};

// GET: Admin auth + rate limiting
export const GET = composeMiddleware([
  (handler) => withRateLimit(handler, { maxRequests: 60, windowMs: 60000 }),
  (handler) => withAuth(handler, { requireAdmin: true }),
])(getHandler);

// POST: Admin auth + CSRF + rate limiting
export const POST = composeMiddleware([
  (handler) => withRateLimit(handler, { maxRequests: 20, windowMs: 60000 }),
  withCsrf,
  (handler) => withAuth(handler, { requireAdmin: true }),
])(postHandler);
```

### Pattern 5: Multiple HTTP Methods

For routes with multiple HTTP methods:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/middleware/auth';
import { withCsrf } from '@/lib/middleware/csrf';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { composeMiddleware } from '@/lib/middleware/types';
import type { RouteHandler } from '@/lib/middleware/types';

// GET handler - read operation
const getHandler: RouteHandler = async (req: NextRequest) => {
  const userId = (req as AuthenticatedRequest).user?.id;
  return NextResponse.json({ userId, data: 'data' });
};

// POST handler - create operation
const postHandler: RouteHandler = async (req: NextRequest) => {
  const userId = (req as AuthenticatedRequest).user?.id;
  const body = await req.json();
  return NextResponse.json({ success: true });
};

// PUT handler - update operation
const putHandler: RouteHandler = async (req: NextRequest) => {
  const userId = (req as AuthenticatedRequest).user?.id;
  const body = await req.json();
  return NextResponse.json({ success: true });
};

// DELETE handler - delete operation
const deleteHandler: RouteHandler = async (req: NextRequest) => {
  const userId = (req as AuthenticatedRequest).user?.id;
  return NextResponse.json({ success: true });
};

// Apply middlewares
export const GET = composeMiddleware([
  (handler) => withRateLimit(handler, { maxRequests: 60, windowMs: 60000 }),
  withAuth,
])(getHandler);

export const POST = composeMiddleware([
  (handler) => withRateLimit(handler, { maxRequests: 20, windowMs: 60000 }),
  withCsrf,
  withAuth,
])(postHandler);

export const PUT = composeMiddleware([
  (handler) => withRateLimit(handler, { maxRequests: 20, windowMs: 60000 }),
  withCsrf,
  withAuth,
])(putHandler);

export const DELETE = composeMiddleware([
  (handler) => withRateLimit(handler, { maxRequests: 10, windowMs: 60000 }),
  withCsrf,
  withAuth,
])(deleteHandler);
```

## Migration Steps

### Step 1: Import Required Middleware

```typescript
import { withAuth, type AuthenticatedRequest } from '@/lib/middleware/auth';
import { withCsrf } from '@/lib/middleware/csrf';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { composeMiddleware } from '@/lib/middleware/types';
import type { RouteHandler } from '@/lib/middleware/types';
```

### Step 2: Convert Handler to RouteHandler Type

Change from:
```typescript
export async function GET(req: Request) {
  // handler code
}
```

To:
```typescript
const handler: RouteHandler = async (req: NextRequest) => {
  // handler code
};
```

### Step 3: Remove Old Auth Checks

Remove manual authentication checks like:
```typescript
const authResult = await requireAuth(request);
if (authResult instanceof Response) return authResult;
const userId = authResult.user.id;
```

Replace with accessing user from request:
```typescript
const userId = (req as AuthenticatedRequest).user?.id;
```

### Step 4: Remove Old CSRF Checks

Remove manual CSRF validation like:
```typescript
const csrfValidation = await validateCsrfToken(request);
if (!csrfValidation.valid) {
  return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
}
```

The middleware handles this automatically.

### Step 5: Apply Middlewares

Add middleware composition at the end:
```typescript
export const GET = composeMiddleware([
  (handler) => withRateLimit(handler, { maxRequests: 60, windowMs: 60000 }),
  withAuth,
])(handler);
```

## Rate Limit Recommendations

- **Public endpoints**: 100-200 requests/minute
- **Authenticated read endpoints**: 60 requests/minute
- **Authenticated write endpoints**: 20 requests/minute
- **Admin endpoints**: 60 requests/minute (read), 20 requests/minute (write)
- **Single-use endpoints** (e.g., onboarding complete): 5 requests/minute
- **Login/register**: 10 requests/minute

## Common Mistakes to Avoid

### ❌ Don't: Double export handlers

```typescript
// Wrong - double export
export async function POST(req: Request) { }
export const POST = withAuth(handler);
```

### ✅ Do: Single export with middleware

```typescript
// Correct - single export
const handler: RouteHandler = async (req: NextRequest) => { };
export const POST = withAuth(handler);
```

### ❌ Don't: Apply CSRF to GET requests

```typescript
// Wrong - CSRF on GET
export const GET = withCsrf(handler);
```

### ✅ Do: Skip CSRF for GET requests

```typescript
// Correct - no CSRF on GET
export const GET = withAuth(handler);
```

### ❌ Don't: Forget to type cast for user access

```typescript
// Wrong - TypeScript error
const userId = req.user.id;
```

### ✅ Do: Type cast to AuthenticatedRequest

```typescript
// Correct - proper type casting
const userId = (req as AuthenticatedRequest).user?.id;
```

## Examples from Codebase

### Example 1: Admin Feature Flags Route

See `app/api/admin/feature-flags/route.ts` for a complete example of:
- Admin-only authentication
- CSRF protection on POST
- Rate limiting on both GET and POST
- Multiple HTTP methods

### Example 2: User Profile Route

See `app/api/users/profile/route.ts` for a complete example of:
- User authentication
- CSRF protection on POST/PUT
- Rate limiting on all methods
- Multiple HTTP methods (GET, POST, PUT)

### Example 3: Onboarding Complete Route

See `app/api/onboarding/complete/route.ts` for a complete example of:
- User authentication
- CSRF protection
- Low rate limit for single-use endpoint
- Complex business logic with middleware

## Testing Middleware Integration

### Test Authentication

```bash
# Should return 401 without auth
curl -X GET http://localhost:3000/api/users/profile

# Should return 200 with auth
curl -X GET http://localhost:3000/api/users/profile \
  -H "Cookie: next-auth.session-token=..."
```

### Test CSRF Protection

```bash
# Should return 403 without CSRF token
curl -X POST http://localhost:3000/api/users/profile \
  -H "Cookie: next-auth.session-token=..." \
  -H "Content-Type: application/json" \
  -d '{"name":"test"}'

# Should return 200 with CSRF token
curl -X POST http://localhost:3000/api/users/profile \
  -H "Cookie: next-auth.session-token=...; csrf-token=..." \
  -H "X-CSRF-Token: ..." \
  -H "Content-Type: application/json" \
  -d '{"name":"test"}'
```

### Test Rate Limiting

```bash
# Make multiple requests quickly
for i in {1..100}; do
  curl -X GET http://localhost:3000/api/users/profile \
    -H "Cookie: next-auth.session-token=..."
done

# Should eventually return 429 Too Many Requests
```

## Troubleshooting

### Issue: TypeScript errors about NextRequest vs Request

**Solution**: Make sure to import `NextRequest` from `next/server` and use it in handler signatures.

### Issue: User is undefined in handler

**Solution**: Make sure to type cast the request to `AuthenticatedRequest` when accessing user data.

### Issue: CSRF validation failing

**Solution**: Ensure the client is:
1. Getting a CSRF token from `/api/csrf/token`
2. Sending it in both cookie and `X-CSRF-Token` header
3. Using the same token value in both places

### Issue: Rate limiting not working

**Solution**: Check that:
1. Redis is running and accessible
2. Environment variables are set correctly
3. The middleware is applied in the correct order (rate limit should be outermost)

## Next Steps

After integrating middlewares:

1. Test each route manually
2. Run integration tests
3. Check TypeScript compilation
4. Verify rate limiting with Redis
5. Test CSRF protection
6. Test authentication flows
7. Deploy to staging
8. Monitor logs for errors
