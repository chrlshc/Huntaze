# E2E Tests Quick Start Guide

Quick reference for running the AI system E2E tests.

## Prerequisites

```bash
# 1. Set environment variables in .env.test
DATABASE_URL=postgresql://user:pass@host:port/database
GEMINI_API_KEY=your_gemini_api_key
ELASTICACHE_REDIS_HOST=localhost
ELASTICACHE_REDIS_PORT=6379

# 2. Ensure services are running
# - PostgreSQL database
# - Redis instance

# 3. Apply database migrations (if not already done)
npx tsx scripts/add-ai-plan-column.ts
npx tsx scripts/add-role-column.ts
```

## Run Tests

### All Tests
```bash
./scripts/test-ai-e2e.sh
```

### Specific Test Suite
```bash
# Quota enforcement
npx vitest run --config vitest.config.e2e.ts -t "Quota Enforcement"

# Rate limiting
npx vitest run --config vitest.config.e2e.ts -t "Rate Limiting"

# Complete user flow
npx vitest run --config vitest.config.e2e.ts -t "Complete User Flow"

# Real user data integration
npx vitest run --config vitest.config.e2e.ts -t "Integration with Real User Data"

# AI insights
npx vitest run --config vitest.config.e2e.ts -t "AI Insights"

# Error recovery
npx vitest run --config vitest.config.e2e.ts -t "Error Recovery"
```

### Watch Mode (Development)
```bash
npx vitest --config vitest.config.e2e.ts
```

## View Results

```bash
# JSON results
cat test-results/e2e-results.json | jq

# HTML report
open test-results/e2e-results.html
```

## Troubleshooting

### Database Connection Error
```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### Redis Connection Error
```bash
# Check Redis is running
redis-cli ping

# Or for ElastiCache
redis-cli -h $ELASTICACHE_REDIS_HOST -p $ELASTICACHE_REDIS_PORT ping
```

### Gemini API Error
```bash
# Check API key
echo $GEMINI_API_KEY

# Test API key
curl -H "x-goog-api-key: $GEMINI_API_KEY" \
  https://generativelanguage.googleapis.com/v1beta/models
```

### Clear Rate Limits
```bash
# Clear all rate limit keys
redis-cli --scan --pattern "ai:ratelimit:*" | xargs redis-cli del
```

## Test Coverage

- ✅ Complete user flow (login → AI usage → quota)
- ✅ Real user data integration
- ✅ Quota enforcement (all plans)
- ✅ Multi-user rate limiting
- ✅ AI insights storage/retrieval
- ✅ Error recovery

## Documentation

- Full README: `tests/integration/e2e/README.md`
- Implementation Summary: `tests/integration/e2e/IMPLEMENTATION_SUMMARY.md`
- Task Completion: `.kiro/specs/ai-system-gemini-integration/TASK_17_6_COMPLETION.md`

## Support

For issues or questions, check:
1. Full README for detailed documentation
2. Test output and logs
3. Common issues section in README
4. Task completion report for known limitations
