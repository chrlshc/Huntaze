# AI Rate Limiting Setup Guide

## Overview

The AI rate limiting system uses AWS ElastiCache Redis to enforce plan-based request limits and detect anomalous usage patterns.

## Features Implemented

### 1. Plan-Based Rate Limits (Requirement 5.2)
- **Starter Plan**: 50 requests per hour
- **Pro Plan**: 100 requests per hour  
- **Business Plan**: 500 requests per hour

### 2. Sliding Window Algorithm (Requirement 5.4)
- Uses Upstash's sliding window implementation
- Gradual recovery as old requests fall out of the window
- Independent tracking per creator

### 3. Error Handling (Requirement 5.3)
- Throws `RateLimitError` when limit exceeded
- Includes `retryAfter` (seconds until reset)
- Includes `limit` and `remaining` counts
- Can be mapped to HTTP 429 responses

### 4. Anomaly Detection (Requirement 5.5)
- Detects when creators exceed 2× their plan limit within 5 minutes
- Logs warnings for investigation
- Non-blocking (doesn't fail requests if detection fails)

## Setup Requirements

### AWS ElastiCache Redis Configuration

You need AWS ElastiCache Redis endpoint in your environment:

```bash
ELASTICACHE_REDIS_HOST=huntaze-redis-production.asmyhp.0001.use1.cache.amazonaws.com
ELASTICACHE_REDIS_PORT=6379
```

### ElastiCache Already Configured

Your ElastiCache Redis cluster is already set up:
- **Cluster ID**: huntaze-redis-production
- **Engine**: Redis 7.1.0
- **Node Type**: cache.t3.micro
- **Endpoint**: huntaze-redis-production.asmyhp.0001.use1.cache.amazonaws.com:6379
- **Region**: us-east-1

### Network Requirements

Your application must be able to reach ElastiCache:
1. **Same VPC**: Application should be in the same VPC as ElastiCache
2. **Security Groups**: ElastiCache security group must allow inbound traffic on port 6379 from your application
3. **Subnets**: Ensure proper subnet configuration

## Usage

```typescript
import { checkCreatorRateLimit, RateLimitError } from './lib/ai/rate-limit';

try {
  await checkCreatorRateLimit(creatorId, 'pro');
  // Request allowed, proceed with AI operation
} catch (error) {
  if (error instanceof RateLimitError) {
    // Return HTTP 429
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        retryAfter: error.retryAfter,
        limit: error.limit,
      }),
      {
        status: 429,
        headers: {
          'Retry-After': error.retryAfter.toString(),
        },
      }
    );
  }
  throw error;
}
```

## Testing

Property-based tests are implemented for all rate limiting properties:

- **Property 9**: Rate limit enforcement (N+1 requests rejected)
- **Property 10**: Plan-based rate limits (correct limits per plan)
- **Property 11**: Rate limit reset (sliding window behavior)

### Running Tests

Tests require network access to ElastiCache Redis. They will automatically skip if Redis is not available:

```bash
npm run test -- tests/unit/ai/rate-limit-enforcement.property.test.ts --run
npm run test -- tests/unit/ai/rate-limit-plan-based.property.test.ts --run
npm run test -- tests/unit/ai/rate-limit-reset.property.test.ts --run
```

### Test Configuration

Tests are configured with appropriate timeouts due to the high volume of requests:
- Starter plan tests: 60s timeout (50 requests)
- Pro plan tests: 120s timeout (100 requests)
- Business plan tests: 300s timeout (500 requests)

## Architecture

```
┌─────────────────────────────────────┐
│     API Route (e.g., /api/ai/chat)  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   checkCreatorRateLimit(id, plan)   │
│   - Selects rate limiter by plan    │
│   - Checks sliding window            │
│   - Detects anomalies                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│    AWS ElastiCache Redis             │
│   - Stores request counts            │
│   - Manages sliding windows          │
│   - Tracks anomaly counters          │
└─────────────────────────────────────┘
```

## Redis Key Structure

- Rate limit keys: `ai:ratelimit:{plan}:{creatorId}`
- Anomaly keys: `ai:anomaly:{creatorId}`

Keys automatically expire based on their window duration.

## Monitoring

Anomaly detection logs include:
- Creator ID
- Plan type
- Number of requests in 5-minute window
- Threshold exceeded
- Timestamp

Example log:
```
[AI Rate Limit] Anomaly detected {
  creatorId: 'creator-123',
  plan: 'starter',
  requestsIn5Min: 105,
  threshold: 100,
  timestamp: '2024-01-15T10:30:00.000Z'
}
```

## Next Steps

1. ✅ ElastiCache Redis is already configured
2. ✅ Add endpoint to environment variables (already in .env.example)
3. Verify network connectivity from your application to ElastiCache
4. Run property tests to verify setup
5. Integrate rate limiting into AI API routes
6. Set up monitoring/alerting for anomalies

## Deployment on AWS Amplify

When deploying to AWS Amplify, ensure:
1. Your Amplify app is in the same VPC as ElastiCache
2. Security groups allow traffic between Amplify and ElastiCache
3. Environment variables are set in Amplify console:
   - `ELASTICACHE_REDIS_HOST`
   - `ELASTICACHE_REDIS_PORT`
