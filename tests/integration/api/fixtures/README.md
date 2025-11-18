# Test Fixtures - Integration Tests

## Overview

This directory contains reusable test fixtures and helper functions for integration tests.

## Available Fixtures

### Integration Fixtures

#### `validIntegration`
A valid integration with future expiry date.

```typescript
import { validIntegration } from './integrations-fixtures';

// Usage
const integration = validIntegration;
// {
//   provider: 'instagram',
//   accountId: 'test-instagram-123',
//   accountName: '@testcreator',
//   expiresAt: Date (30 days from now)
// }
```

#### `expiredIntegration`
An expired integration with past expiry date.

```typescript
import { expiredIntegration } from './integrations-fixtures';

// Usage
const integration = expiredIntegration;
// {
//   provider: 'tiktok',
//   accountId: 'test-tiktok-456',
//   accountName: '@expiredcreator',
//   expiresAt: Date (1 day ago)
// }
```

#### `noExpiryIntegration`
An integration without expiry date.

```typescript
import { noExpiryIntegration } from './integrations-fixtures';

// Usage
const integration = noExpiryIntegration;
// {
//   provider: 'reddit',
//   accountId: 'test-reddit-789',
//   accountName: 'u/testuser',
//   expiresAt: null
// }
```

### Response Fixtures

#### `successResponseEmpty`
Success response with no integrations.

```typescript
import { successResponseEmpty } from './integrations-fixtures';

// Usage
expect(response).toEqual(successResponseEmpty);
```

#### `successResponseWithIntegrations`
Success response with sample integrations.

```typescript
import { successResponseWithIntegrations } from './integrations-fixtures';

// Usage
const expected = successResponseWithIntegrations;
```

#### Error Response Fixtures

```typescript
import {
  errorResponseUnauthorized,
  errorResponseInvalidUserId,
  errorResponseDatabaseError,
} from './integrations-fixtures';
```

## Helper Functions

### `generateRandomIntegration(provider, expired?)`

Generate a random integration for testing.

```typescript
import { generateRandomIntegration } from './integrations-fixtures';

// Generate valid integration
const integration = generateRandomIntegration('instagram');

// Generate expired integration
const expiredIntegration = generateRandomIntegration('tiktok', true);
```

**Parameters:**
- `provider` (string): Provider name (instagram, tiktok, reddit, onlyfans)
- `expired` (boolean, optional): Whether integration should be expired

**Returns:** Integration object with random IDs and tokens

### `generateMultipleIntegrations(count, providers?)`

Generate multiple integrations for testing.

```typescript
import { generateMultipleIntegrations } from './integrations-fixtures';

// Generate 10 integrations with default providers
const integrations = generateMultipleIntegrations(10);

// Generate 5 integrations with specific providers
const customIntegrations = generateMultipleIntegrations(5, ['instagram', 'tiktok']);
```

**Parameters:**
- `count` (number): Number of integrations to generate
- `providers` (string[], optional): Array of provider names

**Returns:** Array of integration objects

### `generateTestUser()`

Generate a test user with unique email.

```typescript
import { generateTestUser } from './integrations-fixtures';

const user = generateTestUser();
// {
//   email: 'test-1705420800-abc123@example.com',
//   fullName: 'Test User abc123',
//   password: 'SecurePassword123!'
// }
```

**Returns:** User object with unique email and credentials

### `generateMockSessionCookie(userId)`

Generate a mock session cookie for testing.

```typescript
import { generateMockSessionCookie } from './integrations-fixtures';

const sessionCookie = generateMockSessionCookie('123');
// 'next-auth.session-token=test-session-123-1705420800'
```

**Parameters:**
- `userId` (string): User ID to include in session

**Returns:** Session cookie string

### `generateCorrelationId()`

Generate a correlation ID for request tracking.

```typescript
import { generateCorrelationId } from './integrations-fixtures';

const correlationId = generateCorrelationId();
// '550e8400-e29b-41d4-a716-446655440000'
```

**Returns:** UUID string

## Database Query Templates

### Integration Queries

```typescript
import {
  createIntegrationQuery,
  deleteIntegrationQuery,
  deleteUserIntegrationsQuery,
  getIntegrationsQuery,
} from './integrations-fixtures';

// Create integration
await query(createIntegrationQuery, [
  userId,
  provider,
  accountId,
  accountName,
  accessToken,
  refreshToken,
  expiresAt,
]);

// Delete integration
await query(deleteIntegrationQuery, [integrationId]);

// Delete all user integrations
await query(deleteUserIntegrationsQuery, [userId]);

// Get user integrations
const result = await query(getIntegrationsQuery, [userId]);
```

## Rate Limit Fixtures

### `rateLimitHeaders`

Standard rate limit headers.

```typescript
import { rateLimitHeaders } from './integrations-fixtures';

expect(response.headers).toMatchObject(rateLimitHeaders);
```

### `rateLimitExceededHeaders`

Headers when rate limit is exceeded.

