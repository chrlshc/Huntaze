# API Integration Tests

## Overview

Comprehensive integration tests for all Huntaze API endpoints with real HTTP requests, database interactions, and session-based authentication.

## Test Structure

```
tests/integration/api/
├── README.md                           # This file
├── fixtures/                           # Test data fixtures
│   ├── content-fixtures.ts            # Content API fixtures
│   └── auth-fixtures.ts               # Auth API fixtures
├── helpers/                            # Test utilities
│   ├── api-client.ts                  # HTTP client wrapper
│   └── test-setup.ts                  # Setup/teardown helpers
├── auth-register.integration.test.ts  # Registration tests
├── auth-onboarding-flow.test.ts       # Auth + onboarding flow
├── onboarding-complete.integration.test.ts # Onboarding completion
├── content.integration.test.ts        # Content CRUD tests
└── content-api-tests.md               # Content API documentation
```

## Running Tests

### All Integration Tests
```bash
npm run test:integration
```

### Specific Test File
```bash
npm run test:integration -- content.integration.test.ts
```

### With Coverage
```bash
npm run test:integration -- --coverage
```

### Watch Mode
```bash
npm run test:integration -- --watch
```

### Verbose Output
```bash
npm run test:integration -- --reporter=verbose
```

## Environment Setup

### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/huntaze_test

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=test-secret-key-min-32-chars

# API
TEST_API_URL=http://localhost:3000
```

### Test Database Setup

```bash
# Create test database
createdb huntaze_test

# Run migrations
npm run db:migrate

# Seed test data (optional)
npm run db:seed:test
```

## Test Patterns

### 1. HTTP Status Code Testing

```typescript
describe('HTTP Status Codes', () => {
  it('should return 200 OK on success', async () => {
    const response = await fetch(`${baseUrl}/api/endpoint`);
    expect(response.status).toBe(200);
  });

  it('should return 401 Unauthorized without auth', async () => {
    const response = await fetch(`${baseUrl}/api/endpoint`);
    expect(response.status).toBe(401);
  });

  it('should return 400 Bad Request for invalid data', async () => {
    const response = await fetch(`${baseUrl}/api/endpoint`, {
      method: 'POST',
      body: JSON.stringify({ invalid: 'data' }),
    });
    expect(response.status).toBe(400);
  });
});
```

### 2. Response Schema Validation

```typescript
import { z } from 'zod';

const ResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    id: z.string(),
    name: z.string(),
  }),
});

