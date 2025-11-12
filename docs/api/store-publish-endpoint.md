# Store Publish API Endpoint

## Overview

The `/api/store/publish` endpoint allows authenticated users to publish their store and make it publicly accessible. This is a **critical financial operation** that requires payment configuration to be completed before publishing.

## Endpoint Details

- **URL**: `/api/store/publish`
- **Method**: `POST`
- **Authentication**: Required (Bearer token)
- **Runtime**: Node.js
- **Gating**: Requires `payments` step completion
- **Criticality**: CRITICAL (fails closed on errors)

## Request

### Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes | Bearer token for authentication |
| `Content-Type` | No | `application/json` (if sending body) |

### Request Body

Optional JSON body with the following fields:

```typescript
{
  confirmPublish?: boolean;      // Explicit confirmation (default: false)
  notifyCustomers?: boolean;     // Send notification emails (default: false)
}
```

#### Request Body Schema

```typescript
interface PublishRequest {
  confirmPublish?: boolean;
  notifyCustomers?: boolean;
}
```

### Example Request

```bash
curl -X POST https://api.huntaze.com/api/store/publish \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "confirmPublish": true,
    "notifyCustomers": false
  }'
```

## Response

### Success Response (200 OK)

```typescript
{
  success: true;
  message: string;
  storeUrl: string;
  publishedAt: string;        // ISO 8601 datetime
  correlationId: string;      // UUID for request tracing
}
```

#### Example Success Response

