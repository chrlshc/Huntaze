# AI Optimize Sales API

Optimize sales messages with AI-powered conversion tactics and pricing strategies.

## Endpoint

```
POST /api/ai/optimize-sales
```

## Authentication

Requires valid session authentication. Include session cookie in request.

## Request Body

```typescript
{
  fanId: string;                    // Required: Fan identifier
  context: {
    currentMessage?: string;        // Current sales message to optimize
    fanProfile?: {
      name?: string;
      tier?: string;
      lifetime_value?: number;
      [key: string]: any;
    };
    purchaseHistory?: {
      totalSpent?: number;
      lastPurchase?: string;
      averageOrderValue?: number;
      [key: string]: any;
    };
    engagementLevel?: 'low' | 'medium' | 'high';
    contentType?: string;           // e.g., 'exclusive_photos', 'custom_video'
    pricePoint?: number;            // Proposed price in USD
  };
}
```

## Response

### Success (200 OK)

```typescript
{
  success: true;
  data: {
    message: string;                      // Optimized sales message
    tactics: Array<{
      name: string;                       // Tactic name
      description: string;                // What the tactic does
      rationale: string;                  // Why it works
    }>;
    suggestedPrice?: number;              // AI-recommended price
    confidence: number;                   // Confidence score (0-1)
    expectedConversionRate: number;       // Expected conversion rate
    alternativeMessages?: Array<{
      message: string;
      approach: string;
      expectedConversionRate: number;
    }>;
    agentsInvolved: string[];
    usage: {
      totalInputTokens: number;
      totalOutputTokens: number;
      totalCostUsd: number;
    };
  };
  meta: {
    timestamp: string;
    requestId: string;
    duration: number;
  };
}
```

### Error Responses

Same error responses as other AI endpoints:
- 400 Bad Request - Validation Error
- 401 Unauthorized
- 429 Rate Limit Exceeded
- 429 Quota Exceeded
- 500 Internal Server Error

## Usage Example

### Basic Optimization

```typescript
import { optimizeSales, unwrapSalesResponse } from '@/app/api/ai/optimize-sales/client';

async function optimizeMyMessage(fanId: string) {
  try {
    const response = await optimizeSales({
      fanId,
      context: {
        currentMessage: 'Check out my new exclusive content!',
        engagementLevel: 'high',
        contentType: 'exclusive_photos',
        pricePoint: 25
      }
    });

    const data = unwrapSalesResponse(response);
    
    console.log('Optimized Message:', data.message);
    console.log('Tactics:', data.tactics);
    console.log('Suggested Price:', data.suggestedPrice);
    console.log('Expected Conversion:', data.expectedConversionRate);
    
    return data;
  } catch (error) {
    console.error('Failed to optimize sales:', error);
    throw error;
  }
}
```

### Advanced Optimization with Fan Profile

```typescript
const response = await optimizeSales({
  fanId: 'fan_123',
  context: {
    currentMessage: 'Want to see something special? 😘',
    fanProfile: {
      name: 'John',
      tier: 'premium',
      lifetime_value: 500,
      preferences: ['exclusive_content', 'custom_requests']
    },
    purchaseHistory: {
      totalSpent: 500,
      lastPurchase: '2024-01-15',
      averageOrderValue: 35,
      purchaseFrequency: 'weekly'
    },
    engagementLevel: 'high',
    contentType: 'custom_video',
    pricePoint: 50
  }
});
```

## Response Examples

### Optimized Message

```typescript
{
  message: "Hey John! 💕 I just created something exclusive that I think you'll absolutely love. It's a custom video just for my premium fans like you. Want to be one of the first to see it? Limited to 10 people only! 🔥",
  tactics: [
    {
      name: "Personalization",
      description: "Uses fan's name to create connection",
      rationale: "Personalized messages have 26% higher conversion rates"
    },
    {
      name: "Scarcity",
      description: "Limited availability creates urgency",
      rationale: "Scarcity triggers FOMO and increases immediate action"
    },
    {
      name: "Social Proof",
      description: "Mentions premium tier status",
      rationale: "Reinforces fan's special status and investment"
    }
  ],
  suggestedPrice: 45,
  confidence: 0.87,
  expectedConversionRate: 0.42
}
```

### Alternative Messages

