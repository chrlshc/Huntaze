# Revenue Optimization Services

This directory contains the core services and utilities for the Revenue Optimization feature.

## 🚀 Quick Links

- 📖 **[API Integration Guide](./API_INTEGRATION_GUIDE.md)** - Guide complet d'intégration (3000+ lignes)
- 📊 **[Optimization Summary](./OPTIMIZATION_SUMMARY.md)** - Résumé des optimisations
- 📋 **[Main Report](../../../REVENUE_API_OPTIMIZATION_REPORT.md)** - Rapport complet

## Structure

```
lib/services/revenue/
├── types.ts                    # TypeScript interfaces and types
├── api-client.ts               # Base API client with retry logic ✨
├── api-monitoring.ts           # Monitoring & observability ✨ NEW
├── api-validator.ts            # Request validation ✨ NEW
├── pricing-service.ts          # Pricing recommendations service
├── churn-service.ts            # Churn prediction service
├── upsell-service.ts           # Upsell opportunities service
├── forecast-service.ts         # Revenue forecast service
├── payout-service.ts           # Payout management service
├── index.ts                    # Main export file
├── README.md                   # This file
├── API_INTEGRATION_GUIDE.md    # Complete integration guide ✨ NEW
└── OPTIMIZATION_SUMMARY.md     # Optimization summary ✨ NEW
```

## ✨ Nouvelles Fonctionnalités

### 1. Monitoring & Observabilité
```typescript
import { revenueAPIMonitor } from '@/lib/services/revenue/api-monitoring';

// Métriques en temps réel
const summary = revenueAPIMonitor.getSummary();
console.log(summary);
// {
//   totalCalls: 1234,
//   successRate: 98.5,
//   averageDuration: 245,
//   errorRate: 1.5
// }
```

### 2. Validation des Requêtes
```typescript
import { validatePricingRequest } from '@/lib/services/revenue/api-validator';

// Validation automatique avant API call
validatePricingRequest({
  creatorId: 'creator_123',
  priceType: 'subscription',
  newPrice: 12.99,
});
```

### 3. Retry avec Exponential Backoff
```typescript
// Automatique dans api-client.ts
// 3 tentatives : 100ms → 200ms → 400ms
// Timeout : 10 secondes
```

### 4. Request Deduplication
```typescript
// Requêtes GET identiques dans 1s = 1 seul appel réseau
const data1 = await pricingService.getRecommendations('creator_123');
const data2 = await pricingService.getRecommendations('creator_123');
// ✅ Une seule requête réseau
```

## Quick Start

```typescript
import {
  pricingService,
  churnService,
  upsellService,
  forecastService,
  payoutService,
} from '@/lib/services/revenue';

// Get pricing recommendations
const pricing = await pricingService.getRecommendations('creator_123');

// Get churn risks
const churnRisks = await churnService.getChurnRisks('creator_123', 'high');

// Get upsell opportunities
const upsells = await upsellService.getOpportunities('creator_123');

// Get revenue forecast
const forecast = await forecastService.getForecast('creator_123', 12);

// Get payout schedule
const payouts = await payoutService.getPayoutSchedule('creator_123');
```

## API Client

The base API client provides:
- ✅ Automatic retry with exponential backoff (3 attempts)
- ✅ Timeout handling (10s default)
- ✅ Error wrapping with correlation IDs
- ✅ Type-safe requests
- ✅ Request deduplication
- ✅ Comprehensive logging

### Configuration

```typescript
const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelay: 100,      // 100ms
  maxDelay: 2000,         // 2s
  backoffFactor: 2,       // Exponential
};

const TIMEOUT_MS = 10000; // 10 seconds
```

### Usage

```typescript
import { revenueAPI } from '@/lib/services/revenue';

// GET request with params
const data = await revenueAPI.get('/pricing', { creatorId: '123' });

// POST request with body
const result = await revenueAPI.post('/pricing/apply', {
  creatorId: '123',
  newPrice: 12.99
});

// PUT request
await revenueAPI.put('/settings', { enabled: true });

// DELETE request
await revenueAPI.delete('/opportunity/123');
```

