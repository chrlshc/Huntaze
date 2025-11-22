# AI API Routes

Complete AI-powered API endpoints for the Huntaze platform using Google Gemini and multi-agent collaboration.

## Overview

The AI API provides four main endpoints for creator assistance:

1. **Chat** (`/api/ai/chat`) - Generate AI-powered responses to fan messages
2. **Generate Caption** (`/api/ai/generate-caption`) - Create optimized captions and hashtags
3. **Analyze Performance** (`/api/ai/analyze-performance`) - Get insights and recommendations
4. **Optimize Sales** (`/api/ai/optimize-sales`) - Optimize sales messages for conversion

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   API Routes (Next.js)                   │
│  /api/ai/chat  /api/ai/caption  /api/ai/analytics       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ├─ Authentication (withAuth middleware)
                     ├─ Rate Limiting (Redis-based)
                     ├─ Quota Enforcement (Database-based)
                     │
┌────────────────────▼────────────────────────────────────┐
│              AITeamCoordinator                           │
│  - Routes requests to agents                             │
│  - Combines multi-agent intelligence                     │
│  - Handles agent failures gracefully                     │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│            AIKnowledgeNetwork                            │
│  - Stores cross-agent insights                           │
│  - Provides context to agents                            │
│  - Enables collective learning                           │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                 AI Agents (4)                            │
│  MessagingAgent  ContentAgent  AnalyticsAgent  SalesAgent│
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│         Gemini Service + Billing Service                 │
│  - @google/genai SDK                                     │
│  - Token tracking & cost calculation                     │
│  - Usage logging to database                             │
└──────────────────────────────────────────────────────────┘
```

## Endpoints

### POST /api/ai/chat

Generate AI-powered response to fan message.

**Request:**
```json
{
  "fanId": "fan_123",
  "message": "Hey! Love your content!",
  "context": {
    "engagementLevel": "high"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Thank you so much! 💕 I really appreciate your support...",
    "confidence": 0.92,
    "suggestedUpsell": "Want to see exclusive behind-the-scenes content?",
    "agentsInvolved": ["messaging-agent", "sales-agent"],
    "usage": {
      "totalInputTokens": 150,
      "totalOutputTokens": 80,
      "totalCostUsd": 0.0023
    }
  }
}
```

[Full Documentation](./chat/README.md)

### POST /api/ai/generate-caption

Generate optimized caption and hashtags for content.

**Request:**
```json
{
  "platform": "instagram",
  "contentInfo": {
    "type": "photo",
    "description": "Beach sunset",
    "mood": "relaxed"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "caption": "Golden hour magic ✨ There's something special about...",
    "hashtags": ["#sunset", "#goldenhour", "#beachlife"],
    "confidence": 0.88,
    "agentsInvolved": ["content-agent", "analytics-agent"],
    "usage": {
      "totalInputTokens": 120,
      "totalOutputTokens": 60,
      "totalCostUsd": 0.0018
    }
  }
}
```

[Full Documentation](./generate-caption/README.md)

### POST /api/ai/analyze-performance

Analyze performance metrics with AI insights.

**Request:**
```json
{
  "metrics": {
    "platforms": ["instagram", "tiktok"],
    "timeframe": "last_30_days",
    "engagementData": {
      "likes": 15000,
      "comments": 500,
      "shares": 200
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "insights": [...],
    "recommendations": [...],
    "patterns": [...],
    "predictions": [...],
    "confidence": 0.85,
    "agentsInvolved": ["analytics-agent"],
    "usage": {
      "totalInputTokens": 300,
      "totalOutputTokens": 200,
      "totalCostUsd": 0.0045
    }
  }
}
```

[Full Documentation](./analyze-performance/README.md)

### POST /api/ai/optimize-sales

Optimize sales message for conversion.

**Request:**
```json
{
  "fanId": "fan_123",
  "context": {
    "currentMessage": "Check out my new content!",
    "engagementLevel": "high",
    "contentType": "exclusive_photos",
    "pricePoint": 25
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Hey! 💕 I just created something exclusive...",
    "tactics": [...],
    "suggestedPrice": 22,
    "confidence": 0.87,
    "expectedConversionRate": 0.42,
    "agentsInvolved": ["sales-agent"],
    "usage": {
      "totalInputTokens": 180,
      "totalOutputTokens": 100,
      "totalCostUsd": 0.0028
    }
  }
}
```

[Full Documentation](./optimize-sales/README.md)

## Common Features

### Authentication

All endpoints require authentication via NextAuth session:

```typescript
import { generateChatResponse } from '@/app/api/ai/chat/client';

// Automatically includes session cookie
const response = await generateChatResponse({
  fanId: 'fan_123',
  message: 'Hello!'
});
```

### Rate Limiting

Plan-based rate limits enforced via Redis:

- **Starter**: 50 requests/hour
- **Pro**: 100 requests/hour
- **Business**: 500 requests/hour

When exceeded, returns 429 with `Retry-After` header.

### Quota Management

Monthly spending quotas enforced via database:

- **Starter**: $10/month
- **Pro**: $50/month
- **Business**: Unlimited

When exceeded, returns 429 with quota details.

### Error Handling

Consistent error responses across all endpoints:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please try again later.",
    "retryable": true,
    "metadata": {
      "retryAfter": 3600,
      "limit": 100,
      "remaining": 0
    }
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_1234567890"
  }
}
```

### Usage Tracking

All requests automatically tracked in database:

```sql
SELECT * FROM usage_logs 
WHERE "creatorId" = 123 
ORDER BY "createdAt" DESC;
```

Includes:
- Input/output tokens
- Cost in USD
- Feature used
- Agent involved
- Model used
- Timestamp

## Client Libraries

Each endpoint has a TypeScript client:

```typescript
// Chat
import { generateChatResponse } from '@/app/api/ai/chat/client';

// Caption
import { generateCaption } from '@/app/api/ai/generate-caption/client';

// Analysis
import { analyzePerformance } from '@/app/api/ai/analyze-performance/client';

// Sales
import { optimizeSales } from '@/app/api/ai/optimize-sales/client';
```

## Testing

Integration tests available:

```bash
npm run test:integration -- tests/integration/api/ai-routes.integration.test.ts
```

See [Test Documentation](../../../tests/integration/api/AI_ROUTES_TEST_README.md) for details.

## Performance

- **Average Response Time**: < 3 seconds (95th percentile)
- **Token Usage**: 100-1000 tokens per request
- **Cost**: $0.001 - $0.05 per request
- **Throughput**: 100+ requests/second (with proper scaling)

## Monitoring

All endpoints include:
- Correlation IDs for request tracking
- Execution time in response metadata
- Error logging with stack traces
- Usage metrics in database

## Security

- ✅ Authentication required
- ✅ Rate limiting enforced
- ✅ Quota management
- ✅ Input validation with Zod
- ✅ SQL injection prevention (Prisma)
- ✅ CORS configured
- ✅ Error messages sanitized

## Cost Optimization

Tips for reducing AI costs:

1. **Cache Responses**: Cache common requests for 5 minutes
2. **Batch Requests**: Combine multiple operations when possible
3. **Use Flash Model**: Switch to `gemini-2.5-flash` for high-volume tasks
4. **Optimize Prompts**: Shorter prompts = lower costs
5. **Monitor Usage**: Track costs per feature/creator

## Deployment

Environment variables required:

```bash
# Gemini API
GEMINI_API_KEY=xxx
GEMINI_MODEL=gemini-2.5-pro

# Rate Limiting
ELASTICACHE_REDIS_HOST=xxx
ELASTICACHE_REDIS_PORT=6379

# Database
DATABASE_URL=xxx

# Quotas (optional overrides)
QUOTA_STARTER_USD=10
QUOTA_PRO_USD=50
QUOTA_BUSINESS_USD=999999
```

## Support

For issues or questions:
- Check endpoint-specific README files
- Review integration tests for examples
- Check CloudWatch logs for errors
- Contact dev team via Slack #ai-support

## Roadmap

Future enhancements:
- [ ] Streaming responses for real-time chat
- [ ] Multi-language support
- [ ] Voice message transcription
- [ ] Image analysis for content
- [ ] A/B testing for sales messages
- [ ] Automated performance reports
- [ ] Custom agent training per creator
