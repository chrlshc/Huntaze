# Design Document

## Overview

The AI System is a production-grade multi-agent architecture that provides intelligent assistance to OnlyFans creators through the Huntaze platform. The system uses Google Gemini AI as its foundation, with four specialized agents coordinated through a central orchestration layer. A shared Knowledge Network enables cross-agent learning, while comprehensive billing and rate limiting ensure cost control and fair resource distribution.

The architecture follows a layered approach:
- **Presentation Layer**: Next.js API routes
- **Orchestration Layer**: AITeamCoordinator + AIKnowledgeNetwork
- **Agent Layer**: Four specialized AI agents (messaging, content, analytics, sales)
- **Service Layer**: Gemini client, billing service, database, cache

## Architecture

### System Layers

```
┌─────────────────────────────────────────────────────────┐
│                   API Routes (Next.js)                   │
│  /api/ai/chat  /api/ai/caption  /api/ai/analytics       │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              AITeamCoordinator                           │
│  - Routes requests to agents                             │
│  - Combines multi-agent intelligence                     │
│  - Enforces quotas & rate limits                         │
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

### Data Flow: Fan Message Response

```
1. Creator receives fan message
2. POST /api/ai/chat { fanId, message }
3. Rate limit check (Upstash Redis)
4. Quota check (database aggregate)
5. Coordinator routes to MessagingAgent
6. MessagingAgent queries Knowledge Network for context
7. MessagingAgent calls Gemini via Billing Service
8. Billing Service logs tokens + cost to database
9. Response returned to creator
10. Insight stored in Knowledge Network
```

## Components and Interfaces

### 1. Gemini Client (lib/ai/geminiClient.ts)

Low-level wrapper around @google/genai SDK.

```typescript
export type GeminiUsageMetadata = {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
};

export type GeminiGenerateTextParams = {
  model?: string;
  contents: { 
    role: 'user' | 'system' | 'model'; 
    parts: { text: string }[] 
  }[];
  config?: {
    temperature?: number;
    maxOutputTokens?: number;
    response_mime_type?: string;
    response_json_schema?: any;
  };
};

export async function generateTextRaw(
  params: GeminiGenerateTextParams
): Promise<{
  model: string;
  text: string;
  usageMetadata: GeminiUsageMetadata;
}>;
```

### 2. Billing Service (lib/ai/geminiBilling.service.ts)

Handles cost calculation and usage logging.

```typescript
export type GeminiCallMetadata = {
  creatorId: string;
  feature: string;
  agentId?: string;
};

export async function generateTextWithBilling(params: {
  prompt: string;
  metadata: GeminiCallMetadata;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}): Promise<{
  text: string;
  usage: {
    model: string;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
  };
}>;
```

**Pricing Table:**
- gemini-2.5-pro: $1.25/1M input, $10.00/1M output
- gemini-2.5-flash: $0.30/1M input, $2.50/1M output
- gemini-2.5-flash-lite: $0.10/1M input, $0.40/1M output

### 3. AI Agents

Each agent implements the `AITeamMember` interface:

```typescript
interface AITeamMember {
  id: string;
  name: string;
  role: string;
  model: string;
  
  initialize(network: AIKnowledgeNetwork): Promise<void>;
  processRequest(request: any): Promise<any>;
}
```

**MessagingAgent** (lib/ai/agents/messaging.ts)
- Generates contextual responses to fan messages
- Incorporates creator communication style
- Learns from successful interactions

**ContentAgent** (lib/ai/agents/content.ts)
- Generates captions and hashtags
- Optimizes for platform algorithms
- Maintains brand voice consistency

**AnalyticsAgent** (lib/ai/agents/analytics.ts)
- Analyzes performance metrics
- Identifies engagement patterns
- Provides actionable recommendations

**SalesAgent** (lib/ai/agents/sales.ts)
- Generates personalized upsell messages
- Tracks conversion strategies
- Adapts based on fan behavior

### 4. AITeamCoordinator (lib/ai/coordinator.ts)

Orchestrates agent collaboration.

```typescript
type AiRequest =
  | { type: 'fan_message'; creatorId: string; fanId: string; message: string }
  | { type: 'generate_caption'; creatorId: string; platform: string; contentInfo: any }
  | { type: 'analyze_performance'; creatorId: string; metrics: any }
  | { type: 'optimize_sales'; creatorId: string; fanId: string; context: any };

