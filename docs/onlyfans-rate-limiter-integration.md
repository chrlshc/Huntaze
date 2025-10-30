# OnlyFans Rate Limiter Integration

## Overview

The OnlyFans Rate Limiter integration provides automatic rate limiting for OnlyFans messages using AWS infrastructure (SQS + Lambda + Redis). Messages are queued and processed at a maximum rate of 10 messages per minute, respecting OnlyFans API limits.

## Architecture

```
Next.js App → API Route → OnlyFansRateLimiterService → SQS Queue → Lambda → Redis → OnlyFans API
```

### Components

1. **OnlyFansRateLimiterService**: High-level service for sending messages
2. **IntelligentQueueManager**: SQS integration and queue management
3. **CloudWatchMetricsService**: Metrics tracking and monitoring
4. **Circuit Breaker**: Protection against cascading failures
5. **Lambda Rate Limiter**: Token bucket algorithm (10 msg/min)
6. **Redis**: Token bucket state storage

## Configuration

### Environment Variables

Required variables in Amplify:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# SQS Queue
SQS_RATE_LIMITER_QUEUE=https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue

# Feature Flags
RATE_LIMITER_ENABLED=true

# Database
DATABASE_URL=postgresql://...
```

### Amplify Setup

Run the configuration script:

```bash
./scripts/configure-amplify-rate-limiter.sh
```

Or manually via AWS CLI:

```bash
aws amplify update-app \
  --app-id d33l77zi1h78ce \
  --region us-east-1 \
  --environment-variables \
    SQS_RATE_LIMITER_QUEUE=https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue \
    RATE_LIMITER_ENABLED=true
```

## Usage

### Sending a Single Message

```typescript
import { createOnlyFansRateLimiterService } from '@/lib/services/onlyfans-rate-limiter.service';
import { getIntelligentQueueManager } from '@/lib/services/intelligent-queue-manager';
import { CloudWatchMetricsService } from '@/lib/services/cloudwatch-metrics.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const queueManager = await getIntelligentQueueManager();
const metrics = new CloudWatchMetricsService();
const rateLimiter = createOnlyFansRateLimiterService(queueManager, prisma, metrics);

const result = await rateLimiter.sendMessage('user_123', {
  recipientId: 'recipient_456',
  content: 'Hello! Thanks for subscribing!',
  mediaUrls: ['https://cdn.example.com/image.jpg'],
  priority: 'high',
});

console.log(result);
// {
//   success: true,
//   messageId: 'msg_abc123',
//   queuedAt: '2025-10-29T10:30:00Z',
//   sqsMessageId: 'sqs_xyz789'
// }
```

### Sending Multiple Messages

```typescript
const messages = [
  { recipientId: 'user_1', content: 'Welcome!' },
  { recipientId: 'user_2', content: 'Thanks for subscribing!' },
  { recipientId: 'user_3', content: 'Check out my new content!' },
];

const results = await rateLimiter.sendBatch('user_123', messages);

results.forEach((result) => {
  if (result.success) {
    console.log(`Message ${result.messageId} queued`);
  } else {
    console.error(`Failed: ${result.error}`);
  }
});
```

### Checking Queue Status

```typescript
const status = await rateLimiter.getQueueStatus();

console.log(status);
// {
//   healthy: true,
//   messagesQueued: 10,
//   messagesProcessing: 5,
//   messagesFailed: 2,
//   averageLatency: 1234
// }
```

## API Endpoints

### POST /api/onlyfans/messages/send

Send a message to OnlyFans with rate limiting.

**Request:**

```json
POST /api/onlyfans/messages/send
Content-Type: application/json

{
  "recipientId": "user_123",
  "content": "Hello! Thanks for subscribing!",
  "mediaUrls": ["https://cdn.example.com/image.jpg"],
  "priority": "high"
}
```

**Response (Success):**

```json
HTTP 202 Accepted

{
  "success": true,
  "messageId": "msg_abc123",
  "queuedAt": "2025-10-29T10:30:00Z",
  "estimatedDelivery": "2025-10-29T10:31:00Z",
  "sqsMessageId": "sqs_xyz789"
}
```

**Response (Error):**

```json
HTTP 400 Bad Request

{
  "success": false,
  "error": "Validation failed",
  "details": [
    { "field": "recipientId", "message": "Recipient ID is required" }
  ]
}
```

### GET /api/onlyfans/messages/status

Get queue status and metrics.

**Response:**

```json
HTTP 200 OK

