# Test Fixtures

Centralized test data fixtures for integration tests. Provides consistent, reusable test data across all test files.

## Usage

```typescript
import { 
  TEST_USERS, 
  MOCK_INTEGRATIONS, 
  MOCK_STATS,
  HTTP_STATUS,
  PERFORMANCE_TARGETS 
} from '@/tests/integration/fixtures/test-data';

// Use standard test user
const user = await createTestUser(TEST_USERS.STANDARD);

// Use Instagram integration
const integration = await createTestIntegration(
  user.id, 
  MOCK_INTEGRATIONS.INSTAGRAM
);

// Use standard stats
const stats = await createUserStats(user.id, MOCK_STATS.STANDARD);

// Check HTTP status
expect(response.status).toBe(HTTP_STATUS.OK);

// Validate performance
expect(duration).toBeLessThan(PERFORMANCE_TARGETS.RESPONSE_TIME.UNCACHED);
```

## Available Fixtures

### TEST_USERS

Pre-configured user fixtures for different scenarios:

- `STANDARD` - Standard test user with all fields
- `UNVERIFIED` - User with unverified email
- `NO_NAME` - User without name
- `SPECIAL_CHARS` - User with unicode characters
- `CONCURRENT(index)` - Generate concurrent test users

### MOCK_INTEGRATIONS

Pre-configured integration fixtures for all providers:

- `INSTAGRAM` - Instagram integration
- `TIKTOK` - TikTok integration
- `REDDIT` - Reddit integration
- `ONLYFANS` - OnlyFans integration
- `EXPIRED` - Expired integration

### MOCK_STATS

Pre-configured stats fixtures for different scenarios:

- `STANDARD` - Standard stats with positive trends
- `HIGH_PERFORMANCE` - High performance stats
- `LOW_PERFORMANCE` - Low performance stats
- `DEFAULT` - Default stats (all zeros)
- `EDGE_CASE` - Boundary value stats

### MOCK_METRICS

Pre-configured metrics fixtures:

- `STANDARD` - Standard metrics with one alarm
- `HEALTHY` - Healthy metrics (no alarms)
- `CRITICAL` - Critical metrics (multiple alarms)

### INVALID_INPUTS

Invalid input test cases for validation testing:

- `EMAILS` - Invalid email formats
- `PASSWORDS` - Invalid passwords
- `PROVIDERS` - Invalid providers
- `ACCOUNT_IDS` - Invalid account IDs

### EDGE_CASES

Edge case test data:

- `LONG_PASSWORD` - Very long password (1000 chars)
- `LONG_EMAIL` - Very long email
- `LONG_NAME` - Very long name
- `SPECIAL_PASSWORD` - Password with special characters
- `UNICODE_NAME` - Name with unicode characters
- `WHITESPACE_EMAIL` - Email with whitespace
- Boundary values (MAX_INT, MIN_INT, etc.)

### HTTP_STATUS

HTTP status code constants:

```typescript
HTTP_STATUS.OK                    // 200
HTTP_STATUS.CREATED               // 201
HTTP_STATUS.BAD_REQUEST           // 400
HTTP_STATUS.UNAUTHORIZED          // 401
HTTP_STATUS.FORBIDDEN             // 403
HTTP_STATUS.NOT_FOUND             // 404
HTTP_STATUS.CONFLICT              // 409
HTTP_STATUS.INTERNAL_SERVER_ERROR // 500
HTTP_STATUS.SERVICE_UNAVAILABLE   // 503
```

### CACHE_CONFIG

Cache configuration constants:

```typescript
CACHE_CONFIG.TTL.MONITORING_METRICS  // 30 seconds
CACHE_CONFIG.TTL.HOME_STATS          // 60 seconds
CACHE_CONFIG.TTL.INTEGRATIONS_STATUS // 300 seconds

CACHE_CONFIG.KEYS.homeStats(userId)
CACHE_CONFIG.KEYS.integrationsStatus(userId)
```

### PERFORMANCE_TARGETS

Performance target constants:

