# AI System Integration Guide

## Setup Complete ✅

The following files have been created:

1. `lib/ai/gemini-client.ts` - New Gemini SDK client (@google/genai)
2. `lib/ai/gemini-billing.service.ts` - Cost tracking and usage logging
3. `lib/ai/rate-limit.ts` - Rate limiting per creator
4. `lib/ai/billing.ts` - Monthly aggregation and quota management
5. `lib/prisma.ts` - Prisma client singleton
6. Updated `prisma/schema.prisma` - Added UsageLog and MonthlyCharge tables

## Next Steps

### 1. Run Prisma Migration

```bash
npx prisma migrate dev --name add-ai-usage-tracking
npx prisma generate
```

### 2. Add Environment Variables

Add to your `.env` file:

```env
# Gemini API
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.0-flash-exp

# Upstash Redis (for rate limiting)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

### 3. Usage Example

```typescript
import { generateTextWithBilling } from '@/lib/ai/gemini-billing.service';
import { checkCreatorRateLimit } from '@/lib/ai/rate-limit';

// In your API route
export async function POST(req: Request) {
  const { creatorId, prompt } = await req.json();

  // Check rate limit
  await checkCreatorRateLimit(creatorId);

  // Generate text with automatic billing
  const { text, usage } = await generateTextWithBilling({
    prompt,
    metadata: {
      creatorId,
      feature: 'fan_message_response',
      agentId: 'messaging_ai',
    },
    temperature: 0.7,
    maxOutputTokens: 1024,
  });

  return Response.json({ text, usage });
}
```

### 4. Create Multi-Agent System

Next, you'll want to create:
- `lib/of/ai-team-coordinator.ts` - Orchestrates multiple agents
- `lib/of/ai-knowledge-network.ts` - Shared learning system
- `lib/of/agents/messaging-ai.ts` - Messaging agent
- `lib/of/agents/sales-ai.ts` - Sales optimization agent
- `lib/of/agents/analytics-ai.ts` - Analytics agent
- `lib/of/agents/compliance-ai.ts` - Content compliance agent

### 5. API Routes

Create routes that use the coordinator:
- `app/api/ai/chat/route.ts` - Fan message responses
- `app/api/ai/generate-caption/route.ts` - Content generation
- `app/api/ai/analyze-performance/route.ts` - Performance analysis

## Cost Tracking

All AI usage is automatically logged to the `usage_logs` table with:
- Creator ID
- Feature used
- Agent ID
- Model used
- Input/output tokens
- Cost in USD

Run monthly aggregation:

```typescript
import { recomputeMonthlyChargesForMonth } from '@/lib/ai/billing';

// Run this via cron job
await recomputeMonthlyChargesForMonth(new Date());
```

## Rate Limiting

Default: 100 requests per hour per creator

Customize in `lib/ai/rate-limit.ts`:

```typescript
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(200, '1 h'), // 200 requests/hour
});
```

## Quota Management

Check quota before expensive operations:

```typescript
import { assertWithinMonthlyQuota } from '@/lib/ai/billing';

await assertWithinMonthlyQuota(creatorId, 'starter', 0.05);
```

## Model Pricing

Configured in `lib/ai/gemini-billing.service.ts`:

- `gemini-2.0-flash-exp`: Free (experimental)
- `gemini-2.5-pro`: $1.25/$10 per 1M tokens
- `gemini-2.5-flash`: $0.30/$2.50 per 1M tokens
- `gemini-2.5-flash-lite`: $0.10/$0.40 per 1M tokens
