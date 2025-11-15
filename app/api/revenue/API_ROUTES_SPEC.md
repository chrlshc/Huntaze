# Revenue Optimization API Routes - Specification

**Status:** Ready to Implement  
**Backend Services:** Already implemented  
**Client Services:** Already implemented

---

## Overview

This document specifies the 15 API routes needed for the Revenue Optimization feature. All backend services and client-side code are already implemented. These routes act as the bridge between them.

---

## Authentication

All routes require authentication via NextAuth session:

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const session = await getServerSession(authOptions);
if (!session) {
  return new Response('Unauthorized', { status: 401 });
}
```

---

## Routes to Implement

### 1. Pricing Routes

#### GET /api/revenue/pricing

Get pricing recommendations for a creator.

**Query Parameters:**
- `creatorId` (required): string

**Response:** `PricingRecommendation`
```json
{
  "subscription": {
    "current": 9.99,
    "recommended": 12.99,
    "revenueImpact": 30,
    "reasoning": "High demand, low churn",
    "confidence": 0.85
  },
  "ppv": [
    {
      "contentId": "content_123",
      "contentType": "video",
      "recommendedRange": { "min": 25, "max": 35 },
      "expectedRevenue": { "min": 2500, "max": 3500 }
    }
  ],
  "metadata": {
    "lastUpdated": "2024-11-12T10:30:00Z",
    "dataPoints": 1234
  }
}
```

**Implementation:**
```typescript
// app/api/revenue/pricing/route.ts
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
// Import your backend pricing service here

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const creatorId = searchParams.get('creatorId');

  if (!creatorId) {
    return Response.json({ error: 'creatorId required' }, { status: 400 });
  }

  if (session.user.id !== creatorId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Call your backend pricing service
    const recommendations = await backendPricingService.getRecommendations(creatorId);
    return Response.json(recommendations);
  } catch (error) {
    console.error('[API] Pricing error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

#### POST /api/revenue/pricing/apply

Apply a pricing change.

**Body:** `ApplyPricingRequest`
```json
{
  "creatorId": "creator_123",
  "priceType": "subscription",
  "contentId": "content_123",
  "newPrice": 12.99
}
```

**Response:**
```json
{
  "success": true
}
```

---

### 2. Churn Routes

#### GET /api/revenue/churn

Get churn risk analysis.

**Query Parameters:**
- `creatorId` (required): string
- `riskLevel` (optional): 'high' | 'medium' | 'low'

**Response:** `ChurnRiskResponse`
```json
{
  "summary": {
    "totalAtRisk": 23,
    "highRisk": 7,
    "mediumRisk": 10,
    "lowRisk": 6
  },
  "fans": [
    {
      "id": "fan_123",
      "name": "Sarah M.",
      "avatar": "https://...",
      "churnProbability": 0.95,
      "daysSinceLastActivity": 25,
      "riskLevel": "high",
      "lifetimeValue": 15000,
      "lastMessage": "Thanks!"
    }
  ],
  "metadata": {
    "lastCalculated": "2024-11-12T10:30:00Z",
    "modelVersion": "v2.1"
  }
}
```

#### POST /api/revenue/churn/reengage

Send re-engagement message to a fan.

**Body:** `ReEngageRequest`
```json
{
  "creatorId": "creator_123",
  "fanId": "fan_456",
  "messageTemplate": "Hey! Missing you..."
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "msg_789"
}
```

#### POST /api/revenue/churn/bulk-reengage

Bulk re-engage multiple fans.

**Body:**
```json
{
  "creatorId": "creator_123",
  "fanIds": ["fan_1", "fan_2", "fan_3"],
  "messageTemplate": "Hey! Missing you..."
}
```

**Response:**
```json
{
  "success": true,
  "sent": 3,
  "failed": 0
}
```

---

### 3. Upsell Routes

#### GET /api/revenue/upsells

Get upsell opportunities.

**Query Parameters:**
- `creatorId` (required): string

**Response:** `UpsellOpportunitiesResponse`
```json
{
  "opportunities": [
    {
      "id": "opp_123",
      "fanId": "fan_456",
      "fanName": "Sarah M.",
      "triggerPurchase": {
        "item": "Beach Photos",
        "amount": 25,
        "date": "2024-11-10T14:30:00Z"
      },
      "suggestedProduct": {
        "name": "Beach Video",
        "price": 49.99,
        "description": "Exclusive beach content"
      },
      "buyRate": 0.78,
      "expectedRevenue": 38.99,
      "confidence": 0.85,
      "messagePreview": "Loved the photos? Check out the video!"
    }
  ],
  "stats": {
    "totalOpportunities": 15,
    "expectedRevenue": 584.85,
    "averageBuyRate": 0.72
  },
  "metadata": {
    "lastUpdated": "2024-11-12T10:30:00Z"
  }
}
```

#### POST /api/revenue/upsells/send

Send an upsell message.

**Body:** `SendUpsellRequest`
```json
{
  "creatorId": "creator_123",
  "opportunityId": "opp_789",
  "customMessage": "Check this out!"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "msg_101"
}
```

#### POST /api/revenue/upsells/dismiss

Dismiss an upsell opportunity.

**Body:**
```json
{
  "creatorId": "creator_123",
  "opportunityId": "opp_789"
}
```

**Response:**
```json
{
  "success": true
}
```

#### GET /api/revenue/upsells/automation

Get automation settings.

**Query Parameters:**
- `creatorId` (required): string

**Response:** `AutomationSettings`
```json
{
  "enabled": true,
  "autoSendThreshold": 0.8,
  "maxDailyUpsells": 10,
  "excludedFans": ["fan_1", "fan_2"],
  "customRules": []
}
```

#### POST /api/revenue/upsells/automation

Update automation settings.

**Body:**
```json
{
  "creatorId": "creator_123",
  "enabled": true,
  "autoSendThreshold": 0.8,
  "maxDailyUpsells": 10,
  "excludedFans": [],
  "customRules": []
}
```

**Response:**
```json
{
  "success": true
}
```

---

### 4. Forecast Routes

#### GET /api/revenue/forecast

Get revenue forecast.

**Query Parameters:**
- `creatorId` (required): string
- `months` (optional): number (default: 12)

**Response:** `RevenueForecastResponse`
```json
{
  "historical": [
    {
      "month": "2024-01",
      "revenue": 12340,
      "growth": 15
    }
  ],
  "forecast": [
    {
      "month": "2024-12",
      "predicted": 18500,
      "confidence": { "min": 16000, "max": 21000 }
    }
  ],
  "currentMonth": {
    "projected": 15234,
    "actual": 12340,
    "completion": 81,
    "onTrack": false
  },
  "nextMonth": {
    "projected": 18500,
    "actual": 0,
    "completion": 0,
    "onTrack": true
  },
  "recommendations": [
    {
      "action": "Add 12 new subscribers",
      "impact": 1200,
      "effort": "medium",
      "description": "Focus on Instagram promotion"
    }
  ],
  "metadata": {
    "modelAccuracy": 0.87,
    "lastUpdated": "2024-11-12T10:30:00Z"
  }
}
```

#### POST /api/revenue/forecast/goal

Set a revenue goal.

**Body:**
```json
{
  "creatorId": "creator_123",
  "goalAmount": 20000,
  "targetMonth": "2024-12"
}
```

**Response:**
```json
{
  "success": true,
  "recommendations": [
    {
      "action": "Add 12 new subscribers",
      "impact": 1200,
      "effort": "medium",
      "description": "Focus on Instagram promotion"
    }
  ]
}
```

#### POST /api/revenue/forecast/scenario

Run a what-if scenario.

**Body:**
```json
{
  "creatorId": "creator_123",
  "newSubscribers": 50,
  "priceIncrease": 2,
  "churnReduction": 0.1
}
```

**Response:**
```json
{
  "projectedRevenue": 18500,
  "impact": 23
}
```

---

### 5. Payout Routes

#### GET /api/revenue/payouts

Get payout schedule.

**Query Parameters:**
- `creatorId` (required): string

**Response:** `PayoutScheduleResponse`
```json
{
  "payouts": [
    {
      "id": "payout_123",
      "platform": "onlyfans",
      "amount": 12340,
      "date": "2024-11-15T00:00:00Z",
      "status": "pending",
      "period": {
        "start": "2024-11-01T00:00:00Z",
        "end": "2024-11-14T23:59:59Z"
      }
    }
  ],
  "summary": {
    "totalExpected": 16680,
    "taxEstimate": 5004,
    "netIncome": 11676
  },
  "platforms": [
    {
      "platform": "onlyfans",
      "connected": true,
      "lastSync": "2024-11-12T10:30:00Z"
    }
  ]
}
```

#### GET /api/revenue/payouts/export

Export payouts as CSV or PDF.

**Query Parameters:**
- `creatorId` (required): string
- `format` (optional): 'csv' | 'pdf' (default: 'csv')

**Response:** File download (CSV or PDF)

**Implementation:**
```typescript
export async function GET(request: NextRequest) {
  // ... auth checks ...

  const format = searchParams.get('format') || 'csv';
  
  // Generate CSV
  const csv = generatePayoutCSV(payouts);
  
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="payouts-${creatorId}-${date}.csv"`,
    },
  });
}
```

#### POST /api/revenue/payouts/tax-rate

Update tax rate.

**Body:**
```json
{
  "creatorId": "creator_123",
  "taxRate": 0.30
}
```

**Response:**
```json
{
  "success": true
}
```

#### POST /api/revenue/payouts/sync

Sync platform connection.

**Body:**
```json
{
  "creatorId": "creator_123",
  "platform": "onlyfans"
}
```

**Response:**
```json
{
  "success": true,
  "lastSync": "2024-11-12T10:35:00Z"
}
```

---

## Error Responses

All routes should return consistent error responses:

```json
{
  "error": "Error message",
  "type": "VALIDATION_ERROR",
  "correlationId": "rev-1699876543210-k3j5h8m2p"
}
```

**Error Status Codes:**
- `400` - Bad Request (validation error)
- `401` - Unauthorized (no session)
- `403` - Forbidden (not your data)
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

---

## Rate Limiting

Implement rate limiting on all routes:

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
});

export async function GET(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return Response.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  // Continue...
}
```

