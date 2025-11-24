# Performance Monitoring Quick Reference

## Commands

```bash
# Generate performance report
npm run perf:report

# Check cold start time (exits 0 if < 3s)
npm run perf:cold-start

# Track bundle sizes
npm run perf:bundle

# Start continuous monitoring
npm run perf:monitor

# Run Lighthouse CI
npm run lighthouse:ci

# Run integration tests
npm run test:integration -- tests/integration/performance/performance-monitoring.integration.test.ts --run
```

## Performance Targets

| Metric | Target | Requirement |
|--------|--------|-------------|
| Cold Start Response | < 3s | 5.2 |
| Skeleton Display | < 50ms | 6.1 |
| Skeleton Duration | < 2s | 6.1 |
| Lazy Load Threshold | > 50KB | 7.2 |
| Lighthouse Performance | > 80% | - |
| First Contentful Paint | < 2s | - |
| Largest Contentful Paint | < 3s | - |
| Cumulative Layout Shift | < 0.1 | - |

## Report Locations

```
.kiro/reports/
├── performance-monitoring.json    # Latest performance report
├── bundle-size-history.json       # Bundle size over time
├── performance-log.jsonl          # Continuous monitoring log
└── lighthouse/                    # Lighthouse CI reports
```

## Quick Checks

### Is staging responsive?
```bash
npm run perf:cold-start && echo "✅ Staging is responsive" || echo "❌ Staging is slow"
```

### Has bundle size increased?
```bash
npm run perf:bundle | grep "changed by"
```

### Are all performance tests passing?
```bash
npm run test:integration -- tests/integration/performance --run
```

## Troubleshooting

### Cold start too slow
1. Check staging server status
2. Verify ping service is running
3. Review network latency

### Bundle size increased
1. Check recent dependency changes
2. Verify lazy loading configuration
3. Run bundle analyzer

### Lighthouse score dropped
1. Review specific failing metrics
2. Check for new blocking resources
3. Verify production build optimization

## Monitoring Setup

### Local Development
```bash
# Terminal 1: Run dev server
npm run dev

# Terminal 2: Monitor performance
npm run perf:monitor
```

### Staging Server
```bash
# Start monitoring as background process
nohup npm run perf:monitor > /var/log/perf-monitor.log 2>&1 &

# Or use PM2
pm2 start npm --name "perf-monitor" -- run perf:monitor
```

### CI/CD Pipeline
```yaml
# Add to GitHub Actions
- run: npm run perf:cold-start
- run: npm run perf:bundle
- run: npm run lighthouse:ci
```

## Key Files

- `.lighthouserc.json` - Lighthouse CI configuration
- `scripts/performance-monitoring.ts` - Monitoring script
- `tests/integration/performance/` - Integration tests
- `lib/services/ping.service.ts` - Cold start prevention

## Environment Variables

```bash
# Set staging URL
export STAGING_URL=https://staging.huntaze.com

# Run monitoring
npm run perf:monitor
```
