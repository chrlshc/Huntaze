# Revenue Optimization Hooks

Custom React hooks for Revenue Optimization features with SWR caching and optimistic updates.

## Available Hooks

- `usePricingRecommendations` - Pricing recommendations and application
- `useChurnRisks` - Churn risk analysis and re-engagement
- `useUpsellOpportunities` - Upsell opportunities and automation
- `useRevenueForecast` - Revenue forecasting and goal setting
- `usePayoutSchedule` - Payout management and export

## Quick Start

```typescript
import {
  usePricingRecommendations,
  useChurnRisks,
  useUpsellOpportunities,
  useRevenueForecast,
  usePayoutSchedule,
} from '@/hooks/revenue';

function MyComponent() {
  const { recommendations, applyPricing, isLoading } = usePricingRecommendations({
    creatorId: 'creator_123',
  });

  // Use the data...
}
```

## usePricingRecommendations

Fetches pricing recommendations with 5-minute caching.

### Usage

```typescript
const {
  recommendations,    // PricingRecommendation | undefined
  isLoading,         // boolean
  error,             // RevenueError | undefined
  applyPricing,      // (request: ApplyPricingRequest) => Promise<{success: boolean}>
  isApplying,        // boolean
  applyError,        // RevenueError | null
  refresh,           // () => void
} = usePricingRecommendations({
  creatorId: 'creator_123',
  enabled: true,     // optional, default: true
});
```

### Example

```typescript
function PricingCard() {
  const { recommendations, applyPricing, isApplying } = usePricingRecommendations({
    creatorId: session.user.id,
  });

  const handleApply = async () => {
    try {
      await applyPricing({
        creatorId: session.user.id,
        priceType: 'subscription',
        newPrice: recommendations.subscription.recommended,
      });
      toast.success('Pricing updated!');
    } catch (error) {
      toast.error(error.userMessage);
    }
  };

  return (
    <div>
      <p>Current: ${recommendations?.subscription.current}</p>
      <p>Recommended: ${recommendations?.subscription.recommended}</p>
      <button onClick={handleApply} disabled={isApplying}>
        Apply
      </button>
    </div>
  );
}
```

## useChurnRisks

Fetches churn risk data with 10-minute caching and 60-second auto-refresh.

### Usage

```typescript
const {
  churnRisks,        // ChurnRiskResponse | undefined
  isLoading,         // boolean
  error,             // RevenueError | undefined
  reEngageFan,       // (request: ReEngageRequest) => Promise<{success: boolean, messageId: string}>
  bulkReEngage,      // (fanIds: string[], template?: string) => Promise<{success: boolean, sent: number, failed: number}>
  isReEngaging,      // boolean
  reEngageError,     // RevenueError | null
  refresh,           // () => void
} = useChurnRisks({
  creatorId: 'creator_123',
  riskLevel: 'high', // optional: 'high' | 'medium' | 'low'
  enabled: true,     // optional, default: true
  autoRefresh: true, // optional, default: true (60s interval)
});
```

### Example

```typescript
function ChurnDashboard() {
  const { churnRisks, reEngageFan, isReEngaging } = useChurnRisks({
    creatorId: session.user.id,
    riskLevel: 'high',
  });

  const handleReEngage = async (fanId: string) => {
    try {
      await reEngageFan({
        creatorId: session.user.id,
        fanId,
      });
      toast.success('Re-engagement message sent!');
    } catch (error) {
      toast.error(error.userMessage);
    }
  };

  return (
    <div>
      <h2>{churnRisks?.summary.highRisk} fans at high risk</h2>
      {churnRisks?.fans.map(fan => (
        <div key={fan.id}>
          <p>{fan.name} - {(fan.churnProbability * 100).toFixed(0)}% risk</p>
          <button onClick={() => handleReEngage(fan.id)} disabled={isReEngaging}>
            Re-engage
          </button>
        </div>
      ))}
    </div>
  );
}
```

## useUpsellOpportunities

Fetches upsell opportunities with 5-minute caching and optimistic updates.

### Usage

```typescript
const {
  opportunities,     // UpsellOpportunitiesResponse | undefined
  isLoading,         // boolean
  error,             // RevenueError | undefined
  sendUpsell,        // (request: SendUpsellRequest) => Promise<{success: boolean, messageId: string}>
  dismissOpportunity,// (opportunityId: string) => Promise<void>
  isSending,         // boolean
  sendError,         // RevenueError | null
  refresh,           // () => void
} = useUpsellOpportunities({
  creatorId: 'creator_123',
  enabled: true,     // optional, default: true
});
```

