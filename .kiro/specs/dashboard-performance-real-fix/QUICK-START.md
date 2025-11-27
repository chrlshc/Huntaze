# Quick Start Guide - Dashboard Performance Tools

## Measure Current Performance

```bash
# Run diagnostic on your dashboard
npm run diagnostic:baseline

# View results
cat .kiro/specs/dashboard-performance-real-fix/baseline-snapshot.json
```

## Measure Optimization Impact

```bash
# After implementing optimizations
npm run measure:impact

# Generates before/after comparison report
```

## Monitor Performance in Development

```bash
# Start dev server with monitoring
npm run dev

# Visit /diagnostics page to see real-time metrics
```

## Test All Optimizations

```bash
# Run all property tests
npm test -- tests/unit/properties

# Run specific optimization tests
npm test -- tests/unit/properties/cache
npm test -- tests/unit/properties/database
```

## AWS Infrastructure Audit

```bash
# Check AWS services health
npm run aws:audit

# Generates infrastructure health report
```

## Database Query Analysis

```bash
# Detect N+1 queries
npm run db:detect-n-plus-one

# Analyze query performance
npm run db:analyze-queries
```

## Key Files

- `lib/diagnostics/` - Performance measurement
- `lib/cache/` - Caching system
- `lib/database/` - Query optimization
- `lib/monitoring/` - Production monitoring
- `lib/aws/` - AWS integrations

## Documentation

See PROJECT-COMPLETE.md for full details.
