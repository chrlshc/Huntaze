# Monitoring & Alerting Configuration

## Overview

This document describes the monitoring and alerting setup for the Huntaze Beta Launch. The system uses AWS CloudWatch for infrastructure monitoring and Vercel Analytics for application monitoring.

---

## Monitoring Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Next.js    │  │  API Routes  │  │   Database   │     │
│  │   Frontend   │  │   Backend    │  │  PostgreSQL  │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    Monitoring Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Vercel     │  │  CloudWatch  │  │  CloudWatch  │     │
│  │  Analytics   │  │    Metrics   │  │     Logs     │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                     Alerting Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  CloudWatch  │  │     SNS      │  │    Email/    │     │
│  │    Alarms    │  │    Topics    │  │    Slack     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## CloudWatch Metrics

### Application Metrics

**Custom Metrics Namespace:** `Huntaze/Beta`

| Metric Name | Unit | Description | Target |
|-------------|------|-------------|--------|
| `APIResponseTime` | Milliseconds | API endpoint response time | < 500ms |
| `APIErrorRate` | Percent | Percentage of failed API requests | < 1% |
| `CacheHitRate` | Percent | Cache hit ratio | > 80% |
| `DatabaseConnections` | Count | Active database connections | < 80% of max |
| `UserRegistrations` | Count | New user registrations per hour | - |
| `EmailsSent` | Count | Verification emails sent | - |
| `OAuthConnections` | Count | Successful OAuth connections | - |

### Infrastructure Metrics

**CloudFront Metrics:**
- `Requests` - Total requests
- `BytesDownloaded` - Data transferred
- `4xxErrorRate` - Client errors
- `5xxErrorRate` - Server errors
- `OriginLatency` - Origin response time
- `CacheHitRate` - CloudFront cache efficiency

**Lambda@Edge Metrics:**
- `Invocations` - Function executions
- `Errors` - Function errors
- `Duration` - Execution time
- `Throttles` - Rate limit hits

**S3 Metrics:**
- `NumberOfObjects` - Total objects stored
- `BucketSizeBytes` - Storage used
- `AllRequests` - Total requests
- `4xxErrors` - Client errors
- `5xxErrors` - Server errors

---

## CloudWatch Alarms

### Critical Alarms (P0)

**1. High Error Rate**
```yaml
AlarmName: huntaze-beta-high-error-rate
MetricName: APIErrorRate
Namespace: Huntaze/Beta
Statistic: Average
Period: 300  # 5 minutes
EvaluationPeriods: 2
Threshold: 1.0  # 1%
ComparisonOperator: GreaterThanThreshold
TreatMissingData: notBreaching
AlarmActions:
  - arn:aws:sns:us-east-1:ACCOUNT:huntaze-critical-alerts
```

**2. Service Down**
```yaml
AlarmName: huntaze-beta-service-down
MetricName: 5xxErrorRate
Namespace: AWS/CloudFront
Statistic: Average
Period: 60  # 1 minute
EvaluationPeriods: 2
Threshold: 5.0  # 5%
ComparisonOperator: GreaterThanThreshold
TreatMissingData: breaching
AlarmActions:
  - arn:aws:sns:us-east-1:ACCOUNT:huntaze-critical-alerts
```

**3. Database Connection Pool Exhausted**
```yaml
AlarmName: huntaze-beta-db-connections-high
MetricName: DatabaseConnections
Namespace: Huntaze/Beta
Statistic: Maximum
Period: 300  # 5 minutes
EvaluationPeriods: 1
Threshold: 80  # 80% of max connections
ComparisonOperator: GreaterThanThreshold
TreatMissingData: notBreaching
AlarmActions:
  - arn:aws:sns:us-east-1:ACCOUNT:huntaze-critical-alerts
```

### High Priority Alarms (P1)

**4. High API Latency**
```yaml
AlarmName: huntaze-beta-high-latency
MetricName: APIResponseTime
Namespace: Huntaze/Beta
Statistic: Average
Period: 300  # 5 minutes
EvaluationPeriods: 3
Threshold: 1000  # 1 second
ComparisonOperator: GreaterThanThreshold
TreatMissingData: notBreaching
AlarmActions:
  - arn:aws:sns:us-east-1:ACCOUNT:huntaze-high-priority-alerts
```

**5. Low Cache Hit Rate**
```yaml
AlarmName: huntaze-beta-low-cache-hit-rate
MetricName: CacheHitRate
Namespace: Huntaze/Beta
Statistic: Average
Period: 900  # 15 minutes
EvaluationPeriods: 2
Threshold: 70  # 70%
ComparisonOperator: LessThanThreshold
TreatMissingData: notBreaching
AlarmActions:
  - arn:aws:sns:us-east-1:ACCOUNT:huntaze-high-priority-alerts
```

