# API Integration Tests Documentation

Comprehensive documentation for API integration testing strategy, scenarios, and best practices.

## Table of Contents

1. [Overview](#overview)
2. [Test Architecture](#test-architecture)
3. [Test Scenarios](#test-scenarios)
4. [Running Tests](#running-tests)
5. [Writing New Tests](#writing-new-tests)
6. [CI/CD Integration](#cicd-integration)
7. [Troubleshooting](#troubleshooting)

## Overview

Our API integration tests validate the complete request-response cycle of API endpoints, including:

- HTTP status codes and headers
- Response schema validation
- Error handling and graceful degradation
- Performance characteristics
- Concurrent access patterns
- Security considerations
- Prometheus metrics compliance

### Test Philosophy

1. **Test Real Behavior**: Integration tests hit actual endpoints, not mocks
2. **Validate Contracts**: Use Zod schemas to validate API contracts
3. **Test Edge Cases**: Cover error paths, not just happy paths
4. **Performance Aware**: Track and validate response times
5. **Production-Like**: Test against production-like configurations

## Test Architecture

### Directory Structure

```
tests/integration/
├── api/
│   ├── README.md                    # API tests documentation
│   ├── metrics.test.ts              # /api/metrics endpoint tests
│   ├── fixtures/
│   │   └── metrics-samples.ts       # Test data and fixtures
│   └── helpers/
│       └── test-utils.ts            # Shared utilities
└── ...
```

### Test Layers

```
┌─────────────────────────────────────────┐
│         Integration Tests               │
│  (Real HTTP requests to endpoints)      │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Next.js API Routes              │
│  (app/api/*/route.ts)                   │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Business Logic                  │
│  (lib/*, services/*)                    │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         External Services               │
│  (Database, Redis, S3, etc.)            │
└─────────────────────────────────────────┘
```

## Test Scenarios

### 1. /api/metrics Endpoint

**Purpose**: Expose Prometheus metrics for monitoring

#### Scenario 1.1: Successful Metrics Collection

**Given**: Server is running with prom-client available  
**When**: GET request to /api/metrics  
**Then**: 
- Returns 200 OK
- Content-Type is text/plain
- Response contains valid Prometheus format
- Default Node.js metrics are present

```typescript
it('should return valid Prometheus metrics', async () => {
  const response = await fetch(`${BASE_URL}/api/metrics`)
  
  expect(response.status).toBe(200)
  expect(response.headers.get('content-type')).toMatch(/text\/plain/)
  
  const text = await response.text()
  expect(text).toContain('process_cpu_user_seconds_total')
  expect(text).toContain('# HELP')
  expect(text).toContain('# TYPE')
})
```

#### Scenario 1.2: Method Not Allowed

**Given**: Server is running  
**When**: POST/PUT/DELETE request to /api/metrics  
**Then**: Returns 405 Method Not Allowed

```typescript
it('should reject non-GET methods', async () => {
  const methods = ['POST', 'PUT', 'DELETE']
  
  for (const method of methods) {
    const response = await fetch(`${BASE_URL}/api/metrics`, { method })
    expect(response.status).toBe(405)
  }
})
```

#### Scenario 1.3: Graceful Degradation

**Given**: prom-client fails to load  
**When**: GET request to /api/metrics  
**Then**: 
- Returns 500 Internal Server Error
- Response is JSON with error message
- Server continues running

```typescript
it('should handle prom-client failure gracefully', async () => {
  // This would require mocking prom-client to fail
  const response = await fetch(`${BASE_URL}/api/metrics`)
  
  if (response.status === 500) {
    const json = await response.json()
    expect(json).toHaveProperty('error')
    expect(json.error).toBe('Metrics unavailable')
  }
})
```

#### Scenario 1.4: Concurrent Access

**Given**: Server is running  
**When**: 20 concurrent GET requests to /api/metrics  
**Then**: 
- All requests return 200 OK
- No race conditions occur
- Metrics are consistent

```typescript
it('should handle concurrent requests', async () => {
  const requests = Array.from({ length: 20 }, () =>
    fetch(`${BASE_URL}/api/metrics`)
  )
  
  const responses = await Promise.all(requests)
  
  responses.forEach(response => {
    expect(response.status).toBe(200)
  })
})
```

#### Scenario 1.5: Performance Validation

**Given**: Server is running  
**When**: First request to /api/metrics (includes lazy init)  
**Then**: Response time < 1000ms

**When**: Subsequent requests  
**Then**: Response time < 200ms

```typescript
it('should respond within acceptable time', async () => {
  // First request (may include lazy init)
  const start1 = Date.now()
  await fetch(`${BASE_URL}/api/metrics`)
  const duration1 = Date.now() - start1
  expect(duration1).toBeLessThan(1000)
  
  // Subsequent request (cached)
  const start2 = Date.now()
  await fetch(`${BASE_URL}/api/metrics`)
  const duration2 = Date.now() - start2
  expect(duration2).toBeLessThan(200)
})
```

#### Scenario 1.6: Prometheus Format Validation

**Given**: Server is running  
**When**: GET request to /api/metrics  
**Then**: 
- Each line matches Prometheus format
- Metric names are valid (alphanumeric + underscore)
- Metric values are numeric
- Labels have valid syntax

```typescript
it('should return valid Prometheus format', async () => {
  const response = await fetch(`${BASE_URL}/api/metrics`)
  const text = await response.text()
  
  const lines = text.split('\n')
  lines.forEach(line => {
    if (line.startsWith('#')) {
      // Comment line
      expect(line).toMatch(/^# (HELP|TYPE) \S+/)
    } else if (line.trim()) {
      // Metric line
      expect(line).toMatch(/^[a-zA-Z_][a-zA-Z0-9_]*/)
    }
  })
})
```

#### Scenario 1.7: Idempotence

**Given**: Server is running  
**When**: Multiple requests to /api/metrics  
**Then**: 
- collectDefaultMetrics() doesn't cause errors
- No "metric already registered" errors
- Metrics registry persists across requests

```typescript
it('should be idempotent', async () => {
  for (let i = 0; i < 5; i++) {
    const response = await fetch(`${BASE_URL}/api/metrics`)
    expect(response.status).toBe(200)
  }
})
```

#### Scenario 1.8: Runtime Configuration

**Given**: Server is running  
**When**: GET request to /api/metrics  
**Then**: 
- Uses Node.js runtime (not Edge)
- Is dynamically rendered (not cached)
- Node.js-specific metrics are present

```typescript
it('should use Node.js runtime', async () => {
  const response = await fetch(`${BASE_URL}/api/metrics`)
  const text = await response.text()
  
  // These metrics only exist in Node.js runtime
  expect(text).toContain('nodejs_')
  expect(text).toContain('process_')
})
```

#### Scenario 1.9: Security

**Given**: Server is running  
**When**: GET request to /api/metrics  
**Then**: 
- No sensitive information exposed
- No authentication required (public endpoint)
- Malformed requests handled safely

```typescript
it('should not expose sensitive information', async () => {
  const response = await fetch(`${BASE_URL}/api/metrics`)
  const text = await response.text()
  
  expect(text.toLowerCase()).not.toContain('password')
  expect(text.toLowerCase()).not.toContain('secret')
  expect(text.toLowerCase()).not.toContain('token')
})
```

### 2. Future Endpoints

As new API endpoints are added, follow this template:

#### Scenario Template: [Endpoint Name]

**Purpose**: [What the endpoint does]

**Test Cases**:
1. Happy path (200 OK)
2. Invalid input (400 Bad Request)
3. Unauthorized (401 Unauthorized)
4. Forbidden (403 Forbidden)
5. Not found (404 Not Found)
6. Server error (500 Internal Server Error)
7. Rate limiting (429 Too Many Requests)
8. Concurrent access
9. Performance validation
10. Schema validation

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Start development server
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
npm run test:integration:coverage

# Run in watch mode
npm run test:integration:watch
```

### Run Specific Tests

```bash
# Run specific test file
npm run test:integration tests/integration/api/metrics.test.ts

# Run tests matching pattern
npm run test:integration -- --grep "concurrent"

# Run with verbose output
npm run test:integration -- --reporter=verbose
```

### Environment Configuration

```bash
# Test against local server (default)
TEST_BASE_URL=http://localhost:3000 npm run test:integration

# Test against staging
TEST_BASE_URL=https://staging.example.com npm run test:integration

# Test against production (read-only tests only)
TEST_BASE_URL=https://api.example.com npm run test:integration
```

## Writing New Tests

### Step 1: Create Test File

```typescript
// tests/integration/api/my-endpoint.test.ts
import { describe, it, expect } from 'vitest'

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

describe('Integration: /api/my-endpoint', () => {
  describe('HTTP Status Codes', () => {
    it('should return 200 OK', async () => {
      const response = await fetch(`${BASE_URL}/api/my-endpoint`)
      expect(response.status).toBe(200)
    })
  })
})
```

### Step 2: Add Response Schema Validation

```typescript
import { z } from 'zod'

const ResponseSchema = z.object({
  data: z.array(z.object({
    id: z.string(),
    name: z.string(),
  })),
  total: z.number(),
})

it('should return valid response schema', async () => {
  const response = await fetch(`${BASE_URL}/api/my-endpoint`)
  const json = await response.json()
  
  const result = ResponseSchema.safeParse(json)
  expect(result.success).toBe(true)
})
```

### Step 3: Add Error Handling Tests

```typescript
it('should handle invalid input', async () => {
  const response = await fetch(`${BASE_URL}/api/my-endpoint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ invalid: 'data' })
  })
  
  expect(response.status).toBe(400)
  
  const json = await response.json()
  expect(json).toHaveProperty('error')
})
```

### Step 4: Add Performance Tests

```typescript
it('should respond within acceptable time', async () => {
  const start = Date.now()
  await fetch(`${BASE_URL}/api/my-endpoint`)
  const duration = Date.now() - start
  
  expect(duration).toBeLessThan(500)
})
```

### Step 5: Add Concurrent Access Tests

```typescript
it('should handle concurrent requests', async () => {
  const requests = Array.from({ length: 10 }, () =>
    fetch(`${BASE_URL}/api/my-endpoint`)
  )
  
  const responses = await Promise.all(requests)
  responses.forEach(r => expect(r.ok).toBe(true))
})
```

### Step 6: Create Fixtures

```typescript
// tests/integration/api/fixtures/my-endpoint-samples.ts
export const validRequest = {
  name: 'Test',
  email: 'test@example.com',
}

export const invalidRequest = {
  name: '', // Invalid: empty name
}

export const expectedResponse = {
  id: expect.any(String),
  name: 'Test',
  createdAt: expect.any(String),
}
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Integration Tests

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Start server
        run: npm start &
        
      - name: Wait for server
        run: npx wait-on http://localhost:3000 --timeout 60000
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          TEST_BASE_URL: http://localhost:3000
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        if: always()
        with:
          files: ./coverage/coverage-final.json
```

### Pre-deployment Validation

```bash
#!/bin/bash
# scripts/pre-deploy-tests.sh

set -e

echo "🧪 Running pre-deployment tests..."

# Start server
npm run build
npm start &
SERVER_PID=$!

# Wait for server
npx wait-on http://localhost:3000 --timeout 60000

# Run tests
npm run test:integration

# Cleanup
kill $SERVER_PID

echo "✅ All tests passed!"
```

## Troubleshooting

### Server Not Running

**Error**: `connect ECONNREFUSED 127.0.0.1:3000`

**Solution**:
```bash
# Start the server first
npm run dev
# or
npm run build && npm start

# Then run tests in another terminal
npm run test:integration
```

### Timeout Errors

**Error**: `Timeout of 5000ms exceeded`

**Solution**: Increase timeout in test file:
```typescript
it('should handle slow operation', async () => {
  // ... test code
}, 10000) // 10 second timeout
```

Or globally in `vitest.config.ts`:
```typescript
export default defineConfig({
  test: {
    testTimeout: 10000,
  }
})
```

### Flaky Tests

**Symptoms**: Tests pass sometimes, fail other times

**Solutions**:
1. Add retry logic for network requests
2. Increase wait times for async operations
3. Ensure test isolation (no shared state)
4. Use `waitFor` helper for conditions

```typescript
import { retry } from './helpers/test-utils'

it('should handle flaky network', async () => {
  const response = await retry(
    () => fetch(`${BASE_URL}/api/endpoint`),
    { maxAttempts: 3, initialDelay: 1000 }
  )
  
  expect(response.ok).toBe(true)
})
```

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
TEST_BASE_URL=http://localhost:3001 npm run test:integration
```

### Environment Variables Not Set

**Error**: Tests fail due to missing env vars

**Solution**:
```bash
# Copy example env file
cp .env.example .env

# Validate env vars
npm run check:env

# Run tests with env vars
npm run test:integration
```

## Best Practices

### 1. Test Independence

Each test should be independent and not rely on other tests:

```typescript
// ❌ Bad: Relies on previous test
let userId: string

it('should create user', async () => {
  const response = await createUser()
  userId = response.id // Shared state
})

it('should get user', async () => {
  const response = await getUser(userId) // Depends on previous test
})

// ✅ Good: Independent tests
it('should create user', async () => {
  const response = await createUser()
  expect(response.id).toBeDefined()
})

it('should get user', async () => {
  const user = await createUser() // Create own test data
  const response = await getUser(user.id)
  expect(response.id).toBe(user.id)
})
```

### 2. Use Descriptive Test Names

```typescript
// ❌ Bad: Vague
it('works', async () => { ... })

// ✅ Good: Descriptive
it('should return 200 OK when metrics are available', async () => { ... })
```

### 3. Test Error Paths

```typescript
it('should handle errors gracefully', async () => {
  const response = await fetch(`${BASE_URL}/api/endpoint`, {
    method: 'POST',
    body: 'invalid json'
  })
  
  expect(response.status).toBe(400)
  const json = await response.json()
  expect(json.error).toBeDefined()
})
```

### 4. Validate Response Schemas

```typescript
import { z } from 'zod'

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  createdAt: z.string().datetime(),
})

it('should return valid user schema', async () => {
  const response = await fetch(`${BASE_URL}/api/users/123`)
  const json = await response.json()
  
  const result = UserSchema.safeParse(json)
  expect(result.success).toBe(true)
})
```

### 5. Use Fixtures for Test Data

```typescript
import { validUser, invalidUser } from './fixtures/users'

it('should accept valid user', async () => {
  const response = await createUser(validUser)
  expect(response.ok).toBe(true)
})

it('should reject invalid user', async () => {
  const response = await createUser(invalidUser)
  expect(response.status).toBe(400)
})
```

## Metrics and Monitoring

Track test suite health:

- **Test Execution Time**: Should be < 5 minutes
- **Test Flakiness Rate**: Should be < 1%
- **Code Coverage**: Target > 80%
- **Tests per Endpoint**: Minimum 10 scenarios

## Related Documentation

- [Observability Hardening Spec](../.kiro/specs/observability-wrapper-build-fix/)
- [API Integration Tests README](../tests/integration/api/README.md)
- [Test Utilities](../tests/integration/api/helpers/test-utils.ts)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/)

## Contributing

When adding new API integration tests:

1. Follow the test structure outlined above
2. Add fixtures for test data
3. Test all HTTP status codes
4. Validate response schemas with Zod
5. Test error handling and edge cases
6. Include performance benchmarks
7. Test concurrent access patterns
8. Document test scenarios in this file
9. Update CI/CD pipelines if needed

## Maintenance Checklist

- [ ] Review and update performance benchmarks quarterly
- [ ] Add tests for new API endpoints
- [ ] Update fixtures when API contracts change
- [ ] Monitor test execution time and optimize slow tests
- [ ] Review and update CI/CD integration
- [ ] Track and reduce test flakiness
- [ ] Maintain > 80% code coverage
