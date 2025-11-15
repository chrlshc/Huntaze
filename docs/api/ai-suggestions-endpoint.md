# AI Suggestions API Endpoint

## Overview

The `/api/ai/suggestions` endpoint provides AI-powered message suggestions for OnlyFans creators. It uses the enhanced AI assistant with circuit breaker protection, user memory integration, and personality calibration.

**Base URL:** `/api/ai/suggestions`  
**Authentication:** Required (JWT token)  
**Runtime:** Node.js  
**Rate Limiting:** Recommended (20 requests/minute per user)

## Endpoints

### POST /api/ai/suggestions

Generates personalized AI message suggestions based on fan context and conversation history.

#### Request

**Method:** `POST`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-Correlation-Id: <optional-uuid>  // For request tracing
```

**Body:**

```typescript
{
  fanId: string;           // Required - Fan identifier
  creatorId: string;       // Required - Creator identifier
  lastMessage?: string;    // Optional - Last message in conversation
  messageCount?: number;   // Optional - Total messages exchanged (default: 0)
  fanValueCents?: number;  // Optional - Fan lifetime value in cents (default: 0)
}
```

**Example Request:**
```bash
curl -X POST "https://api.example.com/api/ai/suggestions" \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "fanId": "fan-12345",
    "creatorId": "creator-67890",
    "lastMessage": "Hey! How are you?",
    "messageCount": 5,
    "fanValueCents": 10000
  }'