### Example

```typescript
function UpsellQueue() {
  const { opportunities, sendUpsell, dismissOpportunity, isSending } = useUpsellOpportunities({
    creatorId: session.user.id,
  });

  const handleSend = async (opportunityId: string) => {
    try {
      await sendUpsell({
        creatorId: session.user.id,
        opportunityId,
      });
      toast.success('Upsell sent!');
    } catch (error) {
      toast.error(error.userMessage);
    }
  };

  return (
    <div>
      <h2>{opportunities?.stats.totalOpportunities} opportunities</h2>
      {opportunities?.opportunities.map(opp => (
        <div key={opp.id}>
          <p>{opp.fanName} - ${opp.expectedRevenue}</p>
          <button onClick={() => handleSend(opp.id)} disabled={isSending}>
            Send
          </button>
          <button onClick={() => dismissOpportunity(opp.id)}>
            Dismiss
          </button>
        </div>
      ))}
    </div>
  );
}
```

## useUpsellAutomation

Separate hook for automation settings.

### Usage

```typescript
const {
  settings,          // AutomationSettings | undefined
  isLoading,         // boolean
  error,             // RevenueError | undefined
  updateSettings,    // (settings: AutomationSettings) => Promise<void>
  isUpdating,        // boolean
} = useUpsellAutomation('creator_123');
```

### Example

```typescript
function AutomationSettings() {
  const { settings, updateSettings, isUpdating } = useUpsellAutomation(session.user.id);

  const handleToggle = async () => {
    await updateSettings({
      ...settings,
      enabled: !settings.enabled,
    });
  };

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={settings?.enabled}
          onChange={handleToggle}
          disabled={isUpdating}
        />
        Enable automation
      </label>
    </div>
  );
}
```

## useRevenueForecast

Fetches revenue forecast with 1-hour caching.

### Usage

```typescript
const {
  forecast,          // RevenueForecastResponse | undefined
  isLoading,         // boolean
  error,             // RevenueError | undefined
  setGoal,           // (goalAmount: number, targetMonth: string) => Promise<{success: boolean, recommendations: any[]}>
  runScenario,       // (changes: {...}) => Promise<{projectedRevenue: number, impact: number}>
  isSettingGoal,     // boolean
  goalError,         // RevenueError | null
  refresh,           // () => void
} = useRevenueForecast({
  creatorId: 'creator_123',
  months: 12,        // optional, default: 12
  enabled: true,     // optional, default: true
});
```

### Example

```typescript
function ForecastDashboard() {
  const { forecast, setGoal, runScenario } = useRevenueForecast({
    creatorId: session.user.id,
    months: 12,
  });

  const handleSetGoal = async () => {
    try {
      const result = await setGoal(20000, '2024-12');
      console.log('Recommendations:', result.recommendations);
      toast.success('Goal set!');
    } catch (error) {
      toast.error(error.userMessage);
    }
  };

  const handleScenario = async () => {
    const result = await runScenario({
      newSubscribers: 50,
      priceIncrease: 2,
    });
    console.log('Projected:', result.projectedRevenue);
    console.log('Impact:', result.impact);
  };

  return (
    <div>
      <h2>Current Month: ${forecast?.currentMonth.actual}</h2>
      <h2>Projected: ${forecast?.currentMonth.projected}</h2>
      <button onClick={handleSetGoal}>Set Goal</button>
      <button onClick={handleScenario}>Run Scenario</button>
    </div>
  );
}
```

## usePayoutSchedule

Fetches payout schedule with 30-minute caching.

### Usage

```typescript
const {
  payouts,           // PayoutScheduleResponse | undefined
  isLoading,         // boolean
  error,             // RevenueError | undefined
  exportPayouts,     // (format: 'csv' | 'pdf') => Promise<void>
  updateTaxRate,     // (taxRate: number) => Promise<void>
  syncPlatform,      // (platform: 'onlyfans' | 'fansly' | 'patreon') => Promise<void>
  isExporting,       // boolean
  exportError,       // RevenueError | null
  isUpdatingTax,     // boolean
  isSyncing,         // boolean
  refresh,           // () => void
} = usePayoutSchedule({
  creatorId: 'creator_123',
  enabled: true,     // optional, default: true
});
```

### Example