```json
{
  "success": true,
  "message": "Boutique publiée avec succès",
  "storeUrl": "https://user123.huntaze.com",
  "publishedAt": "2024-11-11T10:30:00.000Z",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Gating Response (409 Conflict)

Returned when the user hasn't completed required prerequisites (payment configuration).

```typescript
{
  error: 'PRECONDITION_REQUIRED';
  message: string;
  missingStep: string;
  action: {
    type: 'open_modal' | 'redirect';
    modal?: string;
    url?: string;
    prefill?: Record<string, any>;
  };
  correlationId: string;
}
```

#### Example Gating Response

```json
{
  "error": "PRECONDITION_REQUIRED",
  "message": "Vous devez configurer les paiements avant de publier votre boutique",
  "missingStep": "payments",
  "action": {
    "type": "open_modal",
    "modal": "payments_setup",
    "prefill": {
      "returnUrl": "/api/store/publish",
      "userId": "user123"
    }
  },
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Error Responses

#### 400 Bad Request

Invalid request body or malformed JSON.

```json
{
  "error": "Invalid request body",
  "details": "confirmPublish: Expected boolean, received string",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### 401 Unauthorized

Missing or invalid authentication token.

```json
{
  "error": "Unauthorized",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### 404 Not Found

Store not found for the authenticated user.

```json
{
  "error": "Store not found",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### 409 Conflict (Already Published)

Store is already published.

```json
{
  "error": "Store already published",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### 500 Internal Server Error

Server-side error during publishing.

```json
{
  "error": "Failed to publish store",
  "details": "Database connection timeout",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### 503 Service Unavailable

Gating check failed (critical route, fails closed).

```json
{
  "error": "PRECONDITION_REQUIRED",
  "message": "Impossible de vérifier les prérequis. Veuillez réessayer.",
  "missingStep": "payments",
  "action": {
    "type": "redirect",
    "url": "/onboarding"
  },
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

## Status Codes

| Code | Description |
|------|-------------|
| 200 | Store published successfully |
| 400 | Invalid request body or malformed JSON |
| 401 | Unauthorized (missing or invalid token) |
| 404 | Store not found |
| 405 | Method not allowed (only POST is supported) |
| 409 | Conflict (gating check failed or already published) |
| 500 | Internal server error |
| 503 | Service unavailable (gating check failed on critical route) |

## Gating Middleware

This endpoint uses the **onboarding gating middleware** to enforce prerequisites.

### Required Step

- **Step ID**: `payments`
- **Description**: User must complete payment configuration
- **Criticality**: CRITICAL (fails closed on errors)

### Gating Behavior

1. **Check**: Verifies user has completed `payments` step
2. **Pass**: Allows publishing if step is complete
3. **Block**: Returns 409 with guidance if step is incomplete
4. **Fail Closed**: Returns 503 if gating check fails (critical route)

### Gating Event Tracking

When gating blocks a request, an analytics event is logged:

```typescript
{
  eventType: 'gating.blocked',
  userId: string,
  stepId: 'payments',
  metadata: {
    route: '/api/store/publish',
    isCritical: true
  },
  correlationId: string
}
```

## Retry Logic

The endpoint implements **exponential backoff retry** for transient failures:

- **Max Attempts**: 3
- **Initial Delay**: 1000ms
- **Max Delay**: 5000ms
- **Backoff Factor**: 2x

### Retry Behavior

```
Attempt 1: Immediate
Attempt 2: Wait 1000ms
Attempt 3: Wait 2000ms
```

If all attempts fail, returns 500 error.

## Performance Characteristics

- **First Request**: < 5 seconds (includes gating check, validation, publishing)
- **Retry Overhead**: +1-5 seconds (if retries needed)
- **Concurrent Requests**: Supported (unique correlation IDs)

## Security Considerations

### Authentication

- Requires valid Bearer token
- Token validated via `requireUser()` middleware
- Returns 401 if authentication fails

### Authorization

- User can only publish their own store
- No cross-user publishing allowed

### Input Validation

- Request body validated with Zod schema
- Strict schema (no extra fields allowed)
- Type checking for all fields

### Rate Limiting

- Standard API rate limits apply
- Consider implementing specific rate limit for publishing

## Logging

All requests are logged with structured logging:

### Success Log

```typescript
{
  context: 'Store published successfully',
  userId: string,
  storeUrl: string,
  duration: number,
  correlationId: string
}
```

### Error Log

```typescript
{
  context: 'Failed to publish store',
  error: string,
  stack: string,
  duration: number,
  correlationId: string
}
```

### Gating Log

```typescript
{
  context: 'Gating check blocked',
  userId: string,
  requiredStep: 'payments',
  correlationId: string
}
```

## Client Integration

### JavaScript/TypeScript

```typescript
interface PublishStoreResponse {
  success: true;
  message: string;
  storeUrl: string;
  publishedAt: string;
  correlationId: string;
}

interface PublishStoreError {
  error: string;
  details?: string;
  correlationId: string;
}

async function publishStore(
  token: string,
  options?: {
    confirmPublish?: boolean;
    notifyCustomers?: boolean;
  }
): Promise<PublishStoreResponse> {
  const response = await fetch('/api/store/publish', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options || {}),
  });

  if (!response.ok) {
    const error: PublishStoreError = await response.json();
    throw new Error(error.details || error.error);
  }

  return response.json();
}

// Usage
try {
  const result = await publishStore(userToken, {
    confirmPublish: true,
    notifyCustomers: false,
  });
  
  console.log('Store published:', result.storeUrl);
} catch (error) {
  console.error('Failed to publish:', error.message);
}
```

### React Hook

```typescript
import { useState } from 'react';

interface UsePublishStoreOptions {
  onSuccess?: (data: PublishStoreResponse) => void;
  onError?: (error: Error) => void;
}

function usePublishStore(options?: UsePublishStoreOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const publish = async (publishOptions?: {
    confirmPublish?: boolean;
    notifyCustomers?: boolean;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken(); // Your auth token getter
      const result = await publishStore(token, publishOptions);
      
      options?.onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      options?.onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { publish, loading, error };
}

// Usage in component
function PublishButton() {
  const { publish, loading, error } = usePublishStore({
    onSuccess: (data) => {
      toast.success(`Store published: ${data.storeUrl}`);
    },
    onError: (error) => {
      toast.error(`Failed to publish: ${error.message}`);
    },
  });

  return (
    <button
      onClick={() => publish({ confirmPublish: true })}
      disabled={loading}
    >
      {loading ? 'Publishing...' : 'Publish Store'}
    </button>
  );
}
```

## Testing

### Integration Tests

See `tests/integration/api/store-publish.test.ts` for comprehensive test suite.

### Manual Testing

```bash
# Test with valid authentication
curl -X POST http://localhost:3000/api/store/publish \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"confirmPublish": true}'

# Test without authentication (should return 401)
curl -X POST http://localhost:3000/api/store/publish

# Test with invalid body (should return 400)
curl -X POST http://localhost:3000/api/store/publish \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"invalid": "field"}'
```

## Related Endpoints

- `GET /api/onboarding` - Check onboarding status
- `PATCH /api/onboarding/steps/:id` - Complete onboarding steps
- `POST /api/checkout/process` - Process payments (also gated)
- `GET /api/store/status` - Check store publication status

## Related Documentation

- [Onboarding Gating Middleware](./gated-routes.md)
- [Shopify-Style Onboarding Spec](../.kiro/specs/shopify-style-onboarding/)
- [API Integration Tests](../tests/integration/api/README.md)

## Changelog

### 2024-11-11

- Initial implementation
- Added gating middleware integration
- Added retry logic with exponential backoff
- Added comprehensive error handling
- Added request body validation with Zod
- Added structured logging
- Added TypeScript types
- Added integration tests
- Added API documentation

## Support

For issues or questions:
1. Check [API Integration Tests](../tests/integration/api/README.md)
2. Review [Gated Routes Documentation](./gated-routes.md)
3. Contact Platform team
4. Create GitHub issue with `api` label
