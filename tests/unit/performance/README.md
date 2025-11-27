# Performance Testing Infrastructure

This directory contains the performance testing infrastructure for the Huntaze application. The infrastructure includes automated performance audits, bundle size analysis, Web Vitals tracking, and CI/CD integration.

## Overview

The performance testing infrastructure validates:
- **Lighthouse scores** > 90 for all pages
- **Bundle sizes** < 200KB per chunk
- **Web Vitals** meet Core Web Vitals thresholds
- **Performance budgets** are not exceeded

## Components

### 1. Lighthouse CI

Automated Lighthouse audits that run on every PR and push to main/develop branches.

**Configuration**: `lighthouserc.config.js`

**Usage**:
```bash
# Run Lighthouse audit
npm run lighthouse

# Collect metrics only
npm run lighthouse:collect

# Assert against budgets
npm run lighthouse:assert
```

**Thresholds**:
- Performance score: > 90
- First Contentful Paint (FCP): < 2000ms
- Largest Contentful Paint (LCP): < 2500ms
- Cumulative Layout Shift (CLS): < 0.1
- Total Blocking Time (TBT): < 300ms

### 2. Bundle Size Analysis

Analyzes Next.js bundle composition and identifies optimization opportunities.

**Script**: `scripts/bundle-size-analysis.ts`

**Usage**:
```bash
# Analyze bundle sizes
npm run analyze:bundle
```

**Features**:
- Scans `.next/static` directory for all JS/CSS files
- Calculates gzipped sizes
- Identifies oversized chunks (> 200KB)
- Provides optimization recommendations
- Checks compression ratios

**Output**:
```
📊 Overall Statistics:
   Total Size: 450.23 KB
   Total Gzipped: 156.78 KB
   Compression Ratio: 34.8%
   Total Files: 12

📦 Top 10 Largest Files:
   1. vendor.js
      Size: 250.45 KB (87.32 KB gzipped)
   ...

💡 Recommendations:
   - Consider code splitting for large chunks
   - Optimize compression for poorly compressed files
```

### 3. Performance Budget Validation

Validates bundle sizes and performance metrics against defined budgets.

**Script**: `scripts/performance-budget.ts`

**Usage**:
```bash
# Validate performance budgets
npm run validate:budget
```

**Budgets**:
- JS total: 500KB (error)
- JS main chunk: 200KB (error)
- JS vendor chunk: 300KB (warn)
- CSS total: 100KB (error)
- Images total: 1MB (warn)
- Bundle total: 2MB (error)

**Exit Codes**:
- `0`: All budgets passed
- `1`: Budget violations detected

### 4. Web Vitals E2E Testing

Captures and validates Web Vitals metrics in end-to-end tests using Playwright.

**Script**: `scripts/web-vitals-e2e.ts`

**Usage**:
```bash
# Run Web Vitals E2E tests
npm run test:web-vitals

# With custom base URL
BASE_URL=https://staging.huntaze.com npm run test:web-vitals
```

**Metrics Tracked**:
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- First Input Delay (FID)
- Cumulative Layout Shift (CLS)
- Time to First Byte (TTFB)
- Interaction to Next Paint (INP)

**Thresholds**:
- FCP: good < 1800ms, poor > 3000ms
- LCP: good < 2500ms, poor > 4000ms
- FID: good < 100ms, poor > 300ms
- CLS: good < 0.1, poor > 0.25
- TTFB: good < 800ms, poor > 1800ms
- INP: good < 200ms, poor > 500ms

**Output**:
```
📊 Testing http://localhost:3000...
✅ Grade: GOOD
   Metrics:
     FCP: 1245.67 ms
     LCP: 2134.89 ms
     FID: 45.23 ms
     CLS: 0.045
     TTFB: 567.12 ms
```

## CI/CD Integration

### GitHub Actions Workflow

**File**: `.github/workflows/performance-ci.yml`

**Jobs**:
1. **lighthouse-audit**: Runs Lighthouse CI on all pages
2. **bundle-size-check**: Analyzes bundle sizes and validates budgets
3. **web-vitals-e2e**: Runs Web Vitals E2E tests
4. **performance-summary**: Aggregates results and posts summary

**Triggers**:
- Pull requests to `main` or `develop`
- Pushes to `main` or `develop`

**Artifacts**:
- Lighthouse results (`.lighthouseci/`)
- Bundle analysis (`.next/analyze/`)
- Web Vitals results (`test-results/`)

### Running Locally

```bash
# 1. Build the application
npm run build

# 2. Run all performance tests
npm run lighthouse
npm run analyze:bundle
npm run validate:budget

# 3. Start server and run Web Vitals tests
npm run start &
npm run test:web-vitals
```

## Test Files

### Unit Tests

**File**: `tests/performance/performance-testing.test.ts`

Tests the performance testing infrastructure itself:
- Bundle size analyzer functionality
- Performance budget validator
- Lighthouse CI configuration
- CI/CD workflow definition

**Run**:
```bash
npm run test:performance
```

## Integration with Existing Tools

### Next.js Build Analysis

The bundle size analyzer integrates with Next.js build output:
```bash
npm run build -- --profile
```

### Webpack Bundle Analyzer

For visual bundle analysis:
```bash
npm install -D @next/bundle-analyzer
```

Add to `next.config.ts`:
```typescript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);
```

Run:
```bash
ANALYZE=true npm run build
```

## Troubleshooting

### Lighthouse CI Fails

**Issue**: Lighthouse CI times out or fails to start server

**Solution**:
1. Increase `startServerReadyTimeout` in `lighthouserc.config.js`
2. Check that port 3000 is available
3. Verify build completes successfully

### Bundle Size Analysis Shows No Files

**Issue**: `npm run analyze:bundle` reports no bundles found

**Solution**:
1. Run `npm run build` first
2. Check that `.next/static` directory exists
3. Verify build completed without errors

### Web Vitals E2E Tests Fail

**Issue**: Web Vitals tests report poor metrics

**Solution**:
1. Check that server is running (`npm run start`)
2. Verify network conditions (tests use throttling)
3. Review specific failing metrics and optimize accordingly

### CI/CD Pipeline Fails

**Issue**: GitHub Actions workflow fails

**Solution**:
1. Check workflow logs for specific error
2. Verify all dependencies are installed
3. Check that secrets are configured (if using LHCI_GITHUB_APP_TOKEN)

## Best Practices

1. **Run tests locally** before pushing to ensure they pass in CI
2. **Monitor trends** over time to catch performance regressions early
3. **Set realistic budgets** based on your application's needs
4. **Optimize iteratively** - focus on the biggest wins first
5. **Document changes** that affect performance in PR descriptions

## Performance Optimization Workflow

1. **Identify issues**: Run Lighthouse and bundle analysis
2. **Set budgets**: Define acceptable thresholds
3. **Implement fixes**: Code splitting, lazy loading, compression
4. **Validate**: Run tests to confirm improvements
5. **Monitor**: Track metrics in production

## Related Documentation

- [Performance Optimization Design](../../.kiro/specs/performance-optimization-aws/design.md)
- [Performance Requirements](../../.kiro/specs/performance-optimization-aws/requirements.md)
- [AWS Infrastructure Setup](../../.kiro/specs/performance-optimization-aws/AWS-SETUP-GUIDE.md)

## Support

For questions or issues with the performance testing infrastructure:
1. Check this README
2. Review test output and error messages
3. Consult the design document for context
4. Ask in the team chat or create an issue
