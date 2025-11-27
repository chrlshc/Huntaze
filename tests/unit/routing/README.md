# Dashboard Routing Tests

This directory contains property-based and unit tests for the dashboard routing fix feature.

## Test Files

### Property-Based Tests

These tests use `fast-check` to verify properties across many generated inputs:

1. **route-resolution.property.test.ts**
   - Tests that all valid routes resolve correctly
   - Validates route resolution is deterministic
   - Ensures invalid routes don't resolve
   - **Validates**: Requirements 1.3, 2.2, 3.3, 7.2

2. **navigation-active-state.property.test.ts**
   - Tests that exactly one navigation item is active for any route
   - Validates nested routes activate the most specific parent
   - Ensures active state is deterministic
   - **Validates**: Requirement 7.3

3. **z-index-hierarchy.property.test.ts**
   - Tests that z-index values follow design token hierarchy
   - Validates modal always has highest z-index
   - Ensures z-index ordering is transitive
   - **Validates**: Requirements 9.2, 9.5

## Running Tests

### Run all routing tests
```bash
npm run test tests/unit/routing
```

### Run specific test file
```bash
npm run test tests/unit/routing/route-resolution.property.test.ts
```

### Run with coverage
```bash
npm run test:coverage tests/unit/routing
```

### Run in watch mode
```bash
npm run test -- --watch tests/unit/routing
```

## Property-Based Testing

All property tests run 100 iterations by default (as specified in the design document). This ensures thorough coverage of the input space.

### Example Property Test Structure

```typescript
it('Property: description', () => {
  fc.assert(
    fc.property(
      fc.arbitraryGenerator(), // Input generator
      (input) => {
        // Test logic
        expect(result).toBe(expected);
        return true;
      }
    ),
    { numRuns: 100 } // Run 100 times
  );
});
```

## Test Tags

Each property-based test includes a comment tag in the format:
```typescript
// Feature: dashboard-routing-fix, Property {number}: {property_text}
```

This allows easy tracking of which properties are tested and which requirements they validate.

## Integration with E2E Tests

The property tests in this directory complement the E2E tests in `tests/e2e/routing.spec.ts`. While property tests verify logic and invariants, E2E tests verify actual browser behavior and user interactions.

## Adding New Tests

When adding new routing-related tests:

1. Follow the existing naming convention: `{feature}.property.test.ts`
2. Include the feature tag comment at the top
3. Reference the requirements being validated
4. Use `numRuns: 100` for property tests
5. Add documentation to this README

## Dependencies

- **vitest**: Test runner
- **fast-check**: Property-based testing library
- **@playwright/test**: E2E testing (for integration tests)

## Related Files

- Design Document: `.kiro/specs/dashboard-routing-fix/design.md`
- Requirements: `.kiro/specs/dashboard-routing-fix/requirements.md`
- Tasks: `.kiro/specs/dashboard-routing-fix/tasks.md`
- E2E Tests: `tests/e2e/routing.spec.ts`
