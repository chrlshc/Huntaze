# Revenue Optimization API - Integration Tests Documentation

## Overview

This document describes the integration test suite for the Revenue Optimization API endpoints. The tests verify authentication, validation, success cases, error handling, performance, and concurrent access patterns.

## Test Structure

```
tests/integration/revenue/
├── pricing.test.ts          # Pricing API tests
├── churn.test.ts            # Churn API tests
├── upsells.test.ts          # Upsells API tests (TODO)
├── forecast.test.ts         # Forecast API tests (TODO)
├── payouts.test.ts          # Payouts API tests (TODO)
├── fixtures.ts              # Test data fixtures
├── setup.ts                 # Global test setup
└── api-tests.md             # This documentation
```

## Running Tests

### Prerequisites

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Set environment variables:**
   ```bash
   export TEST_BASE_URL=http://localhost:3000
   export TEST_SESSION_TOKEN=your_test_session_token
   ```

### Run All Tests

```bash
npm run test:integration:revenue
```

### Run Specific Test File

```bash
npx vitest tests/integration/revenue/pricing.test.ts
```

### Run Tests in Watch Mode

```bash
npx vitest tests/integration/revenue --watch
```

### Run Tests with Coverage

```bash
npx vitest tests/integration/revenue --coverage
```

## Test Scenarios

### 1. Pricing API Tests (`pricing.test.ts`)

#### GET /api/revenue/pricing

**Authentication Tests:**
- ✅ Returns 401 when not authenticated
- ✅ Returns 403 when accessing another creator's data

**Validation Tests:**
- ✅ Returns 400 when creatorId is missing
- ✅ Returns 400 when creatorId is empty

**Success Tests:**
- ✅ Returns pricing recommendations with valid schema
- ✅ Includes correlation ID in logs
- ✅ Returns consistent data structure
- ✅ Validates all response fields with Zod schema

**Performance Tests:**
- ✅ Responds within 2 seconds

**Error Handling Tests:**
- ✅ Handles server errors gracefully

#### POST /api/revenue/pricing/apply

**Authentication Tests:**
- ✅ Returns 401 when not authenticated
- ✅ Returns 403 when applying pricing for another creator

**Validation Tests:**
- ✅ Returns 400 when creatorId is missing
- ✅ Returns 400 when priceType is missing
- ✅ Returns 400 when newPrice is missing
- ✅ Returns 400 when priceType is invalid
- ✅ Returns 400 when newPrice is negative
- ✅ Returns 400 when newPrice is zero

**Success Tests:**
- ✅ Applies subscription pricing successfully
- ✅ Applies PPV pricing successfully
- ✅ Handles decimal prices correctly

**Concurrent Tests:**
- ✅ Handles multiple simultaneous pricing updates

**Performance Tests:**
- ✅ Responds within 3 seconds

**Rate Limiting Tests:**
- ✅ Enforces rate limits (returns 429 after threshold)

### 2. Churn API Tests (`churn.test.ts`)

#### GET /api/revenue/churn

**Authentication Tests:**
- ✅ Returns 401 when not authenticated
- ✅ Returns 403 when accessing another creator's data

**Validation Tests:**
- ✅ Returns 400 when creatorId is missing
- ✅ Returns 400 when riskLevel is invalid

**Success Tests:**
- ✅ Returns all churn risks with valid schema
- ✅ Filters by high risk level
- ✅ Filters by medium risk level
- ✅ Filters by low risk level
- ✅ Returns consistent churn probabilities
- ✅ Validates summary totals match fan list

**Performance Tests:**
- ✅ Responds within 2 seconds

#### POST /api/revenue/churn/reengage

**Authentication Tests:**
- ✅ Returns 401 when not authenticated
- ✅ Returns 403 when re-engaging for another creator

**Validation Tests:**
- ✅ Returns 400 when creatorId is missing
- ✅ Returns 400 when fanId is missing

**Success Tests:**
- ✅ Re-engages fan successfully
- ✅ Re-engages with custom message template
- ✅ Returns messageId in response

**Performance Tests:**
- ✅ Responds within 3 seconds

#### POST /api/revenue/churn/bulk-reengage

**Authentication Tests:**
- ✅ Returns 401 when not authenticated

**Validation Tests:**
- ✅ Returns 400 when creatorId is missing
- ✅ Returns 400 when fanIds is missing
- ✅ Returns 400 when fanIds is empty array

**Success Tests:**
- ✅ Bulk re-engages multiple fans
- ✅ Handles partial failures gracefully
- ✅ Returns sent and failed counts

**Performance Tests:**
- ✅ Handles bulk operations efficiently (10 fans < 5s)

