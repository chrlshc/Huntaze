# Performance Dashboard

A comprehensive real-time performance monitoring dashboard that integrates with AWS CloudWatch to display Web Vitals, alerts, and historical trends.

## Features

- **Real-time Metrics**: Display current LCP, FID, CLS, and TTFB values
- **Performance Grade**: Automatic calculation of overall performance grade (A-F)
- **Active Alerts**: Visualization of CloudWatch alarms for threshold breaches
- **Historical Trends**: Display performance trends over time (configurable hours)
- **CloudWatch Integration**: Seamless integration with AWS CloudWatch for metrics collection

## Components

### 1. PerformanceDashboard Component

React component that displays the complete dashboard UI.

```tsx
import { PerformanceDashboard } from '@/components/performance/PerformanceDashboard';

function MyPage() {
  return (
    <PerformanceDashboard 
      refreshInterval={30000}  // Refresh every 30 seconds
      showHistorical={true}    // Show historical trends
    />
  );
}
```

**Props:**
- `refreshInterval` (optional): Refresh interval in milliseconds (default: 30000)
- `showHistorical` (optional): Whether to show historical trends (default: true)

### 2. usePerformanceDashboard Hook

React hook for accessing dashboard data programmatically.

```tsx
import { usePerformanceDashboard } from '@/hooks/usePerformanceDashboard';

function MyComponent() {
  const { metrics, alerts, grade, isLoading, refresh } = usePerformanceDashboard(30000);
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>Performance Grade: {grade}</h1>
      <p>LCP: {metrics.lcp}ms</p>
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```

**Returns:**
- `metrics`: Current performance metrics (LCP, FID, CLS, TTFB)
- `alerts`: Array of active alerts
- `historical`: Array of historical data points
- `grade`: Performance grade (A-F)
- `isLoading`: Loading state
- `error`: Error object if fetch failed
- `refresh`: Function to manually refresh data

### 3. DashboardService

Backend service for fetching data from CloudWatch.

```typescript
import { getDashboardService } from '@/lib/monitoring/dashboard-service';

const service = getDashboardService();

// Get current metrics
const metrics = await service.getCurrentMetrics();

// Get active alerts
const alerts = await service.getActiveAlerts();

// Get historical data (last 24 hours)
const historical = await service.getHistoricalData(24);

// Get complete dashboard data
const dashboardData = await service.getDashboardData();
```

## API Endpoints

### GET /api/performance/dashboard

Fetch complete dashboard data including metrics, alerts, and historical trends.

**Query Parameters:**
- `hours` (optional): Number of hours of historical data to fetch (default: 24)

**Response:**
```json
{
  "metrics": {
    "lcp": 2300,
    "fid": 85,
    "cls": 0.08,
    "ttfb": 650
  },
  "alerts": [
    {
      "id": "alarm-123",
      "metric": "LCP",
      "value": 3500,
      "threshold": 2500,
      "timestamp": "2024-11-26T10:30:00Z",
      "severity": "warning"
    }
  ],
  "historical": [
    {
      "timestamp": "2024-11-26T09:00:00Z",
      "lcp": 2200,
      "fid": 80,
      "cls": 0.07,
      "ttfb": 600
    }
  ],
  "grade": "B"
}
```

### POST /api/performance/dashboard/refresh

Trigger a manual refresh of dashboard metrics.

**Response:**
```json
{
  "success": true,
  "data": { /* dashboard data */ },
  "refreshedAt": "2024-11-26T10:35:00Z"
}
```

### GET /api/performance/summary

Enhanced performance summary endpoint with CloudWatch integration.

**Response:**
```json
{
  "lcp": 2300,
  "fid": 85,
  "cls": 0.08,
  "ttfb": 650,
  "alerts": [],
  "historical": [],
  "grade": "B",
  "source": "cloudwatch",
  "timestamp": "2024-11-26T10:35:00Z"
}
```

## Performance Grade Calculation

The performance grade is calculated based on Web Vitals thresholds:

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP    | ≤ 2500ms | ≤ 4000ms | > 4000ms |
| FID    | ≤ 100ms  | ≤ 300ms  | > 300ms  |
| CLS    | ≤ 0.1    | ≤ 0.25   | > 0.25   |
| TTFB   | ≤ 800ms  | ≤ 1800ms | > 1800ms |

