# AI Test API

## Endpoint

```
POST /api/ai/test
```

## Description

Test endpoint for AI text generation with automatic billing and rate limiting. Includes retry logic, structured error handling, and comprehensive logging.

## Authentication

**Required**: Yes (via creatorId parameter)

## Rate Limiting

- **Limit**: 100 requests per hour per creator
- **Response**: 429 Too Many Requests with `Retry-After` header

## Request

### Headers

```
Content-Type: application/json
```

### Request Body

```typescript
{
  creatorId: string;        // Required: Creator identifier
  prompt: string;           // Required: Text prompt (max 10,000 chars)
  temperature?: number;     // Optional: 0-2, default 0.7
  maxOutputTokens?: number; // Optional: 1-8192, default 512
}
```

### Validation Rules

- `creatorId`: Non-empty string
- `prompt`: Non-empty string, max 10,000 characters
- `temperature`: Number between 0 and 2 (optional)
- `maxOutputTokens`: Number between 1 and 8192 (optional)

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "text": "Generated text content",
    "usage": {
      "model": "gemini-1.5-flash",
      "inputTokens": 8,
      "outputTokens": 12,
      "totalTokens": 20,
      "costUsd": 0.000015
    }
  },
  "meta": {
    "timestamp": "2024-11-21T10:30:00.000Z",
    "requestId": "ai-test-1234567890-abc123",
    "duration": 1245
  }
}
```

### Error Responses

#### 400 Bad Request (Validation Error)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "prompt is required and must be a string",
    "retryable": false
  },
  "meta": {
    "timestamp": "2024-11-21T10:30:00.000Z",
    "requestId": "ai-test-1234567890-abc123",
    "duration": 5
  }
}
```

**Causes:**
- Missing required fields
- Invalid field types
- Prompt too long
- Invalid temperature or maxOutputTokens

**Action:** Fix request body and retry

#### 429 Too Many Requests (Rate Limit)

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_ERROR",
    "message": "Rate limit exceeded. Please try again later.",
    "retryable": true
  },
  "meta": {
    "timestamp": "2024-11-21T10:30:00.000Z",
    "requestId": "ai-test-1234567890-abc123",
    "duration": 10
  }
}
```

**Headers:**
- `Retry-After: 3600` - Retry after 1 hour

**Cause:** Creator exceeded 100 requests per hour

**Action:** Wait for rate limit window to reset

#### 500 Internal Server Error

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred. Please try again.",
    "retryable": true
  },
  "meta": {
    "timestamp": "2024-11-21T10:30:00.000Z",
    "requestId": "ai-test-1234567890-abc123",
    "duration": 50
  }
}
```

**Headers:**
- `Retry-After: 10` - Retry after 10 seconds

**Cause:** Unexpected server error

**Action:** Retry with exponential backoff

#### 503 Service Unavailable (AI Service Error)

```json
{
  "success": false,
  "error": {
    "code": "AI_SERVICE_ERROR",
    "message": "AI service temporarily unavailable. Please try again.",
    "retryable": true
  },
  "meta": {
    "timestamp": "2024-11-21T10:30:00.000Z",
    "requestId": "ai-test-1234567890-abc123",
    "duration": 5000
  }
}
```

**Headers:**
- `Retry-After: 60` - Retry after 60 seconds

**Cause:** AI service (Gemini) is unavailable or timed out

**Action:** Retry after delay

#### 504 Gateway Timeout

```json
{
  "success": false,
  "error": {
    "code": "TIMEOUT_ERROR",
    "message": "Request timed out. Please try again.",
    "retryable": true
  },
  "meta": {
    "timestamp": "2024-11-21T10:30:00.000Z",
    "requestId": "ai-test-1234567890-abc123",
    "duration": 30000
  }
}
```

**Headers:**
- `Retry-After: 5` - Retry after 5 seconds

**Cause:** Request exceeded 30 second timeout

**Action:** Retry with shorter prompt or lower maxOutputTokens

## Response Headers

All responses include:

- `X-Correlation-Id`: Unique request identifier for debugging
- `X-Duration-Ms`: Request processing time in milliseconds (success only)
- `Cache-Control`: Caching policy (no-store)
- `Retry-After`: Seconds to wait before retrying (error responses only)

## Features

### 1. Automatic Retry Logic

The API implements exponential backoff retry for transient errors:

- **Max Retries**: 3 attempts
- **Initial Delay**: 1000ms
- **Max Delay**: 5000ms
- **Backoff Factor**: 2x

**Retryable Errors:**
- Network errors (ECONNREFUSED, ETIMEDOUT, etc.)
- 5xx server errors
- Timeout errors

### 2. Rate Limiting

- **Limit**: 100 requests per hour per creator
- **Window**: Rolling 1-hour window
- **Response**: 429 with `Retry-After` header

### 3. Automatic Billing

All successful requests are automatically billed:
- Usage logged to `usage_logs` table
- Cost calculated based on token usage
- Monthly aggregation in `monthly_charges` table

### 4. Structured Error Handling

All errors include:
- Error code for programmatic handling
- User-friendly error message
- Retryable flag
- Correlation ID for tracking