```typescript
import { rateLimitExceededHeaders } from './integrations-fixtures';

expect(response.headers).toMatchObject(rateLimitExceededHeaders);
```

## Usage Examples

### Basic Test Setup

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { query } from '@/lib/db';
import {
  generateTestUser,
  generateMockSessionCookie,
  generateRandomIntegration,
  createIntegrationQuery,
  deleteIntegrationQuery,
} from './fixtures/integrations-fixtures';

describe('My Integration Test', () => {
  let testUserId: string;
  let testSessionCookie: string;
  const testIntegrations: number[] = [];

  beforeAll(async () => {
    // Create test user
    const user = generateTestUser();
    const registerResponse = await fetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(user),
    });
    const data = await registerResponse.json();
    testUserId = data.user.id;
    testSessionCookie = generateMockSessionCookie(testUserId);
  });

  afterAll(async () => {
    // Cleanup integrations
    for (const id of testIntegrations) {
      await query(deleteIntegrationQuery, [id]);
    }
  });

  it('should test something', async () => {
    // Create test integration
    const integration = generateRandomIntegration('instagram');
    const result = await query(createIntegrationQuery, [
      testUserId,
      integration.provider,
      integration.accountId,
      integration.accountName,
      integration.accessToken,
      integration.refreshToken,
      integration.expiresAt,
    ]);
    testIntegrations.push(result.rows[0].id);

    // Make request
    const response = await fetch('/api/integrations/status', {
      headers: { Cookie: testSessionCookie },
    });

    // Assert
    expect(response.status).toBe(200);
  });
});
```

### Testing Multiple Integrations

```typescript
import { generateMultipleIntegrations } from './fixtures/integrations-fixtures';

it('should handle multiple integrations', async () => {
  // Generate 10 test integrations
  const integrations = generateMultipleIntegrations(10);

  // Create them in database
  for (const integration of integrations) {
    const result = await query(createIntegrationQuery, [
      testUserId,
      integration.provider,
      integration.accountId,
      integration.accountName,
      integration.accessToken,
      integration.refreshToken,
      integration.expiresAt,
    ]);
    testIntegrations.push(result.rows[0].id);
  }

  // Test endpoint
  const response = await fetch('/api/integrations/status', {
    headers: { Cookie: testSessionCookie },
  });

  const data = await response.json();
  expect(data.data.integrations).toHaveLength(10);
});
```

### Testing Expired Integrations

```typescript
import { generateRandomIntegration } from './fixtures/integrations-fixtures';

it('should mark expired integrations', async () => {
  // Create expired integration
  const expired = generateRandomIntegration('instagram', true);
  
  const result = await query(createIntegrationQuery, [
    testUserId,
    expired.provider,
    expired.accountId,
    expired.accountName,
    expired.accessToken,
    expired.refreshToken,
    expired.expiresAt,
  ]);
  testIntegrations.push(result.rows[0].id);

  // Test endpoint
  const response = await fetch('/api/integrations/status', {
    headers: { Cookie: testSessionCookie },
  });

  const data = await response.json();
  const integration = data.data.integrations[0];
  expect(integration.status).toBe('expired');
});
```

## Best Practices

### 1. Always Cleanup

```typescript
afterAll(async () => {
  // Delete test integrations
  for (const id of testIntegrations) {
    await query(deleteIntegrationQuery, [id]);
  }
  
  // Delete test users
  for (const email of testUsers) {
    await query('DELETE FROM users WHERE email = $1', [email]);
  }
});
```

### 2. Use Unique Data

```typescript
// Good: Unique data per test run
const user = generateTestUser();

// Bad: Hardcoded data (may conflict)
const user = { email: 'test@example.com' };
```

### 3. Track Created Resources

```typescript
const testIntegrations: number[] = [];

// Track created integration
const result = await query(createIntegrationQuery, [...]);
testIntegrations.push(result.rows[0].id);

// Cleanup later
afterAll(async () => {
  for (const id of testIntegrations) {
    await query(deleteIntegrationQuery, [id]);
  }
});
```

### 4. Use Fixtures for Consistency

```typescript
// Good: Use fixtures
import { validIntegration } from './fixtures/integrations-fixtures';

// Bad: Inline data (harder to maintain)
const integration = {
  provider: 'instagram',
  accountId: 'test-123',
  // ...
};
```

## Adding New Fixtures

To add new fixtures:

1. Add the fixture to `integrations-fixtures.ts`
2. Export it from the file
3. Document it in this README
4. Add usage examples

Example:

```typescript
// In integrations-fixtures.ts
export const newFixture = {
  // fixture data
};

// In README.md
### `newFixture`
Description of the fixture.

\`\`\`typescript
import { newFixture } from './integrations-fixtures';
\`\`\`
```

## Related Documentation

- [Integration Tests Guide](../TESTING_GUIDE.md)
- [API Documentation](../../../../docs/api/integrations-status.md)
- [Test Summary](../INTEGRATIONS_STATUS_TEST_SUMMARY.md)

---

**Last Updated**: 2025-01-16  
**Version**: 1.0
