# Next.js 15 Breaking Changes

## Overview

This document outlines all breaking changes introduced in the upgrade from Next.js 14.2.32 to Next.js 15.5.6, along with React 19 upgrade.

**Upgrade Date**: November 2, 2025  
**Previous Version**: Next.js 14.2.32 + React 18  
**Current Version**: Next.js 15.5.6 + React 19

---

## 1. Async Request APIs

### Summary
Several Next.js request APIs are now asynchronous and must be awaited.

### Affected APIs
- `cookies()`
- `headers()`
- `draftMode()`
- Route `params`
- Route `searchParams`

### Migration Examples

#### cookies()

**Before (Next.js 14)**:
```typescript
import { cookies } from 'next/headers';

export function MyComponent() {
  const cookieStore = cookies();
  const token = cookieStore.get('token');
  return <div>{token?.value}</div>;
}
```

**After (Next.js 15)**:
```typescript
import { cookies } from 'next/headers';

export async function MyComponent() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token');
  return <div>{token?.value}</div>;
}
```

#### headers()

**Before (Next.js 14)**:
```typescript
import { headers } from 'next/headers';

export function MyComponent() {
  const headersList = headers();
  const userAgent = headersList.get('user-agent');
  return <div>{userAgent}</div>;
}
```

**After (Next.js 15)**:
```typescript
import { headers } from 'next/headers';

export async function MyComponent() {
  const headersList = await headers();
  const userAgent = headersList.get('user-agent');
  return <div>{userAgent}</div>;
}
```

#### params in API Routes

**Before (Next.js 14)**:
```typescript
// app/api/users/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = params.id;
  // ...
}
```

**After (Next.js 15)**:
```typescript
// app/api/users/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ...
}
```

#### params in Page Components

**Before (Next.js 14)**:
```typescript
// app/users/[id]/page.tsx
export default function UserPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  return <div>User {params.id}</div>;
}
```

**After (Next.js 15)**:
```typescript
// app/users/[id]/page.tsx
export default async function UserPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  return <div>User {id}</div>;
}
```

### Impact
- **Files Affected**: 65+ files
- **Severity**: HIGH
- **Required Action**: Add `await` to all async API calls

---

## 2. Caching Behavior Changes

### Summary
Default caching behavior has changed for several Next.js features.

### Changes

#### 2.1 fetch() Requests

**Before (Next.js 14)**:
```typescript
// Cached by default
const data = await fetch('https://api.example.com/data');
```

**After (Next.js 15)**:
```typescript
// NOT cached by default - must opt-in
const data = await fetch('https://api.example.com/data', {
  cache: 'force-cache' // Explicitly cache
});

// Or for dynamic data
const data = await fetch('https://api.example.com/data', {
  cache: 'no-store' // Explicitly no cache
});
```

#### 2.2 GET Route Handlers

**Before (Next.js 14)**:
```typescript
// app/api/data/route.ts
export async function GET() {
  // NOT cached by default
  return NextResponse.json({ data: 'value' });
}
```

**After (Next.js 15)**:
```typescript
// app/api/data/route.ts
// NOW cached by default - must opt-out for dynamic data
export const dynamic = 'force-dynamic'; // Opt-out of caching

export async function GET() {
  return NextResponse.json({ data: 'value' });
}
```

#### 2.3 Client Router Cache

**Before (Next.js 14)**:
- Client-side navigation cached by default

**After (Next.js 15)**:
- Client-side navigation NOT cached by default
- Improves data freshness
- May increase server requests

### Impact
- **Files Affected**: 35+ fetch calls, 80+ API routes
- **Severity**: MEDIUM
- **Required Action**: Add explicit cache configuration

---

## 3. Configuration Changes

### 3.1 TypeScript Configuration

**Before (Next.js 14)**:
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // configuration
};

module.exports = nextConfig;
```

**After (Next.js 15)**:
```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // configuration
};

export default nextConfig;
```

### 3.2 New Configuration Options

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  // New caching configuration
  cacheHandler: process.env.CACHE_HANDLER_PATH,
  cacheMaxMemorySize: 50 * 1024 * 1024, // 50MB
  
  // Experimental features
  experimental: {
    turbo: {}, // Turbopack support
    ppr: false, // Partial Prerendering
    reactCompiler: false, // React Compiler
  },
};
```

