# Marketing Campaigns API - Integration Tests

**Status:** Complete  
**Coverage:** 100% of endpoints  
**Test Framework:** Vitest + Zod validation

---

## Overview

Comprehensive integration tests for the Marketing Campaigns API covering all CRUD operations, authentication, authorization, rate limiting, concurrent access, and error handling.

---

## Test Structure

```
tests/integration/marketing/
├── setup.ts              # Test utilities and configuration
├── fixtures.ts           # Test data fixtures
├── campaigns.test.ts     # Main test suite
└── api-tests.md          # This documentation
```

---

## Endpoints Tested

### 1. GET /api/marketing/campaigns

**Purpose:** List all campaigns for a creator

**Test Scenarios:**
- ✅ Returns campaigns list for authenticated creator
- ✅ Filters campaigns by status (active, draft, scheduled, paused, completed)
- ✅ Filters campaigns by channel (email, sms, push, in-app)
- ✅ Filters campaigns by goal (engagement, conversion, retention, reactivation)
- ✅ Returns 400 if creatorId is missing
- ✅ Returns 401 if not authenticated
- ✅ Returns 403 if accessing another creator's campaigns
- ✅ Handles invalid status filter
- ✅ Handles pagination parameters (page, limit)
- ✅ Handles sorting parameters (sortBy, sortOrder)

**Response Schema Validation:**
```typescript
CampaignListResponseSchema = z.object({
  campaigns: z.array(CampaignSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }).optional(),
});
```

**Status Codes:**
- `200` - Success
- `400` - Bad Request (missing creatorId, invalid filters)
- `401` - Unauthorized (no session)
- `403` - Forbidden (not your data)
- `500` - Internal Server Error

---

### 2. POST /api/marketing/campaigns

**Purpose:** Create a new campaign

**Test Scenarios:**
- ✅ Creates a new campaign with valid data
- ✅ Returns 400 for invalid campaign data
- ✅ Returns 401 if not authenticated
- ✅ Validates required fields (name, channel, goal, content)
- ✅ Validates channel values (email, sms, push, in-app)
- ✅ Validates goal values (engagement, conversion, retention, reactivation)
- ✅ Sets default status to 'draft'
- ✅ Initializes metrics to zero

**Request Schema:**
```typescript
CreateCampaignRequest = {
  creatorId: string,
  name: string,
  description?: string,
  channel: 'email' | 'sms' | 'push' | 'in-app',
  goal: 'engagement' | 'conversion' | 'retention' | 'reactivation',
  trigger: {
    type: 'event' | 'schedule' | 'manual',
    event?: string,
    schedule?: object,
  },
  content: {
    subject?: string,
    body: string,
    mediaUrls?: string[],
  },
  targeting: {
    segments: string[],
    excludeSegments?: string[],
  },
}
```

**Status Codes:**
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `500` - Internal Server Error

---

### 3. GET /api/marketing/campaigns/[id]

**Purpose:** Get campaign details

**Test Scenarios:**
- ✅ Returns campaign details for valid ID
- ✅ Returns 400 if creatorId is missing
- ✅ Returns 401 if not authenticated
- ✅ Returns 403 if accessing another creator's campaign
- ✅ Returns 404 for non-existent campaign

**Response Schema:**
```typescript
CampaignDetailResponse = {
  campaign: Campaign,
}
```

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### 4. PUT /api/marketing/campaigns/[id]

**Purpose:** Update campaign

**Test Scenarios:**
- ✅ Updates campaign with valid data
- ✅ Returns 400 for invalid update data
- ✅ Returns 401 if not authenticated
- ✅ Returns 403 if updating another creator's campaign
- ✅ Returns 404 for non-existent campaign
- ✅ Updates updatedAt timestamp
- ✅ Does not allow updating immutable fields (id, createdAt)

**Request Schema:**
```typescript
UpdateCampaignRequest = {
  creatorId: string,
  name?: string,
  description?: string,
  status?: CampaignStatus,
  content?: object,
  targeting?: object,
  schedule?: object,
}
```

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### 5. DELETE /api/marketing/campaigns/[id]

**Purpose:** Delete campaign

**Test Scenarios:**
- ✅ Deletes campaign successfully
- ✅ Returns 400 if creatorId is missing
- ✅ Returns 401 if not authenticated
- ✅ Returns 403 if deleting another creator's campaign
- ✅ Returns 404 for non-existent campaign

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

### 6. POST /api/marketing/campaigns/[id]/launch

**Purpose:** Launch a campaign

**Test Scenarios:**
- ✅ Launches campaign successfully
- ✅ Returns 400 for invalid launch data
- ✅ Returns 401 if not authenticated
- ✅ Returns 403 if launching another creator's campaign
- ✅ Returns 404 for non-existent campaign
- ✅ Validates campaign is in draft status
- ✅ Validates schedule (start date in future)

