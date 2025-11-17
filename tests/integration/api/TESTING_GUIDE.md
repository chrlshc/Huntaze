# Integration Testing Guide

Complete guide for writing and running integration tests for Huntaze APIs.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Test Structure](#test-structure)
3. [Writing Tests](#writing-tests)
4. [Fixtures](#fixtures)
5. [Running Tests](#running-tests)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

## Quick Start

### Prerequisites
```bash
# 1. Install dependencies
npm install

# 2. Setup test database
createdb huntaze_test

# 3. Run migrations
npm run db:migrate

# 4. Set environment variables
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/huntaze_test"
export NEXTAUTH_SECRET="test-secret-key"
export NEXTAUTH_URL="http://localhost:3000"
```

### Run Tests
```bash
# All integration tests
npm run test:integration

# Specific API
npm run test:integration -- marketing-campaigns

# With coverage
npm run test:integration:coverage

# Watch mode
npm run test:integration:watch
```

## Test Structure

### File Organization
```
tests/integration/api/
├── fixtures/
│   ├── marketing-fixtures.ts      # Test data and schemas
│   ├── content-fixtures.ts
│   └── analytics-fixtures.ts
├── marketing-campaigns.integration.test.ts
├── content.integration.test.ts
├── analytics.integration.test.ts
├── marketing-api-tests.md         # Documentation
├── content-api-tests.md
└── TESTING_GUIDE.md               # This file
```

### Test File Template
```typescript
/**
 * API Name - Integration Tests
 * 
 * Description of what this test suite covers
 * 
 * Requirements: X.X, Y.Y, Z.Z
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { query } from '@/lib/db';
import { /* schemas */ } from './fixtures/api-fixtures';

describe('API Name - Integration Tests', () => {
  const baseUrl = process.env.TEST_API_URL || 'http://localhost:3000';
  const testUsers: string[] = [];
  const testResources: string[] = [];
  let testSessionCookie: string;
  let testUserId: string;

  // Setup
  beforeAll(async () => {
    // Create test user
    // Get session
  });

  // Cleanup
  afterAll(async () => {
    // Delete test resources
    // Delete test users
  });

  // Helper functions
  const makeRequest = async (method, path, body?, session?) => {
    // Make HTTP request
  };

  // Test suites
  describe('GET /api/endpoint', () => {
    describe('HTTP Status Codes', () => {
      it('should return 200 OK on success', async () => { /* ... */ });
      it('should return 401 Unauthorized without session', async () => { /* ... */ });
    });

    describe('Response Schema Validation', () => {
      it('should return valid schema', async () => { /* ... */ });
    });

    describe('Authentication & Authorization', () => {
      it('should require valid session', async () => { /* ... */ });
    });

    describe('Input Validation', () => {
      it('should reject invalid input', async () => { /* ... */ });
    });

    describe('Performance', () => {
      it('should complete within target time', async () => { /* ... */ });
    });
  });
});
```

## Writing Tests

### 1. HTTP Status Code Tests
```typescript
describe('HTTP Status Codes', () => {
  it('should return 200 OK on success', async () => {
    const response = await makeRequest('GET', '/api/resource', null, session);
    expect(response.status).toBe(200);
  });

  it('should return 201 Created on creation', async () => {
    const response = await makeRequest('POST', '/api/resource', data, session);
    expect(response.status).toBe(201);
  });

  it('should return 400 Bad Request for invalid data', async () => {
    const response = await makeRequest('POST', '/api/resource', invalidData, session);
    expect(response.status).toBe(400);
  });

  it('should return 401 Unauthorized without session', async () => {
    const response = await makeRequest('GET', '/api/resource');
    expect(response.status).toBe(401);
  });

  it('should return 404 Not Found for non-existent resource', async () => {
    const response = await makeRequest('GET', '/api/resource/non-existent', null, session);
    expect(response.status).toBe(404);
  });
});
```

### 2. Schema Validation Tests
```typescript
import { ResourceSchema } from './fixtures/resource-fixtures';

describe('Response Schema Validation', () => {
  it('should return valid schema', async () => {
    const response = await makeRequest('GET', '/api/resource', null, session);
    
    // Validate with Zod
    const validated = ResourceSchema.parse(response.data);
    expect(validated).toBeDefined();
  });

  it('should not expose sensitive data', async () => {
    const response = await makeRequest('GET', '/api/resource', null, session);
    
    expect(response.data).not.toHaveProperty('password');
    expect(response.data).not.toHaveProperty('secret');
  });
});
```

### 3. Authentication Tests
```typescript
describe('Authentication & Authorization', () => {
  it('should require valid session', async () => {
    const response = await makeRequest('GET', '/api/resource');
    expect(response.status).toBe(401);
  });

  it('should verify ownership', async () => {
    // Create resource as user1
    const createResponse = await makeRequest('POST', '/api/resource', data, user1Session);
    const resourceId = createResponse.data.id;

    // Try to access as user2
    const response = await makeRequest('GET', `/api/resource/${resourceId}`, null, user2Session);
    expect([403, 404]).toContain(response.status);
  });
});
```

### 4. Input Validation Tests
```typescript
import { invalidResourceData } from './fixtures/resource-fixtures';

describe('Input Validation', () => {
  it('should reject missing required fields', async () => {
    const response = await makeRequest(
      'POST',
      '/api/resource',
      invalidResourceData.missingField,
      session
    );
    expect(response.status).toBe(400);
  });

  it('should reject invalid enum values', async () => {
    const response = await makeRequest(
      'POST',
      '/api/resource',
      invalidResourceData.invalidEnum,
      session
    );
    expect(response.status).toBe(400);
  });

  it('should reject out-of-range values', async () => {
    const response = await makeRequest(
      'POST',
      '/api/resource',
      invalidResourceData.outOfRange,
      session
    );
    expect(response.status).toBe(400);
  });
});
```

### 5. Concurrent Access Tests
```typescript
describe('Concurrent Access', () => {
  it('should handle concurrent creations', async () => {
    const requests = Array.from({ length: 10 }, () =>
      makeRequest('POST', '/api/resource', data, session)
    );

    const responses = await Promise.all(requests);
    const successCount = responses.filter(r => r.status === 201).length;

    expect(successCount).toBe(10);
  });

  it('should maintain data consistency', async () => {
    // Create resource
    const createResponse = await makeRequest('POST', '/api/resource', data, session);
    const resourceId = createResponse.data.id;

    // Concurrent updates
    const updates = Array.from({ length: 5 }, (_, i) =>
      makeRequest('PUT', `/api/resource/${resourceId}`, { value: i }, session)
    );

    await Promise.all(updates);

    // Verify final state
    const getResponse = await makeRequest('GET', `/api/resource/${resourceId}`, null, session);
    expect(getResponse.data.value).toBeGreaterThanOrEqual(0);
    expect(getResponse.data.value).toBeLessThan(5);
  });
});
```

### 6. Performance Tests
```typescript
describe('Performance', () => {
  it('should complete within target time', async () => {
    const startTime = Date.now();
    
    await makeRequest('GET', '/api/resource', null, session);
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(1000); // < 1 second
  });

  it('should handle bulk operations efficiently', async () => {
    const startTime = Date.now();
    
    const requests = Array.from({ length: 20 }, () =>
      makeRequest('POST', '/api/resource', data, session)
    );
    
    await Promise.all(requests);
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(5000); // < 5 seconds
  });
});
```

## Fixtures

### Creating Fixtures File
```typescript
// tests/integration/api/fixtures/resource-fixtures.ts

import { z } from 'zod';

// ============================================================================
// Zod Schemas
// ============================================================================

export const ResourceSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  status: z.enum(['active', 'inactive']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ResourceListSchema = z.object({
  items: z.array(ResourceSchema),
  pagination: z.object({
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
    hasMore: z.boolean(),
  }),
});

// ============================================================================
// Sample Data
// ============================================================================

export const sampleResources = {
  basic: {
    name: 'Basic Resource',
    status: 'active' as const,
  },
  
  complex: {
    name: 'Complex Resource',
    status: 'inactive' as const,
    metadata: {
      key: 'value',
    },
  },
};

// ============================================================================
// Invalid Data
// ============================================================================

export const invalidResourceData = {
  missingName: {
    status: 'active',
  },
  
  invalidStatus: {
    name: 'Test',
    status: 'invalid',
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

export function generateResourceName(): string {
  return `Test Resource ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function createResourceData(overrides = {}) {
  return {
    ...sampleResources.basic,
    name: generateResourceName(),
    ...overrides,
  };
}
```

## Running Tests

### Basic Commands
```bash
# All tests
npm run test:integration

# Specific file
npm run test:integration -- marketing-campaigns

# Specific test
npm run test:integration -- marketing-campaigns -t "should return 200 OK"

# With coverage
npm run test:integration:coverage

# Watch mode
npm run test:integration:watch

# Verbose output
npm run test:integration -- --reporter=verbose
```

### Environment Variables
```bash
# Required
export DATABASE_URL="postgresql://..."
export NEXTAUTH_SECRET="..."
export NEXTAUTH_URL="http://localhost:3000"

# Optional
export TEST_API_URL="http://localhost:3001"
export DEBUG="*"
```

### CI/CD
```yaml
# .github/workflows/test.yml
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
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:integration
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
```

## Best Practices

### 1. Test Independence
```typescript
// ✅ Good: Each test is independent
it('should create resource', async () => {
  const response = await createResource();
  expect(response.status).toBe(201);
  testResources.push(response.data.id); // Track for cleanup
});

// ❌ Bad: Tests depend on each other
let resourceId;
it('should create resource', async () => {
  const response = await createResource();
  resourceId = response.data.id; // Shared state
});
it('should update resource', async () => {
  await updateResource(resourceId); // Depends on previous test
});
```

### 2. Cleanup
```typescript
// ✅ Good: Clean up after tests
afterAll(async () => {
  for (const id of testResources) {
    await query('DELETE FROM resources WHERE id = $1', [id]);
  }
});

// ❌ Bad: No cleanup
// Test data accumulates in database
```

### 3. Descriptive Names
```typescript
// ✅ Good: Clear what is being tested
it('should return 401 Unauthorized when session is missing', async () => {
  // ...
});

// ❌ Bad: Unclear what is being tested
it('test auth', async () => {
  // ...
});
```

### 4. Arrange-Act-Assert
```typescript
// ✅ Good: Clear structure
it('should update resource', async () => {
  // Arrange
  const resource = await createResource();
  const updateData = { name: 'Updated' };
  
  // Act
  const response = await updateResource(resource.id, updateData);
  
  // Assert
  expect(response.status).toBe(200);
  expect(response.data.name).toBe('Updated');
});
```

### 5. Use Fixtures
```typescript
// ✅ Good: Use fixtures
import { createResourceData } from './fixtures/resource-fixtures';

const data = createResourceData({ status: 'active' });

// ❌ Bad: Inline data
const data = {
  name: 'Test Resource',
  status: 'active',
  // ... many fields
};
```

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
psql -h localhost -U postgres -d huntaze_test -c "SELECT 1;"

# Restart PostgreSQL
brew services restart postgresql@14  # macOS
sudo systemctl restart postgresql    # Linux

# Check DATABASE_URL
echo $DATABASE_URL
```

### Session/Auth Issues
```bash
# Check NEXTAUTH_SECRET
echo $NEXTAUTH_SECRET

# Regenerate secret
openssl rand -base64 32

# Set in environment
export NEXTAUTH_SECRET="new-secret"
```

### Test Timeouts
```typescript
// Increase timeout for slow tests
it('should complete slow operation', async () => {
  // ...
}, 10000); // 10 second timeout
```

### Port Conflicts
```bash
# Find process using port
lsof -ti:3000

# Kill process
lsof -ti:3000 | xargs kill -9

# Use different port
export TEST_API_URL="http://localhost:3001"
```

### Clean Test Data
```bash
# Clean all test users
psql -d huntaze_test -c "DELETE FROM users WHERE email LIKE 'test-%@example.com';"

# Clean all test resources
psql -d huntaze_test -c "DELETE FROM resources WHERE name LIKE 'Test Resource%';"
```

## Resources

### Documentation
- [Marketing API Tests](./marketing-api-tests.md)
- [Content API Tests](./content-api-tests.md)
- [Testing Summary](../../.kiro/specs/core-apis-implementation/TESTING_SUMMARY.md)

### Examples
- [Marketing Tests](./marketing-campaigns.integration.test.ts)
- [Marketing Fixtures](./fixtures/marketing-fixtures.ts)
- [Content Tests](./content.integration.test.ts)

### Tools
- [Vitest](https://vitest.dev/) - Test runner
- [Zod](https://zod.dev/) - Schema validation
- [Prisma](https://www.prisma.io/) - Database ORM

## Support

For help:
1. Check this guide
2. Review existing tests
3. Check troubleshooting section
4. Ask team for help

---

**Last Updated**: November 17, 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
