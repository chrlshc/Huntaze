# Onboarding API Endpoint

## Overview

The `/api/onboarding` endpoint provides access to the Shopify-style onboarding system, allowing clients to fetch onboarding steps with user progress and update onboarding data.

**Base URL:** `/api/onboarding`  
**Authentication:** Required (JWT token)  
**Runtime:** Node.js  
**Caching:** Redis (5-minute TTL)

## Endpoints

### GET /api/onboarding

Retrieves all active onboarding steps with the current user's progress, filtered by market and role.

#### Request

**Method:** `GET`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `market` | string | No | ISO 3166-1 alpha-2 country code | `FR`, `DE`, `US` |

**Example Request:**
```bash
curl -X GET "https://api.example.com/api/onboarding?market=FR" \
  -H "Authorization: Bearer eyJhbGc..."
```

#### Response

**Success (200 OK):**

```typescript
{
  progress: number;        // Overall completion percentage (0-100)
  steps: Array<{
    id: string;           // Step identifier (e.g., "email_verification")
    version: number;      // Step version for migration support
    title: string;        // Display title
    description?: string; // Optional description
    required: boolean;    // Whether step is required
    weight: number;       // Weight for progress calculation
    status: 'todo' | 'done' | 'skipped';  // Current status
    completedAt?: string; // ISO 8601 timestamp if completed
    roleRestricted?: string; // Role required if restricted
  }>;
}
```

**Example Response:**
```json
{
  "progress": 45,
  "steps": [
    {
      "id": "email_verification",
      "version": 1,
      "title": "Vérifier votre email",
      "description": "Confirmez votre adresse email pour sécuriser votre compte",
      "required": true,
      "weight": 20,
      "status": "done",
      "completedAt": "2024-11-10T14:30:00Z"
    },
    {
      "id": "payments",
      "version": 2,
      "title": "Configurer les paiements",
      "description": "Ajoutez vos informations de paiement pour encaisser",
      "required": true,
      "weight": 30,
      "status": "todo"
    },
    {
      "id": "theme",
      "version": 1,
      "title": "Personnaliser le thème",
      "required": false,
      "weight": 15,
      "status": "skipped"
    }
  ]
}
```

**Error Responses:**

| Status | Description | Response Body |
|--------|-------------|---------------|
| 400 | Invalid market parameter | `{ "error": "Invalid market parameter. Must be a 2-letter ISO country code", "correlationId": "..." }` |
| 401 | Unauthorized | `{ "error": "Unauthorized", "correlationId": "..." }` |
| 500 | Server error | `{ "error": "Failed to fetch onboarding status", "details": "...", "correlationId": "..." }` |

#### Caching

- **Cache Key:** `onboarding:user:{userId}:market:{market}`
- **TTL:** 5 minutes (300 seconds)
- **Invalidation:** Automatic on POST requests
- **Fallback:** Database query if cache unavailable

#### Performance

- **First Request:** ~200-500ms (database query)
- **Cached Request:** ~10-50ms (Redis lookup)
- **Concurrent Requests:** Supported, no race conditions

---

### POST /api/onboarding

Updates onboarding step data for the current user.

#### Request

**Method:** `POST`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body:**

```typescript
{
  step: string;    // Step identifier (required, alphanumeric + underscore/hyphen)
  data?: object;   // Step-specific data (optional)
}
```

**Example Request:**
```bash
curl -X POST "https://api.example.com/api/onboarding" \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "step": "email_verification",
    "data": {
      "verified": true,
      "verificationMethod": "email_link"
    }
  }'
```

#### Response

**Success (200 OK):**

```json
{
  "ok": true
}
```

**Error Responses:**

| Status | Description | Response Body |
|--------|-------------|---------------|
| 400 | Missing step parameter | `{ "error": "step parameter is required and must be a string", "correlationId": "..." }` |
| 400 | Invalid step format | `{ "error": "step must contain only alphanumeric characters, underscores, and hyphens", "correlationId": "..." }` |
| 400 | Invalid JSON | `{ "error": "Invalid JSON in request body", "correlationId": "..." }` |
| 401 | Unauthorized | `{ "error": "Unauthorized", "correlationId": "..." }` |
| 500 | Server error | `{ "error": "Failed to save onboarding data", "details": "...", "correlationId": "..." }` |

#### Side Effects

1. **Cache Invalidation:** All cached onboarding data for the user is invalidated
2. **Database Update:** Step data is persisted to the database
3. **Logging:** Request is logged with correlation ID for debugging

#### Validation Rules

**Step Parameter:**
- Required
- Must be a string
- Must match pattern: `/^[a-zA-Z0-9_-]+$/`
- Examples: `email_verification`, `payments`, `theme-setup`, `product123`

**Data Parameter:**
- Optional
- Can be any valid JSON object
- Stored as-is in the database

---

## Authentication

All endpoints require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

The token must contain a valid user ID. Unauthorized requests return `401 Unauthorized`.

---

## Error Handling

### Error Response Format

All error responses follow this structure:

```typescript
{
  error: string;           // Human-readable error message
  details?: string;        // Additional error details (optional)
  correlationId?: string;  // Unique ID for request tracing (optional)
}
```