{
  "success": true,
  "timestamp": "2025-10-29T10:30:00Z",
  "configuration": {
    "configured": true,
    "enabled": true,
    "active": true,
    "queueUrl": "https://sqs.us-east-1.amazonaws.com/...",
    "region": "us-east-1"
  },
  "queue": {
    "healthy": true,
    "messagesQueued": 10,
    "messagesProcessing": 5,
    "messagesFailed": 2,
    "averageLatency": 1234
  }
}
```

## Monitoring

### CloudWatch Dashboard

Access the dashboard: [Huntaze-OnlyFans-Rate-Limiter](https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=Huntaze-OnlyFans-Rate-Limiter)

**Widgets:**
- Messages Overview (Queued, Sent, Failed, Rate Limited)
- Queue Latency (Avg, Max, P99)
- SQS Queue Depth
- Lambda Invocations & Errors
- Error Rate & Success Rate

### CloudWatch Alarms

Active alarms:
- **High Error Rate**: Triggers when error rate > 5%
- **Queue Depth High**: Triggers when queue has > 100 messages
- **Queue Age High**: Triggers when messages are older than 10 minutes
- **High Latency**: Triggers when average latency > 5 seconds

### Metrics

Custom metrics in `Huntaze/OnlyFans` namespace:
- `MessagesQueued`: Number of messages queued
- `MessagesSent`: Number of messages sent successfully
- `MessagesFailed`: Number of failed messages
- `RateLimitedMessages`: Number of rate-limited messages
- `QueueLatency`: Time from queue to send (milliseconds)

## Troubleshooting

### Messages Not Being Sent

1. **Check rate limiter status:**
   ```bash
   curl https://your-app.com/api/onlyfans/messages/send
   ```

2. **Verify environment variables:**
   ```bash
   aws amplify get-app --app-id d33l77zi1h78ce --region us-east-1 \
     --query 'app.environmentVariables'
   ```

3. **Check SQS queue:**
   ```bash
   aws sqs get-queue-attributes \
     --queue-url https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue \
     --attribute-names All
   ```

4. **Check Lambda logs:**
   ```bash
   aws logs tail /aws/lambda/huntaze-rate-limiter --follow
   ```

### High Error Rate

1. **Check CloudWatch alarms:**
   ```bash
   aws cloudwatch describe-alarms \
     --alarm-names onlyfans-rate-limiter-high-error-rate
   ```

2. **Review Lambda errors:**
   ```bash
   aws logs filter-log-events \
     --log-group-name /aws/lambda/huntaze-rate-limiter \
     --filter-pattern "ERROR"
   ```

3. **Check database connection:**
   - Verify `DATABASE_URL` is correct
   - Check Prisma connection pool

### Queue Depth Growing

1. **Check Lambda concurrency:**
   ```bash
   aws lambda get-function-concurrency \
     --function-name huntaze-rate-limiter
   ```

2. **Increase Lambda reserved concurrency:**
   ```bash
   aws lambda put-function-concurrency \
     --function-name huntaze-rate-limiter \
     --reserved-concurrent-executions 5
   ```

3. **Check rate limiting:**
   - Verify Redis is accessible
   - Check token bucket configuration

## Testing

### Run Unit Tests

```bash
npm run test:unit tests/unit/services/onlyfans-rate-limiter.service.test.ts
```

### Run Integration Tests

```bash
npm run test:integration tests/integration/api/onlyfans-messages.test.ts
```

### Run E2E Tests

```bash
npm run test:e2e tests/e2e/onlyfans-rate-limiter.spec.ts
```

## Deployment

### Staging

```bash
# Deploy to staging
git checkout develop
git push origin develop

# Verify deployment
curl https://staging.huntaze.com/api/onlyfans/messages/send
```

### Production

```bash
# Deploy to production
git checkout main
git merge develop
git push origin main

# Monitor deployment
aws amplify start-job \
  --app-id d33l77zi1h78ce \
  --branch-name main \
  --job-type RELEASE

# Verify deployment
curl https://huntaze.com/api/onlyfans/messages/send
```

## Rollback

If issues occur in production:

1. **Disable rate limiter:**
   ```bash
   aws amplify update-app \
     --app-id d33l77zi1h78ce \
     --environment-variables RATE_LIMITER_ENABLED=false
   ```

2. **Revert code:**
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

3. **Purge SQS queue (if needed):**
   ```bash
   aws sqs purge-queue \
     --queue-url https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue
   ```

## Cost Estimation

Monthly costs:
- **SQS**: ~$0.02 (43,200 messages/month)
- **Lambda**: ~$0.01 (43,200 invocations)
- **CloudWatch Metrics**: ~$3.00 (10 custom metrics)
- **Total**: ~$3/month

## Support

For issues or questions:
- **Slack**: #huntaze-engineering
- **Email**: engineering@huntaze.com
- **Documentation**: https://docs.huntaze.com/rate-limiter

## References

- [AWS Lambda + SQS Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html)
- [Token Bucket Algorithm](https://en.wikipedia.org/wiki/Token_bucket)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