```

#### Response

**Success (200 OK):**

```typescript
{
  success: true;
  suggestions: string[];    // Array of suggested messages
  metadata: {
    count: number;          // Number of suggestions
    duration: number;       // Generation time in ms
    correlationId: string;  // Request correlation ID
  };
}
```

**Example Response:**
```json
{
  "success": true,
  "suggestions": [
    "Hey! I'm doing great, thanks for asking! 😊 How's your day going?",
    "Hi there! I'm wonderful! Just finished a photoshoot. What have you been up to?",
    "Hello! I'm doing amazing! Thanks for checking in. Want to see some new content?"
  ],
  "metadata": {
    "count": 3,
    "duration": 1250,
    "correlationId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Error Responses:**

| Status | Description | Response Body |
|--------|-------------|---------------|
| 400 | Invalid request | `{ "success": false, "error": "Missing or invalid fanId", "message": "...", "correlationId": "..." }` |
| 401 | Unauthorized | `{ "success": false, "error": "Unauthorized", "correlationId": "..." }` |
| 500 | Server error | `{ "success": false, "error": "Failed to generate suggestions", "message": "...", "correlationId": "..." }` |
| 503 | Service unavailable | `{ "success": false, "error": "Service temporarily unavailable", "message": "AI service is experiencing high load...", "correlationId": "..." }` |

#### Response Headers

- `X-Correlation-Id`: Request correlation ID for tracing
- `X-Response-Time`: Response time in milliseconds (e.g., "1250ms")
- `Cache-Control`: "no-store, must-revalidate" (responses are not cached)
- `Retry-After`: Seconds to wait before retry (only on 503 errors)

---

### GET /api/ai/suggestions

Health check endpoint that returns the status of circuit breakers.

#### Request

**Method:** `GET`

**Headers:** None required

**Example Request:**
```bash
curl -X GET "https://api.example.com/api/ai/suggestions"
```

#### Response

**Success (200 OK):**

```typescript
{
  status: 'healthy';
  circuitBreakers: {
    [key: string]: {
      state: 'closed' | 'open' | 'half-open';
      failures: number;
      successes: number;
      lastFailureTime?: number;
      nextAttemptTime?: number;
    };
  };
  timestamp: string;        // ISO 8601 timestamp
  correlationId: string;
}
```

**Example Response:**
```json
{
  "status": "healthy",
  "circuitBreakers": {
    "openai": {
      "state": "closed",
      "failures": 0,
      "successes": 150,
      "lastFailureTime": null,
      "nextAttemptTime": null
    },
    "memory": {
      "state": "closed",
      "failures": 0,
      "successes": 150,
      "lastFailureTime": null,
      "nextAttemptTime": null
    }
  },
  "timestamp": "2024-11-12T10:30:00.000Z",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Error (503 Service Unavailable):**

```json
{
  "status": "unhealthy",
  "error": "Circuit breaker open",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## Features

### Circuit Breaker Protection

The endpoint uses circuit breakers to protect against cascading failures:

- **OpenAI Circuit Breaker**: Protects OpenAI API calls
- **Memory Circuit Breaker**: Protects user memory service calls

**Circuit Breaker States:**
- `closed`: Normal operation, requests pass through
- `open`: Too many failures, requests fail fast
- `half-open`: Testing if service recovered

**Configuration:**
- Failure threshold: 5 consecutive failures
- Timeout: 30 seconds
- Reset timeout: 60 seconds

### Automatic Retry

Failed requests are automatically retried with exponential backoff:
- Max retries: 3
- Initial delay: 1 second
- Backoff factor: 2x
- Max delay: 10 seconds

### User Memory Integration

Suggestions are personalized using:
- Conversation history
- Fan preferences
- Emotional context
- Interaction patterns

### Performance Optimization

- Lazy loading of AI services
- Caching of user memory
- Parallel API calls where possible
- Graceful degradation on failures

---

## Error Handling

### Error Response Format

All error responses follow this structure:

```typescript
{
  success: false;
  error: string;           // Error type/category
  message?: string;        // Detailed error message
  correlationId: string;   // Request correlation ID
}
```

### Common Errors

#### 400 Bad Request

**Causes:**
- Missing required fields (fanId, creatorId)
- Invalid field types
- Negative values for messageCount or fanValueCents
- Malformed JSON

**Example:**
```json
{
  "success": false,
  "error": "Missing or invalid fanId",
  "message": "fanId must be a non-empty string",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### 401 Unauthorized

**Causes:**
- Missing Authorization header
- Invalid JWT token
- Expired token

**Example:**
```json
{
  "success": false,
  "error": "Unauthorized",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### 503 Service Unavailable

**Causes:**
- Circuit breaker open (too many failures)
- AI service overloaded
- Temporary service outage

**Example:**
```json
{
  "success": false,
  "error": "Service temporarily unavailable",
  "message": "AI service is experiencing high load. Please try again in a moment.",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response Headers:**
- `Retry-After: 30` (seconds to wait before retry)

---

## Usage Examples

### TypeScript Client

```typescript
interface SuggestionsRequest {
  fanId: string;
  creatorId: string;
  lastMessage?: string;
  messageCount?: number;
  fanValueCents?: number;
}

interface SuggestionsResponse {
  success: boolean;
  suggestions: string[];
  metadata: {
    count: number;
    duration: number;
    correlationId: string;
  };
}

async function generateSuggestions(
  request: SuggestionsRequest,
  authToken: string
): Promise<SuggestionsResponse> {
  const response = await fetch('/api/ai/suggestions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.error);
  }

  return response.json();
}

// Usage
try {
  const result = await generateSuggestions({
    fanId: 'fan-123',
    creatorId: 'creator-456',
    lastMessage: 'Hey!',
    messageCount: 5,
    fanValueCents: 10000,
  }, authToken);

  console.log('Suggestions:', result.suggestions);
} catch (error) {
  console.error('Failed to generate suggestions:', error);
}
```

### React Hook

```typescript
import { useState } from 'react';

interface UseSuggestionsOptions {
  fanId: string;
  creatorId: string;
  authToken: string;
}

export function useSuggestions({ fanId, creatorId, authToken }: UseSuggestionsOptions) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async (lastMessage?: string, messageCount?: number, fanValueCents?: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fanId,
          creatorId,
          lastMessage,
          messageCount,
          fanValueCents,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error);
      }

      const data = await response.json();
      setSuggestions(data.suggestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return { suggestions, loading, error, generate };
}
```

### Retry Logic

```typescript
async function generateSuggestionsWithRetry(
  request: SuggestionsRequest,
  authToken: string,
  maxRetries: number = 3
): Promise<SuggestionsResponse> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await generateSuggestions(request, authToken);
    } catch (error) {
      lastError = error as Error;

      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('400')) {
        throw error;
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries - 1) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}
```

---

## Performance Considerations

### Response Times

- **Typical:** 1-3 seconds
- **With memory lookup:** 2-4 seconds
- **Circuit breaker open:** <100ms (fail fast)

### Rate Limiting

Recommended limits:
- **Per user:** 20 requests/minute
- **Per creator:** 100 requests/minute
- **Global:** 1000 requests/minute

### Caching Strategy

- User memory: 5 minutes TTL
- Circuit breaker status: No cache
- Suggestions: No cache (always fresh)

---

## Monitoring

### Metrics

The endpoint exposes Prometheus metrics:

```
# Request count
ai_suggestions_requests_total{status="success|error"}

# Response time
ai_suggestions_duration_seconds{status="success|error"}
```

### Logging

All requests are logged with:
- User ID
- Fan ID
- Creator ID
- Duration
- Correlation ID
- Success/failure status

**Example Log:**
```
[AI Suggestions API] Generating AI suggestions {
  userId: "user-123",
  fanId: "fan-456",
  creatorId: "creator-789",
  hasLastMessage: true,
  correlationId: "550e8400-e29b-41d4-a716-446655440000"
}
```

### Alerting

Recommended alerts:
- Error rate > 5% for 5 minutes
- P95 latency > 5 seconds
- Circuit breaker open for > 2 minutes

---

## Security

### Authentication

- JWT token required in Authorization header
- Token must be valid and not expired
- User must have access to the specified creator

### Input Validation

- All inputs are validated and sanitized
- SQL injection protection
- XSS prevention
- Rate limiting to prevent abuse

### Data Privacy

- No PII in logs (except user/fan IDs)
- Correlation IDs for debugging
- GDPR compliant

---

## Related Documentation

- [OnlyFans AI Assistant Integration](./onlyfans-ai-assistant-integration.md)
- [Circuit Breaker Pattern](../circuit-breaker-pattern.md)
- [User Memory Service](./of-memory-service.md)
- [API Testing Guide](../api-tests.md)

---

## Changelog

### 2024-11-12
- Initial implementation
- Circuit breaker integration
- User memory integration
- Comprehensive error handling
- Performance optimization

---

## Support

For issues or questions:
1. Check correlation ID in response
2. Review error message details
3. Check circuit breaker status via GET endpoint
4. Contact platform team with correlation ID