---

## CORS Headers

Add CORS headers for API routes:

```typescript
const headers = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL,
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

---

## Logging

Log all API requests:

```typescript
console.log('[API] Revenue pricing request:', {
  method: request.method,
  creatorId,
  correlationId: request.headers.get('X-Correlation-ID'),
  timestamp: new Date().toISOString(),
});
```

---

## Testing

Test each route with:

```bash
# GET request
curl -X GET "http://localhost:3000/api/revenue/pricing?creatorId=creator_123" \
  -H "Cookie: next-auth.session-token=..."

# POST request
curl -X POST "http://localhost:3000/api/revenue/pricing/apply" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"creatorId":"creator_123","priceType":"subscription","newPrice":12.99}'
```

---

## Implementation Checklist

- [ ] Create route files in `app/api/revenue/`
- [ ] Implement authentication checks
- [ ] Add input validation
- [ ] Connect to backend services
- [ ] Add error handling
- [ ] Implement rate limiting
- [ ] Add logging
- [ ] Test with Postman/Thunder Client
- [ ] Add CORS headers
- [ ] Document in Swagger/OpenAPI

---

## File Structure

```
app/api/revenue/
├── pricing/
│   ├── route.ts
│   └── apply/
│       └── route.ts
├── churn/
│   ├── route.ts
│   ├── reengage/
│   │   └── route.ts
│   └── bulk-reengage/
│       └── route.ts
├── upsells/
│   ├── route.ts
│   ├── send/
│   │   └── route.ts
│   ├── dismiss/
│   │   └── route.ts
│   └── automation/
│       └── route.ts
├── forecast/
│   ├── route.ts
│   ├── goal/
│   │   └── route.ts
│   └── scenario/
│       └── route.ts
└── payouts/
    ├── route.ts
    ├── export/
    │   └── route.ts
    ├── tax-rate/
    │   └── route.ts
    └── sync/
        └── route.ts
```

---

## Next Steps

1. Create the 15 route files
2. Implement authentication and validation
3. Connect to backend services (CIN AI, churn models, etc.)
4. Test each endpoint
5. Add rate limiting
6. Deploy to staging

**Estimated Time:** 2-3 days

---

**Document created by:** Kiro AI Assistant  
**Date:** 2025-11-12  
**Status:** Ready to Implement