**6. Lambda@Edge Errors**
```yaml
AlarmName: huntaze-beta-lambda-errors
MetricName: Errors
Namespace: AWS/Lambda
Statistic: Sum
Period: 300  # 5 minutes
EvaluationPeriods: 1
Threshold: 10  # 10 errors
ComparisonOperator: GreaterThanThreshold
TreatMissingData: notBreaching
AlarmActions:
  - arn:aws:sns:us-east-1:ACCOUNT:huntaze-high-priority-alerts
```

### Warning Alarms (P2)

**7. Elevated 4xx Error Rate**
```yaml
AlarmName: huntaze-beta-elevated-4xx-errors
MetricName: 4xxErrorRate
Namespace: AWS/CloudFront
Statistic: Average
Period: 900  # 15 minutes
EvaluationPeriods: 2
Threshold: 5.0  # 5%
ComparisonOperator: GreaterThanThreshold
TreatMissingData: notBreaching
AlarmActions:
  - arn:aws:sns:us-east-1:ACCOUNT:huntaze-warning-alerts
```

**8. Email Delivery Issues**
```yaml
AlarmName: huntaze-beta-email-delivery-issues
MetricName: Reputation.BounceRate
Namespace: AWS/SES
Statistic: Average
Period: 3600  # 1 hour
EvaluationPeriods: 1
Threshold: 5.0  # 5%
ComparisonOperator: GreaterThanThreshold
TreatMissingData: notBreaching
AlarmActions:
  - arn:aws:sns:us-east-1:ACCOUNT:huntaze-warning-alerts
```

---

## SNS Topics

### Critical Alerts Topic

**Topic Name:** `huntaze-critical-alerts`
**Subscribers:**
- Email: ops@huntaze.com
- Email: oncall@huntaze.com
- Slack: #incidents (via webhook)
- PagerDuty: (optional)

**Delivery Policy:**
```json
{
  "http": {
    "defaultHealthyRetryPolicy": {
      "minDelayTarget": 20,
      "maxDelayTarget": 20,
      "numRetries": 3,
      "numMaxDelayRetries": 0,
      "numNoDelayRetries": 0,
      "numMinDelayRetries": 0,
      "backoffFunction": "linear"
    },
    "disableSubscriptionOverrides": false
  }
}
```

### High Priority Alerts Topic

**Topic Name:** `huntaze-high-priority-alerts`
**Subscribers:**
- Email: dev@huntaze.com
- Slack: #alerts

### Warning Alerts Topic

**Topic Name:** `huntaze-warning-alerts`
**Subscribers:**
- Email: dev@huntaze.com
- Slack: #monitoring

---

## CloudWatch Dashboards

### Main Dashboard: `huntaze-beta-overview`

**Widgets:**

1. **Service Health (Row 1)**
   - Error Rate (line chart, 1 hour)
   - API Latency (line chart, 1 hour)
   - Request Count (line chart, 1 hour)
   - Cache Hit Rate (line chart, 1 hour)

2. **Performance Metrics (Row 2)**
   - CloudFront Origin Latency (line chart, 1 hour)
   - Database Connections (line chart, 1 hour)
   - Lambda@Edge Duration (line chart, 1 hour)
   - S3 Request Latency (line chart, 1 hour)

3. **Business Metrics (Row 3)**
   - User Registrations (number, 24 hours)
   - Emails Sent (number, 24 hours)
   - OAuth Connections (number, 24 hours)
   - Active Users (number, current)

4. **Error Tracking (Row 4)**
   - 4xx Errors (line chart, 1 hour)
   - 5xx Errors (line chart, 1 hour)
   - Lambda Errors (line chart, 1 hour)
   - Database Errors (line chart, 1 hour)

5. **Alarms Status (Row 5)**
   - All Alarms Status (alarm widget)

### Performance Dashboard: `huntaze-beta-performance`

**Widgets:**

1. **Core Web Vitals**
   - First Contentful Paint (gauge, target < 1.5s)
   - Largest Contentful Paint (gauge, target < 2.5s)
   - First Input Delay (gauge, target < 100ms)
   - Cumulative Layout Shift (gauge, target < 0.1)

2. **API Performance**
   - P50 Response Time (line chart)
   - P95 Response Time (line chart)
   - P99 Response Time (line chart)
   - Slowest Endpoints (table)

3. **Cache Performance**
   - Cache Hit Rate (line chart)
   - Cache Miss Rate (line chart)
   - Cache Evictions (line chart)
   - Cache Size (line chart)

