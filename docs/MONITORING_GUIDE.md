# Monitoring & Observability Guide

This guide explains how to use the monitoring and alerting system for Social Integrations.

## Overview

The monitoring system provides:
- **Structured Logging**: All events are logged with correlation IDs and context
- **Metrics Collection**: Key performance indicators are tracked in real-time
- **Dashboards**: Visual representation of system health
- **Alerts**: Automated notifications when issues are detected

## Accessing the Dashboard

Visit `/monitoring` to view the monitoring dashboard.

The dashboard shows:
- OAuth flow success rates by platform
- Upload success rates over time
- Webhook processing metrics
- Token refresh status
- Active alerts
- Recent events

## Metrics Collected

### OAuth Metrics
- `oauth.success` - Successful OAuth flows
- `oauth.failure` - Failed OAuth attempts

### Upload Metrics
- `upload.success` - Successful content uploads
- `upload.failure` - Failed upload attempts

### Webhook Metrics
- `webhook.received` - Webhooks received
- `webhook.processed` - Webhooks processed
- `webhook.latency` - Processing time in milliseconds

### Token Refresh Metrics
- `token.refresh.success` - Successful token refreshes
- `token.refresh.failure` - Failed token refresh attempts

### API Metrics
- `api.call` - API calls made
- `api.latency` - API response times

### Worker Metrics
- `worker.run` - Worker executions
- `worker.duration` - Worker execution time

## Alerts

The system monitors for the following conditions:

### High Error Rate (ERROR)
Triggers when upload error rate exceeds 5% (with minimum 10 attempts)

### Token Refresh Failures (CRITICAL)
Triggers when more than 3 token refresh failures occur

### High Webhook Latency (WARNING)
Triggers when average webhook processing time exceeds 5 seconds

### OAuth Failures (ERROR)
Triggers when more than 5 OAuth failures occur

## Alert Notifications

Alerts can be sent to multiple channels:

### Slack Integration
Set `SLACK_WEBHOOK_URL` in your environment:

```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

Alerts will be posted to the configured Slack channel with color-coded severity:
- 🟡 WARNING - Yellow
- 🔴 ERROR - Red
- 🔴 CRITICAL - Dark Red

### Email Notifications (TODO)
Configure AWS SES to send email alerts:

```bash
ALERT_EMAIL_TO=ops@example.com
```

### PagerDuty Integration (TODO)
For critical alerts, integrate with PagerDuty:

```bash
PAGERDUTY_API_KEY=your-api-key
PAGERDUTY_SERVICE_ID=your-service-id
```

## Running the Alert Checker

The alert checker runs periodically to evaluate alert conditions:

```bash
# Run manually
node scripts/run-alert-checker.js

# Configure check interval (seconds)
ALERT_CHECK_INTERVAL=60 node scripts/run-alert-checker.js
```

Or trigger via API:

```bash
curl -X POST http://localhost:3000/api/workers/alert-checker
```

## API Endpoints

### Get Metrics
```bash
GET /api/monitoring/metrics
```

Returns current metrics and summary.

### Get Alerts
```bash
GET /api/monitoring/alerts
GET /api/monitoring/alerts?includeResolved=true
```

Returns active (or all) alerts.

### Resolve Alert
```bash
POST /api/monitoring/alerts
Content-Type: application/json

{
  "alertId": "alert_id_here"
}
```

Manually resolve an alert.

### Trigger Alert Check
```bash
POST /api/workers/alert-checker
```

Manually trigger alert condition checking.

## Structured Logging

All logs include:
- `timestamp` - ISO 8601 timestamp
- `level` - Log level (info, warn, error)
- `message` - Human-readable message
- `context` - Additional structured data
- `correlationId` - Request correlation ID (when applicable)

Sensitive data (tokens, passwords) is automatically redacted.

### Log Levels

- **INFO**: Normal operations (OAuth success, uploads, etc.)
- **WARN**: Potential issues (high latency, retries)
- **ERROR**: Errors that need attention (API failures, validation errors)

### Example Log Entry

```json
{
  "timestamp": "2024-11-01T12:00:00.000Z",
  "level": "info",
  "message": "OAuth flow completed",
  "context": {
    "platform": "tiktok",
    "userId": "user_123",
    "correlationId": "req_abc123"
  }
}
```

## Production Recommendations

### CloudWatch Integration
Send metrics to AWS CloudWatch:

```typescript
// In lib/utils/metrics.ts
if (process.env.NODE_ENV === 'production') {
  // Send to CloudWatch
  await cloudwatch.putMetricData({
    Namespace: 'SocialIntegrations',
    MetricData: [{
      MetricName: metric,
      Value: value,
      Timestamp: new Date(),
      Dimensions: Object.entries(tags || {}).map(([Name, Value]) => ({
        Name,
        Value,
      })),
    }],
  });
}
```

### Datadog Integration
Send metrics to Datadog:

```typescript
import { StatsD } from 'hot-shots';

const statsd = new StatsD({
  host: process.env.DATADOG_HOST,
  port: 8125,
});

statsd.increment(metric, tags);
```

### Log Aggregation
Use a log aggregation service:
- AWS CloudWatch Logs
- Datadog Logs
- Splunk
- ELK Stack

### Alert Escalation
Configure alert escalation policies:
1. First alert → Slack notification
2. After 5 minutes → Email to on-call
3. After 15 minutes → PagerDuty incident

## Troubleshooting

### No Metrics Showing
- Check that the application is running
- Verify metrics are being recorded (check logs)
- Ensure `/api/monitoring/metrics` endpoint is accessible

### Alerts Not Triggering
- Verify alert conditions are met
- Check alert checker is running
- Review logs for errors in alert evaluation

### Slack Notifications Not Working
- Verify `SLACK_WEBHOOK_URL` is set correctly
- Test webhook URL manually
- Check network connectivity

## Custom Alerts

Add custom alert conditions:

```typescript
import { alertService } from '@/lib/services/alertService';

alertService.addAlertConfig({
  name: 'custom_alert',
  condition: () => {
    // Your condition logic
    return someCondition;
  },
  message: 'Custom alert message',
  severity: 'warning',
});
```

## Metrics Retention

By default, metrics are kept in memory (last 1000 entries).

For production, configure persistent storage:
- Time-series database (InfluxDB, TimescaleDB)
- CloudWatch Metrics
- Datadog
- Prometheus

## Dashboard Customization

The monitoring dashboard can be customized by modifying:
- `app/monitoring/page.tsx` - Dashboard UI
- `app/api/monitoring/metrics/route.ts` - Metrics aggregation
- `lib/services/alertService.ts` - Alert logic

## Best Practices

1. **Monitor What Matters**: Focus on metrics that indicate user impact
2. **Set Realistic Thresholds**: Avoid alert fatigue with too-sensitive alerts
3. **Document Runbooks**: Create runbooks for each alert type
4. **Regular Reviews**: Review and adjust alert thresholds based on actual patterns
5. **Test Alerts**: Regularly test alert notifications work correctly

## Support

For issues or questions about monitoring:
1. Check this guide
2. Review application logs
3. Contact the development team
