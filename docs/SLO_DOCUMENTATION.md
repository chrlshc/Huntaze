# Service Level Objectives (SLOs) Documentation

## Overview

This document defines the Service Level Objectives (SLOs) for the Huntaze Onboarding System. SLOs are measurable targets that define the expected performance and reliability of the system.

## SLO Definitions

### Latency SLOs

#### API Latency - GET /api/onboarding
- **Target:** p95 < 300ms
- **Threshold:** p95 < 500ms (warning)
- **Window:** 5 minutes
- **Severity:** Warning

#### API Latency - PATCH /api/onboarding/steps/:id
- **Target:** p95 < 300ms
- **Threshold:** p95 < 500ms (warning)
- **Window:** 5 minutes
- **Severity:** Warning

#### API Latency - POST /api/onboarding/snooze
- **Target:** p95 < 300ms
- **Threshold:** p95 < 500ms (warning)
- **Window:** 5 minutes
- **Severity:** Warning

### Error Rate SLOs

#### 5xx Error Rate
- **Target:** < 0.5% of requests
- **Threshold:** < 1% (warning)
- **Window:** 5 minutes
- **Severity:** Critical

#### 4xx Error Rate
- **Target:** < 5% of requests
- **Threshold:** < 10% (warning)
- **Window:** 5 minutes
- **Severity:** Warning

### Availability SLO

#### System Availability
- **Target:** > 99.9% uptime
- **Threshold:** > 99.5% (warning)
- **Window:** 30 days
- **Severity:** Critical
- **Allowed Downtime:** ~43 minutes per month


### Performance SLOs

#### Gating 409 Rate
- **Target:** < 10% of requests
- **Threshold:** < 20% (warning)
- **Window:** 10 minutes
- **Severity:** Warning
- **Note:** High rates may indicate UX issues

#### Cache Hit Rate
- **Target:** > 80%
- **Threshold:** > 60% (warning)
- **Window:** 15 minutes
- **Severity:** Warning

#### Analytics Drop Rate
- **Target:** < 5%
- **Threshold:** < 10% (warning)
- **Window:** 15 minutes
- **Severity:** Warning

## Error Budget

### Calculation Method
We use consumption-based error budgets. Each SLO has an allocated error budget that represents acceptable downtime or errors.

### Budget Allocation

#### Availability Budget
- **Period:** 30 days
- **Budget:** 0.1% downtime (43 minutes)
- **Policy:** Freeze deployments when exhausted

#### Error Rate Budget
- **Period:** 30 days
- **Budget:** 0.5% error rate
- **Policy:** Notify product team at 50% consumption

## Monitoring & Alerting

### Critical Alerts (PagerDuty)
- 5xx error rate > 1% for 5 minutes
- Availability < 99% for 10 minutes

### Warning Alerts (Slack)
- p95 latency > 500ms for 10 minutes
- 409 rate > 20% for 10 minutes
- Cache hit rate < 60% for 15 minutes
- Analytics drop rate > 10% for 15 minutes

## Usage

### Loading SLO Configuration

```typescript
import { sloTracker } from '@/lib/slo-tracker';

// Get all SLOs
const slos = sloTracker.getSLOs();

// Get specific SLO
const latencySLO = sloTracker.getSLO('api_latency_get_onboarding');
```

### Calculating Compliance

```typescript
// Calculate compliance for a metric
const metrics = sloTracker.calculateCompliance(
  'api_latency_get_onboarding',
  285,  // current p95 latency in ms
  10000 // total requests
);

console.log(metrics.compliance);  // 100 (target met)
console.log(metrics.status);      // 'healthy'
```

### Generating Reports

```typescript
// Generate SLO report
const allMetrics = [
  sloTracker.calculateCompliance('api_latency_get_onboarding', 285, 10000),
  sloTracker.calculateCompliance('error_rate_5xx', 25, 10000),
  // ... more metrics
];

const report = sloTracker.generateReport(allMetrics);
console.log(report.overall_compliance);  // 98.5%
console.log(report.recommendations);     // Array of recommendations
```

## Resources

- **Dashboard:** https://grafana.huntaze.com/d/onboarding
- **Runbook:** https://docs.huntaze.com/runbooks/onboarding
- **Incident Response:** https://docs.huntaze.com/incident-response
