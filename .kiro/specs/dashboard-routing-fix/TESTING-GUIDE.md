# Testing Guide - Dashboard Routing Fix

## Overview

This guide explains how to use the testing infrastructure for the dashboard routing fix feature.

## Test Types

### 1. Property-Based Tests

Property-based tests use `fast-check` to verify properties across many generated inputs (100 iterations per property).

**Location**: `tests/unit/routing/`

**What they test**:
- Route resolution logic
- Navigation active state
- Z-index hierarchy
- Invariants that should hold for all inputs

**Example**:
```typescript
it('Property: all navigation routes resolve to correct pages', () => {
  fc.assert(
    fc.property(
      fc.constantFrom(...VALID_ROUTES),
      (route) => {
        const result = resolveRoute(route);
        expect(result.exists).toBe(true);
        return result.exists;
      }
    ),
    { numRuns: 100 }
  );
});
```

### 2. E2E Tests

End-to-end tests use Playwright to verify actual browser behavior.

**Location**: `tests/e2e/routing.spec.ts`

**What they test**:
- Navigation through the application
- Redirects
- Visual layout
- User interactions

**Example**:
```typescript
test('should redirect /messages to /onlyfans/messages', async ({ page }) => {
  await page.goto(`${BASE_URL}/messages`);
  await expect(page).toHaveURL(/\/onlyfans\/messages/);
});
```

## Running Tests

### Quick Commands

```bash
# Run all routing tests
npm run test:routing

# Watch mode (auto-rerun on changes)
npm run test:routing:watch

# E2E tests
npm run test:routing:e2e

# Validate infrastructure
npm run test:routing:validate
```

### Detailed Commands

```bash
# Run specific test file
npm run test tests/unit/routing/route-resolution.property.test.ts

# Run with coverage
npm run test:coverage tests/unit/routing

# Run E2E in headed mode (see browser)
npx playwright test tests/e2e/routing.spec.ts --headed

# Run E2E in UI mode (interactive)
npx playwright test tests/e2e/routing.spec.ts --ui
```

## Writing New Tests

### Adding a Property Test

1. Create a new file in `tests/unit/routing/`
2. Follow the naming convention: `{feature}.property.test.ts`
3. Include the feature tag comment
4. Reference requirements being validated

**Template**:
```typescript
/**
 * Property-based tests for {feature}
 * Feature: dashboard-routing-fix, Property {number}: {property_text}
 * Validates: Requirements {X.Y}
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

describe('{Feature} Property Tests', () => {
  it('Property {N}: {description}', () => {
    fc.assert(
      fc.property(
        fc.arbitraryGenerator(),
        (input) => {
          // Test logic
          expect(result).toBe(expected);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Adding an E2E Test

1. Add test to `tests/e2e/routing.spec.ts`
2. Use descriptive test names
3. Include proper assertions

**Template**:
```typescript
test('should {behavior}', async ({ page }) => {
  await page.goto(`${BASE_URL}/route`);
  
  // Perform actions
  await page.click('[data-testid="element"]');
  
  // Assert results
  await expect(page).toHaveURL(/expected-url/);
  await expect(page.locator('.element')).toBeVisible();
});
```

## Test Organization

### File Structure

```
tests/
├── unit/
│   └── routing/
│       ├── route-resolution.property.test.ts
│       ├── navigation-active-state.property.test.ts
│       ├── z-index-hierarchy.property.test.ts
│       └── README.md
└── e2e/
    └── routing.spec.ts
```

### Naming Conventions

- Property tests: `{feature}.property.test.ts`
- E2E tests: `{feature}.spec.ts`
- Test descriptions: Start with "Property {N}:" for property tests
- Test tags: Include feature and property number in comments

## Debugging Tests

### Property Test Failures

When a property test fails, fast-check will show the failing input:

```
Property failed after 42 tests
{ route: "/invalid-route" }
Shrunk 5 time(s)
Got error: Expected true but received false
```

**How to debug**:
1. Look at the failing input
2. Run the test with that specific input
3. Add console.log to see intermediate values
4. Fix the issue
5. Re-run all tests

### E2E Test Failures

When an E2E test fails, Playwright provides:
- Screenshots
- Video recordings
- Trace files

**How to debug**:
```bash
# Run in headed mode to see browser
npx playwright test tests/e2e/routing.spec.ts --headed

# Run in debug mode
npx playwright test tests/e2e/routing.spec.ts --debug

# View test report
npx playwright show-report
```

## Best Practices

### Property Tests

1. **Use 100 iterations** (as specified in design)
2. **Test invariants**, not specific examples
3. **Keep properties simple** and focused
4. **Use descriptive names** for properties
5. **Tag with feature and property number**

### E2E Tests

1. **Use data-testid** attributes for selectors
2. **Wait for elements** before interacting
3. **Test user flows**, not implementation details
4. **Keep tests independent** (no shared state)
5. **Use page objects** for complex pages

### General

1. **Run tests frequently** during development
2. **Fix failing tests immediately**
3. **Don't skip tests** without good reason
4. **Update tests** when requirements change
5. **Document complex test logic**

## Continuous Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Scheduled nightly builds

**CI Configuration**: `.github/workflows/test.yml`

## Troubleshooting

### Tests won't run

```bash
# Check dependencies
npm install

# Verify fast-check is installed
npm list fast-check

# Validate infrastructure
npm run test:routing:validate
```

### Tests are slow

```bash
# Run specific tests instead of all
npm run test tests/unit/routing/route-resolution.property.test.ts

# Use optimized test command
npm run test:unit:optimized
```

### E2E tests fail locally

```bash
# Install Playwright browsers
npx playwright install

# Check if dev server is running
npm run dev

# Set correct BASE_URL
export BASE_URL=http://localhost:3000
```

## Resources

- [fast-check Documentation](https://fast-check.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Property-Based Testing Guide](https://fast-check.dev/docs/introduction/)

## Getting Help

If you encounter issues:

1. Check this guide
2. Review test examples in `tests/unit/routing/`
3. Run validation script: `npm run test:routing:validate`
4. Check the design document for property specifications
5. Ask the team for help

---

**Last Updated**: November 27, 2024
