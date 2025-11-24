# Performance Monitoring Guide

This guide explains how to use the performance monitoring and validation tools for the Linear UI Performance Refactor.

## Overview

The performance monitoring system tracks:
- **Cold Start Response Times** (Requirement 5.2)
- **Skeleton Screen Display Duration** (Requirement 6.1)
- **Bundle Sizes Over Time** (Requirement 7.4)
- **Lazy Loading Behavior** (Requirement 7.2)

## Quick Start

### 1. Run Performance Report

Generate a comprehensive performance report:

```bash
npm run perf:report
```

This will:
- Measure cold start response time
- Track bundle sizes
- Provide skeleton screen timing guidance
- Suggest running Lighthouse CI

### 2. Monitor Cold Start

Check if staging responds within 3 seconds:

```bash
npm run perf:cold-start
```

Exit code:
- `0` = Success (< 3 seconds)
- `1` = Failure (>= 3 seconds or error)

### 3. Track Bundle Sizes

Track bundle sizes and detect regressions:

```bash
npm run perf:bundle
```

This will:
- Calculate total, initial, and lazy bundle sizes
- Compare with previous measurements
- Alert on >5% changes

### 4. Continuous Monitoring

Start continuous monitoring (runs indefinitely):

```bash
npm run perf:monitor
```

This will:
- Ping staging every 10 minutes to prevent cold starts
- Track bundle sizes every hour
- Log all metrics to `.kiro/reports/performance-log.jsonl`

Press `Ctrl+C` to stop.

## Lighthouse CI

### Setup

Lighthouse CI is configured in `.lighthouserc.json` with performance budgets:

- Performance Score: >= 80%
- First Contentful Paint: <= 2s
- Largest Contentful Paint: <= 3s
- Cumulative Layout Shift: <= 0.1
- Total Blocking Time: <= 300ms

### Run Lighthouse CI

```bash
npm run lighthouse:ci
```

Or use the existing script:

```bash
npm run lighthouse
```

### View Reports

Lighthouse reports are saved to `.kiro/reports/lighthouse/`

## Integration Tests

Run the performance integration tests:

```bash
npm run test:integration -- tests/integration/performance/performance-monitoring.integration.test.ts --run
```

These tests verify:
- Cold start response times are within 3 seconds
- Skeleton screens display immediately
- Lazy loading works correctly
- Performance metrics are tracked

## Performance Metrics

### Cold Start Response Time

**Requirement:** 5.2 - Response within 3 seconds maximum

**How to measure:**
```bash
npm run perf:cold-start
```

**Target:** < 3000ms

**Prevention:**
- Automated ping every 10 minutes
- Circuit breaker pattern for failures
- Retry logic with exponential backoff

### Skeleton Screen Display Duration

**Requirement:** 6.1 - Display skeleton screens during loading

**How to measure:**
- Browser Performance API (client-side)
- Integration tests simulate timing

**Target:** 
- Initial display: < 50ms
- Total duration: < 2s

**Implementation:**
- Skeleton screens render immediately
- No blank screens during loading
- Smooth transition to content

### Bundle Size Tracking

**Requirement:** 7.4 - Track bundle sizes over time

**How to measure:**
```bash
npm run perf:bundle
```

**Targets:**
- Initial bundle: Minimize
- Lazy-loaded: > 50KB components
- Total: Monitor for regressions

**History:**
- Stored in `.kiro/reports/bundle-size-history.json`
- Last 100 measurements kept
- Alerts on >5% changes

### Lazy Loading Behavior

**Requirement:** 7.2 - Defer loading of invisible components

**How to verify:**
- Integration tests check deferred loading
- Bundle analysis confirms lazy chunks
- Performance tests measure async loading

**Targets:**
- Components > 50KB lazy loaded
- No blocking on main thread
- Fallback UI during loading

## Reports and Logs

### Performance Report

Location: `.kiro/reports/performance-monitoring.json`

Contains:
- Timestamp
- Cold start time
- Bundle sizes
- Lighthouse scores (when available)

### Bundle Size History

Location: `.kiro/reports/bundle-size-history.json`

Contains:
- Historical bundle size measurements
- Component-level breakdown
- Lazy vs initial split

### Performance Log

Location: `.kiro/reports/performance-log.jsonl`

Contains:
- Continuous monitoring events
- Cold start ping results
- Failures and alerts

Format: JSON Lines (one JSON object per line)

## CI/CD Integration

### GitHub Actions

Add to your workflow:

```yaml
- name: Performance Monitoring
  run: |
    npm run perf:cold-start
    npm run perf:bundle
    npm run lighthouse:ci
```

### Pre-deployment Checks

Before deploying to staging:

```bash
# Check cold start
npm run perf:cold-start || echo "Warning: Cold start check failed"

# Check bundle size
npm run perf:bundle

# Run Lighthouse
npm run lighthouse:ci
```

### Continuous Monitoring

On staging server:

```bash
# Start monitoring in background
nohup npm run perf:monitor > /var/log/performance-monitor.log 2>&1 &
```

Or use a process manager like PM2:

```bash
pm2 start npm --name "perf-monitor" -- run perf:monitor
```

## Troubleshooting

### Cold Start Monitoring Fails

**Symptom:** `npm run perf:cold-start` returns error

**Solutions:**
1. Check staging URL is accessible
2. Verify `/api/health` endpoint exists
3. Check network connectivity
4. Review timeout settings (3s default)

### Bundle Size Regression

**Symptom:** Bundle size increased >5%

**Solutions:**
1. Review recent changes
2. Check for new dependencies
3. Verify lazy loading is working
4. Run bundle analyzer: `npm run analyze`

### Lighthouse CI Fails

**Symptom:** Lighthouse scores below thresholds

**Solutions:**
1. Review specific failing metrics
2. Check network throttling settings
3. Verify build is production-optimized
4. Review Lighthouse report for recommendations

### Skeleton Screens Not Displaying

**Symptom:** Blank screens during loading

**Solutions:**
1. Verify SkeletonScreen components are imported
2. Check loading states are properly managed
3. Review Suspense boundaries
4. Test with network throttling

## Best Practices

### 1. Regular Monitoring

- Run `npm run perf:report` weekly
- Monitor cold start times daily
- Track bundle sizes on every build
- Run Lighthouse CI on every PR

### 2. Performance Budgets

Set and enforce budgets:
- Cold start: < 3s
- Initial bundle: < 200KB
- Lazy chunks: > 50KB
- Lighthouse performance: > 80

### 3. Alerting

Set up alerts for:
- 3+ consecutive cold start failures
- Bundle size increases > 10%
- Lighthouse score drops > 5 points
- Response times > 5s

### 4. Documentation

Document:
- Performance optimization decisions
- Bundle size changes
- Lazy loading strategy
- Monitoring setup

## Environment Variables

### STAGING_URL

The staging URL to monitor.

**Default:** `https://staging.huntaze.com`

**Usage:**
```bash
STAGING_URL=https://my-staging.com npm run perf:monitor
```

## Related Documentation

- [Lazy Loading Guide](../../../components/performance/LAZY_LOADING_GUIDE.md)
- [Skeleton Screen Guide](../../../components/layout/SkeletonScreen.README.md)
- [Bundle Analysis Guide](../../../scripts/analyze-bundle-size.ts)
- [Ping Service Documentation](../../../lib/services/ping.service.README.md)

## Support

For issues or questions:
1. Check integration tests for examples
2. Review performance logs in `.kiro/reports/`
3. Consult the design document for requirements
4. Check Lighthouse reports for specific recommendations
