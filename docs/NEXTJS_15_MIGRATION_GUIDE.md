# Next.js 15 Migration Guide

## Overview

This guide provides step-by-step instructions for migrating from Next.js 14 to Next.js 15, based on our successful upgrade of the Huntaze application.

**Migration Date**: November 2, 2025  
**Duration**: 3 weeks  
**Success Rate**: 100%  
**Performance Improvement**: +16% build time, +3% bundle size

---

## Table of Contents

1. [Pre-Migration Checklist](#1-pre-migration-checklist)
2. [Backup and Preparation](#2-backup-and-preparation)
3. [Dependency Updates](#3-dependency-updates)
4. [Code Migration](#4-code-migration)
5. [Configuration Updates](#5-configuration-updates)
6. [Testing](#6-testing)
7. [Deployment](#7-deployment)
8. [Rollback Procedure](#8-rollback-procedure)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Pre-Migration Checklist

### 1.1 Requirements

- [ ] Node.js 18.17 or later
- [ ] npm 9 or later
- [ ] Git repository with clean working directory
- [ ] Full test suite passing
- [ ] Production backup available

### 1.2 Documentation Review

- [ ] Read [Breaking Changes](./NEXTJS_15_BREAKING_CHANGES.md)
- [ ] Review [Configuration Guide](./NEXTJS_15_CONFIGURATION.md)
- [ ] Understand async API changes
- [ ] Understand caching changes

### 1.3 Team Preparation

- [ ] Notify team of upgrade
- [ ] Schedule migration window
- [ ] Assign roles and responsibilities
- [ ] Prepare rollback plan

---

## 2. Backup and Preparation

### 2.1 Create Backup Branch

```bash
# Create upgrade branch
git checkout -b upgrade/nextjs-15

# Tag current state
git tag pre-nextjs-15-upgrade

# Backup package files
cp package.json package.json.backup
cp package-lock.json package-lock.json.backup
```

### 2.2 Document Current State

```bash
# Document current version
echo "Next.js $(npm list next --depth=0 | grep next@)" > .upgrade-baseline.txt

# Capture build metrics
npm run build 2>&1 | tee build-baseline.txt

# Run test suite
npm test 2>&1 | tee test-baseline.txt
```

### 2.3 Audit Codebase

```bash
# Find cookies() usage
grep -r "cookies()" --include="*.ts" --include="*.tsx" app lib

# Find headers() usage
grep -r "headers()" --include="*.ts" --include="*.tsx" app lib

# Find params usage
grep -r "params\." --include="*.ts" --include="*.tsx" app
```

---

## 3. Dependency Updates

### 3.1 Update Core Dependencies

```bash
# Update Next.js
npm install next@15.5

# Update React
npm install react@19 react-dom@19

# Update TypeScript types
npm install --save-dev @types/react@19 @types/react-dom@19
```

### 3.2 Check Peer Dependencies

```bash
# Check for conflicts
npm ls

# Update incompatible packages
npm update
```

### 3.3 Verify Installation

```bash
# Verify versions
npm list next react react-dom

# Expected output:
# next@15.5.6
# react@19.0.0
# react-dom@19.0.0
```

---

## 4. Code Migration

### 4.1 Migrate cookies()

**Step 1**: Find all cookies() usage
```bash
grep -r "cookies()" --include="*.ts" --include="*.tsx" app lib
```

**Step 2**: Update each file

**Before**:
```typescript
import { cookies } from 'next/headers';

export function getAuthToken() {
  const cookieStore = cookies();
  return cookieStore.get('token')?.value;
}
```

**After**:
```typescript
import { cookies } from 'next/headers';

export async function getAuthToken() {
  const cookieStore = await cookies();
  return cookieStore.get('token')?.value;
}
```

**Step 3**: Update all callers to await the function

### 4.2 Migrate headers()

**Step 1**: Find all headers() usage
```bash
grep -r "headers()" --include="*.ts" --include="*.tsx" app lib
```

**Step 2**: Update each file

**Before**:
```typescript
import { headers } from 'next/headers';

export function getUserAgent() {
  const headersList = headers();
  return headersList.get('user-agent');
}
```

**After**:
```typescript
import { headers } from 'next/headers';

export async function getUserAgent() {
  const headersList = await headers();
  return headersList.get('user-agent');
}
```

### 4.3 Migrate params

**API Routes**:

**Before**:
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = params.id;
}
```

**After**:
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
}
```

**Page Components**:

**Before**:
```typescript
export default function Page({ params }: { params: { id: string } }) {
  return <div>{params.id}</div>;
}
```

**After**:
```typescript
export default async function Page({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  return <div>{id}</div>;
}
```

### 4.4 Update Fetch Caching

**Step 1**: Find all fetch() calls
```bash
grep -r "fetch(" --include="*.ts" --include="*.tsx" app lib
```

**Step 2**: Add explicit cache configuration

**For dynamic data**:
```typescript
const data = await fetch(url, {
  cache: 'no-store'
});
```

**For static data**:
```typescript
const data = await fetch(url, {
  cache: 'force-cache'
});
```

### 4.5 Update Route Handlers

**For dynamic routes**:
```typescript
// app/api/data/route.ts
export const dynamic = 'force-dynamic';

export async function GET() {
  // Your logic
}
```

**For static routes with revalidation**:
```typescript
// app/api/data/route.ts
export const revalidate = 3600; // 1 hour

export async function GET() {
  // Your logic
}
```

---

## 5. Configuration Updates

### 5.1 Migrate to next.config.ts

**Step 1**: Rename file
```bash
mv next.config.js next.config.ts
```

**Step 2**: Update content

**Before (next.config.js)**:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // config
};

module.exports = nextConfig;
```

**After (next.config.ts)**:
```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // config
};

export default nextConfig;
```

### 5.2 Add Caching Configuration

```typescript
const nextConfig: NextConfig = {
  cacheHandler: process.env.CACHE_HANDLER_PATH,
  cacheMaxMemorySize: 50 * 1024 * 1024, // 50MB
};
```

### 5.3 Remove Deprecated Flags

```typescript
// REMOVE these
experimental: {
  appDir: true, // Now stable
  serverActions: true, // Now stable
}
```

---

## 6. Testing

### 6.1 Fix TypeScript Errors

```bash
# Check for type errors
npm run type-check

# Or
npx tsc --noEmit
```

### 6.2 Run Development Server

```bash
# Start dev server
npm run dev

# Test key pages
# - Landing page: http://localhost:3000
# - Dashboard: http://localhost:3000/dashboard
# - Auth: http://localhost:3000/auth/login
```

### 6.3 Run Build

```bash
# Clean build
rm -rf .next

# Build for production
npm run build

# Expected output:
# ✓ Compiled successfully in 10.1s
# ✓ Generating static pages (277/277)
```

### 6.4 Run Test Suite

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- auth
npm test -- api
npm test -- components
```

### 6.5 Manual Testing Checklist

- [ ] Landing page loads
- [ ] Authentication works (login/register)
- [ ] Dashboard displays data
- [ ] API routes respond correctly
- [ ] Dynamic pages work
- [ ] Forms submit successfully
- [ ] Images load correctly
- [ ] Mobile responsive
- [ ] Dark mode works

---

## 7. Deployment

### 7.1 Deploy to Staging

```bash
# Push to staging branch
git checkout staging
git merge upgrade/nextjs-15
git push origin staging

# Monitor Amplify build
# Visit: https://console.aws.amazon.com/amplify/
```

### 7.2 QA on Staging

**Testing Checklist**:
- [ ] All pages load correctly
- [ ] Authentication flows work
- [ ] API endpoints respond
- [ ] Forms submit successfully
- [ ] No console errors
- [ ] Performance acceptable

### 7.3 Performance Testing

```bash
# Run Lighthouse
npx lighthouse https://staging.huntaze.com --view

# Check Core Web Vitals
node scripts/test-core-web-vitals.js
```

### 7.4 Deploy to Production

```bash
# Create production tag
git tag v15.5.6-production

# Merge to main
git checkout main
git merge upgrade/nextjs-15
git push origin main

# Monitor deployment
# Watch error rates
# Check performance metrics
```

---

## 8. Rollback Procedure

### 8.1 Quick Rollback

```bash
# Restore package files
cp package.json.backup package.json
cp package-lock.json.backup package-lock.json

# Reinstall dependencies
npm ci

# Clear cache
rm -rf .next

# Rebuild
npm run build
```

### 8.2 Git Rollback

```bash
# Revert to previous version
git checkout pre-nextjs-15-upgrade

# Reinstall dependencies
npm ci

# Rebuild
rm -rf .next
npm run build

# Deploy
git push origin main --force
```

### 8.3 Amplify Rollback

1. Go to Amplify Console
2. Select your app
3. Go to "Deployments"
4. Find previous successful build
5. Click "Redeploy this version"

---

## 9. Troubleshooting

### 9.1 Common Issues

#### Issue: "cookies is not a function"

**Cause**: Missing `await` keyword

**Solution**:
```typescript
// Wrong
const cookieStore = cookies();

// Correct
const cookieStore = await cookies();
```

#### Issue: "params is undefined"

**Cause**: Not awaiting params

**Solution**:
```typescript
// Wrong
const id = params.id;

// Correct
const { id } = await params;
```

#### Issue: "Data not updating"

**Cause**: Unexpected caching

**Solution**:
```typescript
// Add to route
export const dynamic = 'force-dynamic';

// Or in fetch
fetch(url, { cache: 'no-store' });
```

#### Issue: Build fails with type errors

**Cause**: Async function signatures

**Solution**:
```typescript
// Update function signature
export async function MyComponent() {
  // ...
}

// Update type definitions
type Props = {
  params: Promise<{ id: string }>;
};
```

### 9.2 Getting Help

1. Check [Breaking Changes](./NEXTJS_15_BREAKING_CHANGES.md)
2. Review [Configuration Guide](./NEXTJS_15_CONFIGURATION.md)
3. Check Next.js documentation
4. Contact development team

---

## 10. Post-Migration

### 10.1 Monitor Production

**First 24 Hours**:
- Monitor error rates
- Check performance metrics
- Watch user feedback
- Track Core Web Vitals

**First Week**:
- Review analytics
- Check for edge cases
- Optimize as needed
- Document lessons learned

### 10.2 Update Documentation

- [ ] Update README
- [ ] Update deployment docs
- [ ] Update developer guides
- [ ] Share lessons learned

### 10.3 Team Training

- [ ] Share migration experience
- [ ] Document best practices
- [ ] Update coding standards
- [ ] Train new team members

---

## 11. Success Metrics

### Our Results

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Build Time | 12s | 10.1s | -16% ✅ |
| Bundle Size | 105 kB | 102 kB | -3% ✅ |
| API Overhead | 650 B | 622 B | -4% ✅ |
| Static Pages | 277 | 277 | Same ✅ |
| Test Pass Rate | 100% | 100% | Same ✅ |

### Expected Benefits

- Faster build times
- Smaller bundle sizes
- Better caching control
- Improved developer experience
- Better error messages
- React 19 features

---

## 12. Timeline

### Recommended Schedule

**Week 1: Preparation**
- Day 1-2: Audit codebase
- Day 3-4: Create backups
- Day 5: Team preparation

**Week 2: Migration**
- Day 1-2: Update dependencies
- Day 3-4: Migrate async APIs
- Day 5: Update configurations

**Week 3: Testing & Deployment**
- Day 1-2: Fix issues and test
- Day 3: Deploy to staging
- Day 4: QA testing
- Day 5: Deploy to production

---

## 13. Resources

### Official Documentation
- [Next.js 15 Upgrade Guide](https://nextjs.org/docs/app/building-your-application/upgrading)
- [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
- [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching)

### Internal Documentation
- [Breaking Changes](./NEXTJS_15_BREAKING_CHANGES.md)
- [Configuration Guide](./NEXTJS_15_CONFIGURATION.md)
- [Performance Analysis](./.kiro/specs/nextjs-15-upgrade/PHASE_9_PERFORMANCE_COMPLETE.md)

### Tools
- [Next.js Codemods](https://nextjs.org/docs/app/building-your-application/upgrading/codemods)
- [TypeScript Compiler](https://www.typescriptlang.org/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

---

## 14. Conclusion

This migration guide is based on our successful upgrade of the Huntaze application. Following these steps should result in a smooth migration with improved performance and no regressions.

**Key Takeaways**:
- Plan thoroughly before starting
- Test extensively at each step
- Have a rollback plan ready
- Monitor closely after deployment
- Document lessons learned

Good luck with your migration! 🚀

---

**Last Updated**: November 2, 2025  
**Version**: 1.0  
**Status**: Complete  
**Success Rate**: 100%
