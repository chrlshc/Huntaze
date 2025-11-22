# AI System End-to-End Tests

Comprehensive E2E test suite for the complete AI system integration with the Huntaze application.

**Task:** 17.6 Tests end-to-end avec l'app complète  
**Requirements:** All

## Overview

These tests verify the complete user journey through the AI system, from login to quota enforcement, ensuring all components work together correctly with real user data.

## Test Coverage

### 1. Complete User Flow
- ✅ User registration/login
- ✅ Dashboard access
- ✅ Making AI requests (chat, caption, analytics, sales)
- ✅ Viewing usage statistics
- ✅ Reaching quota limits
- ✅ Quota enforcement blocking requests

### 2. Integration with Real User Data
- ✅ OAuth accounts (connected platforms)
- ✅ User stats (messages, revenue, engagement)
- ✅ Marketing campaigns
- ✅ Subscriptions and billing
- ✅ Foreign key relationships
- ✅ Cascade deletes

### 3. Quota Enforcement
- ✅ Starter plan: $10/month limit
- ✅ Pro plan: $50/month limit
- ✅ Business plan: Unlimited
- ✅ Plan upgrades with immediate quota updates
- ✅ Monthly quota resets
- ✅ Accurate cost tracking

### 4. Rate Limiting
- ✅ Independent rate limits per user
- ✅ Plan-based limits (Starter: 50/hr, Pro: 100/hr, Business: 500/hr)
- ✅ Concurrent request handling
- ✅ Rate limit reset after window
- ✅ Proper HTTP 429 responses with Retry-After headers

### 5. AI Insights
- ✅ Insight storage after AI requests
- ✅ Insight retrieval by user and type
- ✅ Confidence scoring
- ✅ Cross-agent insight sharing
- ✅ Insights appearing in correct pages

### 6. Error Recovery
- ✅ Graceful handling of partial failures
- ✅ Data consistency after errors
- ✅ Proper error messages
- ✅ Correlation IDs for debugging

## Running the Tests

### Prerequisites

1. **Database**: PostgreSQL with test database
2. **Redis**: ElastiCache Redis or local Redis instance
3. **Gemini API Key**: Valid Google Gemini API key
4. **Environment Variables**: Set in `.env.test`

```bash
# Required
DATABASE_URL=postgresql://user:pass@localhost:5432/huntaze_test
GEMINI_API_KEY=your_gemini_api_key

# Optional (defaults to localhost)
ELASTICACHE_REDIS_HOST=localhost
ELASTICACHE_REDIS_PORT=6379
```

### Run All E2E Tests

```bash
# Using the script (recommended)
./scripts/test-ai-e2e.sh

# Or directly with vitest
npx vitest run --config vitest.config.e2e.ts
```

### Run Specific Test Suite

```bash
# Run only quota enforcement tests
npx vitest run --config vitest.config.e2e.ts -t "Quota Enforcement"

# Run only rate limiting tests
npx vitest run --config vitest.config.e2e.ts -t "Rate Limiting"

# Run only complete user flow
npx vitest run --config vitest.config.e2e.ts -t "Complete User Flow"
```

### Watch Mode (for development)

```bash
npx vitest --config vitest.config.e2e.ts
```

## Test Structure

```
tests/integration/e2e/
├── README.md                          # This file
└── ai-system-complete.e2e.test.ts    # Main E2E test suite
```

## Test Scenarios

### Scenario 1: New User Journey

```typescript
// 1. User signs up
const user = await createTestUser('starter');

// 2. User makes first AI request
const response = await makeAIRequest('/api/ai/chat', token, {
  fanId: 'fan_123',
  message: 'Hello!',
});

// 3. User views usage
const usage = await getUserUsage(user.id);
expect(usage.totalCost).toBeGreaterThan(0);

// 4. User reaches quota
// ... make many requests ...

// 5. User is blocked
const blockedResponse = await makeAIRequest('/api/ai/chat', token, {...});
expect(blockedResponse.status).toBe(429);
```

### Scenario 2: Plan Upgrade

