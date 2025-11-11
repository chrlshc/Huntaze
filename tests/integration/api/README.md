# API Integration Tests

Comprehensive integration tests for API endpoints with focus on observability, error handling, and production readiness.

## Test Structure

```
tests/integration/api/
├── README.md                    # This file
├── metrics.test.ts              # /api/metrics endpoint tests
├── fixtures/
│   └── metrics-samples.ts       # Test data and fixtures
└── helpers/
    └── test-utils.ts            # Shared test utilities
```

## Running Tests

### Prerequisites

```bash
# Start the development server
npm run dev

# Or start production build
npm run build
npm start
```

### Run All Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run with coverage
npm run test:integration -- --coverage

# Run specific test file
npm run test:integration tests/integration/api/metrics.test.ts

# Run in watch mode
npm run test:integration -- --watch
```

### Environment Variables

```bash
# Set custom base URL (default: http://localhost:3000)
TEST_BASE_URL=http://localhost:3000 npm run test:integration

# Run against staging
TEST_BASE_URL=https://staging.example.com npm run test:integration

# Run against production (read-only tests only)
TEST_BASE_URL=https://production.example.com npm run test:integration
```

## Test Coverage

### /api/metrics Endpoint

**Status Codes:**
- ✅ 200 OK - Successful metrics collection
- ✅ 405 Method Not Allowed - POST, PUT, DELETE rejected
- ✅ 500 Internal Server Error - Graceful degradation

**Response Validation:**
- ✅ Prometheus text format compliance
- ✅ Valid metric names (alphanumeric + underscore)
- ✅ Valid metric values (numeric)
- ✅ HELP and TYPE declarations
- ✅ Default Node.js metrics present
- ✅ Label syntax validation

**Error Handling:**
- ✅ Graceful degradation on prom-client failure
- ✅ JSON error format on 500
- ✅ No crashes on malformed requests

**Performance:**
- ✅ First request < 1s (includes lazy init)
- ✅ Subsequent requests < 200ms
- ✅ Concurrent requests handled correctly

**Concurrency:**
- ✅ Multiple concurrent requests (10+)
- ✅ No race conditions on metric registration
- ✅ Consistent data across concurrent requests
- ✅ Idempotent collectDefaultMetrics()

**Runtime Configuration:**
- ✅ Node.js runtime (not Edge)
- ✅ Dynamic rendering (not cached)
- ✅ Proper Content-Type headers

**Security:**
- ✅ No sensitive information exposed
- ✅ No authentication required (public endpoint)
- ✅ Safe handling of malformed requests

**Prometheus Compatibility:**
- ✅ Scrapable by Prometheus
- ✅ Valid metric types (counter, gauge, histogram, summary)
- ✅ Valid label syntax

## Test Scenarios

### 1. Happy Path

```typescript
// GET /api/metrics
// Expected: 200 OK with Prometheus metrics
const response = await fetch('/api/metrics')
expect(response.status).toBe(200)
expect(response.headers.get('content-type')).toMatch(/text\/plain/)
```

### 2. Error Handling

```typescript
// Simulate prom-client failure
// Expected: 500 with JSON error
const response = await fetch('/api/metrics')
if (response.status === 500) {
  const json = await response.json()
  expect(json.error).toBe('Metrics unavailable')
}
```

### 3. Concurrent Access

```typescript
// 20 concurrent requests
const requests = Array.from({ length: 20 }, () => fetch('/api/metrics'))
const responses = await Promise.all(requests)
responses.forEach(r => expect(r.ok).toBe(true))
```

### 4. Performance Validation

```typescript
// First request (lazy init)
const start = Date.now()
await fetch('/api/metrics')
const duration = Date.now() - start
expect(duration).toBeLessThan(1000)
```

## Fixtures

### Valid Prometheus Metrics

```typescript
import { validPrometheusMetrics } from './fixtures/metrics-samples'

