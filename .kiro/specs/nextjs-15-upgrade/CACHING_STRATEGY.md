# Next.js 15 Caching Strategy

## Overview

Next.js 15 introduces new caching defaults that require explicit configuration for dynamic routes.

## Key Changes

### 1. GET/HEAD Route Handlers
**Old Behavior (Next.js 14):** Not cached by default  
**New Behavior (Next.js 15):** Cached by default

**Action Required:** Add `export const dynamic = 'force-dynamic'` to routes that need fresh data

### 2. fetch() Requests
**Old Behavior (Next.js 14):** Cached by default  
**New Behavior (Next.js 15):** Not cached by default

**Action Required:** Add `cache: 'force-cache'` to fetch calls that should be cached

---

## Route Classification

### Dynamic Routes (Need `dynamic = 'force-dynamic'`)

These routes return user-specific or real-time data and should NOT be cached:

#### Authentication & User Routes
- `app/api/auth/**` - All auth routes
- `app/api/users/**` - User profile routes

#### Analytics Routes
- `app/api/analytics/overview/route.ts`
- `app/api/analytics/audience/route.ts`
- `app/api/analytics/trends/route.ts`
- `app/api/analytics/content/route.ts`
- `app/api/analytics/platform/[platform]/route.ts`

#### CRM Routes
- `app/api/crm/conversations/**`
- `app/api/crm/fans/**`
- `app/api/of/**`
- `app/api/onlyfans/**`

#### Content Routes
- `app/api/content/**` - All content management routes

#### Social Media Routes
- `app/api/tiktok/**`
- `app/api/instagram/**`
- `app/api/reddit/**`

#### Debug/Dev Routes
- `app/api/debug-**`
- `app/api/dev/**`
- `app/api/force-**`
- `app/api/bypass-**`

### Static/Cacheable Routes (Can use default caching)

These routes return data that can be cached:

- Public documentation endpoints (if any)
- Static configuration endpoints (if any)

**Note:** Currently, most of our API routes are dynamic and user-specific.

---

## Implementation Pattern

### For Dynamic Routes (Most Common)

```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Your dynamic logic here
  return NextResponse.json({ data: 'fresh data' });
}
```

### For Routes with Revalidation

```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Revalidate every hour
export const revalidate = 3600;

export async function GET(request: NextRequest) {
  // Your logic here
  return NextResponse.json({ data: 'cached for 1 hour' });
}
```

### For fetch() Calls That Should Be Cached

```typescript
// In any component or route
const response = await fetch('https://api.example.com/data', {
  cache: 'force-cache', // Explicitly cache
  next: { revalidate: 3600 } // Revalidate every hour
});
```

### For fetch() Calls That Should NOT Be Cached (Default in Next.js 15)

```typescript
// In any component or route
const response = await fetch('https://api.example.com/data', {
  cache: 'no-store' // Explicitly no cache (this is now the default)
});
```

---

## Migration Checklist

### Phase 1: Critical Routes (Week 2)
- [ ] Add `dynamic = 'force-dynamic'` to all auth routes
- [ ] Add `dynamic = 'force-dynamic'` to all analytics routes
- [ ] Add `dynamic = 'force-dynamic'` to all CRM routes

### Phase 2: Content & Social Routes (Week 3)
- [ ] Add `dynamic = 'force-dynamic'` to all content routes
- [ ] Add `dynamic = 'force-dynamic'` to all social media routes

### Phase 3: Review & Optimize (Week 4)
- [ ] Review all fetch() calls
- [ ] Add explicit caching where beneficial
- [ ] Test caching behavior in production

---

## Testing Caching Behavior

### Check if a Route is Cached

```bash
# Make a request and check response headers
curl -I https://your-app.com/api/example

# Look for:
# - Cache-Control headers
# - X-Next-Cache headers
```

### Verify Dynamic Rendering

```typescript
// Add logging in development
if (process.env.NODE_ENV === 'development') {
  console.log('[Route] Rendering at:', new Date().toISOString());
}
```

---

## Performance Considerations

### When to Use Caching
- ✅ Public data that changes infrequently
- ✅ Configuration data
- ✅ Static content

### When NOT to Use Caching
- ❌ User-specific data
- ❌ Real-time analytics
- ❌ Authentication data
- ❌ CRM data
- ❌ Content management data

---

## Next.js 15 Caching Defaults Summary

| Feature | Next.js 14 | Next.js 15 | Migration Action |
|---------|------------|------------|------------------|
| GET/HEAD routes | Not cached | **Cached** | Add `dynamic = 'force-dynamic'` |
| fetch() | **Cached** | Not cached | Add `cache: 'force-cache'` if needed |
| Client router cache | **Cached** | Not cached | No action needed |
| Page components | Cached | Cached | No change |

---

## Resources

- [Next.js 15 Caching Documentation](https://nextjs.org/docs/app/building-your-application/caching)
- [Route Segment Config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config)
- [fetch API Options](https://nextjs.org/docs/app/api-reference/functions/fetch)

---

**Status:** Strategy documented, ready for implementation in Phase 5