```typescript
alternativeMessages: [
  {
    message: "John, I made something special with you in mind 💋 This custom video is exactly what you've been asking for. Ready to see it?",
    approach: "Direct and personal",
    expectedConversionRate: 0.38
  },
  {
    message: "🔥 EXCLUSIVE DROP 🔥 Premium members only! Custom content just went live. You're on the VIP list, John. Claim yours before they're gone!",
    approach: "Urgency and exclusivity",
    expectedConversionRate: 0.35
  }
]
```

## Sales Tactics

The AI uses proven psychological tactics:

1. **Personalization**: Using fan's name and preferences
2. **Scarcity**: Limited availability or time-sensitive offers
3. **Social Proof**: Highlighting popularity or exclusivity
4. **Reciprocity**: Offering value before asking
5. **Authority**: Establishing expertise or status
6. **Urgency**: Time-limited opportunities
7. **Exclusivity**: VIP or premium member benefits
8. **Emotional Appeal**: Creating desire and connection

## Pricing Optimization

The AI considers multiple factors for price suggestions:

- Fan's purchase history and average order value
- Content type and production effort
- Market rates for similar content
- Fan's engagement level and loyalty
- Seasonal trends and demand
- Competitor pricing

## Multi-Agent Processing

The sales endpoint uses the SalesAgent which:

1. Analyzes fan profile and history
2. Identifies optimal conversion tactics
3. Generates personalized message
4. Suggests optimal pricing
5. Provides alternative approaches
6. Stores successful strategies in Knowledge Network

## Rate Limits

- **Starter Plan**: 50 requests/hour
- **Pro Plan**: 100 requests/hour
- **Business Plan**: 500 requests/hour

## Monthly Quotas

- **Starter Plan**: $10/month
- **Pro Plan**: $50/month
- **Business Plan**: Unlimited

## Best Practices

1. **Provide Context**: More fan data = better optimization
2. **Test Alternatives**: Try different approaches with A/B testing
3. **Track Results**: Monitor actual conversion rates
4. **Iterate**: Use successful tactics for future messages
5. **Personalize**: Always include fan-specific details
6. **Be Authentic**: Maintain your brand voice
7. **Respect Boundaries**: Don't be overly aggressive

## Integration Example

```typescript
import { optimizeSales } from '@/app/api/ai/optimize-sales/client';

function SalesMessageComposer({ fanId, fanProfile }) {
  const [message, setMessage] = useState('');
  const [optimized, setOptimized] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleOptimize() {
    setLoading(true);
    try {
      const response = await optimizeSales({
        fanId,
        context: {
          currentMessage: message,
          fanProfile,
          engagementLevel: 'high',
          contentType: 'exclusive_photos',
          pricePoint: 25
        }
      });

      if (response.success) {
        setOptimized(response.data);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Enter your sales message..."
      />
      <button onClick={handleOptimize} disabled={loading}>
        Optimize with AI
      </button>
      
      {optimized && (
        <div>
          <h3>Optimized Message</h3>
          <p>{optimized.message}</p>
          
          <h4>Tactics Used</h4>
          <ul>
            {optimized.tactics.map((tactic, i) => (
              <li key={i}>
                <strong>{tactic.name}</strong>: {tactic.description}
              </li>
            ))}
          </ul>
          
          <p>Suggested Price: ${optimized.suggestedPrice}</p>
          <p>Expected Conversion: {(optimized.expectedConversionRate * 100).toFixed(1)}%</p>
        </div>
      )}
    </div>
  );
}
```

## Performance

- **Average Response Time**: < 3 seconds (95th percentile)
- **Token Usage**: 300-700 tokens per request (typical)
- **Cost**: $0.001 - $0.03 per request (typical)

## Conversion Tracking

Track actual conversion rates to improve AI recommendations:

```typescript
// After fan makes purchase
await fetch('/api/ai/track-conversion', {
  method: 'POST',
  body: JSON.stringify({
    fanId,
    messageId: optimized.messageId,
    converted: true,
    purchaseAmount: 45
  })
});
```

## Error Handling

```typescript
const response = await optimizeSales(request);

if (!response.success) {
  if (response.error.code === 'VALIDATION_ERROR') {
    console.error('Invalid request:', response.error.metadata);
  } else if (response.error.code === 'RATE_LIMIT_EXCEEDED') {
    const retryAfter = response.error.metadata?.retryAfter;
    console.log(`Retry after ${retryAfter} seconds`);
  } else {
    console.error(response.error.message);
  }
}
```