export class AITeamCoordinator {
  async route(request: AiRequest): Promise<any>;
  async handleFanMessage(creatorId: string, fanId: string, message: string): Promise<any>;
  async handleCaptionGeneration(creatorId: string, platform: string, contentInfo: any): Promise<any>;
  async handlePerformanceAnalysis(creatorId: string, metrics: any): Promise<any>;
  async handleSalesOptimization(creatorId: string, fanId: string, context: any): Promise<any>;
}
```

### 5. AIKnowledgeNetwork (lib/ai/knowledge-network.ts)

Shared learning system.

```typescript
export type Insight = {
  source: string;
  type: string;
  confidence: number;
  data: any;
  timestamp: Date;
};

export class AIKnowledgeNetwork {
  async storeInsight(creatorId: string, insight: Insight): Promise<void>;
  async getRelevantInsights(creatorId: string, type: string, limit?: number): Promise<Insight[]>;
  async broadcastInsight(creatorId: string, insight: Insight): Promise<void>;
}
```

### 6. Rate Limiting (lib/ai/rateLimit.ts)

Uses Upstash Redis for distributed rate limiting.

```typescript
export async function checkCreatorRateLimit(creatorId: string): Promise<void>;
```

Configuration:
- Starter: 50 requests/hour
- Pro: 100 requests/hour
- Business: 500 requests/hour

### 7. Quota Management (lib/ai/quota.ts)

```typescript
export async function assertWithinMonthlyQuota(
  creatorId: string,
  plan: 'starter' | 'pro' | 'business',
  estimatedCostUsd: number
): Promise<void>;
```

Monthly Quotas:
- Starter: $10/month
- Pro: $50/month
- Business: Unlimited

## Data Models

### Database Schema (Prisma)

```prisma
model Creator {
  id             String          @id @default(cuid())
  email          String          @unique
  plan           CreatorPlan
  usageLogs      UsageLog[]
  monthlyCharges MonthlyCharge[]
}

enum CreatorPlan {
  STARTER
  PRO
  BUSINESS
}

model UsageLog {
  id           String   @id @default(cuid())
  creator      Creator  @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  creatorId    String
  feature      String
  agentId      String?
  model        String
  tokensInput  Int
  tokensOutput Int
  costUsd      Decimal  @db.Decimal(10, 6)
  createdAt    DateTime @default(now())
  
  @@index([creatorId, createdAt])
}

model MonthlyCharge {
  id                String   @id @default(cuid())
  creator           Creator  @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  creatorId         String
  month             DateTime
  totalTokensInput  Int
  totalTokensOutput Int
  totalCostUsd      Decimal  @db.Decimal(10, 6)
  planPrice         Decimal  @db.Decimal(10, 2)
  
  @@unique([creatorId, month])
}

