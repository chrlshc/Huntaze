# Property Tests Quick Reference

## Overview
Property-Based Tests (PBT) for mobile-ux-marketing-refactor feature using fast-check.

## Test Files

### 1. Viewport CSS Property Tests
**Location**: `tests/unit/styles/viewport.property.test.ts`

**Properties Tested**:
- ✅ Property 1: Global viewport CSS enforcement (6 tests)
- ✅ Property 2: Dynamic viewport height usage (2 tests)
- ✅ Property 3: Safe area padding on fixed components (2 tests)

**Total**: 10 tests, 100 iterations each

### 2. JSON-LD Schema Property Tests
**Location**: `tests/unit/lib/seo/json-ld.property.test.ts`

**Properties Tested**:
- ✅ Property 16: JSON-LD schema validation (21 tests)

**Total**: 21 tests, 100 iterations each

## Running Tests

```bash
# Run all property tests
npm run test -- tests/unit/styles/viewport.property.test.ts tests/unit/lib/seo/json-ld.property.test.ts --run

# Run viewport tests only
npm run test -- tests/unit/styles/viewport.property.test.ts --run

# Run JSON-LD tests only
npm run test -- tests/unit/lib/seo/json-ld.property.test.ts --run
```

## Test Coverage Summary

| Property | Requirement | Tests | Status |
|----------|-------------|-------|--------|
| Property 1: Viewport CSS | 1.1 | 6 | ✅ Pass |
| Property 2: DVH Usage | 1.2 | 2 | ✅ Pass |
| Property 3: Safe Areas | 1.4 | 2 | ✅ Pass |
| Property 16: JSON-LD | 4.5 | 21 | ✅ Pass |

## Key Validations

### Viewport Tests Validate:
- `overflow-x: hidden` on html and body
- Safe area CSS variables (--sat, --sab, --sal, --sar)
- `.app-viewport-lock` class configuration
- `touch-action: manipulation` on html
- Use of `dvh` instead of `vh` units
- Consistent configuration across reads

### JSON-LD Tests Validate:
- Organization schema generation
- Product schema with random data
- WebSite schema generation
- Required field validation
- Schema.org compliance
- JSON serializability
- Brand and offer information
- Social profiles and search actions
- Optional field handling

## Test Results

```
Test Files  2 passed (2)
Tests       31 passed (31)
Duration    ~2-5 seconds
```

## Design Document References

All tests implement properties defined in:
`.kiro/specs/mobile-ux-marketing-refactor/design.md`

Section: **Correctness Properties**

## Notes

- All tests use fast-check library
- Each test runs 100 iterations
- Tests validate real implementation (no mocks)
- Proper feature tagging for traceability