it('should return valid response schema', async () => {
  const response = await fetch(`${baseUrl}/api/endpoint`);
  const data = await response.json();
  
  expect(ResponseSchema.parse(data)).toBeDefined();
});
```

### 3. Authentication Testing

```typescript
describe('Authentication', () => {
  let sessionCookie: string;

  beforeAll(async () => {
    // Login to get session
    const response = await fetch(`${baseUrl}/api/auth/signin`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    sessionCookie = response.headers.get('set-cookie');
  });

  it('should require authentication', async () => {
    const response = await fetch(`${baseUrl}/api/endpoint`, {
      headers: { Cookie: sessionCookie },
    });
    
    expect(response.status).toBe(200);
  });
});
```

### 4. Database Integration Testing

```typescript
import { query } from '@/lib/db';

it('should create record in database', async () => {
  const response = await fetch(`${baseUrl}/api/endpoint`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  const { id } = await response.json();

  // Verify in database
  const result = await query('SELECT * FROM table WHERE id = $1', [id]);
  expect(result.rows.length).toBe(1);
});
```

### 5. Concurrent Access Testing

```typescript
it('should handle concurrent requests', async () => {
  const requests = Array.from({ length: 10 }, () =>
    fetch(`${baseUrl}/api/endpoint`, { method: 'POST' })
  );

  const responses = await Promise.all(requests);
  const successCount = responses.filter(r => r.status === 200).length;

  expect(successCount).toBe(10);
});
```

### 6. Rate Limiting Testing

```typescript
it('should enforce rate limits', async () => {
  const requests = [];

  // Exceed rate limit
  for (let i = 0; i < 100; i++) {
    requests.push(fetch(`${baseUrl}/api/endpoint`));
  }

  const responses = await Promise.all(requests);
  const rateLimited = responses.some(r => r.status === 429);

  expect(rateLimited).toBe(true);
});
```

## Test Coverage Goals

### Minimum Coverage
- **Lines**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Statements**: 80%

### Critical Paths
- Authentication flows: 100%
- Authorization checks: 100%
- Data validation: 90%
- Error handling: 85%

## Best Practices

### 1. Test Isolation

```typescript
describe('Test Suite', () => {
  const testData: string[] = [];

  afterEach(async () => {
    // Cleanup after each test
    for (const id of testData) {
      await query('DELETE FROM table WHERE id = $1', [id]);
    }
    testData.length = 0;
  });
});
```

### 2. Use Fixtures

```typescript
import { validContentData } from './fixtures/content-fixtures';

it('should create content', async () => {
  const response = await fetch(`${baseUrl}/api/content`, {
    method: 'POST',
    body: JSON.stringify(validContentData.minimal),
  });

  expect(response.status).toBe(201);
});
```

### 3. Test Real Scenarios

```typescript
it('should complete full user journey', async () => {
  // 1. Register
  const registerResponse = await register(userData);
  
  // 2. Login
  const loginResponse = await login(credentials);
  
  // 3. Complete onboarding
  const onboardingResponse = await completeOnboarding(answers);
  
  // 4. Create content
  const contentResponse = await createContent(contentData);
  
  // All steps should succeed
  expect(registerResponse.status).toBe(201);
  expect(loginResponse.status).toBe(200);
  expect(onboardingResponse.status).toBe(200);
  expect(contentResponse.status).toBe(201);
});
```

### 4. Performance Testing

```typescript
it('should complete within time limit', async () => {
  const startTime = Date.now();
  
  await fetch(`${baseUrl}/api/endpoint`);
  
  const duration = Date.now() - startTime;
  expect(duration).toBeLessThan(1000); // < 1 second
});
```

### 5. Error Scenarios

```typescript
describe('Error Handling', () => {
  it('should handle network errors', async () => {
    // Mock network failure
    const response = await fetch('http://invalid-url');
    expect(response).toBeUndefined();
  });

  it('should handle database errors', async () => {
    // Mock database failure
    const response = await fetch(`${baseUrl}/api/endpoint`);
    expect(response.status).toBe(500);
  });
});
```

## Common Issues

### Database Connection Errors

**Problem**: Tests fail with "connection refused"

**Solution**:
```bash
# Check database is running
pg_isready

# Verify DATABASE_URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### Session Authentication Failures

**Problem**: Tests fail with 401 Unauthorized

**Solution**:
```typescript
// Ensure session cookie is set
const response = await fetch(url, {
  headers: {
    Cookie: sessionCookie,
  },
  credentials: 'include', // Important!
});
```

### Flaky Tests

**Problem**: Tests pass/fail randomly

**Solution**:
- Add proper cleanup in `afterEach`
- Use unique test data (timestamps, UUIDs)
- Increase timeouts for slow operations
- Avoid shared state between tests

### Rate Limit Failures

**Problem**: Tests fail due to rate limiting

**Solution**:
```typescript
// Add delays between requests
await new Promise(resolve => setTimeout(resolve, 100));

// Or use separate test users
const testUser = `test-${Date.now()}@example.com`;
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run migrations
        run: npm run db:migrate
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          NEXTAUTH_SECRET: ${{ secrets.TEST_NEXTAUTH_SECRET }}
```

## Test Documentation

Each API endpoint should have comprehensive test documentation:

- **HTTP Status Codes**: All possible response codes
- **Request/Response Schemas**: Zod validation
- **Authentication**: Session requirements
- **Authorization**: Ownership checks
- **Rate Limiting**: Limits and headers
- **Concurrent Access**: Race condition handling
- **Performance**: Response time benchmarks
- **Security**: XSS, SQL injection tests

See [content-api-tests.md](./content-api-tests.md) for example.

## Related Documentation

- [API Reference](../../../docs/api/README.md)
- [Authentication Guide](../../../docs/api/SESSION_AUTH.md)
- [Database Migrations](../../../migrations/README.md)
- [Rate Limiting](../../../lib/services/rate-limiter/README.md)

---

**Last Updated**: November 17, 2025  
**Version**: 1.0  
**Status**: ✅ Active