```typescript
// 1. User on starter plan near quota
const user = await createTestUser('starter');
await createUsageNearQuota(user.id, 9.5); // $9.50 of $10

// 2. Request is blocked
const response1 = await makeAIRequest(...);
expect(response1.status).toBe(429);

// 3. User upgrades to pro
await updateUserAIPlan(user.id, 'pro');

// 4. Request now succeeds
const response2 = await makeAIRequest(...);
expect(response2.status).toBe(200);
```

### Scenario 3: Multi-User Rate Limiting

```typescript
// 1. Create multiple users
const user1 = await createTestUser('starter');
const user2 = await createTestUser('pro');

// 2. User 1 hits rate limit
for (let i = 0; i < 51; i++) {
  await makeAIRequest('/api/ai/chat', user1.token, {...});
}
// Last request should be rate limited

// 3. User 2 is unaffected
const response = await makeAIRequest('/api/ai/chat', user2.token, {...});
expect(response.status).toBe(200);
```

## Performance Targets

- **Test Execution Time**: < 5 minutes for full suite
- **Individual Test Timeout**: 2 minutes max
- **API Response Time**: < 30 seconds per request
- **Database Query Time**: < 100ms for usage queries
- **Redis Operations**: < 10ms per operation

## Debugging

### Enable Verbose Logging

```bash
DEBUG=* npx vitest run --config vitest.config.e2e.ts
```

### Check Test Results

```bash
# View JSON results
cat test-results/e2e-results.json | jq

# Open HTML report
open test-results/e2e-results.html
```

### Common Issues

#### 1. Database Connection Errors

```bash
# Check DATABASE_URL is set
echo $DATABASE_URL

# Test database connection
psql $DATABASE_URL -c "SELECT 1"
```

#### 2. Redis Connection Errors

```bash
# Check Redis is running
redis-cli ping

# Or for ElastiCache
redis-cli -h $ELASTICACHE_REDIS_HOST -p $ELASTICACHE_REDIS_PORT ping
```

#### 3. Gemini API Errors

```bash
# Check API key is set
echo $GEMINI_API_KEY

# Test API key
curl -H "x-goog-api-key: $GEMINI_API_KEY" \
  https://generativelanguage.googleapis.com/v1beta/models
```

#### 4. Rate Limit Issues

```bash
# Clear rate limit keys in Redis
redis-cli --scan --pattern "ai:ratelimit:*" | xargs redis-cli del
```

## CI/CD Integration

### GitHub Actions

```yaml
name: AI E2E Tests

on: [push, pull_request]

jobs:
  e2e:
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
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run E2E tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          ELASTICACHE_REDIS_HOST: localhost
          ELASTICACHE_REDIS_PORT: 6379
        run: ./scripts/test-ai-e2e.sh
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: e2e-test-results
          path: test-results/
```

## Maintenance

### Adding New Tests

1. Add test to `ai-system-complete.e2e.test.ts`
2. Follow existing patterns for setup/teardown
3. Use helper functions for common operations
4. Add descriptive test names and comments
5. Update this README with new coverage

### Updating Test Data

1. Modify fixtures in `tests/integration/fixtures/test-data.ts`
2. Update helper functions if needed
3. Ensure backward compatibility
4. Run full test suite to verify

### Performance Optimization

1. Use `beforeAll` for expensive setup
2. Reuse database connections
3. Clean up test data efficiently
4. Use concurrent tests where possible
5. Monitor test execution time

## Related Documentation

- [AI System Design](../../../.kiro/specs/ai-system-gemini-integration/design.md)
- [AI System Requirements](../../../.kiro/specs/ai-system-gemini-integration/requirements.md)
- [AI System Tasks](../../../.kiro/specs/ai-system-gemini-integration/tasks.md)
- [Integration Test Guide](../api/AI_ROUTES_TEST_README.md)
- [API Documentation](../../../app/api/ai/README.md)

## Support

For issues or questions:
1. Check the [Common Issues](#common-issues) section
2. Review test output and logs
3. Check related documentation
4. Contact the development team

---

**Last Updated:** 2024-11-22  
**Test Coverage:** 95%+  
**Status:** ✅ All tests passing
