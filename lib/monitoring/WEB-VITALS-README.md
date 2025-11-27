# Web Vitals Monitoring with CloudWatch

Comprehensive Web Vitals monitoring system with automatic CloudWatch integration, real-time alerting, and performance dashboards.

## Overview

This system automatically measures, logs, and monitors Core Web Vitals:
- **LCP** (Largest Contentful Paint) - Loading performance
- **FID** (First Input Delay) - Interactivity
- **CLS** (Cumulative Layout Shift) - Visual stability
- **FCP** (First Contentful Paint) - Initial render
- **TTFB** (Time to First Byte) - Server response time

## Features

✅ **Automatic Measurement** - Web Vitals measured on every page load
✅ **CloudWatch Integration** - Metrics sent to CloudWatch for monitoring
✅ **Real-time Alerts** - Automatic alerts when thresholds exceeded
✅ **Performance Dashboard** - Visual dashboard in CloudWatch
✅ **Grade Calculation** - A-F performance grading
✅ **Connection Awareness** - Metrics grouped by connection type
✅ **Device Segmentation** - Separate tracking for mobile/desktop

## Quick Start

### 1. Setup CloudWatch Alarms

```bash
npm run setup:web-vitals-alarms
```

This creates:
- CloudWatch alarms for each Web Vital
- SNS topic for notifications
- CloudWatch dashboard with visualizations

### 2. Subscribe to Alerts

```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:YOUR_ACCOUNT:huntaze-web-vitals-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com
```

### 3. Use in Your Application

```tsx
import { WebVitalsMonitor } from '@/components/performance/WebVitalsMonitor';

export default function Layout({ children }) {
  return (
    <>
      {children}
      <WebVitalsMonitor showDetails={true} autoReport={true} />
    </>
  );
}
```

## Usage

### Basic Hook Usage

```tsx
import { useWebVitals } from '@/hooks/useWebVitals';

function MyComponent() {
  const { vitals, isLoading } = useWebVitals({
    sendToCloudWatch: true,
    reportToAnalytics: true,
    onReport: (report) => {
      console.log('Web Vitals:', report);
    },
  });

  return (
    <div>
      <p>LCP: {vitals.lcp}ms</p>
      <p>FID: {vitals.fid}ms</p>
      <p>CLS: {vitals.cls}</p>
    </div>
  );
}
```

### Performance Grading

```tsx
import { getPerformanceGrade } from '@/hooks/useWebVitals';

const grade = getPerformanceGrade(vitals);
console.log(`Performance: ${grade.grade} (${grade.score}/100)`);
```

### Monitor Component

```tsx
// Detailed view with all metrics
<WebVitalsMonitor showDetails={true} autoReport={true} />

// Compact badge view
<WebVitalsMonitor showDetails={false} autoReport={true} />
```

## Thresholds

### Good Performance
- **LCP**: ≤ 2.5 seconds
- **FID**: ≤ 100 milliseconds
- **CLS**: ≤ 0.1
- **FCP**: ≤ 1.8 seconds
- **TTFB**: ≤ 800 milliseconds

### Needs Improvement
- **LCP**: 2.5 - 4.0 seconds
- **FID**: 100 - 300 milliseconds
- **CLS**: 0.1 - 0.25
- **FCP**: 1.8 - 3.0 seconds
- **TTFB**: 800 - 1800 milliseconds

### Poor Performance
- **LCP**: > 4.0 seconds
- **FID**: > 300 milliseconds
- **CLS**: > 0.25
- **FCP**: > 3.0 seconds
- **TTFB**: > 1800 milliseconds

## Alert Severity

### Warning
Triggered when metric exceeds threshold by up to 50%

Example: LCP = 3000ms (threshold: 2500ms, +20%)

### Critical
Triggered when metric exceeds threshold by 50% or more

Example: LCP = 4000ms (threshold: 2500ms, +60%)

## CloudWatch Dashboard

Access your dashboard at:
```
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=Huntaze-WebVitals
```

### Dashboard Widgets

1. **LCP Over Time** - Average and P95 LCP
2. **FID Over Time** - Average and P95 FID
3. **CLS Over Time** - Average and P95 CLS
4. **FCP & TTFB** - Combined view
5. **Page Views** - Total measurements
6. **LCP by Connection** - Performance by network type

## Testing

### Run Property Tests

```bash
npm test tests/unit/properties/web-vitals.property.test.ts
```

### Test Integration

```bash
npm run test:web-vitals-integration
```

### Test with API Running

```bash
TEST_API=true npm run test:web-vitals-integration
```

## API Endpoints

### POST /api/metrics
Send Web Vitals metrics to CloudWatch

```json
{
  "namespace": "Huntaze/WebVitals",
  "metricName": "LCP",
  "value": 1500,
  "unit": "Milliseconds",
  "dimensions": {
    "Page": "/dashboard",
    "Connection": "4g",
    "UserAgent": "Desktop"
  }
}
```

### POST /api/metrics/alert
Trigger alert for threshold breach

```json
{
  "metricName": "LCP",
  "value": 3000,
  "threshold": 2500,
  "severity": "warning",
  "context": {
    "url": "https://app.huntaze.com/dashboard",
    "userAgent": "Mozilla/5.0...",
    "connection": "4g",
    "timestamp": 1234567890
  }
}
```

## Environment Variables

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=REDACTED_key
AWS_SECRET_ACCESS_KEY=REDACTED_secret
AWS_ACCOUNT_ID=123456789012

# Enable CloudWatch in development
NEXT_PUBLIC_ENABLE_CLOUDWATCH=true

# Analytics endpoint (optional)
NEXT_PUBLIC_ANALYTICS_ENDPOINT=https://analytics.example.com
```

## Monitoring Best Practices

### 1. Set Realistic Thresholds
Adjust thresholds based on your application's baseline performance

### 2. Monitor Trends
Look for gradual degradation over time, not just absolute values

### 3. Segment by Context
Compare metrics across:
- Different pages
- Connection types (4G vs 3G)
- Device types (mobile vs desktop)

### 4. Act on Alerts
When alerts fire:
1. Check CloudWatch dashboard for context
2. Identify affected pages/users
3. Review recent deployments
4. Investigate bottlenecks

### 5. Regular Audits
Run Lighthouse audits weekly to validate Web Vitals

## Troubleshooting

### No Metrics in CloudWatch

1. Check AWS credentials are configured
2. Verify metrics API endpoint is working
3. Check browser console for errors
4. Ensure `sendToCloudWatch` is enabled

### Alarms Not Triggering

1. Verify alarms are created: `aws cloudwatch describe-alarms`
2. Check alarm state in CloudWatch console
3. Verify SNS topic subscription is confirmed
4. Check evaluation periods and thresholds

### High Alert Volume

1. Review and adjust thresholds
2. Increase evaluation periods
3. Filter by specific pages or user segments
4. Implement alert aggregation

## Performance Impact

The Web Vitals monitoring system is designed to have minimal performance impact:

- **Measurement**: Uses native browser APIs (PerformanceObserver)
- **Reporting**: Asynchronous, non-blocking
- **Network**: Batched metrics, < 1KB per report
- **CPU**: < 1ms per measurement
- **Memory**: < 100KB

## Related Documentation

- [CloudWatch Metrics](../aws/README.md)
- [Performance Diagnostics](../performance/diagnostics.ts)
- [Loading States](../../components/loading/README.md)

## Support

For issues or questions:
1. Check CloudWatch Logs: `/huntaze/web-vitals-alerts`
2. Review property tests for expected behavior
3. Consult AWS CloudWatch documentation