## Services

### 1. Pricing Service

Handles dynamic pricing recommendations and application.

```typescript
import { pricingService } from '@/lib/services/revenue';

// Get recommendations
const recommendations = await pricingService.getRecommendations('creator_123');
console.log(recommendations.subscription.recommended); // $12.99
console.log(recommendations.subscription.revenueImpact); // 30%

// Apply pricing
await pricingService.applyPricing({
  creatorId: 'creator_123',
  priceType: 'subscription',
  newPrice: 12.99,
});
```

### 2. Churn Service

Handles churn risk prediction and fan re-engagement.

```typescript
import { churnService } from '@/lib/services/revenue';

// Get churn risks (all levels)
const allRisks = await churnService.getChurnRisks('creator_123');

// Get high-risk fans only
const highRisk = await churnService.getChurnRisks('creator_123', 'high');

// Re-engage single fan
await churnService.reEngageFan({
  creatorId: 'creator_123',
  fanId: 'fan_456',
  messageTemplate: 'custom message',
});

// Bulk re-engage
await churnService.bulkReEngage(
  'creator_123',
  ['fan_1', 'fan_2', 'fan_3'],
  'Hey! Missing you...'
);
```

### 3. Upsell Service

Handles upsell opportunity detection and automation.

```typescript
import { upsellService } from '@/lib/services/revenue';

// Get opportunities
const opportunities = await upsellService.getOpportunities('creator_123');

// Send upsell
await upsellService.sendUpsell({
  creatorId: 'creator_123',
  opportunityId: 'opp_789',
  customMessage: 'Check out this exclusive content!',
});

// Dismiss opportunity
await upsellService.dismissOpportunity('creator_123', 'opp_789');

// Get automation settings
const settings = await upsellService.getAutomationSettings('creator_123');

// Update automation
await upsellService.updateAutomationSettings('creator_123', {
  enabled: true,
  autoSendThreshold: 0.8,
  maxDailyUpsells: 10,
  excludedFans: [],
  customRules: [],
});
```

### 4. Forecast Service

Handles revenue forecasting and goal setting.

```typescript
import { forecastService } from '@/lib/services/revenue';

// Get 12-month forecast
const forecast = await forecastService.getForecast('creator_123', 12);

// Set revenue goal
await forecastService.setGoal('creator_123', 20000, '2024-12');

// Run scenario analysis
const scenario = await forecastService.getScenario('creator_123', {
  newSubscribers: 50,
  priceIncrease: 2,
  churnReduction: 0.1,
});
console.log(scenario.projectedRevenue); // $18,500
console.log(scenario.impact); // +23%
```

### 5. Payout Service

Handles multi-platform payout management and export.

```typescript
import { payoutService } from '@/lib/services/revenue';

// Get payout schedule
const schedule = await payoutService.getPayoutSchedule('creator_123');

// Export as CSV
await payoutService.downloadPayouts('creator_123', 'csv');

// Update tax rate
await payoutService.updateTaxRate('creator_123', 0.30);

// Sync platform
await payoutService.syncPlatform('creator_123', 'onlyfans');
```

## Types

All revenue optimization types are centralized in `types.ts`:

```typescript
import type {
  // Pricing
  PricingRecommendation,
  PPVPricingRecommendation,
  ApplyPricingRequest,
  
  // Churn
  ChurnRiskResponse,
  ChurnRiskFan,
  ReEngageRequest,
  
  // Upsell
  UpsellOpportunitiesResponse,
  UpsellOpportunity,
  SendUpsellRequest,
  AutomationSettings,
  
  // Forecast
  RevenueForecastResponse,
  RevenueDataPoint,
  ForecastDataPoint,
  MonthForecast,
  GoalRecommendation,
  
  // Payout
  PayoutScheduleResponse,
  Payout,
  PlatformConnection,
  
  // Metrics
  RevenueMetrics,
  MetricTrends,
  TrendDirection,
  
  // Errors
  RevenueError,
  RevenueErrorType,
} from '@/lib/services/revenue';
```

