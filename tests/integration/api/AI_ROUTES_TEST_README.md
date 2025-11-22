# AI Routes Integration Tests

## Overview

Integration tests for the AI API routes covering:
- `/api/ai/chat` - Fan message response generation
- `/api/ai/generate-caption` - Caption and hashtag generation
- `/api/ai/analyze-performance` - Performance analysis
- `/api/ai/optimize-sales` - Sales message optimization

## Running Tests

```bash
# Run all AI integration tests
npm run test:integration -- tests/integration/api/ai-routes.integration.test.ts

# Run specific test suite
npm run test:integration -- tests/integration/api/ai-routes.integration.test.ts -t "POST /api/ai/chat"
```

## Prerequisites

1. **Database**: Tests use real database (not mocks)
   - Ensure `.env.test` has valid `DATABASE_URL`
   - Database should have AI tables created (UsageLog, MonthlyCharge, AIInsight)

2. **Redis**: Tests require Redis for rate limiting
   - Ensure `ELASTICACHE_REDIS_HOST` and `ELASTICACHE_REDIS_PORT` are set
   - Or use local Redis instance

3. **Gemini API**: Tests make real API calls
   - Ensure `GEMINI_API_KEY` is set in `.env.test`
   - Note: This will incur actual API costs

## Test Coverage

### Authentication Tests
- ✅ Requires valid session for all endpoints
- ✅ Returns 401 for unauthenticated requests

### Validation Tests
- ✅ Validates request body schema
- ✅ Returns 400 for invalid requests
- ✅ Validates enum values (platform, engagementLevel)

### Rate Limiting Tests
- ✅ Enforces plan-based rate limits
- ✅ Returns 429 when limit exceeded
- ✅ Includes Retry-After header
- ✅ Resets after time window

### Quota Tests
- ✅ Enforces monthly spending quotas
- ✅ Returns 429 when quota exceeded
- ✅ Tracks usage in database

### Response Tests
- ✅ Returns correct response schema
- ✅ Includes usage metadata
- ✅ Includes agents involved
- ✅ Includes correlation ID

### Usage Tracking Tests
- ✅ Creates UsageLog records
- ✅ Tracks tokens and costs
- ✅ Associates with correct creator

## Test Data Cleanup

Tests automatically clean up:
- Test users
- Usage logs
- Monthly charges
- AI insights
- Rate limit keys in Redis

## Known Issues

1. **TypeScript Path Resolution**: The test file may show TypeScript errors in the IDE due to path alias resolution. This doesn't affect test execution.

2. **Rate Limit Test Timeout**: The rate limit test makes 101 requests and may take 30-60 seconds. Timeout is set to 60000ms.

3. **API Costs**: Tests make real Gemini API calls which incur costs. Estimated cost per full test run: $0.10-$0.50

## Skipping Tests

To skip expensive tests during development:

```bash
# Skip rate limit test
npm run test:integration -- tests/integration/api/ai-routes.integration.test.ts -t "^(?!.*rate limits)"

# Skip all AI tests
npm run test:integration -- --exclude tests/integration/api/ai-routes.integration.test.ts
```

## Debugging

Enable debug logging:

```bash
DEBUG=ai:* npm run test:integration -- tests/integration/api/ai-routes.integration.test.ts
```

View Redis keys:

```bash
redis-cli -h $ELASTICACHE_REDIS_HOST -p $ELASTICACHE_REDIS_PORT
> KEYS ai:*
```

View database records:

```sql
SELECT * FROM usage_logs WHERE "creatorId" = <test_user_id>;
SELECT * FROM monthly_charges WHERE "creatorId" = <test_user_id>;
SELECT * FROM ai_insights WHERE "creatorId" = <test_user_id>;
```

## CI/CD Integration

Tests are designed to run in CI/CD pipelines:

```yaml
# .github/workflows/test.yml
- name: Run AI Integration Tests
  env:
    DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
    GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
    ELASTICACHE_REDIS_HOST: ${{ secrets.REDIS_HOST }}
    ELASTICACHE_REDIS_PORT: ${{ secrets.REDIS_PORT }}
  run: npm run test:integration -- tests/integration/api/ai-routes.integration.test.ts
```

## Performance Benchmarks

Expected test execution times:
- Authentication tests: < 1s each
- Validation tests: < 1s each
- Rate limiting test: 30-60s (makes 101 requests)
- Usage tracking test: 2-3s (includes database operations)
- Full suite: 60-90s

## Future Improvements

1. Add mock mode for Gemini API to reduce costs
2. Add performance benchmarks for response times
3. Add tests for concurrent requests
4. Add tests for quota threshold notifications
5. Add tests for Knowledge Network integration
6. Add tests for multi-agent collaboration scenarios