// Use in tests to validate format
expect(actualMetrics).toMatch(/# HELP/)
expect(actualMetrics).toMatch(/# TYPE/)
```

### Expected Default Metrics

```typescript
import { expectedDefaultMetrics } from './fixtures/metrics-samples'

expectedDefaultMetrics.forEach(metric => {
  expect(metricsText).toContain(metric)
})
```

### Performance Benchmarks

```typescript
import { performanceBenchmarks } from './fixtures/metrics-samples'

expect(duration).toBeLessThan(performanceBenchmarks.firstRequest.maxDuration)
```

## Best Practices

### 1. Test Isolation

Each test should be independent and not rely on state from other tests:

```typescript
it('should handle request independently', async () => {
  // Don't rely on previous test state
  const response = await fetch('/api/metrics')
  expect(response.ok).toBe(true)
})
```

### 2. Async/Await

Always use async/await for cleaner test code:

```typescript
it('should return metrics', async () => {
  const response = await fetch('/api/metrics')
  const text = await response.text()
  expect(text).toContain('process_cpu')
})
```

### 3. Error Handling

Test both success and failure paths:

```typescript
it('should handle errors gracefully', async () => {
  const response = await fetch('/api/metrics')
  
  if (response.ok) {
    const text = await response.text()
    expect(text.length).toBeGreaterThan(0)
  } else {
    const json = await response.json()
    expect(json).toHaveProperty('error')
  }
})
```

### 4. Performance Testing

Use realistic thresholds based on production requirements:

```typescript
it('should respond quickly', async () => {
  const start = Date.now()
  await fetch('/api/metrics')
  const duration = Date.now() - start
  
  // First request: < 1s (includes lazy init)
  expect(duration).toBeLessThan(1000)
})
```

### 5. Concurrent Testing

Test realistic concurrent load:

```typescript
it('should handle concurrent requests', async () => {
  const concurrentRequests = 20
  const requests = Array.from(
    { length: concurrentRequests },
    () => fetch('/api/metrics')
  )
  
  const responses = await Promise.all(requests)
  responses.forEach(r => expect(r.ok).toBe(true))
})
```

## Debugging Tests

### Enable Verbose Logging

```bash
# Run with debug output
DEBUG=* npm run test:integration

# Run specific test with logs
npm run test:integration -- --reporter=verbose metrics.test.ts
```

### Inspect Responses

```typescript
it('should return valid metrics', async () => {
  const response = await fetch('/api/metrics')
  const text = await response.text()
  
  // Log for debugging
  console.log('Status:', response.status)
  console.log('Headers:', Object.fromEntries(response.headers))
  console.log('Body preview:', text.substring(0, 200))
  
  expect(response.ok).toBe(true)
})
```

### Test Against Different Environments

```bash
# Local
TEST_BASE_URL=http://localhost:3000 npm run test:integration

# Staging
TEST_BASE_URL=https://staging.example.com npm run test:integration

# Production (read-only)
TEST_BASE_URL=https://api.example.com npm run test:integration
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Start server
        run: npm start &
        
      - name: Wait for server
        run: npx wait-on http://localhost:3000
      
      - name: Run integration tests
        run: npm run test:integration
```

## Troubleshooting

### Server Not Running

```bash
Error: connect ECONNREFUSED 127.0.0.1:3000
```

**Solution:** Start the dev server first:
```bash
npm run dev
```

### Timeout Errors

```bash
Error: Timeout of 5000ms exceeded
```

**Solution:** Increase timeout in vitest.config.ts:
```typescript
export default defineConfig({
  test: {
    testTimeout: 10000, // 10 seconds
  }
})
```

### Flaky Tests

If tests fail intermittently:

1. Check for race conditions in concurrent tests
2. Increase wait times for async operations
3. Ensure test isolation (no shared state)
4. Use retry logic for network requests

```typescript
it('should handle flaky network', async () => {
  let response
  let attempts = 0
  const maxAttempts = 3
  
  while (attempts < maxAttempts) {
    try {
      response = await fetch('/api/metrics')
      if (response.ok) break
    } catch (error) {
      attempts++
      if (attempts === maxAttempts) throw error
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  expect(response.ok).toBe(true)
})
```

## Related Documentation

- [Observability Hardening Spec](../../../.kiro/specs/observability-wrapper-build-fix/)
- [Team Briefing](../../../.kiro/specs/observability-wrapper-build-fix/TEAM_BRIEFING.md)
- [Design Document](../../../.kiro/specs/observability-wrapper-build-fix/design.md)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/)

## Contributing

When adding new API integration tests:

1. Follow the existing test structure
2. Add fixtures for test data
3. Test all HTTP status codes
4. Validate response schemas with Zod
5. Test error handling and edge cases
6. Include performance benchmarks
7. Test concurrent access patterns
8. Document test scenarios in this README

## Maintenance

### Regular Tasks

- [ ] Review and update performance benchmarks quarterly
- [ ] Add tests for new API endpoints
- [ ] Update fixtures when API contracts change
- [ ] Monitor test execution time and optimize slow tests
- [ ] Review and update CI/CD integration

### Metrics

Track test suite health:
- Test execution time
- Test flakiness rate
- Code coverage percentage
- Number of tests per endpoint
