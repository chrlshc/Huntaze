# AI Chat API

Generate AI-powered responses to fan messages using multi-agent collaboration.

## Endpoint

```
POST /api/ai/chat
```

## Authentication

Requires valid session authentication. Include session cookie in request.

## Request Body

```typescript
{
  fanId: string;        // Required: Fan identifier
  message: string;      // Required: Fan's message
  context?: {           // Optional: Additional context
    engagementLevel?: 'low' | 'medium' | 'high';
    purchaseHistory?: any;
    [key: string]: any;
  };
}
```

## Response

### Success (200 OK)

```typescript
{
  success: true;
  data: {
    response: string;              // AI-generated response
    confidence: number;            // Confidence score (0-1)
    suggestedUpsell?: string;      // Optional upsell suggestion
    salesTactics?: string[];       // Sales tactics used
    suggestedPrice?: number;       // Suggested pricing
    agentsInvolved: string[];      // Agents that processed request
    usage: {
      totalInputTokens: number;    // Input tokens used
      totalOutputTokens: number;   // Output tokens used
      totalCostUsd: number;        // Cost in USD
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

#### 400 Bad Request - Validation Error

```typescript
{
  success: false;
  error: {
    code: 'VALIDATION_ERROR';
    message: string;
    metadata?: {
      errors: Array<{ message: string; path: string[] }>;
    };
  };
  meta: { timestamp: string; requestId: string };
}
```

#### 401 Unauthorized

```typescript
{
  success: false;
  error: {
    code: 'UNAUTHORIZED';
    message: 'Authentication required';
  };
  meta: { timestamp: string; requestId: string };
}
```

#### 429 Rate Limit Exceeded

```typescript
{
  success: false;
  error: {
    code: 'RATE_LIMIT_EXCEEDED';
    message: 'Rate limit exceeded. Please try again later.';
    retryable: true;
    metadata: {
      retryAfter: number;  // Seconds until retry
      limit: number;       // Rate limit
      remaining: number;   // Remaining requests
    };
  };
  meta: { timestamp: string; requestId: string };
}
```

Headers:
- `Retry-After`: Seconds until retry allowed
- `X-RateLimit-Limit`: Rate limit for plan
- `X-RateLimit-Remaining`: Remaining requests

#### 429 Quota Exceeded

```typescript
{
  success: false;
  error: {
    code: 'RATE_LIMIT_EXCEEDED';
    message: 'Monthly quota exceeded...';
    retryable: false;
    metadata: {
      currentUsage: number;
      limit: number;
      plan: string;
      estimatedCost: number;
    };
  };
  meta: { timestamp: string; requestId: string };
}
```

#### 500 Internal Server Error

```typescript
{
  success: false;
  error: {
    code: 'INTERNAL_ERROR';
    message: 'An error occurred while processing your request';
    retryable: true;
  };
  meta: { timestamp: string; requestId: string };
}
```

## Usage Example

### Client-side (React)

```typescript
import { generateChatResponse, unwrapChatResponse } from '@/app/api/ai/chat/client';

async function handleFanMessage(fanId: string, message: string) {
  try {
    const response = await generateChatResponse({
      fanId,
      message,
      context: { engagementLevel: 'high' }
    });

    const data = unwrapChatResponse(response);
    
    console.log('AI Response:', data.response);
    console.log('Cost:', data.usage.totalCostUsd);
    console.log('Agents:', data.agentsInvolved);
    
    return data.response;
  } catch (error) {
    console.error('Failed to generate response:', error);
    throw error;
  }
}
```

### Server-side (API Route)

```typescript
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const { fanId, message } = await req.json();
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': req.headers.get('cookie') || '',
    },
    body: JSON.stringify({ fanId, message }),
  });

  return response;
}
```

## Rate Limits

- **Starter Plan**: 50 requests/hour
- **Pro Plan**: 100 requests/hour
- **Business Plan**: 500 requests/hour

## Monthly Quotas

- **Starter Plan**: $10/month
- **Pro Plan**: $50/month
- **Business Plan**: Unlimited

## Multi-Agent Processing

The chat endpoint uses multiple AI agents:

1. **MessagingAgent**: Generates contextual response
2. **SalesAgent**: Provides upsell suggestions (when appropriate)

Agents collaborate to provide comprehensive, conversion-optimized responses.

## Error Handling

Always check the `success` field and handle errors appropriately:

```typescript
const response = await generateChatResponse(request);

if (!response.success) {
  if (response.error.code === 'RATE_LIMIT_EXCEEDED') {
    // Handle rate limit
    const retryAfter = response.error.metadata?.retryAfter;
    console.log(`Retry after ${retryAfter} seconds`);
  } else if (response.error.code === 'QUOTA_EXCEEDED') {
    // Handle quota exceeded
    console.log('Upgrade plan required');
  } else {
    // Handle other errors
    console.error(response.error.message);
  }
}
```

## Performance

- **Average Response Time**: < 3 seconds (95th percentile)
- **Token Usage**: Varies by message complexity
- **Cost**: $0.001 - $0.05 per request (typical)

## Security

- All requests require authentication
- Rate limiting prevents abuse
- Quota enforcement ensures cost control
- All errors are logged with correlation IDs for debugging
