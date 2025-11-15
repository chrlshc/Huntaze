# AI Suggestions API Integration Tests

Comprehensive integration tests for the `/api/ai/suggestions` endpoint.

## Overview

The AI Suggestions endpoint generates personalized message suggestions for OnlyFans creators using AI-powered analysis of fan interactions, preferences, and conversation context.

## Test Coverage

### HTTP Status Codes
- ✅ 200 OK - Successful suggestion generation
- ✅ 400 Bad Request - Missing required fields
- ✅ 401 Unauthorized - No authentication
- ✅ 403 Forbidden - Invalid token
- ✅ 405 Method Not Allowed - Wrong HTTP method
- ✅ 429 Too Many Requests - Rate limiting
- ✅ 500 Internal Server Error - Service failure
- ✅ 503 Service Unavailable - Circuit breaker open

### Request Validation
- ✅ Required fields (fanId, creatorId)
- ✅ Optional fields (lastMessage, messageCount, fanValueCents)
- ✅ Empty request body
- ✅ Malformed JSON
- ✅ Very long messages (>10k chars)
- ✅ Negative values
- ✅ Special characters and emojis
- ✅ XSS attempts
- ✅ SQL injection attempts

### Response Validation
- ✅ Success response schema (Zod)
- ✅ Error response schema (Zod)
- ✅ Health check response schema (Zod)
- ✅ Correlation ID in headers
- ✅ Response time in headers
- ✅ Suggestion structure (text, tone, confidence)
- ✅ Metadata (count, duration, correlationId)

### Performance
- ✅ Response time < 5s (target: < 2s)
- ✅ Consistent performance across requests
- ✅ Duration included in response metadata
- ✅ Concurrent request handling (10+ requests)

### Security
- ✅ Authentication required
- ✅ Authorization validation
- ✅ XSS sanitization
- ✅ SQL injection protection
- ✅ No sensitive data in errors
- ✅ Secure headers

### Circuit Breaker
- ✅ Health check endpoint
- ✅ Circuit breaker status reporting
- ✅ Graceful degradation
- ✅ State transitions (closed/open/half-open)

### Rate Limiting
- ✅ Excessive request handling
- ✅ Rate limit headers
- ✅ 429 responses
- ✅ Service stability under load

## Running Tests

### Prerequisites

```bash
# Start the development server
npm run dev

# Or start production build
npm run build && npm start
```

### Run All AI Suggestions Tests

```bash
# Run specific test file
npm run test:integration tests/integration/api/ai-suggestions.test.ts

# Run with coverage
npm run test:integration -- --coverage tests/integration/api/ai-suggestions.test.ts

# Run in watch mode
npm run test:integration -- --watch tests/integration/api/ai-suggestions.test.ts
```

### Run Specific Test Suites

```bash
# Run only POST tests
npm run test:integration -- --grep "POST - Generate Suggestions"

# Run only health check tests
npm run test:integration -- --grep "GET - Health Check"

# Run only security tests
npm run test:integration -- --grep "Security"

# Run only performance tests
npm run test:integration -- --grep "Performance"
```

## Test Scenarios

### 1. Successful Suggestion Generation

```typescript
POST /api/ai/suggestions
Authorization: Bearer <token>
Content-Type: application/json

{
  "fanId": "fan-123",
  "creatorId": "creator-456",
  "lastMessage": "Hey, how are you?",
  "messageCount": 10,
  "fanValueCents": 5000
}

Response: 200 OK
{
  "success": true,
  "suggestions": [
    {
      "text": "Hey! I'm doing great...",
      "tone": "friendly",
      "confidence": 0.92
    }
  ],
  "metadata": {
    "count": 3,
    "duration": 1234,
    "correlationId": "req-1234567890-abc123def"
  }
}
```

### 2. Missing Required Fields

```typescript
POST /api/ai/suggestions
Authorization: Bearer <token>
Content-Type: application/json

{
  "creatorId": "creator-456"
  // Missing fanId
}

Response: 400 Bad Request
{
  "error": "Missing required fields",
  "details": "fanId and creatorId are required"
}
```

### 3. Health Check

```typescript
GET /api/ai/suggestions

Response: 200 OK
{
  "status": "healthy",
  "circuitBreakers": {
    "emotionAnalyzer": { "state": "closed", "failures": 0 },
    "preferenceEngine": { "state": "closed", "failures": 0 },
    "personalityCalibrator": { "state": "closed", "failures": 0 }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 4. Rate Limiting

```typescript
// After 100 requests in 1 minute
POST /api/ai/suggestions
Authorization: Bearer <token>