## Error Handling

All services use the `RevenueError` type for consistent error handling:

```typescript
import { RevenueErrorType } from '@/lib/services/revenue';

try {
  const data = await pricingService.getRecommendations('creator_123');
} catch (error) {
  const revenueError = error as RevenueError;
  
  // Check error type
  if (revenueError.type === RevenueErrorType.PERMISSION_ERROR) {
    console.log('No permission');
  }
  
  // User-friendly message
  console.error(revenueError.userMessage);
  
  // Correlation ID for debugging
  console.error('Correlation ID:', revenueError.correlationId);
  
  // Check if retryable
  if (revenueError.retryable) {
    // Retry logic
  }
}
```

### Error Types

- `NETWORK_ERROR` - Connection issues (retryable)
- `API_ERROR` - Server errors (retryable)
- `VALIDATION_ERROR` - Invalid input (not retryable)
- `PERMISSION_ERROR` - Access denied (not retryable)
- `RATE_LIMIT_ERROR` - Too many requests (retryable)

## Logging

All services include comprehensive logging:

```typescript
// Service logs include:
// - Request parameters
// - Response summaries
// - Error details
// - Performance metrics

// Example logs:
[PricingService] Fetching recommendations for creator: creator_123
[PricingService] Recommendations received: {
  subscriptionImpact: 30,
  ppvCount: 5,
  confidence: 0.85
}
[PricingService] Applying pricing: {
  creatorId: 'creator_123',
  priceType: 'subscription',
  newPrice: 12.99
}
[PricingService] Pricing applied successfully
```

## Custom Hooks

Use the custom hooks in `hooks/revenue/` for React components:

```typescript
import {
  usePricingRecommendations,
  useChurnRisks,
  useUpsellOpportunities,
  useRevenueForecast,
  usePayoutSchedule,
} from '@/hooks/revenue';

// In your component
const { recommendations, applyPricing, isLoading } = usePricingRecommendations({
  creatorId: 'creator_123',
});
```

See `hooks/revenue/README.md` for detailed hook documentation.

## API Routes

The services connect to these API routes:

```
POST   /api/revenue/pricing          - Get pricing recommendations
POST   /api/revenue/pricing/apply    - Apply pricing change

GET    /api/revenue/churn            - Get churn risks
POST   /api/revenue/churn/reengage   - Re-engage fan
POST   /api/revenue/churn/bulk-reengage - Bulk re-engage

GET    /api/revenue/upsells          - Get upsell opportunities
POST   /api/revenue/upsells/send     - Send upsell
POST   /api/revenue/upsells/dismiss  - Dismiss opportunity
GET    /api/revenue/upsells/automation - Get automation settings
POST   /api/revenue/upsells/automation - Update automation

GET    /api/revenue/forecast         - Get revenue forecast
POST   /api/revenue/forecast/goal    - Set revenue goal
POST   /api/revenue/forecast/scenario - Run scenario

GET    /api/revenue/payouts          - Get payout schedule
GET    /api/revenue/payouts/export   - Export payouts
POST   /api/revenue/payouts/tax-rate - Update tax rate
POST   /api/revenue/payouts/sync     - Sync platform
```

## Testing

```bash
# Run service tests
npm test lib/services/revenue

# Test with mock data
npm run test:revenue

# Integration tests
npm run test:integration:revenue
```

## Performance

- **Caching**: All services use SWR for client-side caching
- **Deduplication**: Requests within 5s are deduplicated
- **Retry Logic**: Exponential backoff for failed requests
- **Timeout**: 10s timeout prevents hanging requests
- **Logging**: Minimal performance impact

## Security

- ✅ All requests require authentication
- ✅ Creator can only access their own data
- ✅ Rate limiting on mutation endpoints
- ✅ CSRF protection on POST requests
- ✅ Input validation on all requests
- ✅ Correlation IDs for audit trails

## Next Steps

1. ✅ Services implemented
2. ✅ Custom hooks created
3. [ ] API routes implementation
4. [ ] UI components
5. [ ] Integration tests
6. [ ] E2E tests