---

## Vercel Analytics

### Real User Monitoring (RUM)

**Metrics Tracked:**
- Page load times
- Time to Interactive (TTI)
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- First Input Delay (FID)

**Pages Monitored:**
- `/` (Landing page)
- `/auth/login`
- `/auth/register`
- `/home`
- `/integrations`
- `/onboarding`

### Function Monitoring

**Metrics Tracked:**
- Execution duration
- Memory usage
- Cold starts
- Error rate
- Invocation count

**Functions Monitored:**
- `/api/auth/register`
- `/api/auth/login`
- `/api/home/stats`
- `/api/integrations/status`
- `/api/integrations/callback/[provider]`

---

## Log Management

### CloudWatch Log Groups

**Application Logs:**
- `/aws/lambda/huntaze-security-headers`
- `/aws/lambda/huntaze-image-optimization`
- `/huntaze/beta/application`
- `/huntaze/beta/api`

**Log Retention:**
- Critical logs: 90 days
- Application logs: 30 days
- Debug logs: 7 days

### Log Insights Queries

**1. Top Errors (Last Hour)**
```sql
fields @timestamp, @message
| filter @message like /ERROR/
| stats count() by @message
| sort count desc
| limit 20
```

**2. Slow API Requests**
```sql
fields @timestamp, request.path, duration
| filter duration > 1000
| sort duration desc
| limit 50
```

**3. Failed Authentication Attempts**
```sql
fields @timestamp, email, reason
| filter @message like /authentication failed/
| stats count() by email
| sort count desc
```

**4. OAuth Connection Errors**
```sql
fields @timestamp, provider, error
| filter @message like /OAuth.*error/
| stats count() by provider, error
```

---

## Alert Response Procedures

### Critical Alert Response (P0)

**Response Time:** < 5 minutes

1. **Acknowledge alert** in Slack/PagerDuty
2. **Check CloudWatch dashboard** for context
3. **Review error logs** for root cause
4. **Assess impact** (users affected, data loss)
5. **Decide:** Fix forward or rollback?
6. **Execute action** (hotfix or rollback)
7. **Monitor recovery**
8. **Post incident report**

### High Priority Alert Response (P1)

**Response Time:** < 15 minutes

1. **Acknowledge alert**
2. **Investigate root cause**
3. **Assess urgency**
4. **Create fix or workaround**
5. **Deploy fix**
6. **Monitor resolution**
7. **Document issue**

### Warning Alert Response (P2)

**Response Time:** < 1 hour

1. **Review alert details**
2. **Investigate if pattern**
3. **Create ticket if needed**
4. **Schedule fix**
5. **Update monitoring if false positive**

---

## Monitoring Best Practices

### 1. Alert Fatigue Prevention

- Set appropriate thresholds (not too sensitive)
- Use evaluation periods to avoid flapping
- Implement alert suppression during maintenance
- Review and tune alarms monthly

### 2. Metric Collection

- Collect metrics at appropriate intervals (1-5 minutes)
- Use appropriate statistics (Average, Sum, Maximum)
- Set retention policies based on importance
- Archive historical data for analysis

### 3. Dashboard Design

- Group related metrics together
- Use consistent time ranges
- Include alarm status widgets
- Add annotations for deployments

### 4. Log Management

- Use structured logging (JSON format)
- Include correlation IDs for tracing
- Set appropriate log levels
- Implement log sampling for high-volume logs

---

## Monitoring Checklist

### Daily
- [ ] Review CloudWatch dashboard
- [ ] Check alarm status
- [ ] Review error logs
- [ ] Monitor performance trends

### Weekly
- [ ] Analyze performance trends
- [ ] Review alert history
- [ ] Check log retention
- [ ] Update dashboards if needed

### Monthly
- [ ] Review and tune alarms
- [ ] Analyze cost metrics
- [ ] Archive old logs
- [ ] Update monitoring documentation

---

## Monitoring Costs

**Estimated Monthly Costs (Beta Launch):**

| Service | Usage | Cost |
|---------|-------|------|
| CloudWatch Metrics | 50 custom metrics | $15 |
| CloudWatch Alarms | 10 alarms | $1 |
| CloudWatch Logs | 10 GB ingestion | $5 |
| CloudWatch Dashboards | 3 dashboards | $9 |
| SNS Notifications | 1000 emails/month | $0.50 |
| **Total** | | **~$30/month** |

**Cost Optimization:**
- Use metric filters to reduce custom metrics
- Implement log sampling for high-volume logs
- Set appropriate log retention periods
- Use CloudWatch Insights instead of exporting logs

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-21 | Kiro | Initial monitoring configuration |