**Concurrent Tests:**
- ✅ Handles simultaneous churn data requests
- ✅ Handles concurrent re-engagement requests

### 3. Upsells API Tests (TODO)

#### GET /api/revenue/upsells
- [ ] Authentication tests
- [ ] Validation tests
- [ ] Success cases
- [ ] Performance tests

#### POST /api/revenue/upsells/send
- [ ] Authentication tests
- [ ] Validation tests
- [ ] Success cases
- [ ] Performance tests

#### POST /api/revenue/upsells/dismiss
- [ ] Authentication tests
- [ ] Validation tests
- [ ] Success cases

#### GET /api/revenue/upsells/automation
- [ ] Authentication tests
- [ ] Success cases

#### POST /api/revenue/upsells/automation
- [ ] Authentication tests
- [ ] Validation tests
- [ ] Success cases

### 4. Forecast API Tests (TODO)

#### GET /api/revenue/forecast
- [ ] Authentication tests
- [ ] Validation tests
- [ ] Success cases with various month ranges
- [ ] Performance tests

#### POST /api/revenue/forecast/goal
- [ ] Authentication tests
- [ ] Validation tests
- [ ] Success cases
- [ ] Returns recommendations

#### POST /api/revenue/forecast/scenario
- [ ] Authentication tests
- [ ] Validation tests
- [ ] Success cases with various scenarios
- [ ] Performance tests

### 5. Payouts API Tests (TODO)

#### GET /api/revenue/payouts
- [ ] Authentication tests
- [ ] Success cases
- [ ] Validates all platforms
- [ ] Performance tests

#### GET /api/revenue/payouts/export
- [ ] Authentication tests
- [ ] CSV export format
- [ ] PDF export format
- [ ] File download validation

#### POST /api/revenue/payouts/tax-rate
- [ ] Authentication tests
- [ ] Validation tests (0-1 range)
- [ ] Success cases
- [ ] Updates calculations correctly

#### POST /api/revenue/payouts/sync
- [ ] Authentication tests
- [ ] Validation tests (valid platforms)
- [ ] Success cases for each platform
- [ ] Updates lastSync timestamp

## Test Data Fixtures

All test fixtures are defined in `fixtures.ts`:

### Creator IDs
- `TEST_CREATORS.VALID` - Valid test creator
- `TEST_CREATORS.OTHER` - Another creator (for permission tests)
- `TEST_CREATORS.INVALID` - Invalid creator ID

### Fan IDs
- `TEST_FANS.HIGH_RISK` - High churn risk fan
- `TEST_FANS.MEDIUM_RISK` - Medium churn risk fan
- `TEST_FANS.LOW_RISK` - Low churn risk fan
- `TEST_FANS.INVALID` - Invalid fan ID

### Mock Responses
- `MOCK_PRICING_RECOMMENDATION` - Complete pricing response
- `MOCK_CHURN_RISK_RESPONSE` - Complete churn response
- `MOCK_UPSELL_OPPORTUNITIES` - Complete upsell response
- `MOCK_REVENUE_FORECAST` - Complete forecast response
- `MOCK_PAYOUT_SCHEDULE` - Complete payout response

### Request Fixtures
- `PRICING_FIXTURES` - Valid and invalid pricing requests
- `CHURN_FIXTURES` - Valid and invalid churn requests
- `UPSELL_FIXTURES` - Valid and invalid upsell requests
- `FORECAST_FIXTURES` - Valid and invalid forecast requests
- `PAYOUT_FIXTURES` - Valid and invalid payout requests

## Schema Validation

All API responses are validated using Zod schemas:

```typescript
import { z } from 'zod';

const PricingRecommendationSchema = z.object({
  subscription: z.object({
    current: z.number().positive(),
    recommended: z.number().positive(),
    revenueImpact: z.number(),
    reasoning: z.string().min(1),
    confidence: z.number().min(0).max(1),
  }),
  // ... more fields
});

// Validate response
const validated = PricingRecommendationSchema.parse(data);
```

## Performance Benchmarks

| Endpoint | Target | Actual |
|----------|--------|--------|
| GET /api/revenue/pricing | < 2s | ✅ |
| POST /api/revenue/pricing/apply | < 3s | ✅ |
| GET /api/revenue/churn | < 2s | ✅ |
| POST /api/revenue/churn/reengage | < 3s | ✅ |
| POST /api/revenue/churn/bulk-reengage (10 fans) | < 5s | ✅ |

## Rate Limiting Tests

Rate limits are tested by making multiple rapid requests:

```typescript
// Make 15 requests rapidly
const requests = Array.from({ length: 15 }, () =>
  makeRequest('/api/revenue/pricing/apply', { ... })
);

const responses = await Promise.all(requests);

// At least one should be rate limited (429)
const rateLimited = responses.some(r => r.status === 429);
expect(rateLimited).toBe(true);
```