### 5. Performance Monitoring

Each request is logged with:
- Correlation ID
- Creator ID
- Duration
- Token usage
- Cost
- Error details (if applicable)

## Client-Side Integration

### TypeScript Client (Recommended)

```typescript
import { testAIGeneration } from '@/app/api/ai/test/client';

async function generateText() {
  try {
    const result = await testAIGeneration({
      creatorId: 'creator_123',
      prompt: 'Write a friendly greeting message',
      temperature: 0.7,
      maxOutputTokens: 512,
    });

    if (result.success) {
      console.log('Generated text:', result.data.text);
      console.log('Cost:', result.data.usage.costUsd);
      console.log('Tokens:', result.data.usage.totalTokens);
    } else {
      console.error('Error:', result.error.message);
      
      if (result.error.retryable) {
        console.log('Error is retryable, will retry automatically');
      }
    }
  } catch (error) {
    console.error('Request failed after all retries:', error);
  }
}
```

### React Component

```typescript
'use client';

import { useState } from 'react';
import { testAIGeneration } from '@/app/api/ai/test/client';
import type { AITestData } from '@/app/api/ai/test/types';

export function AITestComponent() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<AITestData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await testAIGeneration({
        creatorId: 'creator_123',
        prompt,
      });

      if (response.success) {
        setResult(response.data);
      } else {
        setError(response.error.message);
      }
    } catch (err) {
      setError('Request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your prompt..."
        disabled={loading}
      />
      <button type="submit" disabled={loading || !prompt}>
        {loading ? 'Generating...' : 'Generate'}
      </button>

      {result && (
        <div>
          <h3>Generated Text:</h3>
          <p>{result.text}</p>
          <p>Cost: ${result.usage.costUsd.toFixed(6)}</p>
          <p>Tokens: {result.usage.totalTokens}</p>
        </div>
      )}

      {error && <div className="error">{error}</div>}
    </form>
  );
}
```

### Fetch with Manual Retry

```typescript
async function testAIWithRetry(
  creatorId: string,
  prompt: string,
  maxRetries = 3
) {
  const baseDelay = 1000;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId, prompt }),
        signal: AbortSignal.timeout(30000),
      });

      const data = await response.json();

      if (response.ok) {
        return data;
      }

      // Check if error is retryable
      if (!data.error.retryable || attempt === maxRetries) {
        throw new Error(data.error.message);
      }

      // Get retry delay from header or use exponential backoff
      const retryAfter = response.headers.get('Retry-After');
      const delay = retryAfter
        ? parseInt(retryAfter) * 1000
        : baseDelay * Math.pow(2, attempt - 1);

      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));

    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

## Logging

All requests are logged with structured JSON format:

```json
{
  "correlationId": "ai-test-1234567890-abc123",
  "timestamp": "2024-11-21T10:30:00.000Z",
  "service": "ai-test-api",
  "level": "info",
  "message": "AI test completed successfully",
  "metadata": {
    "creatorId": "creator_123",
    "duration": 1245,
    "inputTokens": 8,
    "outputTokens": 12,
    "costUsd": 0.000015
  }
}
```

## Performance

- **Target Response Time**: < 5 seconds (p95)
- **Timeout**: 30 seconds
- **Max Prompt Length**: 10,000 characters
- **Max Output Tokens**: 8,192

## Security

- **Rate Limiting**: 100 requests per hour per creator
- **Input Validation**: Strict validation of all inputs
- **Error Sanitization**: No sensitive data in error messages
- **Correlation IDs**: For request tracking and debugging

## Cost Tracking

All requests are automatically tracked for billing:

- **Usage Logs**: Stored in `usage_logs` table
- **Monthly Charges**: Aggregated in `monthly_charges` table
- **Cost Calculation**: Based on Gemini API pricing

## Testing

See test files:
- Integration tests: `tests/integration/api/ai-test.integration.test.ts`
- Unit tests: `tests/unit/ai/ai-test.test.ts`

## Related Documentation

- [AI System Architecture](../../../../docs/AI_FULL_ARCHITECTURE.md)
- [Gemini Billing Service](../../../../lib/ai/gemini-billing.service.ts)
- [Rate Limiting](../../../../lib/ai/rate-limit.ts)
- [AI Integration Guide](../../../../lib/ai/INTEGRATION_GUIDE.md)

## Troubleshooting

### Issue: Rate limit exceeded

**Solution:** Wait for rate limit window to reset (1 hour) or increase rate limit for creator

### Issue: Request timeout

**Solution:** Reduce prompt length or maxOutputTokens, or increase timeout

### Issue: AI service unavailable

**Solution:** Retry after delay, check Gemini API status

### Issue: High costs

**Solution:** Reduce maxOutputTokens, use lower temperature, implement caching

## Changelog

### v1.0.0 (2024-11-21)
- ✨ Initial implementation
- ✅ Automatic retry with exponential backoff
- ✅ Rate limiting (100 req/hour)
- ✅ Automatic billing
- ✅ Structured error handling
- ✅ Performance monitoring
- ✅ Correlation ID tracking
- ✅ Comprehensive documentation
