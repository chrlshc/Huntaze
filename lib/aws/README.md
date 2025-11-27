# AWS Performance Monitoring

This module provides CloudWatch integration for performance monitoring, metrics collection, and alerting.

## Quick Start

### 1. Setup AWS Infrastructure

```bash
# Set AWS credentials
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_SESSION_TOKEN="your-session-token"  # if using temporary credentials
export AWS_REGION="us-east-1"

# Setup CloudWatch dashboards, alarms, and SNS topics
npm run aws:setup

# Or with email alerts
npm run aws:setup your-email@example.com
```

This will create:
- CloudWatch dashboard with performance metrics
- 8 CloudWatch alarms for performance thresholds
- SNS topic for alert notifications
- Log group for application logs

### 2. Test Integration

```bash
npm run aws:test
```

This sends test metrics to verify the setup is working.

## Usage

### Server-Side Metrics

```typescript
import { getCloudWatchMonitoring } from '@/lib/aws';

const monitoring = getCloudWatchMonitoring();

// Send a metric
await monitoring.putMetric({
  namespace: 'Huntaze/Performance',
  metricName: 'PageLoadTime',
  value: 1500,
  unit: 'Milliseconds',
  dimensions: {
    Page: '/dashboard',
    Environment: 'production',
  },
});

// Log an event
await monitoring.logEvent({
  level: 'ERROR',
  message: 'API request failed',
  context: {
    endpoint: '/api/users',
    statusCode: 500,
  },
});
```

### Client-Side Metrics

```typescript
import { sendMetric, sendMetricsBatch } from '@/lib/aws';

// Send single metric
await sendMetric({
  metricName: 'LCP',
  value: 2000,
  unit: 'Milliseconds',
  dimensions: {
    Page: window.location.pathname,
  },
});

// Send multiple metrics
await sendMetricsBatch([
  { metricName: 'LCP', value: 2000, unit: 'Milliseconds' },
  { metricName: 'FID', value: 50, unit: 'Milliseconds' },
  { metricName: 'CLS', value: 0.05, unit: 'Count' },
]);
```

## Metrics

### Core Web Vitals
- **LCP** (Largest Contentful Paint) - Target: < 2500ms
- **FID** (First Input Delay) - Target: < 100ms
- **CLS** (Cumulative Layout Shift) - Target: < 0.1
- **TTFB** (Time to First Byte) - Target: < 800ms
- **FCP** (First Contentful Paint) - Target: < 1800ms

### Performance Metrics
- **PageLoadTime** - Target: < 3000ms
- **APIResponseTime** - Target: < 2000ms
- **CacheHitRate** - Target: > 70%
- **ErrorRate** - Target: < 5%
- **MemoryUsage** - Target: < 85%

## Alarms

The following alarms are configured:

| Alarm | Threshold | Evaluation Periods |
|-------|-----------|-------------------|
| High LCP | > 2500ms | 2 |
| High FID | > 100ms | 2 |
| High CLS | > 0.1 | 2 |
| Slow Page Load | > 3000ms | 2 |
| Slow API Response | > 2000ms | 2 |
| High Error Rate | > 5% | 2 |
| Low Cache Hit Rate | < 70% | 3 |
| High Memory Usage | > 85% | 2 |

## Dashboard

View your performance dashboard:
```
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=Huntaze-Performance-Dashboard
```

## API Endpoints

### POST /api/metrics
Send a single metric from the client.

**Request:**
```json
{
  "metricName": "LCP",
  "value": 2000,
  "unit": "Milliseconds",
  "dimensions": {
    "Page": "/dashboard"
  }
}
```

### POST /api/metrics/batch
Send multiple metrics in a batch.

**Request:**
```json
{
  "metrics": [
    {
      "metricName": "LCP",
      "value": 2000,
      "unit": "Milliseconds"
    },
    {
      "metricName": "FID",
      "value": 50,
      "unit": "Milliseconds"
    }
  ]
}
```

## Environment Variables

```bash
# Required
AWS_ACCESS_KEY_ID=REDACTED-access-key
AWS_SECRET_ACCESS_KEY=REDACTED-secret-key
AWS_REGION=us-east-1

# Optional
AWS_SESSION_TOKEN=REDACTED-session-token  # for temporary credentials
ALERT_EMAIL=your-email@example.com    # for SNS notifications
```

## Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  /api/metrics   │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│   CloudWatch    │
│   Monitoring    │
└──────┬──────────┘
       │
       ├─► CloudWatch Metrics
       ├─► CloudWatch Logs
       └─► SNS Alerts
```

## Troubleshooting

### Metrics not appearing
- Wait 1-2 minutes for metrics to propagate
- Check AWS credentials are valid
- Verify region is correct

### Alarms in INSUFFICIENT_DATA state
- This is normal for new alarms
- Alarms need data points to evaluate
- Send test metrics to populate data

### Log events failing
- Ensure log group and stream are created
- Call `monitoring.initialize()` before logging
- Check CloudWatch Logs permissions

## Related Documentation

- [CloudWatch Metrics](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/working_with_metrics.html)
- [CloudWatch Alarms](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/AlarmThatSendsEmail.html)
- [CloudWatch Logs](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/WhatIsCloudWatchLogs.html)
