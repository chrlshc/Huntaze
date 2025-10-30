# Dashboard Metrics API

## Overview

The Dashboard Metrics API provides aggregated metrics for the user's dashboard, including revenue, messages, campaigns, and engagement statistics.

**Endpoint**: `GET /api/dashboard/metrics`  
**Authentication**: Required (Session-based)  
**Runtime**: Node.js

---

## Request

### Headers

```http
Cookie: next-auth.session-token=<session-token>
```

### Query Parameters

None

---

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "revenue": {
      "total": 45000,
      "change": 12.5,
      "changeType": "increase",
      "formatted": "$45,000"
    },
    "messages": {
      "sent": 1250,
      "change": 8.3,
      "changeType": "increase"
    },
    "campaigns": {
      "active": 5,
      "total": 23,
      "change": 0,
      "changeType": "increase"
    },
    "engagement": {
      "rate": 68,
      "change": 5.4,
      "changeType": "increase"
    }
  }
}
```

### Response Fields

#### Revenue Object
- `total` (number): Total revenue in cents for the last 30 days
- `change` (number): Percentage change compared to previous 30 days
- `changeType` (string): Either "increase" or "decrease"
- `formatted` (string): Formatted currency string (USD)

#### Messages Object
- `sent` (number): Total messages sent in the last 30 days
- `change` (number): Percentage change compared to previous 30 days
- `changeType` (string): Either "increase" or "decrease"

#### Campaigns Object
- `active` (number): Number of currently active campaigns
- `total` (number): Total number of campaigns (all time)
- `change` (number): Percentage change in active campaigns
- `changeType` (string): Either "increase" or "decrease"

#### Engagement Object
- `rate` (number): Engagement rate percentage (0-100)
- `change` (number): Percentage point change in engagement rate
- `changeType` (string): Either "increase" or "decrease"

---

## Error Responses

### 401 Unauthorized

Returned when the user is not authenticated.

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

### 500 Internal Server Error

Returned when an unexpected error occurs.

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to fetch dashboard metrics"
  }
}
```

---

## Examples

### cURL

```bash
curl -X GET https://app.huntaze.com/api/dashboard/metrics \
  -H "Cookie: next-auth.session-token=your-session-token"
```

### JavaScript (Fetch)

```javascript
const response = await fetch('/api/dashboard/metrics', {
  method: 'GET',
  credentials: 'include', // Include cookies
});

const data = await response.json();

if (data.success) {
  console.log('Revenue:', data.data.revenue.formatted);
  console.log('Messages sent:', data.data.messages.sent);
  console.log('Active campaigns:', data.data.campaigns.active);
  console.log('Engagement rate:', data.data.engagement.rate + '%');
}
```

### TypeScript (with API Client)

```typescript
import { apiClient } from '@/lib/api-client';

interface DashboardMetrics {
  revenue: {
    total: number;
    change: number;
    changeType: 'increase' | 'decrease';
    formatted: string;
  };
  messages: {
    sent: number;
    change: number;
    changeType: 'increase' | 'decrease';
  };
  campaigns: {
    active: number;
    total: number;
    change: number;
    changeType: 'increase' | 'decrease';
  };
  engagement: {
    rate: number;
    change: number;
    changeType: 'increase' | 'decrease';
  };
}

const metrics = await apiClient.get<DashboardMetrics>('/dashboard/metrics');
```

---

## Data Sources

### Revenue
- **Source**: `Transaction` model
- **Filter**: Last 30 days, status = 'completed'
- **Comparison**: Previous 30 days (30-60 days ago)

### Messages
- **Source**: `Message` model
- **Filter**: Last 30 days
- **Comparison**: Previous 30 days (30-60 days ago)

### Campaigns
- **Source**: `Campaign` model
- **Active**: status = 'active'
- **Total**: All campaigns for user

### Engagement
- **Source**: Calculated metric (placeholder)
- **Note**: Currently returns mock data (68% rate, 5.4% change)

---

## Performance

- **Average Response Time**: < 200ms
- **Database Queries**: 6 parallel queries
- **Caching**: Not implemented (consider Redis for high-traffic users)

---

## Rate Limiting

No specific rate limiting applied. Uses default Next.js API route limits.

---

## Changelog

### 2025-10-30
- Initial implementation
- Added revenue, messages, campaigns, and engagement metrics
- Implemented 30-day comparison periods

---

## Related Endpoints

- `GET /api/dashboard/activity` - Recent activity feed
- `GET /api/dashboard/revenue` - Detailed revenue breakdown
- `GET /api/campaigns` - Campaign management

---

## Notes

- Engagement rate is currently a placeholder (68%) and needs real calculation
- Consider adding caching for frequently accessed metrics
- Future: Add date range parameters for custom periods
- Future: Add granular breakdown (daily, weekly, monthly)
