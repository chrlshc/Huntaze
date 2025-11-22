# AI System Quick Start

## 🚀 Setup (5 minutes)

### 1. Install Dependencies

Already done! ✅ `@google/genai` is installed.

### 2. Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Get API Key"
3. Copy your API key

### 3. Setup Environment Variables

Add to your `.env` file:

```env
# Gemini AI
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.0-flash-exp

# Upstash Redis (for rate limiting)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

**Get Upstash Redis (Free):**
1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a new Redis database
3. Copy the REST URL and Token

### 4. Run Database Migration

```bash
npx prisma migrate dev --name add-ai-usage-tracking
```

This creates the `usage_logs` and `monthly_charges` tables.

## 🧪 Test the System

### Option 1: Use the Test API

```bash
curl -X POST http://localhost:3000/api/ai/test \
  -H "Content-Type: application/json" \
  -d '{
    "creatorId": "test-creator-123",
    "prompt": "Write a friendly greeting message"
  }'
```

Expected response:

```json
{
  "success": true,
  "text": "Hello! How can I help you today?",
  "usage": {
    "model": "gemini-2.0-flash-exp",
    "inputTokens": 8,
    "outputTokens": 12,
    "totalTokens": 20,
    "costUsd": 0
  }
}
```

### Option 2: Use in Your Code

```typescript
import { generateTextWithBilling } from '@/lib/ai/gemini-billing.service';

const { text, usage } = await generateTextWithBilling({
  prompt: 'Write a short bio for an OnlyFans creator',
  metadata: {
    creatorId: 'user-123',
    feature: 'bio_generation',
    agentId: 'content_ai',
  },
  temperature: 0.8,
  maxOutputTokens: 200,
});

console.log('Generated:', text);
console.log('Cost:', usage.costUsd, 'USD');
```

## 📊 Check Usage Logs

Query the database to see logged usage:

```sql
SELECT * FROM usage_logs ORDER BY created_at DESC LIMIT 10;
```

Or use Prisma:

```typescript
import { db } from '@/lib/prisma';

const logs = await db.usageLog.findMany({
  where: { creatorId: 'test-creator-123' },
  orderBy: { createdAt: 'desc' },
  take: 10,
});

console.log(logs);
```

## 🎯 Rate Limiting Test

The system allows 100 requests per hour per creator. Test it:

```bash
# This should work
curl -X POST http://localhost:3000/api/ai/test \
  -H "Content-Type: application/json" \
  -d '{"creatorId": "test-123", "prompt": "Hello"}'

# After 100 requests, you'll get:
# {"error": "Rate limit exceeded - please try again later"}
```

## 💰 Cost Tracking

### Check Monthly Costs

```typescript
import { db } from '@/lib/prisma';

const spent = await db.usageLog.aggregate({
  where: {
    creatorId: 'user-123',
    createdAt: {
      gte: new Date(2025, 0, 1), // January 1, 2025
    },
  },
  _sum: {
    costUsd: true,
    tokensInput: true,
    tokensOutput: true,
  },
});

console.log('Total cost:', spent._sum.costUsd);
console.log('Total tokens:', spent._sum.tokensInput + spent._sum.tokensOutput);
```

### Run Monthly Aggregation

```typescript
import { recomputeMonthlyChargesForMonth } from '@/lib/ai/billing';

// Aggregate costs for current month
await recomputeMonthlyChargesForMonth(new Date());
```

## 🔧 Troubleshooting

### Error: "GEMINI_API_KEY is not set"

Make sure your `.env` file has:
```env
GEMINI_API_KEY=your_actual_key_here
```

### Error: "Cannot find module '@google/genai'"

Run:
```bash
npm install @google/genai --legacy-peer-deps
```

### Error: "Property 'usageLog' does not exist"

Run:
```bash
npx prisma generate
```

### Error: "Rate limit exceeded"

This is expected! The system is working. Wait 1 hour or use a different `creatorId`.

### Database Connection Error

Make sure your `DATABASE_URL` in `.env` is correct:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/huntaze"
```

## 📈 Next Steps

1. **Create Multi-Agent System** - Build the coordinator and specialized agents
2. **Add More API Routes** - Create routes for different AI features
3. **Setup Monitoring** - Track costs and usage in production
4. **Implement Quotas** - Enforce monthly spending limits per plan

See `lib/ai/INTEGRATION_GUIDE.md` for detailed next steps.

## 🎉 You're Ready!

The AI system is now:
- ✅ Connected to Gemini
- ✅ Tracking all costs
- ✅ Rate limiting requests
- ✅ Logging to database
- ✅ Ready for production

Start building your multi-agent system!