```typescript
function PayoutDashboard() {
  const {
    payouts,
    exportPayouts,
    updateTaxRate,
    syncPlatform,
    isExporting,
  } = usePayoutSchedule({
    creatorId: session.user.id,
  });

  const handleExport = async () => {
    try {
      await exportPayouts('csv');
      toast.success('Export downloaded!');
    } catch (error) {
      toast.error(error.userMessage);
    }
  };

  const handleTaxUpdate = async (rate: number) => {
    await updateTaxRate(rate);
    toast.success('Tax rate updated!');
  };

  const handleSync = async () => {
    await syncPlatform('onlyfans');
    toast.success('Platform synced!');
  };

  return (
    <div>
      <h2>Total Expected: ${payouts?.summary.totalExpected}</h2>
      <h2>Net Income: ${payouts?.summary.netIncome}</h2>
      <button onClick={handleExport} disabled={isExporting}>
        Export CSV
      </button>
      <button onClick={handleSync}>Sync OnlyFans</button>
    </div>
  );
}
```

## Common Patterns

### Loading States

```typescript
function MyComponent() {
  const { data, isLoading, error } = useSomeHook({ creatorId });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return <EmptyState />;

  return <DataDisplay data={data} />;
}
```

### Error Handling

```typescript
function MyComponent() {
  const { data, error } = useSomeHook({ creatorId });

  if (error) {
    return (
      <div className="error">
        <p>{error.userMessage}</p>
        {error.retryable && <button onClick={refresh}>Retry</button>}
        <p className="text-xs">ID: {error.correlationId}</p>
      </div>
    );
  }

  // ...
}
```

### Optimistic Updates

```typescript
function MyComponent() {
  const { data, mutate } = useSWR(key, fetcher);

  const handleUpdate = async () => {
    // Optimistic update
    mutate({ ...data, updated: true }, false);

    try {
      // Make API call
      await updateAPI();
      // Revalidate from server
      await mutate();
    } catch (error) {
      // Rollback on error
      await mutate();
    }
  };
}
```

### Manual Refresh

```typescript
function MyComponent() {
  const { data, refresh } = useSomeHook({ creatorId });

  return (
    <div>
      <DataDisplay data={data} />
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```

### Conditional Fetching

```typescript
function MyComponent() {
  const [showDetails, setShowDetails] = useState(false);

  // Only fetch when showDetails is true
  const { data } = useSomeHook({
    creatorId,
    enabled: showDetails,
  });

  return (
    <div>
      <button onClick={() => setShowDetails(true)}>
        Show Details
      </button>
      {showDetails && <Details data={data} />}
    </div>
  );
}
```

## Cache Configuration

Each hook has optimized cache settings:

| Hook | Cache TTL | Auto-Refresh | Deduplication |
|------|-----------|--------------|---------------|
| usePricingRecommendations | 5 min | No | 5s |
| useChurnRisks | 10 min | Yes (60s) | 5s |
| useUpsellOpportunities | 5 min | No | 5s |
| useRevenueForecast | 1 hour | No | 10s |
| usePayoutSchedule | 30 min | No | 5s |

## Performance Tips

1. **Use conditional fetching** for data that's not always needed
2. **Leverage optimistic updates** for better UX
3. **Don't disable caching** unless necessary
4. **Use the refresh function** instead of forcing revalidation
5. **Handle loading states** to prevent layout shifts

## Testing

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { usePricingRecommendations } from './usePricingRecommendations';

test('fetches pricing recommendations', async () => {
  const { result } = renderHook(() =>
    usePricingRecommendations({ creatorId: 'test_123' })
  );

  expect(result.current.isLoading).toBe(true);

  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });

  expect(result.current.recommendations).toBeDefined();
});
```

## Troubleshooting

### Hook returns undefined data

- Check if `enabled` is set to `true`
- Verify the API route is working
- Check browser console for errors
- Look for correlation ID in error logs

### Data not refreshing

- Check cache TTL settings
- Verify `revalidateOnFocus` is configured
- Call `refresh()` manually if needed
- Check if SWR is properly configured

### Optimistic updates not working

- Ensure `mutate()` is called with `false` as second argument
- Verify the data structure matches
- Check for errors in the API call
- Always revalidate after the API call

## Next Steps

1. Implement API routes in `app/api/revenue/`
2. Create UI components using these hooks
3. Add error boundaries for production
4. Set up monitoring for hook performance
5. Write integration tests
