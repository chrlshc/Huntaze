# Unit Tests

This directory contains unit tests for the Huntaze application, with a focus on testing business logic, calculations, and isolated components.

## Test Framework

- **Framework**: Jest 30.x with TypeScript support
- **Coverage Tool**: Jest built-in coverage (Istanbul)
- **Coverage Thresholds**: 80% for lines, branches, functions, and statements

## Running Tests

```bash
# Run all unit tests with coverage
npm run test:unit

# Run tests in watch mode
npm run test:unit:watch

# Run tests in CI mode (optimized for CI/CD)
npm run test:unit:ci

# Run specific test file
npm run test:unit -- tests/unit/onboarding/progress-calculation.test.ts

# Run tests matching a pattern
npm run test:unit -- --testNamePattern="progress calculation"
```

## Test Structure

```
tests/unit/
├── setup.ts                    # Global test setup
├── onboarding/                 # Onboarding system tests
│   ├── progress-calculation.test.ts
│   ├── gating-logic.test.ts
│   ├── step-transitions.test.ts
│   ├── repositories/
│   │   ├── step-definitions.test.ts
│   │   ├── user-onboarding.test.ts
│   │   └── events.test.ts
│   └── middleware/
│       └── onboarding-gating.test.ts
└── ...
```

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  it('should do something', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = functionToTest(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### Mocking

```typescript
// Mock a module
jest.mock('@/lib/db', () => ({
  getPool: jest.fn(() => ({
    query: jest.fn(),
  })),
}));

// Mock a function
const mockFunction = jest.fn();
mockFunction.mockReturnValue('mocked value');
mockFunction.mockResolvedValue(Promise.resolve('async value'));
```

### Async Tests

```typescript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBe('expected');
});
```

## Coverage Reports

Coverage reports are generated in the `coverage/` directory:

- `coverage/lcov-report/index.html` - HTML coverage report
- `coverage/lcov.info` - LCOV format for CI tools
- `coverage/coverage-final.json` - JSON format

## Best Practices

1. **Test Isolation**: Each test should be independent and not rely on other tests
2. **Mock External Dependencies**: Mock database, Redis, external APIs
3. **Clear Test Names**: Use descriptive test names that explain what is being tested
4. **Arrange-Act-Assert**: Follow the AAA pattern for test structure
5. **Coverage**: Aim for 80%+ coverage, but focus on meaningful tests
6. **Fast Tests**: Unit tests should run quickly (< 100ms per test)

## Configuration

Jest configuration is in `jest.config.js`:

- **Test Environment**: Node.js
- **Test Match**: `**/*.test.ts` and `**/*.test.tsx`
- **Module Mapper**: `@/*` maps to project root
- **Coverage Threshold**: 80% for all metrics
- **Setup File**: `tests/unit/setup.ts`

## Troubleshooting

### Tests Timing Out

Increase timeout in test:
```typescript
it('slow test', async () => {
  // ...
}, 30000); // 30 second timeout
```

### Module Not Found

Check `moduleNameMapper` in `jest.config.js` and ensure paths are correct.

### TypeScript Errors

Ensure `ts-jest` is configured correctly and `tsconfig.json` is valid.

## CI Integration

Tests run automatically in CI with:
```bash
npm run test:unit:ci
```

This command:
- Runs all tests once (no watch mode)
- Generates coverage report
- Uses limited workers for CI environment
- Fails if coverage thresholds are not met