### Correlation IDs

Every request generates a unique `correlationId` (UUID v4) for tracing:

- Included in error responses
- Logged with all log entries
- Used for debugging and support

**Example:**
```json
{
  "error": "Failed to fetch onboarding status",
  "details": "Database connection timeout",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Graceful Degradation

The API is designed to degrade gracefully:

1. **Cache Failures:** Falls back to database queries
2. **Cache Invalidation Failures:** Logs warning but completes request
3. **Non-Critical Errors:** Logged but don't fail the request

---

## Market-Specific Filtering

The `market` query parameter filters steps based on market rules defined in the database:

### Supported Markets

- `FR` - France (includes `mentions_legales`, `politique_retours`)
- `DE` - Germany (includes `impressum`)
- `US` - United States
- `GB` - United Kingdom
- And more...

### Market Rules

Steps can have market-specific requirements stored in the `market_rule` JSONB field:

```json
{
  "markets": ["FR", "BE", "LU"]
}
```

If no market is specified, all non-market-specific steps are returned.

---

## Role-Based Visibility

Steps can be restricted to specific user roles:

### Roles

- `owner` - Account owner (full access)
- `staff` - Staff member (limited access)
- `admin` - Administrator (elevated access)

### Role Restrictions

Steps with `roleVisibility` array filter based on user role:

```json
{
  "id": "payments",
  "roleVisibility": ["owner"],
  "roleRestricted": "owner"  // Included in response if user lacks access
}
```

---

## Progress Calculation

Progress is calculated using weighted scoring:

```
progress = (sum of completed step weights) / (sum of required + non-skipped optional step weights) * 100
```

### Rules

1. **Required steps** always count toward total weight
2. **Optional steps** count only if not skipped
3. **Skipped optional steps** are excluded from calculation
4. **Completed steps** contribute their weight to the numerator

### Example

| Step | Weight | Required | Status | Counts? |
|------|--------|----------|--------|---------|
| Email | 20 | Yes | Done | ✅ 20/20 |
| Payments | 30 | Yes | Todo | ❌ 0/30 |
| Theme | 15 | No | Skipped | ⊘ Excluded |
| Product | 10 | No | Done | ✅ 10/10 |

**Total:** 30 / 60 = **50% progress**

---

## Logging

All requests are logged with structured metadata:

### Log Levels

- `INFO` - Normal operations (requests, cache hits/misses)
- `WARN` - Non-critical errors (cache failures)
- `ERROR` - Critical errors (database failures, auth errors)

### Log Format

```typescript
{
  context: string;           // Log context (e.g., "GET request")
  userId?: string;           // User ID if authenticated
  market?: string;           // Market parameter if provided
  correlationId: string;     // Request correlation ID
  error?: string;            // Error message if applicable
  stack?: string;            // Stack trace if error
  // ... additional metadata
}
```

### Example Logs

```
[Onboarding API] GET request { userId: "user123", market: "FR", correlationId: "..." }
[Onboarding API] Cache hit { userId: "user123", cacheKey: "onboarding:user:user123:market:FR", correlationId: "..." }
[Onboarding API] GET request completed { userId: "user123", progress: 45, stepCount: 5, correlationId: "..." }
```

---

## Rate Limiting

**Note:** Rate limiting is not currently implemented but is planned for future releases.

**Recommended Limits:**
- GET: 60 requests/minute per user
- POST: 20 requests/minute per user

---

## Testing

### Integration Tests

Integration tests are located in `tests/integration/api/onboarding.test.ts`.

**Run tests:**
```bash
npm run test:integration tests/integration/api/onboarding.test.ts
```

### Manual Testing

**Test GET endpoint:**
```bash
# With authentication
curl -X GET "http://localhost:3000/api/onboarding?market=FR" \
  -H "Authorization: Bearer <token>"

# Test cache (run twice)
curl -X GET "http://localhost:3000/api/onboarding" \
  -H "Authorization: Bearer <token>"
```

**Test POST endpoint:**
```bash
# Valid request
curl -X POST "http://localhost:3000/api/onboarding" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"step": "email_verification", "data": {"verified": true}}'

# Invalid step format
curl -X POST "http://localhost:3000/api/onboarding" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"step": "invalid step!", "data": {}}'
```

---

## Related Documentation

- [Shopify-Style Onboarding Spec](../../.kiro/specs/shopify-style-onboarding/)
- [Database Schema](../../lib/db/migrations/2024-11-11-shopify-style-onboarding.sql)
- [Repository Documentation](../../lib/db/repositories/)
- [Smart Onboarding System](../../lib/smart-onboarding/)

---

## Changelog

### 2024-11-11
- Initial implementation with GET and POST endpoints
- Added Redis caching with 5-minute TTL
- Implemented market-specific filtering
- Added role-based visibility
- Structured logging with correlation IDs
- Comprehensive error handling and validation

---

## Support

For issues or questions:
1. Check logs for correlation ID
2. Review error response details
3. Consult integration tests for examples
4. Contact platform team with correlation ID