## Concurrent Access Tests

Tests verify the API handles concurrent requests correctly:

```typescript
// Simultaneous reads
const requests = Array.from({ length: 5 }, () =>
  makeRequest(`/api/revenue/churn?creatorId=${TEST_CREATOR_ID}`)
);

const responses = await Promise.all(requests);

// All should succeed
responses.forEach(response => {
  expect(response.status).toBe(200);
});
```

## Error Scenarios

### HTTP Status Codes Tested

- **200** - Success
- **400** - Bad Request (validation errors)
- **401** - Unauthorized (no session)
- **403** - Forbidden (wrong creator)
- **429** - Too Many Requests (rate limit)
- **500** - Internal Server Error

### Error Response Format

All errors return consistent format:

```json
{
  "error": "Error message"
}
```

## Authentication

Tests use session tokens for authentication:

```typescript
const response = await fetch(url, {
  headers: {
    'Cookie': `next-auth.session-token=${TEST_SESSION_TOKEN}`,
  },
});
```

## Correlation IDs

All requests include correlation IDs for tracing:

```typescript
headers: {
  'X-Correlation-ID': `test-${Date.now()}-${randomString}`,
}
```

## Best Practices

### 1. Use Fixtures

Always use fixtures from `fixtures.ts` instead of hardcoding test data:

```typescript
import { PRICING_FIXTURES, TEST_CREATORS } from './fixtures';

// Good
const response = await makeRequest('/api/revenue/pricing/apply', {
  method: 'POST',
  body: JSON.stringify(PRICING_FIXTURES.VALID_SUBSCRIPTION),
});

// Bad
const response = await makeRequest('/api/revenue/pricing/apply', {
  method: 'POST',
  body: JSON.stringify({
    creatorId: 'test_123',
    priceType: 'subscription',
    newPrice: 12.99,
  }),
});
```

### 2. Validate Schemas

Always validate response schemas with Zod:

```typescript
import { PricingRecommendationSchema } from './schemas';

const data = await response.json();
const validated = PricingRecommendationSchema.parse(data);
```

### 3. Test Edge Cases

Test boundary conditions:

```typescript
// Test zero
// Test negative
// Test very large numbers
// Test empty strings
// Test null/undefined
// Test special characters
```

### 4. Test Performance

Always include performance assertions:

```typescript
const startTime = Date.now();
const response = await makeRequest(url);
const duration = Date.now() - startTime;

expect(duration).toBeLessThan(2000);
```

### 5. Clean Up

Clean up test data after tests:

```typescript
afterEach(async () => {
  await cleanupTestData(TEST_CREATOR_ID);
});
```

## Troubleshooting

### Tests Failing with 401

**Problem:** All tests return 401 Unauthorized

**Solution:** Set valid TEST_SESSION_TOKEN:
```bash
export TEST_SESSION_TOKEN=your_valid_token
```

### Tests Timing Out

**Problem:** Tests timeout before completing

**Solution:** 
1. Ensure dev server is running
2. Increase timeout in vitest.config.ts
3. Check network connectivity

### Schema Validation Errors

**Problem:** Zod schema validation fails

**Solution:**
1. Check API response format matches schema
2. Update schema if API changed
3. Verify mock data matches schema

### Rate Limit Errors

**Problem:** Tests fail due to rate limiting

**Solution:**
1. Add delays between tests
2. Use different test accounts
3. Increase rate limit for test environment

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Start server
        run: npm run dev &
        
      - name: Wait for server
        run: npx wait-on http://localhost:3000
      
      - name: Run integration tests
        run: npm run test:integration:revenue
        env:
          TEST_BASE_URL: http://localhost:3000
          TEST_SESSION_TOKEN: ${{ secrets.TEST_SESSION_TOKEN }}
```

## Coverage Goals

- **Line Coverage:** > 80%
- **Branch Coverage:** > 75%
- **Function Coverage:** > 80%

## Next Steps

1. ✅ Complete pricing API tests
2. ✅ Complete churn API tests
3. ⏳ Add upsells API tests
4. ⏳ Add forecast API tests
5. ⏳ Add payouts API tests
6. ⏳ Add E2E workflow tests
7. ⏳ Add load testing
8. ⏳ Add security testing

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Zod Documentation](https://zod.dev/)
- [Next.js Testing](https://nextjs.org/docs/testing)
- [API Testing Best Practices](https://www.testim.io/blog/api-testing-best-practices/)

---

**Last Updated:** 2025-11-12  
**Status:** In Progress (2/5 endpoints complete)  
**Maintainer:** Kiro AI - Tester Agent