model AIInsight {
  id         String   @id @default(cuid())
  creatorId  String
  source     String
  type       String
  confidence Float
  data       Json
  createdAt  DateTime @default(now())
  
  @@index([creatorId, type, createdAt])
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, several properties can be consolidated:
- Properties 5.1 and 2.4 both test usage logging - can be combined into one comprehensive property
- Properties 6.2 and 7.2 both test plan-based limits - can be combined
- Properties 8.2 and 8.3 both test Gemini SDK usage - can be combined
- Properties 11.x about database schema can be combined into structural validation

### Billing & Cost Tracking Properties

**Property 1: Usage logging completeness**
*For any* AI request that completes successfully, the system SHALL create a UsageLog record containing creatorId, feature, agentId, model, input tokens, output tokens, and calculated cost in USD.
**Validates: Requirements 1.3, 2.4, 5.1, 5.4**

**Property 2: Cost calculation accuracy**
*For any* AI request using a specific model, the calculated cost SHALL equal (inputTokens / 1,000,000 × inputPrice) + (outputTokens / 1,000,000 × outputPrice) where prices match the model pricing table.
**Validates: Requirements 5.1, 5.2**

**Property 3: Monthly aggregation correctness**
*For any* creator and month, the MonthlyCharge total cost SHALL equal the sum of all UsageLog costs for that creator within that month's date range.
**Validates: Requirements 5.3**

**Property 4: Real-time cost queries**
*For any* creator and time period, querying usage costs SHALL return the sum of all UsageLog costs within that period, with results available within 1 second of the last write.
**Validates: Requirements 5.5**

### Quota Management Properties

**Property 5: Quota enforcement before execution**
*For any* AI request, if the creator's current month spending plus estimated request cost exceeds their plan quota, the request SHALL be rejected before calling the Gemini API.
**Validates: Requirements 6.1**

**Property 6: Plan-based quota limits**
*For any* creator, the enforced monthly quota SHALL be $10 for STARTER plan, $50 for PRO plan, and unlimited for BUSINESS plan.
**Validates: Requirements 6.2**

**Property 7: Quota upgrade propagation**
*For any* creator who changes from plan A to plan B, the next AI request SHALL enforce plan B's quota limit, not plan A's.
**Validates: Requirements 6.4**

**Property 8: Quota threshold notifications**
*For any* creator whose monthly spending reaches 80% or 95% of their quota, a notification SHALL be created within 1 minute of crossing the threshold.
**Validates: Requirements 6.5**

### Rate Limiting Properties

**Property 9: Rate limit enforcement**
*For any* creator making N+1 requests within the rate limit window where N equals their plan's limit, the (N+1)th request SHALL be rejected with HTTP 429.
**Validates: Requirements 7.1**

**Property 10: Plan-based rate limits**
*For any* creator, the enforced rate limit SHALL be 50 req/hour for STARTER, 100 req/hour for PRO, and 500 req/hour for BUSINESS.
**Validates: Requirements 7.2**

**Property 11: Rate limit reset**
*For any* creator who was rate-limited, after the sliding window period elapses, the next request SHALL be allowed.
**Validates: Requirements 7.4**

**Property 12: Anomaly logging**
*For any* creator making requests at a rate exceeding 2× their plan limit within a 5-minute window, an anomaly log SHALL be created.
**Validates: Requirements 7.5**

### Gemini SDK Integration Properties

**Property 13: SDK usage metadata extraction**
*For any* successful Gemini API call, the response SHALL contain usageMetadata with promptTokenCount and candidatesTokenCount, and these values SHALL be used for billing calculations.
**Validates: Requirements 8.2, 8.3**

**Property 14: Structured output schema validation**
*For any* request specifying a JSON schema, the Gemini API call SHALL include response_mime_type: 'application/json' and response_json_schema in the config.
**Validates: Requirements 8.4**

**Property 15: SDK error handling**
*For any* Gemini SDK error, the system SHALL catch the error, log it with error type and message, and return a user-friendly error response without exposing internal details.
**Validates: Requirements 8.5**

### Coordinator & Agent Properties

**Property 16: Request routing correctness**
*For any* AI request of type T, the Coordinator SHALL invoke the agent whose role matches T (fan_message → MessagingAgent, generate_caption → ContentAgent, etc.).
**Validates: Requirements 9.1**

**Property 17: Multi-agent orchestration**
*For any* request requiring multiple agents, the Coordinator SHALL invoke all required agents and combine their responses into a single unified result.
**Validates: Requirements 9.2, 9.3**

**Property 18: Agent failure isolation**
*For any* multi-agent request where one agent fails, the Coordinator SHALL return partial results from successful agents rather than failing the entire request.
**Validates: Requirements 9.4**

**Property 19: Routing decision logging**
*For any* request processed by the Coordinator, a log entry SHALL be created containing request type, selected agents, and execution time.
**Validates: Requirements 9.5**

### Knowledge Network Properties

**Property 20: Insight storage completeness**
*For any* insight broadcast by an agent, the Knowledge Network SHALL store a record containing source agentId, type, confidence score, data, and timestamp.
**Validates: Requirements 10.1, 10.3**

**Property 21: Cross-agent insight retrieval**
*For any* agent requesting insights of type T for creator C, the Knowledge Network SHALL return all insights of type T associated with creator C, regardless of which agent created them.
**Validates: Requirements 10.2**

**Property 22: Confidence decay over time**
*For any* insight stored at time T, when queried at time T+30days, the confidence score SHALL be reduced by at least 20% from its original value.
**Validates: Requirements 10.4**

**Property 23: Insight ranking**
*For any* insight query, results SHALL be ordered by (confidence × relevance_score) in descending order.
**Validates: Requirements 10.5**

### Database Schema Properties

**Property 24: Usage log foreign key integrity**
*For any* UsageLog record, the creatorId SHALL reference an existing Creator record, and deleting a Creator SHALL cascade delete all associated UsageLog records.
**Validates: Requirements 11.5**

**Property 25: Monthly charge uniqueness**
*For any* creator and month combination, at most one MonthlyCharge record SHALL exist.
**Validates: Requirements 11.3**

**Property 26: Indexed query performance**
*For any* query filtering UsageLog by creatorId and date range, the query SHALL use the (creatorId, createdAt) index and complete within 100ms for up to 100,000 records.
**Validates: Requirements 11.4**

### Admin Dashboard Properties

**Property 27: Total spending aggregation**
*For any* time period, the admin dashboard total spending SHALL equal the sum of all UsageLog costs within that period across all creators.
**Validates: Requirements 12.1**

**Property 28: Per-creator breakdown accuracy**
*For any* creator, the dashboard spending breakdown by feature SHALL equal the sum of UsageLog costs grouped by feature for that creator.
**Validates: Requirements 12.2**

**Property 29: High-cost creator ranking**
*For any* time period, the dashboard SHALL rank creators by total AI spending in descending order.
**Validates: Requirements 12.4**

## Error Handling

### Error Categories

1. **Quota Exceeded**: HTTP 429, message includes current usage and plan limit
2. **Rate Limit Exceeded**: HTTP 429, includes retry-after header
3. **Gemini API Error**: HTTP 502, logged with full context, user sees generic message
4. **Invalid Request**: HTTP 400, validation errors returned
5. **Authentication Error**: HTTP 401, requires valid session
6. **Agent Failure**: HTTP 500, logged with agent ID and error details

### Error Response Format

```typescript
{
  error: string;
  code: 'QUOTA_EXCEEDED' | 'RATE_LIMITED' | 'API_ERROR' | 'INVALID_REQUEST';
  details?: {
    currentUsage?: number;
    limit?: number;
    retryAfter?: number;
  };
}
```

### Retry Strategy

- Gemini API errors: Exponential backoff, max 3 retries
- Rate limit errors: No retry, client must wait
- Quota errors: No retry, requires plan upgrade
- Transient errors: Retry once after 1 second

## Testing Strategy

### Unit Testing

Unit tests will cover:
- Cost calculation logic with various token counts and models
- Quota checking logic with different plans and usage levels
- Rate limit enforcement with sliding windows
- Agent routing logic with different request types
- Insight storage and retrieval
- Error handling for each error category

Framework: Vitest
Location: `tests/unit/ai/`

### Property-Based Testing

Property-based tests will verify universal properties across random inputs using `fast-check` library. Each test will run minimum 100 iterations.

**Test Configuration:**
```typescript
import fc from 'fast-check';

// Run each property test 100 times with random inputs
const testConfig = { numRuns: 100 };
```

**Property Test Examples:**

```typescript
// Property 2: Cost calculation accuracy
test('cost calculation matches formula for any token counts', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 1000000 }), // inputTokens
      fc.integer({ min: 0, max: 100000 }),  // outputTokens
      fc.constantFrom('gemini-2.5-pro', 'gemini-2.5-flash'),
      (inputTokens, outputTokens, model) => {
        const result = computeCostUSD(model, { 
          promptTokenCount: inputTokens,
          candidatesTokenCount: outputTokens 
        });
        
        const pricing = MODEL_PRICING[model];
        const expected = 
          (inputTokens / 1_000_000) * pricing.inputPricePerMTokens +
          (outputTokens / 1_000_000) * pricing.outputPricePerMTokens;
        
        return Math.abs(result.costUsd - expected) < 0.000001;
      }
    ),
    testConfig
  );
});

// Property 16: Request routing correctness
test('coordinator routes requests to correct agent', () => {
  fc.assert(
    fc.property(
      fc.constantFrom('fan_message', 'generate_caption', 'analyze_performance'),
      fc.string(), // creatorId
      async (requestType, creatorId) => {
        const coordinator = new AITeamCoordinator();
        const spy = jest.spyOn(coordinator, 'getAgentForType');
        
        await coordinator.route({ type: requestType, creatorId, /* ... */ });
        
        const expectedAgent = {
          'fan_message': 'messaging',
          'generate_caption': 'content',
          'analyze_performance': 'analytics'
        }[requestType];
        
        expect(spy).toHaveBeenCalledWith(expectedAgent);
        return true;
      }
    ),
    testConfig
  );
});
```

**Property Test Tags:**
Each property-based test MUST include a comment tag referencing the design document:
```typescript
// Feature: ai-system-gemini-integration, Property 2: Cost calculation accuracy
// Validates: Requirements 5.1, 5.2
```

### Integration Testing

Integration tests will verify:
- End-to-end API flows from request to database
- Gemini SDK integration with mocked responses
- Rate limiting with real Redis (test instance)
- Database operations with test database
- Multi-agent coordination scenarios

Framework: Vitest with test database
Location: `tests/integration/ai/`

### Performance Testing

- Response time: 95th percentile < 3 seconds for fan messages
- Database queries: < 100ms for usage aggregations
- Rate limit checks: < 10ms per request
- Concurrent requests: Support 100 simultaneous creators

## Deployment Considerations

### Environment Variables

```bash
# Gemini API
GEMINI_API_KEY=xxx
GEMINI_MODEL=gemini-2.5-pro

# Rate Limiting
UPSTASH_REDIS_REST_URL=xxx
UPSTASH_REDIS_REST_TOKEN=xxx

# Database
DATABASE_URL=xxx

# Quotas (optional overrides)
QUOTA_STARTER_USD=10
QUOTA_PRO_USD=50
QUOTA_BUSINESS_USD=999999
```

### Monitoring & Alerts

- CloudWatch metrics for AI costs per hour/day
- Alert when daily costs exceed $200
- Alert when error rate > 5%
- Dashboard showing costs by creator, feature, agent
- Linear integration for automatic incident creation

### Scaling Strategy

- Stateless agents enable horizontal scaling
- Redis rate limiting supports distributed deployment
- Database connection pooling for high concurrency
- Caching layer for Knowledge Network queries
- Async job queue for monthly aggregations

### Cost Optimization

- Use gemini-2.5-flash for high-volume, low-complexity tasks
- Cache common responses for 5 minutes
- Batch insight storage operations
- Implement prompt compression techniques
- Monitor and optimize token usage per feature