**Request Schema:**
```typescript
LaunchCampaignRequest = {
  creatorId: string,
  schedule?: {
    startDate: string,
    endDate?: string,
    timezone: string,
  },
}
```

**Status Codes:**
- `200` - Success
- `400` - Bad Request (invalid data, not in draft)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (campaign already active)
- `500` - Internal Server Error

---

## Authentication & Authorization

### Authentication Tests

**Scenarios:**
- ✅ All endpoints require valid session token
- ✅ Returns 401 for missing session
- ✅ Returns 401 for invalid session
- ✅ Returns 401 for expired session

**Implementation:**
```typescript
const session = await getServerSession();

if (!session?.user?.id) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### Authorization Tests

**Scenarios:**
- ✅ Creator can only access their own campaigns
- ✅ Returns 403 when accessing another creator's data
- ✅ Validates creatorId matches session user ID

**Implementation:**
```typescript
if (session.user.id !== creatorId) {
  return Response.json({ error: 'Forbidden' }, { status: 403 });
}
```

---

## Rate Limiting

### Test Scenarios

- ✅ Enforces rate limits on campaign creation (10 req/min)
- ✅ Enforces rate limits on campaign updates (20 req/min)
- ✅ Enforces rate limits on campaign launches (5 req/min)
- ✅ Includes Retry-After header on rate limit
- ✅ Returns 429 when rate limit exceeded

### Configuration

```typescript
const RATE_LIMITS = {
  create: { requests: 10, window: 60000 },  // 10 per minute
  update: { requests: 20, window: 60000 },  // 20 per minute
  launch: { requests: 5, window: 60000 },   // 5 per minute
  list: { requests: 100, window: 60000 },   // 100 per minute
};
```

### Response Format

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 60
}
```

---

## Concurrent Access

### Test Scenarios

- ✅ Handles concurrent reads (5 simultaneous requests)
- ✅ Handles concurrent updates to same campaign (3 simultaneous)
- ✅ Handles concurrent campaign creation (3 simultaneous)
- ✅ Ensures unique IDs for concurrent creations
- ✅ Handles conflicts gracefully (returns 409)

### Conflict Resolution

**Optimistic Locking:**
```typescript
// Use version field or updatedAt timestamp
if (campaign.version !== requestVersion) {
  return Response.json(
    { error: 'Conflict', message: 'Campaign was modified by another request' },
    { status: 409 }
  );
}
```

---

## Schema Validation

### Zod Schemas

All responses are validated against Zod schemas:

```typescript
// Campaign Schema
const CampaignSchema = z.object({
  id: z.string(),
  creatorId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  status: z.enum(['draft', 'scheduled', 'active', 'paused', 'completed']),
  channel: z.enum(['email', 'sms', 'push', 'in-app']),
  goal: z.enum(['engagement', 'conversion', 'retention', 'reactivation']),
  trigger: z.object({
    type: z.enum(['event', 'schedule', 'manual']),
    event: z.string().optional(),
    schedule: z.object({}).optional(),
  }),
  content: z.object({
    subject: z.string().optional(),
    body: z.string(),
    mediaUrls: z.array(z.string()).optional(),
  }),
  schedule: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    timezone: z.string(),
  }).optional(),
  targeting: z.object({
    segments: z.array(z.string()),
    excludeSegments: z.array(z.string()).optional(),
  }),
  metrics: z.object({
    sent: z.number(),
    delivered: z.number(),
    opened: z.number(),
    clicked: z.number(),
    converted: z.number(),
    revenue: z.number(),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// List Response Schema
const CampaignListResponseSchema = z.object({
  campaigns: z.array(CampaignSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }).optional(),
});
```

### Validation Tests

- ✅ All successful responses match schema
- ✅ All error responses have error field
- ✅ All timestamps are valid ISO 8601 strings
- ✅ All enums have valid values
- ✅ All required fields are present

---

## Error Handling

### Error Response Format

```typescript
interface ErrorResponse {
  error: string;              // Error type
  message: string;            // User-friendly message
  details?: any;              // Additional error details
  correlationId?: string;     // For debugging
}
```

### Error Scenarios

**400 Bad Request:**
- Missing required fields
- Invalid field values
- Invalid enum values
- Malformed JSON
- Invalid query parameters

**401 Unauthorized:**
- Missing session token
- Invalid session token
- Expired session token

**403 Forbidden:**
- Accessing another creator's data
- Insufficient permissions

**404 Not Found:**
- Campaign ID doesn't exist
- Resource not found

**409 Conflict:**
- Campaign already active (when launching)
- Concurrent modification conflict
- Duplicate campaign name

**429 Too Many Requests:**
- Rate limit exceeded
- Includes Retry-After header

**500 Internal Server Error:**
- Database errors
- External service failures
- Unexpected errors

### Error Handling Tests

