# AI Agents - Specialized Intelligence for Creator Success

This directory contains the specialized AI agents that power Huntaze's multi-agent AI system. Each agent is designed for a specific domain and works collaboratively through the AIKnowledgeNetwork.

## Architecture

All agents implement the `AITeamMember` interface and follow a consistent pattern:

```typescript
interface AITeamMember {
  id: string;
  name: string;
  role: string;
  model: string;
  
  initialize(network: AIKnowledgeNetwork): Promise<void>;
  processRequest(request: any): Promise<AIResponse>;
}
```

## Available Agents

### 1. MessagingAgent (`messaging.ts`)

**Purpose**: Handles fan interactions and message generation

**Model**: `gemini-2.5-flash` (optimized for speed)

**Capabilities**:
- Generates contextual responses based on fan history
- Matches creator's communication style
- Suggests upsell opportunities at appropriate times
- Learns from successful interactions

**Usage**:
```typescript
import { MessagingAgent } from './agents/messaging';

const agent = new MessagingAgent();
await agent.initialize(knowledgeNetwork);

const response = await agent.processRequest({
  creatorId: '123',
  fanId: '456',
  message: 'Hey! Love your content',
  context: {
    creatorStyle: 'friendly and playful',
    previousMessages: [...]
  }
});
```

**Insights Generated**:
- `successful_interaction`: Tracks message types and response strategies
- `fan_preference`: Learns fan communication preferences

---

### 2. ContentAgent (`content.ts`)

**Purpose**: Generates captions and hashtags for social media content

**Model**: `gemini-2.5-flash` (optimized for creative generation)

**Capabilities**:
- Platform-specific optimization (Instagram, Twitter, TikTok, OnlyFans)
- Hashtag suggestions based on trends
- Brand voice consistency
- Call-to-action integration

**Usage**:
```typescript
import { ContentAgent } from './agents/content';

const agent = new ContentAgent();
await agent.initialize(knowledgeNetwork);

const response = await agent.processRequest({
  creatorId: '123',
  platform: 'instagram',
  contentInfo: {
    type: 'photo',
    description: 'Beach photoshoot',
    mood: 'playful',
    targetAudience: 'fitness enthusiasts'
  }
});
```

**Insights Generated**:
- `content_strategy`: Tracks successful content approaches
- `trending_topic`: Identifies trending hashtags and topics

---

### 3. AnalyticsAgent (`analytics.ts`)

**Purpose**: Analyzes performance metrics and provides actionable insights

**Model**: `gemini-2.5-pro` (uses more powerful model for complex analysis)

**Capabilities**:
- Pattern recognition in engagement data
- Performance predictions
- Actionable recommendations
- Multi-platform analysis

**Usage**:
```typescript
import { AnalyticsAgent } from './agents/analytics';

const agent = new AnalyticsAgent();
await agent.initialize(knowledgeNetwork);

const response = await agent.processRequest({
  creatorId: '123',
  metrics: {
    timeframe: '30d',
    platforms: ['instagram', 'tiktok'],
    data: {
      engagement: 15000,
      followers: 50000,
      revenue: 5000
    }
  }
});
```

**Response Structure**:
```typescript
{
  insights: string[];      // Key findings
  patterns: string[];      // Observed trends
  predictions: string[];   // Future projections
  recommendations: string[]; // Actionable steps
  confidence: number;      // 0-1 confidence score
}
```

**Insights Generated**:
- `performance_pattern`: Tracks engagement patterns
- `engagement_pattern`: Identifies what drives engagement

---

### 4. SalesAgent (`sales.ts`)

**Purpose**: Optimizes sales messages for maximum conversion

**Model**: `gemini-2.5-flash` (balanced for persuasive messaging)

**Capabilities**:
- Psychological tactics (scarcity, urgency, FOMO, social proof)
- Pricing optimization
- Fan engagement level matching
- Conversion strategy tracking

**Usage**:
```typescript
import { SalesAgent } from './agents/sales';

const agent = new SalesAgent();
await agent.initialize(knowledgeNetwork);

const response = await agent.processRequest({
  creatorId: '123',
  fanId: '456',
  context: {
    engagementLevel: 'high',
    contentType: 'exclusive video',
    pricePoint: 25,
    purchaseHistory: [
      { type: 'photo', price: 15 },
      { type: 'video', price: 20 }
    ]
  }
});
```

**Response Structure**:
```typescript
{
  message: string;           // Optimized sales message
  tactics: string[];         // Psychological tactics used
  suggestedPrice?: number;   // Optimal price point
  confidence: number;        // 0-1 confidence score
}
```

**Insights Generated**:
- `sales_tactic`: Tracks effective sales approaches
- `pricing_insight`: Learns optimal pricing strategies
- `conversion_strategy`: Identifies successful conversion patterns

---

## Knowledge Network Integration

All agents share insights through the AIKnowledgeNetwork:

```typescript
// Agent stores an insight
await network.broadcastInsight(creatorId, {
  source: 'messaging-agent',
  type: 'fan_preference',
  confidence: 0.85,
  data: { preferredTone: 'casual', respondsToEmojis: true },
  timestamp: new Date()
});

// Another agent retrieves insights
const insights = await network.getRelevantInsights(
  creatorId,
  'fan_preference',
  5 // limit
);
```

## Testing

Each agent has comprehensive property-based tests:

- `agents-messaging-routing.property.test.ts`
- `agents-content-routing.property.test.ts`
- `agents-analytics-routing.property.test.ts`
- `agents-sales-routing.property.test.ts`

Run all agent tests:
```bash
npm run test -- tests/unit/ai/agents-*.property.test.ts --run
```

## Cost Optimization

Agents use different models based on their needs:

| Agent | Model | Cost | Reason |
|-------|-------|------|--------|
| Messaging | gemini-2.5-flash | Low | Real-time responses need speed |
| Content | gemini-2.5-flash | Low | Creative generation at scale |
| Analytics | gemini-2.5-pro | Medium | Complex analysis requires power |
| Sales | gemini-2.5-flash | Low | Balanced persuasion and speed |

## Error Handling

All agents follow consistent error handling:

```typescript
{
  success: false,
  error: "Error message",
  // No data field when error occurs
}
```

Agents gracefully handle:
- API failures
- Network timeouts
- Invalid input
- Missing context

## Future Enhancements

Planned improvements:
- [ ] Multi-language support
- [ ] A/B testing integration
- [ ] Real-time learning from user feedback
- [ ] Agent collaboration for complex tasks
- [ ] Custom agent training per creator

## Requirements Validation

✅ **Requirement 1.1**: Generate contextual responses based on fan history  
✅ **Requirement 1.2**: Integrate insights from multiple agents  
✅ **Requirement 1.5**: Store successful interaction insights  
✅ **Requirement 9.1**: Common interface for all agents  

All agents validated with Property 16: Request routing correctness
