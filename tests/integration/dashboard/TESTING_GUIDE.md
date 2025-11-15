# Dashboard API Testing Guide

Complete guide for testing the Dashboard API endpoint.

---

## Quick Start

```bash
# Run all tests
npm run test:integration -- tests/integration/dashboard

# Run with coverage
npm run test:integration -- --coverage tests/integration/dashboard

# Run in watch mode
npm run test:integration -- --watch tests/integration/dashboard
```

---

## Test Types

### 1. Integration Tests (29 tests)

**File:** `dashboard.test.ts`

**Categories:**
- Authentication (3 tests)
- Query Parameters (5 tests)
- Response Schema (5 tests)
- Data Aggregation (5 tests)
- Error Handling (4 tests)
- Performance (2 tests)
- Edge Cases (5 tests)

**Run:**
```bash
npm run test:integration -- tests/integration/dashboard/dashboard.test.ts
```

### 2. Schema Validation Tests (25 tests)

**File:** `schema-validation.test.ts`

**Categories:**
- Success Response Schema (5 tests)
- Error Response Schema (1 test)
- Data Type Validation (8 tests)
- Array Length Validation (5 tests)
- Enum Validation (2 tests)
- Sorting Validation (2 tests)

**Run:**
```bash
npm run test:integration -- tests/integration/dashboard/schema-validation.test.ts
```

### 3. Load Tests

**File:** `load-test.js`

**Scenarios:**
- Ramp up to 50 concurrent users
- Sustained load for 2 minutes
- Response time < 1s (p95)
- Error rate < 1%

**Run:**
```bash
k6 run tests/integration/dashboard/load-test.js
```

---

## Running Specific Tests

### By Category

```bash
# Authentication tests
npm run test:integration -- -t "Authentication"

# Schema validation
npm run test:integration -- -t "Schema Validation"

# Performance tests
npm run test:integration -- -t "Performance"

# Error handling
npm run test:integration -- -t "Error Handling"
```

### By Test Name

```bash
# Specific test
npm run test:integration -- -t "should return 401 when user is not authenticated"

# Multiple tests
npm run test:integration -- -t "should validate|should return"
```

---

## Test Utilities

### createNextRequest

Creates a mock NextRequest with headers and query parameters.

```typescript
import { createNextRequest } from './setup';

const request = createNextRequest('/api/dashboard', {
  userId: 'test_user_123',
  searchParams: { range: '7d', include: 'analytics,content' },
});
```

### mockFetchResponse

Mocks a fetch response for a specific URL.

```typescript
import { mockFetchResponse } from './setup';

mockFetchResponse(
  'http://localhost:3000/api/analytics/overview?range=30d',
  { success: true, data: { totalRevenue: 12500 } }
);
```

### mockFetchError

Mocks a fetch error for a specific URL.

```typescript
import { mockFetchError } from './setup';

mockFetchError(
  'http://localhost:3000/api/analytics/overview?range=30d',
  new Error('Network error')
);
```

### parseResponse

Parses response body as JSON.

```typescript
import { parseResponse } from './setup';

const response = await GET(request);
const data = await parseResponse(response);
```

---

## Test Fixtures

### Mock User IDs

```typescript
import { mockUserId, mockUnauthorizedUserId } from './fixtures';

// Use in tests
const request = createNextRequest('/api/dashboard', {
  userId: mockUserId,
});
```

### Mock API Responses

```typescript
import {
  mockAnalyticsData,
  mockFansData,
  mockMessagesData,
  mockContentData,
} from './fixtures';

// Setup mock responses
mockFetchResponse(url, mockAnalyticsData);
```

### Expected Responses

```typescript
import {
  mockDashboardResponse,
  mockEmptyDashboardResponse,
  mockUnauthorizedResponse,
} from './fixtures';

// Validate response
expect(data).toMatchObject(mockDashboardResponse);
```

---

## Writing New Tests

### 1. Add Test to Existing Suite

```typescript
// In dashboard.test.ts
describe('New Feature', () => {
  it('should handle new scenario', async () => {
    const request = createNextRequest('/api/dashboard', {
      userId: mockUserId,
    });
    
    const response = await GET(request);
    const data = await parseResponse(response);
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
```

### 2. Add Schema Validation

```typescript
// In schema-validation.test.ts
const NewFeatureSchema = z.object({
  field: z.string(),
  value: z.number(),
});

it('should validate new feature schema', async () => {
  const request = createNextRequest('/api/dashboard', {
    userId: mockUserId,
  });
  
  const response = await GET(request);
  const data = await parseResponse(response);
  
  const result = NewFeatureSchema.safeParse(data.data.newFeature);
  expect(result.success).toBe(true);
});
```