Response: 429 Too Many Requests
{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

## Fixtures

Test fixtures are available in `fixtures/ai-suggestions-samples.ts`:

```typescript
import {
  validSuggestionRequest,
  minimalSuggestionRequest,
  highValueFanRequest,
  newFanRequest,
  invalidRequests,
  edgeCaseRequests,
  mockSuggestions,
  circuitBreakerStates,
} from './fixtures/ai-suggestions-samples'
```

### Example Usage

```typescript
it('should handle high-value fan request', async () => {
  const response = await fetch(`${BASE_URL}/api/ai/suggestions`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer test-token',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(highValueFanRequest)
  })
  
  expect(response.ok).toBe(true)
})
```

## Performance Benchmarks

| Scenario | Max Duration | Target | Notes |
|----------|--------------|--------|-------|
| First request | 5000ms | 2000ms | Includes AI processing |
| Subsequent requests | 3000ms | 1500ms | With caching |
| Concurrent (10 req) | 10000ms | 5000ms | Parallel processing |
| Health check | 500ms | 100ms | Simple status check |

## Security Test Cases

### XSS Attempts
```typescript
const xssAttempts = [
  '<script>alert("xss")</script>',
  '<img src=x onerror=alert(1)>',
  'javascript:alert(1)',
  '<svg onload=alert(1)>'
]
```

### SQL Injection Attempts
```typescript
const sqlInjectionAttempts = [
  "'; DROP TABLE users; --",
  "' OR '1'='1",
  "admin'--",
  "1' UNION SELECT * FROM users--"
]
```

## Circuit Breaker States

The endpoint integrates with circuit breakers for:
- **Emotion Analyzer**: Analyzes fan message sentiment
- **Preference Engine**: Learns fan preferences
- **Personality Calibrator**: Adjusts tone and style

### States
- **Closed**: Normal operation, all requests pass through
- **Open**: Service unavailable, requests fail fast
- **Half-Open**: Testing if service recovered

### Testing Circuit Breakers

```typescript
// Check circuit breaker status
GET /api/ai/suggestions

// Trigger circuit breaker (simulate failures)
POST /api/ai/suggestions
Body: { fanId: "fan-trigger-error", creatorId: "creator-error" }

// Verify circuit breaker opened
GET /api/ai/suggestions
// Should show "open" state for failed service
```

## Troubleshooting

### Test Failures

**Issue**: Tests fail with 401 Unauthorized

**Solution**: Ensure authentication is properly mocked or use valid test tokens:
```typescript
headers: {
  'Authorization': 'Bearer test-token-valid'
}
```

---

**Issue**: Tests timeout

**Solution**: Increase timeout for AI processing:
```typescript
it('should generate suggestions', async () => {
  // ...
}, 10000) // 10 second timeout
```

---

**Issue**: Rate limit errors

**Solution**: Add delays between test runs:
```typescript
afterEach(async () => {
  await new Promise(resolve => setTimeout(resolve, 100))
})
```

### Performance Issues

If tests are slow:
1. Check if AI services are running
2. Verify circuit breakers are closed
3. Check for network latency
4. Review caching configuration

### Flaky Tests

If tests fail intermittently:
1. Add retry logic for network requests
2. Increase wait times for async operations
3. Ensure test isolation (no shared state)
4. Check for race conditions in concurrent tests

## Related Documentation

- [AI Suggestions API Documentation](../../../docs/api/ai-suggestions-endpoint.md)
- [OnlyFans AI Assistant Integration](../../../docs/api/onlyfans-ai-assistant-integration.md)
- [Circuit Breaker Pattern](../../../docs/circuit-breaker-pattern.md)
- [API Tests Documentation](../../../docs/api-tests.md)
- [Test Utilities](./helpers/test-utils.ts)

## Contributing

When adding new tests:

1. Follow existing test structure
2. Use fixtures for test data
3. Test all HTTP status codes
4. Validate response schemas with Zod
5. Test error handling and edge cases
6. Include performance benchmarks
7. Test concurrent access patterns
8. Document new scenarios in this README

## Maintenance

### Regular Tasks

- [ ] Review and update performance benchmarks monthly
- [ ] Update fixtures when API contracts change
- [ ] Monitor test execution time
- [ ] Track and reduce test flakiness
- [ ] Update security test cases
- [ ] Verify circuit breaker integration

### Metrics to Track

- Test execution time
- Test flakiness rate
- Code coverage percentage
- Number of test scenarios
- Performance benchmark trends

---

**Last Updated**: 2024-01-15  
**Test Count**: 50+ scenarios  
**Coverage**: 95%+  
**Status**: ✅ All tests passing