**Grade Calculation:**
- Each metric gets a score from 0 to 1 based on its value
- Average score determines the grade:
  - A: ≥ 90%
  - B: ≥ 75%
  - C: ≥ 50%
  - D: ≥ 25%
  - F: < 25%

## Alert Severity

Alerts are categorized by severity:

- **Critical**: Metric exceeds "poor" threshold
  - LCP ≥ 4000ms
  - FID ≥ 300ms
  - CLS ≥ 0.25
  - TTFB ≥ 1800ms

- **Warning**: Metric exceeds "good" threshold but below "poor"
  - LCP: 2500-4000ms
  - FID: 100-300ms
  - CLS: 0.1-0.25
  - TTFB: 800-1800ms

## Configuration

### Environment Variables

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# CloudWatch Configuration
CLOUDWATCH_NAMESPACE=Huntaze/Performance

# Application Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.com
```

### CloudWatch Setup

The dashboard requires the following CloudWatch resources:

1. **Metric Namespace**: `Huntaze/Performance`
2. **Metrics**: LCP, FID, CLS, TTFB
3. **Dimensions**: Environment (production, staging, development)
4. **Alarms**: Configured for each metric with appropriate thresholds

## Testing

### Property-Based Tests

Run property-based tests to verify correctness:

```bash
npm test tests/unit/properties/performance-dashboard.property.test.ts
```

**Properties Tested:**
- Property 40: Dashboard creation with all key metrics
- Property 41: Threshold notifications for breaches
- Property 42: Error context logging
- Grade calculation consistency
- Historical data ordering

### Integration Tests

Run integration tests:

```bash
tsx scripts/test-performance-dashboard.ts
```

**Tests:**
1. Fetch current metrics
2. Fetch active alerts
3. Fetch historical data
4. Get complete dashboard data
5. Test dashboard API endpoint
6. Test performance summary endpoint

## Usage Example

### Basic Dashboard Page

```tsx
// app/dashboard/performance/page.tsx
import { PerformanceDashboard } from '@/components/performance/PerformanceDashboard';

export default function PerformancePage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Performance Monitoring</h1>
      <PerformanceDashboard 
        refreshInterval={30000}
        showHistorical={true}
      />
    </div>
  );
}
```

### Custom Dashboard with Hook

```tsx
import { usePerformanceDashboard } from '@/hooks/usePerformanceDashboard';

export function CustomDashboard() {
  const { 
    metrics, 
    alerts, 
    grade, 
    isLoading, 
    error,
    refresh 
  } = usePerformanceDashboard(60000); // Refresh every minute

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2>Performance: Grade {grade}</h2>
        <button onClick={refresh}>Refresh Now</button>
      </div>
      
      <div className="grid grid-cols-4 gap-4">
        <MetricCard title="LCP" value={metrics.lcp} unit="ms" />
        <MetricCard title="FID" value={metrics.fid} unit="ms" />
        <MetricCard title="CLS" value={metrics.cls} unit="" />
        <MetricCard title="TTFB" value={metrics.ttfb} unit="ms" />
      </div>
      
      {alerts.length > 0 && (
        <AlertsList alerts={alerts} />
      )}
    </div>
  );
}
```

## Troubleshooting

### Dashboard shows no data

1. Verify AWS credentials are configured
2. Check CloudWatch namespace matches configuration
3. Ensure metrics are being sent to CloudWatch
4. Check browser console for errors

### Alerts not appearing

1. Verify CloudWatch alarms are configured
2. Check alarm state in AWS Console
3. Ensure alarm namespace matches dashboard configuration

### Historical data is empty

1. Verify metrics have been collected for the requested time period
2. Check CloudWatch retention settings
3. Ensure sufficient data points exist

## Performance Considerations

- Dashboard refreshes every 30 seconds by default (configurable)
- CloudWatch API calls are cached for 5 minutes
- Historical data is limited to prevent excessive API calls
- Fallback to local metrics if CloudWatch is unavailable

## Related Documentation

- [Web Vitals Monitoring](./WEB-VITALS-README.md)
- [CloudWatch Integration](../aws/README.md)
- [Performance Diagnostics](../performance/diagnostics.ts)