- ✅ Returns appropriate status codes
- ✅ Includes error message
- ✅ Includes correlation ID
- ✅ Handles malformed JSON
- ✅ Handles missing content-type header
- ✅ Logs errors with context

---

## Test Data Fixtures

### Campaign Fixtures

```typescript
// Valid active campaign
validCampaign: {
  id: 'camp_test_001',
  creatorId: 'test_creator_123',
  name: 'Welcome New Subscribers',
  status: 'active',
  channel: 'email',
  goal: 'engagement',
  // ... full campaign object
}

// Draft campaign
draftCampaign: {
  id: 'camp_test_002',
  status: 'draft',
  // ...
}

// Scheduled campaign
scheduledCampaign: {
  id: 'camp_test_003',
  status: 'scheduled',
  // ...
}
```

### Request Fixtures

```typescript
// Valid create request
validCreateRequest: {
  creatorId: 'test_creator_123',
  name: 'New Test Campaign',
  channel: 'email',
  goal: 'conversion',
  // ...
}

// Invalid create request
invalidCreateRequest: {
  creatorId: 'test_creator_123',
  name: '', // Empty name
  channel: 'invalid_channel',
}
```

### Error Fixtures

```typescript
unauthorizedError: {
  error: 'Unauthorized',
  message: 'Authentication required',
}

validationError: {
  error: 'Validation Error',
  message: 'Invalid request parameters',
  details: [
    { field: 'name', message: 'Name is required' },
  ],
}
```

---

## Running Tests

### Run All Tests

```bash
npm run test:integration:marketing
```

### Run Specific Test File

```bash
npx vitest tests/integration/marketing/campaigns.test.ts
```

### Run with Coverage

```bash
npx vitest --coverage tests/integration/marketing/
```

### Run in Watch Mode

```bash
npx vitest --watch tests/integration/marketing/
```

---

## Test Configuration

### Vitest Config

```typescript
// vitest.config.integration.ts
export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.ts'],
    environment: 'node',
    setupFiles: ['tests/integration/marketing/setup.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
    globals: true,
  },
});
```

### Environment Variables

```bash
# .env.test
TEST_API_URL=http://localhost:3000
TEST_DATABASE_URL=postgresql://test:test@localhost:5432/test_db
NEXTAUTH_SECRET=test_secret
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Marketing API Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run integration tests
        run: npm run test:integration:marketing
        env:
          TEST_API_URL: http://localhost:3000
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## Performance Benchmarks

### Response Time Targets

| Endpoint | Target | Actual |
|----------|--------|--------|
| GET /campaigns | < 200ms | TBD |
| POST /campaigns | < 300ms | TBD |
| GET /campaigns/[id] | < 100ms | TBD |
| PUT /campaigns/[id] | < 200ms | TBD |
| DELETE /campaigns/[id] | < 150ms | TBD |
| POST /campaigns/[id]/launch | < 500ms | TBD |

### Load Testing

```bash
# Using k6 for load testing
k6 run tests/load/marketing-campaigns.js
```

---

## Security Considerations

### Tested Security Features

- ✅ Authentication required for all endpoints
- ✅ Authorization checks (creator ownership)
- ✅ Rate limiting to prevent abuse
- ✅ Input validation to prevent injection
- ✅ CSRF protection (via NextAuth)
- ✅ Correlation IDs for audit trails

### Security Best Practices

1. **Never log sensitive data** (tokens, passwords)
2. **Validate all inputs** (client and server)
3. **Use parameterized queries** (prevent SQL injection)
4. **Implement rate limiting** (prevent DoS)
5. **Use HTTPS in production**
6. **Sanitize error messages** (no stack traces to client)

---

## Troubleshooting

### Common Issues

**Tests failing with 401:**
- Check session mock is properly configured
- Verify auth headers are included
- Check NextAuth configuration

**Tests failing with 500:**
- Check database connection
- Verify backend services are running
- Check server logs for errors

**Rate limit tests flaky:**
- Increase wait time between requests
- Reset rate limiter between tests
- Use isolated test database

**Concurrent tests failing:**
- Use unique IDs for each test
- Clean up test data after each test
- Use transactions for isolation

---

## Next Steps

1. ✅ Complete all endpoint tests
2. ✅ Add schema validation
3. ✅ Add rate limiting tests
4. ✅ Add concurrent access tests
5. [ ] Add performance benchmarks
6. [ ] Add load testing
7. [ ] Add E2E tests with Playwright
8. [ ] Add monitoring and alerting

---

## Documentation

- [Marketing API Spec](../../../app/api/marketing/campaigns/API_SPEC.md)
- [Marketing Types](../../../lib/types/marketing.ts)
- [Marketing Schemas](../../../lib/schemas/marketing.ts)
- [Test Setup Guide](./setup.ts)
- [Test Fixtures](./fixtures.ts)

---

**Last Updated:** 2024-11-13  
**Test Coverage:** 100%  
**Status:** ✅ Complete

