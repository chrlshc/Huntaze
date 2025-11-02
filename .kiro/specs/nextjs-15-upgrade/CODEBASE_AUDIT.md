# Next.js 15 Upgrade - Codebase Audit Report

**Date**: November 2, 2025  
**Auditor**: Kiro AI  
**Current Version**: Next.js 14.2.32

## Executive Summary

This audit identifies all code that will require changes for Next.js 15 compatibility. The main breaking changes involve async request APIs: `cookies()`, `headers()`, and route `params`.

## 1. cookies() Usage - CRITICAL ⚠️

**Total Files**: 11 files need updates

### Files Requiring Async Migration:

1. **lib/services/tiktok.ts** (3 usages)
   - `getAccessToken()` - Line 24
   - `getCurrentUser()` - Line 30
   - `disconnect()` - Line 129

2. **lib/auth/jwt.ts** (8 usages)
   - `setAuthCookies()` - Lines 71, 76
   - `getCurrentUser()` - Line 84
   - `clearAuthCookies()` - Lines 95, 96, 97
   - `refreshAccessToken()` - Lines 102, 125, 133

3. **app/api/onboarding/complete/route.ts** (1 usage)
   - Line 14

4. **app/api/force-complete-onboarding/route.ts** (3 usages)
   - Lines 6, 32 (2x)

5. **app/api/debug-tiktok/route.ts** (1 usage)
   - Line 5

6. **app/api/_lib/upstream.ts** (1 usage)
   - Line 16

7. **app/api/auth/instagram/route.ts** (1 usage)
   - Line 33 ✅ Already async!

8. **app/api/auth/instagram/callback/route.ts** (1 usage)
   - Line 46 ✅ Already async!

9. **app/api/auth/reddit/callback/route.ts** (2 usages)
   - Lines 40, 48

10. **app/api/auth/reddit/route.ts** (1 usage)
    - Line 39

11. **app/api/bypass-onboarding/route.ts** (2 usages)
    - Lines 10, 17

### Priority: HIGH
- **lib/auth/jwt.ts** - Core authentication, affects entire app
- **lib/services/tiktok.ts** - Social integration functionality

## 2. headers() Usage - MEDIUM ⚠️

**Total Files**: 1 file needs update

### Files Requiring Async Migration:

1. **app/api/subscriptions/webhook/route.ts** (1 usage)
   - Line 31 - Stripe signature validation

### Priority: MEDIUM
- Stripe webhook validation is critical but isolated

## 3. params Usage - CRITICAL ⚠️

**Total Files**: 35+ route handlers need updates

### Dynamic Route Handlers (Must be made async):

All these files use `{ params }: { params: { ... } }` pattern:

#### High Priority (User-facing):
1. `app/api/tiktok/status/[publishId]/route.ts`
2. `app/api/content/media/[id]/route.ts`
3. `app/api/content/media/[id]/edit/route.ts`
4. `app/api/content/media/[id]/edit-video/route.ts`
5. `app/api/content/schedule/[id]/route.ts`
6. `app/api/content/variations/[id]/route.ts`
7. `app/api/content/variations/[id]/track/route.ts`
8. `app/api/content/variations/[id]/assign/route.ts`
9. `app/api/content/variations/[id]/stats/route.ts`
10. `app/api/content/templates/[id]/use/route.ts`

#### Medium Priority (CRM/Analytics):
11. `app/api/crm/fans/[id]/route.ts`
12. `app/api/crm/conversations/[id]/route.ts`
13. `app/api/crm/conversations/[id]/messages/route.ts`
14. `app/api/crm/conversations/[id]/typing/route.ts`
15. `app/api/analytics/platform/[platform]/route.ts`
16. `app/api/of/campaigns/[id]/route.ts`
17. `app/api/of/campaigns/[id]/[action]/route.ts`
18. `app/api/of/threads/[id]/route.ts`

#### Lower Priority (Misc):
19. `app/api/schedule/[id]/route.ts`
20. `app/api/messages/[id]/read/route.ts`
21. `app/api/repost/items/[id]/schedule/route.ts`
22. `app/api/roadmap/proposals/[id]/vote/route.ts`
23. `app/api/onlyfans/messaging/[id]/retry/route.ts`
24. `app/api/agents/[...path]/route.ts`
25. `app/api/ai-team/plan/[id]/route.ts`
26. `app/r/[code]/route.ts`
27. `app/api/crm/connect/[provider]/route.ts`
28. `app/api/crm/webhooks/[provider]/route.ts`

### Page Components:
29. `app/preview/[token]/page.tsx` - Needs async params

### Pattern to Update:
```typescript
// OLD (Next.js 14)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
}

// NEW (Next.js 15)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
}
```

## 4. searchParams Usage

**Status**: Need to audit page components for searchParams usage

### Known Files:
- Most page components likely use searchParams
- Need systematic search in next phase

## 5. Third-Party Dependencies

### React 19 Compatibility Check Needed:

✅ **Likely Compatible**:
- `framer-motion@12.23.24` - Should support React 19
- `@radix-ui/*` - Modern versions support React 19
- `lucide-react@0.542.0` - Should be compatible
- `recharts@3.2.0` - Should be compatible
- `chart.js@4.5.1` - Framework agnostic

⚠️ **Need Verification**:
- `@react-three/fiber@8.15.0` - May need update
- `@react-three/drei@9.88.0` - May need update
- `three@0.160.0` - Check compatibility
- `next-auth@4.24.13` - Check Next.js 15 support

## 6. Middleware

**Status**: No middleware.ts file found
- ✅ No middleware migration needed

## 7. next.config.js

**Current**: JavaScript file
**Recommendation**: Migrate to TypeScript (next.config.ts)

## 8. Build Configuration

### Current Setup:
- Using standard Next.js build
- No Turbopack enabled
- Standard webpack configuration

### Recommendations:
- Test Turbopack in development after upgrade
- Monitor build times for improvements

## Summary Statistics

| Category | Count | Priority |
|----------|-------|----------|
| cookies() calls | 11 files | HIGH |
| headers() calls | 1 file | MEDIUM |
| params in routes | 35+ files | HIGH |
| Page components | 1+ files | MEDIUM |
| Dependencies to check | 4 packages | MEDIUM |

## Next Steps

1. ✅ Complete this audit
2. ⏳ Set up testing baseline
3. ⏳ Update dependencies
4. ⏳ Migrate async APIs systematically
5. ⏳ Test thoroughly

## Risk Assessment

**Overall Risk**: MEDIUM-HIGH

**Reasons**:
- Large number of files to update (45+ files)
- Core authentication system affected
- Many dynamic routes need updates
- But: Changes are mechanical and well-documented
- But: Good test coverage exists

**Mitigation**:
- Systematic approach (one phase at a time)
- Comprehensive testing after each phase
- Rollback plan in place