### Impact
- **Files Affected**: 1 (next.config.js → next.config.ts)
- **Severity**: LOW
- **Required Action**: Migrate to TypeScript config

---

## 4. React 19 Changes

### 4.1 Improved Hydration Errors

React 19 provides better error messages for hydration mismatches.

**Example Error (React 19)**:
```
Hydration failed because the server rendered HTML didn't match the client.
Expected: <div>Server</div>
Received: <div>Client</div>
```

### 4.2 Server Components

React 19 has better support for async Server Components.

```typescript
// Now fully supported
export default async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}
```

### 4.3 Enhanced Server Actions

Server Actions have improved error handling and type safety.

```typescript
'use server';

export async function submitForm(formData: FormData) {
  // Better error handling
  try {
    await saveData(formData);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### Impact
- **Severity**: LOW
- **Required Action**: None (improvements only)

---

## 5. Deprecated Features

### 5.1 Removed Experimental Flags

The following experimental flags have been removed:

```typescript
// REMOVED in Next.js 15
experimental: {
  appDir: true, // Now stable
  serverActions: true, // Now stable
}
```

### 5.2 Legacy Image Component

The legacy `next/legacy/image` component is deprecated.

**Migration**:
```typescript
// Before
import Image from 'next/legacy/image';

// After
import Image from 'next/image';
```

---

## 6. Performance Improvements

### 6.1 Build Performance

- **Build Time**: -16% improvement (12s → 10.1s)
- **Bundle Size**: -3% reduction (105 kB → 102 kB)
- **API Overhead**: -4% reduction (650 B → 622 B)

### 6.2 Runtime Performance

- Better code splitting
- Improved tree shaking
- Faster hydration

---

## 7. Migration Checklist

### Critical Changes
- [ ] Update all `cookies()` calls to use `await`
- [ ] Update all `headers()` calls to use `await`
- [ ] Update all `params` to be async in routes
- [ ] Add explicit cache configuration to fetch calls
- [ ] Add `dynamic = 'force-dynamic'` to dynamic API routes

### Configuration Changes
- [ ] Migrate next.config.js to next.config.ts
- [ ] Remove deprecated experimental flags
- [ ] Configure caching strategy

### Testing
- [ ] Run full test suite
- [ ] Test authentication flows
- [ ] Test API routes
- [ ] Test dynamic pages
- [ ] Verify caching behavior

---

## 8. Troubleshooting

### Common Issues

#### Issue: "cookies is not a function"
**Cause**: Missing `await` keyword  
**Solution**: Add `await` before `cookies()`

```typescript
// Wrong
const cookieStore = cookies();

// Correct
const cookieStore = await cookies();
```

#### Issue: "params is undefined"
**Cause**: Not awaiting params  
**Solution**: Await params and destructure

```typescript
// Wrong
const id = params.id;

// Correct
const { id } = await params;
```

#### Issue: "Data not updating"
**Cause**: Unexpected caching  
**Solution**: Add explicit cache configuration

```typescript
// For dynamic data
export const dynamic = 'force-dynamic';

// Or in fetch
fetch(url, { cache: 'no-store' });
```

---

## 9. Resources

### Official Documentation
- [Next.js 15 Upgrade Guide](https://nextjs.org/docs/app/building-your-application/upgrading)
- [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
- [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching)

### Internal Documentation
- [Migration Guide](./NEXTJS_15_MIGRATION_GUIDE.md)
- [Configuration Guide](./NEXTJS_15_CONFIGURATION.md)
- [Performance Analysis](./.kiro/specs/nextjs-15-upgrade/PHASE_9_PERFORMANCE_COMPLETE.md)

---

## 10. Support

For questions or issues:
1. Check this documentation
2. Review the migration guide
3. Check Next.js 15 documentation
4. Contact the development team

---

**Last Updated**: November 2, 2025  
**Version**: 1.0  
**Status**: Complete