### 3. Add Test Fixture

```typescript
// In fixtures.ts
export const mockNewFeatureData = {
  success: true,
  data: {
    field: 'value',
    value: 123,
  },
};
```

---

## Debugging Tests

### Enable Verbose Logging

```bash
npm run test:integration -- --reporter=verbose tests/integration/dashboard
```

### Run Single Test

```bash
npm run test:integration -- -t "exact test name"
```

### Debug in VS Code

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Dashboard Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "test:integration", "--", "tests/integration/dashboard"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### View Coverage Report

```bash
npm run test:integration -- --coverage tests/integration/dashboard
open coverage/lcov-report/index.html
```

---

## CI/CD Integration

### GitHub Actions

See `.github-ci-example.yml` for complete CI configuration.

**Key steps:**
1. Run tests on push/PR
2. Generate coverage report
3. Upload to Codecov
4. Check coverage threshold (100%)
5. Comment PR with results

### Pre-commit Hook

Add to `.husky/pre-commit`:

```bash
#!/bin/sh
npm run test:integration -- tests/integration/dashboard
```

### Pre-push Hook

Add to `.husky/pre-push`:

```bash
#!/bin/sh
npm run test:integration -- --coverage tests/integration/dashboard
```

---

## Performance Testing

### Local Load Test

```bash
# Start server
npm run build
npm start

# Run load test
k6 run tests/integration/dashboard/load-test.js
```

### Custom Load Test

```bash
# Custom VUs and duration
k6 run --vus 100 --duration 5m tests/integration/dashboard/load-test.js

# With custom base URL
BASE_URL=https://staging.example.com k6 run tests/integration/dashboard/load-test.js
```

### Analyze Results

```bash
# View results
cat load-test-results.json | jq '.metrics'

# Check thresholds
cat load-test-results.json | jq '.metrics | to_entries[] | select(.value.thresholds)'
```

---

## Troubleshooting

### Tests Failing

1. **Check server is running:**
   ```bash
   curl -H "x-user-id: test" http://localhost:3000/api/dashboard
   ```

2. **Check environment variables:**
   ```bash
   echo $NEXT_PUBLIC_API_URL
   ```

3. **Clear cache:**
   ```bash
   rm -rf .next node_modules/.cache
   npm run build
   ```

### Coverage Not 100%

1. **View uncovered lines:**
   ```bash
   npm run test:integration -- --coverage tests/integration/dashboard
   open coverage/lcov-report/index.html
   ```

2. **Add missing tests:**
   - Check coverage report for uncovered branches
   - Add tests for edge cases
   - Test error paths

### Slow Tests

1. **Profile tests:**
   ```bash
   npm run test:integration -- --reporter=verbose tests/integration/dashboard
   ```

2. **Optimize:**
   - Reduce mock data size
   - Use `beforeEach` for common setup
   - Parallelize independent tests

---

## Best Practices

### 1. Test Naming

```typescript
// Good
it('should return 401 when user is not authenticated', async () => {});

// Bad
it('test auth', async () => {});
```

### 2. Test Structure

```typescript
// Arrange
const request = createNextRequest('/api/dashboard', {
  userId: mockUserId,
});

// Act
const response = await GET(request);
const data = await parseResponse(response);

// Assert
expect(response.status).toBe(200);
expect(data.success).toBe(true);
```

### 3. Mock Data

```typescript
// Use fixtures
import { mockAnalyticsData } from './fixtures';

// Don't inline large objects
mockFetchResponse(url, mockAnalyticsData);
```

### 4. Assertions

```typescript
// Be specific
expect(data.data.summary.totalRevenue.value).toBe(12500);

// Not vague
expect(data).toBeTruthy();
```

### 5. Error Testing

```typescript
// Test both success and error paths
it('should handle API errors gracefully', async () => {
  mockFetchError(url, new Error('Network error'));
  
  const response = await GET(request);
  
  expect(response.status).toBe(200); // Graceful degradation
  expect(data.data.summary.totalRevenue.value).toBe(0);
});
```

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Zod Documentation](https://zod.dev/)
- [k6 Documentation](https://k6.io/docs/)
- [Testing Best Practices](https://testingjavascript.com/)

---

## Support

For questions or issues:
1. Check [api-tests.md](./api-tests.md) for detailed scenarios
2. Review [DASHBOARD_API_TESTS_COMPLETE.md](../../../DASHBOARD_API_TESTS_COMPLETE.md)
3. Contact the team on Slack #testing

---

**Last Updated:** 2024-11-13  
**Maintained By:** Kiro AI - Tester Agent

