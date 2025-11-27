# Dashboard Routing Fix - Spec

## Overview

This spec addresses critical routing and page structure issues in the Huntaze dashboard. The current navigation structure has misaligned routes where pages are not correctly mapped to their intended functionality.

## Status

- ✅ **Task 1**: Set up testing infrastructure - COMPLETE
- ⏳ **Task 2**: Create OnlyFans main dashboard page - NOT STARTED
- ⏳ **Task 3**: Fix messages routing - NOT STARTED
- ⏳ **Task 4**: Update navigation menu - NOT STARTED

## Quick Links

- [Requirements](./requirements.md) - User stories and acceptance criteria
- [Design](./design.md) - Technical design and architecture
- [Tasks](./tasks.md) - Implementation plan
- [Task 1 Summary](./TASK-1-SUMMARY.md) - Testing infrastructure setup

## Key Issues Being Fixed

1. **Missing OnlyFans Main Page**: `/onlyfans` directory lacks a main `page.tsx`
2. **Messages Routing**: `/messages` should redirect to `/onlyfans/messages`
3. **Navigation Inconsistencies**: Menu items don't consistently map to correct routes
4. **Layout Conflicts**: Content page has element overlapping issues
5. **Z-Index Issues**: Inconsistent z-index usage across components

## Testing Infrastructure

### Property-Based Tests (11 tests, all passing)

```bash
npm run test:routing
```

- **Route Resolution**: Validates all routes resolve correctly
- **Navigation Active State**: Ensures proper active state highlighting
- **Z-Index Hierarchy**: Verifies design token hierarchy

### E2E Tests

```bash
npm run test:routing:e2e
```

- Navigation through all main routes
- Redirect behavior validation
- Layout and visual regression tests

## Running Tests

```bash
# All routing tests
npm run test:routing

# Watch mode
npm run test:routing:watch

# E2E tests
npm run test:routing:e2e

# Validate infrastructure
npm run test:routing:validate
```

## Architecture

### Current State
```
app/(app)/
├── layout.tsx
├── home/page.tsx
├── onlyfans/
│   ├── [MISSING] page.tsx  ❌
│   ├── messages/page.tsx
│   ├── fans/page.tsx
│   └── ppv/page.tsx
├── messages/page.tsx  ⚠️ (needs redirect)
├── marketing/page.tsx
├── social-marketing/page.tsx
├── analytics/page.tsx
├── integrations/page.tsx
└── content/page.tsx  ⚠️ (layout issues)
```

### Target State
```
app/(app)/
├── layout.tsx
├── home/page.tsx
├── onlyfans/
│   ├── page.tsx  ✅ NEW
│   ├── messages/page.tsx
│   ├── fans/page.tsx
│   └── ppv/page.tsx
├── messages/page.tsx  ✅ REDIRECT
├── marketing/page.tsx
├── social-marketing/page.tsx
├── analytics/page.tsx
├── integrations/page.tsx  ✅ REFACTORED
└── content/page.tsx  ✅ FIXED
```

## Correctness Properties

The design includes 10 correctness properties that must be validated:

1. **Route Resolution Consistency** - All valid routes resolve correctly
2. **OnlyFans Page Accessibility** - `/onlyfans` displays dashboard
3. **Messages Redirect Correctness** - `/messages` → `/onlyfans/messages`
4. **Layout Grid Integration** - No overlapping elements
5. **Z-Index Hierarchy Consistency** - Proper layering
6. **Navigation Active State** - Correct highlighting
7. **Authentication Guard** - Protected routes redirect
8. **Performance Loading States** - Fast loading indicators
9. **Error Recovery** - Graceful error handling
10. **Responsive Layout Adaptation** - Mobile-friendly

## Development Workflow

1. Read the requirements and design documents
2. Review the task list
3. Execute tasks in order
4. Run tests after each task
5. Verify correctness properties

## Files Structure

```
.kiro/specs/dashboard-routing-fix/
├── README.md                    # This file
├── requirements.md              # User stories & acceptance criteria
├── design.md                    # Technical design
├── tasks.md                     # Implementation plan
├── task-1-complete.md          # Task 1 detailed report
└── TASK-1-SUMMARY.md           # Task 1 quick summary

tests/unit/routing/
├── route-resolution.property.test.ts
├── navigation-active-state.property.test.ts
├── z-index-hierarchy.property.test.ts
└── README.md

tests/e2e/
└── routing.spec.ts

scripts/
└── test-routing-infrastructure.ts
```

## Next Steps

To continue with this spec:

1. Review Task 2 in [tasks.md](./tasks.md)
2. Create the OnlyFans main dashboard page
3. Implement the corresponding property tests
4. Verify all tests pass
5. Move to Task 3

## Getting Help

- Review the [design document](./design.md) for technical details
- Check the [requirements](./requirements.md) for acceptance criteria
- Look at existing tests in `tests/unit/routing/` for examples
- Run `npm run test:routing:validate` to check infrastructure

## Contributing

When working on this spec:

1. Follow the task order in tasks.md
2. Write tests before or alongside implementation
3. Ensure all property tests pass (100 iterations each)
4. Update documentation as you go
5. Mark tasks as complete in tasks.md

---

**Last Updated**: November 27, 2024  
**Status**: Task 1 Complete, Ready for Task 2
