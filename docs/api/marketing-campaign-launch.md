# Marketing Campaign Launch API

## Endpoint

```
POST /api/marketing/campaigns/[id]/launch
```

Launch a marketing campaign immediately or schedule it for later.

---

## Authentication

**Required:** Yes  
**Method:** Session-based authentication

The user must be authenticated and must be the owner of the campaign (creatorId must match session.user.id).

---

## Request

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Campaign ID |

### Request Body

```typescript
{
  creatorId: string;        // Required - Creator ID (must match session user)
  scheduledFor?: string;    // Optional - ISO 8601 date string for scheduled launch
  notifyAudience?: boolean; // Optional - Send notification to audience (default: true)
}
```

### Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes | Must be `application/json` |
| `X-Correlation-ID` | No | Optional correlation ID for request tracing |

---

## Response

### Success Response (200 OK)

```typescript
{
  campaign: {
    id: string;
    status: 'active' | 'scheduled';
    launchedAt: string | null;
    scheduledFor: string | null;
    audienceSize: number;
    estimatedReach: number;
    notifyAudience: boolean;
    createdBy: string;
    updatedAt: string;
  };
  message: string;
}
```

### Response Headers

| Header | Description |
|--------|-------------|
| `X-Correlation-ID` | Correlation ID for request tracing |
| `X-Response-Time` | Response time in milliseconds |
| `Cache-Control` | Set to `no-store` (don't cache launch responses) |

---

## Error Responses

### 400 Bad Request

**Invalid request body or parameters**

```json
{
  "error": "creatorId is required",
  "type": "VALIDATION_ERROR",
  "correlationId": "mkt-launch-1234567890-abc123",
  "userMessage": "Creator ID is required."
}
```

**Common validation errors:**
- Missing `creatorId`
- Invalid JSON in request body
- Invalid `scheduledFor` date format
- `scheduledFor` date in the past
- `scheduledFor` date more than 90 days in the future

### 401 Unauthorized

**No active session**

```json
{
  "error": "Unauthorized",
  "type": "AUTHENTICATION_ERROR",
  "correlationId": "mkt-launch-1234567890-abc123",
  "userMessage": "Please log in to launch campaigns."
}
```

### 403 Forbidden

**User doesn't own the campaign**

```json
{
  "error": "Forbidden",
  "type": "PERMISSION_ERROR",
  "correlationId": "mkt-launch-1234567890-abc123",
  "userMessage": "You do not have permission to launch this campaign."
}
```

### 404 Not Found

**Campaign doesn't exist**

```json
{
  "error": "Internal server error",
  "type": "NOT_FOUND_ERROR",
  "correlationId": "mkt-launch-1234567890-abc123",
  "userMessage": "Campaign not found.",
  "retryable": false
}
```

### 409 Conflict

**Campaign already launched**

```json
{
  "error": "Internal server error",
  "type": "CONFLICT_ERROR",
  "correlationId": "mkt-launch-1234567890-abc123",
  "userMessage": "Campaign has already been launched.",
  "retryable": false
}
```

### 429 Too Many Requests

**Rate limit exceeded**

```json
{
  "error": "Internal server error",
  "type": "RATE_LIMIT_ERROR",
  "correlationId": "mkt-launch-1234567890-abc123",
  "userMessage": "Too many requests. Please try again later.",
  "retryable": false
}
```

**Response Headers:**
- `Retry-After: 60` (retry after 60 seconds)

### 500 Internal Server Error

**Server error**

```json
{
  "error": "Internal server error",
  "type": "API_ERROR",
  "correlationId": "mkt-launch-1234567890-abc123",
  "userMessage": "Failed to launch campaign. Please try again.",
  "retryable": true
}
```

---

## Examples

### Immediate Launch

**Request:**

```bash
curl -X POST https://api.huntaze.com/api/marketing/campaigns/camp_123/launch \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{
    "creatorId": "creator_456"
  }'
```

**Response:**

```json
{
  "campaign": {
    "id": "camp_123",
    "status": "active",
    "launchedAt": "2025-11-14T10:30:00.000Z",
    "scheduledFor": null,
    "audienceSize": 234,
    "estimatedReach": 210,
    "notifyAudience": true,
    "createdBy": "creator_456",
    "updatedAt": "2025-11-14T10:30:00.000Z"
  },
  "message": "Campaign launched successfully"
}
```

### Scheduled Launch

**Request:**

```bash
curl -X POST https://api.huntaze.com/api/marketing/campaigns/camp_123/launch \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{
    "creatorId": "creator_456",
    "scheduledFor": "2025-12-01T10:00:00Z",
    "notifyAudience": false
  }'
```

**Response:**

```json
{
  "campaign": {
    "id": "camp_123",
    "status": "scheduled",
    "launchedAt": null,
    "scheduledFor": "2025-12-01T10:00:00Z",
    "audienceSize": 234,
    "estimatedReach": 210,
    "notifyAudience": false,
    "createdBy": "creator_456",
    "updatedAt": "2025-11-14T10:30:00.000Z"
  },
  "message": "Campaign scheduled for 2025-12-01T10:00:00Z"
}
```

---

## Client-Side Usage

### Using the Hook

```typescript
import { useCampaignLaunch } from '@/hooks/marketing/useCampaignLaunch';

function CampaignLaunchButton({ campaignId, creatorId }) {
  const { launchCampaign, isLaunching, error } = useCampaignLaunch({
    onSuccess: (response) => {
      toast.success(response.message);
      router.push(`/campaigns/${response.campaign.id}`);
    },
    onError: (error) => {
      toast.error(error.userMessage || 'Failed to launch campaign');
    },
  });

  const handleLaunch = async () => {
    const result = await launchCampaign(campaignId, {
      creatorId,
    });
    
    if (result.success) {
      console.log('Campaign launched:', result.data);
    }
  };

  return (
    <button 
      onClick={handleLaunch} 
      disabled={isLaunching}
    >
      {isLaunching ? 'Launching...' : 'Launch Campaign'}
    </button>
  );
}
```

### Direct Fetch

```typescript
async function launchCampaign(campaignId: string, creatorId: string) {
  const correlationId = `launch-${Date.now()}`;
  
  const response = await fetch(`/api/marketing/campaigns/${campaignId}/launch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Correlation-ID': correlationId,
    },
    body: JSON.stringify({
      creatorId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.userMessage || 'Failed to launch campaign');
  }

  return await response.json();
}
```

---

## Validation Rules

### scheduledFor

- Must be a valid ISO 8601 date string
- Must be in the future (> current time)
- Cannot be more than 90 days in the future
- Examples:
  - ✅ `"2025-12-01T10:00:00Z"`
  - ✅ `"2025-11-15T14:30:00.000Z"`
  - ❌ `"2025-11-01T10:00:00Z"` (past date)
  - ❌ `"2026-03-01T10:00:00Z"` (> 90 days)
  - ❌ `"invalid-date"` (invalid format)

### notifyAudience

- Optional boolean
- Default: `true`
- When `true`, sends notification to audience when campaign launches
- When `false`, launches silently

---

## Performance

### Response Times

| Scenario | Average | P95 | P99 |
|----------|---------|-----|-----|
| Immediate launch | < 200ms | < 500ms | < 1000ms |
| Scheduled launch | < 150ms | < 300ms | < 600ms |
| With retry | < 500ms | < 1500ms | < 3000ms |

### Rate Limits

- **Per user:** 10 launches per minute
- **Per campaign:** 1 launch per campaign (cannot re-launch)
- **Global:** 1000 launches per minute

### Retry Strategy

The client-side hook implements automatic retry with exponential backoff:

1. **First attempt:** Immediate
2. **Second attempt:** After 1 second
3. **Third attempt:** After 2 seconds
4. **Max retries:** 3 attempts

**Retryable errors:**
- Network errors
- Server errors (5xx)
- Rate limit errors (429)

**Non-retryable errors:**
- Validation errors (400)
- Authentication errors (401)
- Permission errors (403)
- Not found errors (404)
- Conflict errors (409)

---

## Monitoring

### Correlation IDs

Every request generates or accepts a correlation ID for tracing:

```
X-Correlation-ID: mkt-launch-1736159823400-abc123
```

Use this ID to:
- Trace requests across services
- Debug issues in production
- Correlate logs and metrics

### Logging

All requests are logged with:
- Correlation ID
- Campaign ID
- Creator ID
- Scheduled date (if applicable)
- Response time
- Success/failure status

**Example log:**

```json
{
  "level": "info",
  "message": "Campaign launch success",
  "creatorId": "creator_456",
  "campaignId": "camp_123",
  "status": "active",
  "audienceSize": 234,
  "isScheduled": false,
  "duration": 245,
  "correlationId": "mkt-launch-1736159823400-abc123",
  "timestamp": "2025-11-14T10:30:00.000Z"
}
```

---

## Security

### Authentication

- Session-based authentication required
- User must be logged in
- Session must be valid and not expired

### Authorization

- User must own the campaign (creatorId must match session.user.id)
- Cannot launch campaigns for other users

### Input Validation

- All inputs are validated before processing
- SQL injection protection (parameterized queries)
- XSS protection (sanitized inputs)
- CSRF protection (session-based)

### Rate Limiting

- Per-user rate limits enforced
- Per-campaign limits enforced
- Global rate limits enforced

---

## Best Practices

### Client-Side

1. **Use the hook:** Prefer `useCampaignLaunch` over direct fetch
2. **Handle errors:** Always handle error states
3. **Show loading:** Display loading state during launch
4. **Disable button:** Prevent double-click during launch
5. **Validate dates:** Validate scheduled dates before sending

### Server-Side

1. **Use correlation IDs:** Always include correlation ID in requests
2. **Implement retry:** Use exponential backoff for retries
3. **Handle timeouts:** Set appropriate request timeouts
4. **Log errors:** Log all errors with context
5. **Monitor metrics:** Track success/failure rates

---

## Troubleshooting

### Common Issues

**Issue:** "Campaign has already been launched"
- **Cause:** Attempting to re-launch an already active campaign
- **Solution:** Check campaign status before launching

**Issue:** "scheduledFor must be in the future"
- **Cause:** Scheduled date is in the past
- **Solution:** Validate date is in the future before sending

**Issue:** "Rate limit exceeded"
- **Cause:** Too many launch requests
- **Solution:** Wait 60 seconds and retry

**Issue:** "Network error"
- **Cause:** Connection issue or server down
- **Solution:** Check network connection and retry

### Debug Checklist

1. ✅ Check authentication (session valid?)
2. ✅ Check authorization (correct creatorId?)
3. ✅ Check campaign exists (valid campaignId?)
4. ✅ Check campaign status (not already launched?)
5. ✅ Check scheduled date (valid and in future?)
6. ✅ Check rate limits (not exceeded?)
7. ✅ Check correlation ID (in logs?)

---

## Related Endpoints

- `GET /api/marketing/campaigns` - List campaigns
- `POST /api/marketing/campaigns` - Create campaign
- `GET /api/marketing/campaigns/[id]` - Get campaign details
- `PUT /api/marketing/campaigns/[id]` - Update campaign
- `DELETE /api/marketing/campaigns/[id]` - Delete campaign

---

**Version:** 1.0.0  
**Last Updated:** November 14, 2025  
**Status:** ✅ Production Ready
