# API Integration Tests

## Quick Start

### Run All API Integration Tests

```bash
npm run test:integration:api
```

### Run CSRF Token Tests Only

```bash
npm run test:integration:csrf
```

### Run with Coverage

```bash
npm run test:integration:api:coverage
```

### Run in Watch Mode

```bash
npm run test:integration:api:watch
```

## Prerequisites

### 1. Start the Development Server

```bash
npm run dev
```

The server should be running on `http://localhost:3000`.

### 2. Set Environment Variables

Create a `.env.test` file:

```bash
# Test API URL
TEST_API_URL=http://localhost:3000

# Node environment
NODE_ENV=test

# Redis (optional, for rate limiting tests)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Database (optional, for database tests)
DATABASE_URL=postgresql://user:password@localhost:5432/huntaze_test
```

### 3. Install Dependencies

```bash
npm install
```

## Test Structure

```
tests/integration/api/
├── csrf-token.integration.test.ts          # Core integration tests
├── csrf-token-scenarios.integration.test.ts # Scenario-based tests
├── fixtures/
│   └── csrf-token.fixtures.ts              # Test data and helpers
├── setup.ts                                 # Test setup
├── global-setup.ts                          # Global setup
├── global-teardown.ts                       # Global teardown
├── API_TESTS.md                            # Detailed documentation
└── README.md                               # This file
```

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect } from 'vitest';

describe('My API Endpoint', () => {
  const baseUrl = process.env.TEST_API_URL || 'http://localhost:3000';

  it('should return 200 OK', async () => {
    const response = await fetch(`${baseUrl}/api/my-endpoint`);
    
    expect(response.status).toBe(200);
    
    const body = await response.json();
    expect(body).toHaveProperty('data');
  });
});
```

### Using Fixtures

```typescript
import {
  TEST_USER_AGENTS,
  makeConcurrentRequests,
  measureRequestDuration,
} from './fixtures/csrf-token.fixtures';

it('should handle concurrent requests', async () => {
  const responses = await makeConcurrentRequests(
    `${baseUrl}/api/csrf/token`,
    10
  );
  
  expect(responses.every(r => r.status === 200)).toBe(true);
});
```

### Schema Validation with Zod

```typescript
import { z } from 'zod';

const ResponseSchema = z.object({
  token: z.string().length(64),
});

it('should return valid response schema', async () => {
  const response = await fetch(`${baseUrl}/api/csrf/token`);
  const body = await response.json();
  
  const validation = ResponseSchema.safeParse(body);
  expect(validation.success).toBe(true);
});
```

## Test Categories

### 1. Success Cases

Test successful API responses:

```typescript
it('should return 200 with valid data', async () => {
  const response = await fetch(`${baseUrl}/api/endpoint`);
  expect(response.status).toBe(200);
});
```

### 2. Error Cases

Test error handling:

```typescript
it('should return 400 for invalid input', async () => {
  const response = await fetch(`${baseUrl}/api/endpoint`, {
    method: 'POST',
    body: JSON.stringify({ invalid: 'data' }),
  });
  expect(response.status).toBe(400);
});
```

### 3. Authentication

Test authentication requirements:

```typescript
it('should return 401 without auth', async () => {
  const response = await fetch(`${baseUrl}/api/protected`);
  expect(response.status).toBe(401);
});
```

### 4. Rate Limiting

Test rate limiting behavior:

```typescript
it('should rate limit excessive requests', async () => {
  const responses = await makeConcurrentRequests(url, 200);
  const rateLimited = responses.filter(r => r.status === 429);
  expect(rateLimited.length).toBeGreaterThan(0);
});
```

### 5. Performance

Test response times:

```typescript
it('should respond within 100ms', async () => {
  const { response, duration } = await measureRequestDuration(url);
  expect(response.status).toBe(200);
  expect(duration).toBeLessThan(100);
});
```

### 6. Concurrent Access

Test concurrent request handling:

```typescript
it('should handle 50 concurrent requests', async () => {
  const responses = await makeConcurrentRequests(url, 50);
  const successCount = responses.filter(r => r.status === 200).length;
  expect(successCount).toBeGreaterThanOrEqual(45);
});
```

## Best Practices

### 1. Use Descriptive Test Names

```typescript
// ❌ Bad
it('test 1', async () => { ... });