```typescript
PERFORMANCE_TARGETS.RESPONSE_TIME.UNCACHED  // 500ms
PERFORMANCE_TARGETS.RESPONSE_TIME.CACHED    // 100ms
PERFORMANCE_TARGETS.CONCURRENT.SMALL        // 10 requests
PERFORMANCE_TARGETS.CONCURRENT.MEDIUM       // 20 requests
PERFORMANCE_TARGETS.LOAD_TEST.REQUESTS      // 50 requests
```

### ERROR_MESSAGES

Expected error message constants:

```typescript
ERROR_MESSAGES.AUTH.UNAUTHORIZED
ERROR_MESSAGES.VALIDATION.EMAIL_REQUIRED
ERROR_MESSAGES.RESOURCE.USER_NOT_FOUND
ERROR_MESSAGES.CSRF.TOKEN_MISSING
```

## Examples

### Example 1: Basic User Test

```typescript
import { TEST_USERS, HTTP_STATUS } from '@/tests/integration/fixtures/test-data';

describe('User Tests', () => {
  it('should create user', async () => {
    const user = await createTestUser(TEST_USERS.STANDARD);
    
    expect(user.email).toBe(TEST_USERS.STANDARD.email);
    expect(user.emailVerified).toBe(true);
  });
});
```

### Example 2: Integration Test

```typescript
import { 
  TEST_USERS, 
  MOCK_INTEGRATIONS, 
  HTTP_STATUS 
} from '@/tests/integration/fixtures/test-data';

describe('Integration Tests', () => {
  it('should create integration', async () => {
    const user = await createTestUser(TEST_USERS.STANDARD);
    const integration = await createTestIntegration(
      user.id,
      MOCK_INTEGRATIONS.INSTAGRAM
    );
    
    expect(integration.provider).toBe('instagram');
    expect(integration.userId).toBe(user.id);
  });
});
```

### Example 3: Validation Test

```typescript
import { 
  INVALID_INPUTS, 
  HTTP_STATUS 
} from '@/tests/integration/fixtures/test-data';

describe('Validation Tests', () => {
  it('should reject invalid emails', async () => {
    for (const email of INVALID_INPUTS.EMAILS) {
      const response = await registerRequest(email, 'password');
      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    }
  });
});
```

### Example 4: Performance Test

```typescript
import { 
  TEST_USERS, 
  PERFORMANCE_TARGETS 
} from '@/tests/integration/fixtures/test-data';

describe('Performance Tests', () => {
  it('should respond within target time', async () => {
    const startTime = Date.now();
    await loginRequest(TEST_USERS.STANDARD.email, TEST_USERS.STANDARD.password);
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(PERFORMANCE_TARGETS.RESPONSE_TIME.AUTH);
  });
});
```

### Example 5: Edge Case Test

```typescript
import { 
  EDGE_CASES, 
  HTTP_STATUS 
} from '@/tests/integration/fixtures/test-data';

describe('Edge Case Tests', () => {
  it('should handle long passwords', async () => {
    const response = await registerRequest(
      'test@example.com',
      EDGE_CASES.LONG_PASSWORD
    );
    
    expect(response.status).toBe(HTTP_STATUS.CREATED);
  });
});
```

## Best Practices

1. **Use Fixtures**: Always use fixtures instead of hardcoding test data
2. **Consistent Data**: Use the same fixtures across related tests
3. **Cleanup**: Clean up test data after each test
4. **Isolation**: Don't modify fixtures during tests
5. **Documentation**: Document custom fixtures

## Adding New Fixtures

To add new fixtures, edit `test-data.ts`:

```typescript
export const NEW_FIXTURE = {
  EXAMPLE: {
    field1: 'value1',
    field2: 'value2',
  },
};
```

Then export it:

```typescript
export default {
  // ... existing exports
  NEW_FIXTURE,
};
```

## Related Files

- `tests/integration/api/api-tests.md` - Test documentation
- `tests/integration/setup/prisma-mock.ts` - Prisma mocks
- `tests/integration/setup/api-test-client.ts` - API test client

---

**Last Updated**: 2024-11-19  
**Status**: ✅ Production Ready