// ✅ Good
it('should return 200 with valid CSRF token', async () => { ... });
```

### 2. Test One Thing Per Test

```typescript
// ❌ Bad
it('should work', async () => {
  // Tests multiple things
  expect(response.status).toBe(200);
  expect(response.headers.get('content-type')).toBe('application/json');
  expect(body.token).toBeTruthy();
  expect(cookie).toBeTruthy();
});

// ✅ Good
it('should return 200 status code', async () => {
  expect(response.status).toBe(200);
});

it('should return JSON content-type', async () => {
  expect(response.headers.get('content-type')).toContain('application/json');
});
```

### 3. Use Fixtures for Test Data

```typescript
// ❌ Bad
const token = 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456';

// ✅ Good
import { VALID_CSRF_TOKENS } from './fixtures/csrf-token.fixtures';
const token = VALID_CSRF_TOKENS[0];
```

### 4. Clean Up After Tests

```typescript
afterEach(async () => {
  // Clean up test data
  await cleanupTestData();
});
```

### 5. Handle Async Properly

```typescript
// ❌ Bad
it('should work', () => {
  fetch(url).then(response => {
    expect(response.status).toBe(200);
  });
});

// ✅ Good
it('should work', async () => {
  const response = await fetch(url);
  expect(response.status).toBe(200);
});
```

## Debugging Tests

### Run Single Test File

```bash
npm run test:integration:api -- csrf-token.integration.test.ts
```

### Run Single Test

```bash
npm run test:integration:api -- -t "should return 200"
```

### Enable Verbose Logging

```bash
DEBUG=* npm run test:integration:api
```

### Run with Node Inspector

```bash
node --inspect-brk node_modules/.bin/vitest run --config vitest.config.integration.api.ts
```

## Troubleshooting

### Server Not Running

**Error**: `ECONNREFUSED`

**Solution**: Start the development server:

```bash
npm run dev
```

### Port Already in Use

**Error**: `EADDRINUSE`

**Solution**: Kill the process using the port:

```bash
lsof -ti:3000 | xargs kill -9
```

### Tests Timing Out

**Error**: `Test timed out`

**Solution**: Increase timeout in test:

```typescript
it('slow test', async () => {
  // ...
}, 60000); // 60 second timeout
```

### Redis Connection Failed

**Error**: `Redis connection refused`

**Solution**: Start Redis:

```bash
redis-server
```

Or skip rate limiting tests:

```bash
npm run test:integration:api -- --exclude rate-limit
```

### Database Connection Failed

**Error**: `Database connection refused`

**Solution**: Check database is running and credentials are correct.

## CI/CD Integration

### GitHub Actions

```yaml
name: API Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - run: npm ci
      
      - run: npm run build
      
      - run: npm run dev &
      
      - run: sleep 10
      
      - run: npm run test:integration:api
        env:
          TEST_API_URL: http://localhost:3000
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          REDIS_HOST: localhost
          REDIS_PORT: 6379
```

## Performance Benchmarks

| Metric | Target | Typical |
|--------|--------|---------|
| Single request | < 100ms | ~10ms |
| 10 sequential | < 500ms | ~100ms |
| 10 concurrent | < 200ms | ~50ms |
| 50 concurrent | < 500ms | ~150ms |

## Coverage Goals

- **Line Coverage**: > 80%
- **Branch Coverage**: > 80%
- **Function Coverage**: > 80%
- **Statement Coverage**: > 80%

## Resources

- [API Tests Documentation](./API_TESTS.md)
- [CSRF Token API Documentation](../../../app/api/csrf/token/README.md)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://testingjavascript.com/)

## Support

For questions or issues:

1. Check [API_TESTS.md](./API_TESTS.md) for detailed documentation
2. Review existing tests for examples
3. Check [Troubleshooting](#troubleshooting) section
4. Contact the platform team

## Contributing

When adding new tests:

1. Follow the existing test structure
2. Use fixtures for test data
3. Add documentation to API_TESTS.md
4. Ensure tests pass locally
5. Update this README if needed

## License

Internal use only - Huntaze Platform Team
