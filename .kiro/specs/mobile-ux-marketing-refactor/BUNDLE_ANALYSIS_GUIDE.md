# Bundle Analysis Guide

## Overview

This guide explains how to use the bundle analyzer to monitor and optimize JavaScript bundle sizes for the Huntaze application. As per **Requirement 2.5**, initial JS bundles must remain under 200KB to ensure fast Time to Interactive (TTI).

## Quick Start

### 1. Analyze Bundle Composition

To visualize what's inside your bundles:

```bash
npm run build:analyze
```

This will:
- Build the application with webpack
- Generate interactive HTML reports showing bundle composition
- Open two browser windows:
  - Client bundle analysis
  - Server bundle analysis

### 2. Verify Bundle Sizes

To check if bundles meet the 200KB requirement:

```bash
npm run build && npm run bundle:verify
```

This will:
- Analyze all generated bundles
- Identify initial bundles (main, framework, webpack chunks)
- Report any bundles exceeding 200KB
- Provide optimization recommendations

## Understanding the Reports

### Bundle Analyzer Visualization

The interactive report shows:
- **Treemap View**: Visual representation of bundle composition
- **Module Sizes**: Parsed, gzipped, and stat sizes
- **Dependencies**: Which packages contribute to bundle size

**Key Metrics:**
- **Stat Size**: Original file size
- **Parsed Size**: Size after minification
- **Gzipped Size**: Size after compression (what users download)

### Bundle Verification Output

Example output:

```
🔍 Analyzing bundle sizes...

📦 Initial Bundle Analysis:
──────────────────────────────────────────────────────────────────────
✅ main-abc123.js                          145.32 KB
✅ framework-xyz789.js                     178.45 KB
✅ webpack-def456.js                       52.18 KB
──────────────────────────────────────────────────────────────────────
📊 Total Initial Bundle Size: 375.95 KB
🎯 Target: Each bundle < 200KB

✅ SUCCESS: All initial bundles are within the 200KB limit!
```

## Optimization Strategies

### 1. Dynamic Imports

For heavy components not needed immediately:

```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false, // Defer to client-side
});
```

### 2. Code Splitting by Route

Next.js automatically splits code by route. Ensure heavy features are in separate routes:

```
app/
  (marketing)/     # Lightweight, SEO-focused
  (app)/          # Feature-rich, code-split
```

### 3. Dependency Optimization

**Check dependency sizes:**
```bash
npm run build:analyze
```

**Common optimizations:**
- Use `lucide-react` instead of `react-icons` (smaller)
- Import specific lodash functions: `import debounce from 'lodash/debounce'`
- Use `date-fns` instead of `moment` (tree-shakeable)

### 4. Tree Shaking

Ensure imports are tree-shakeable:

```typescript
// ❌ Bad: Imports entire library
import _ from 'lodash';

// ✅ Good: Imports only what's needed
import { debounce } from 'lodash';
```

### 5. Remove Unused Dependencies

```bash
# Find unused dependencies
npx depcheck

# Remove them
npm uninstall <package-name>
```

## Performance Budget

| Bundle Type | Target Size | Max Size | Status |
|------------|-------------|----------|--------|
| Main | < 150KB | 200KB | ✅ |
| Framework | < 180KB | 200KB | ✅ |
| Page Chunks | < 100KB | 200KB | ✅ |

## CI/CD Integration

### GitHub Actions

Add to your workflow:

```yaml
- name: Build and Verify Bundle Sizes
  run: |
    npm run build
    npm run bundle:verify
```

This will fail the build if any bundle exceeds 200KB.

### Amplify Build

Already integrated in `amplify.yml`:

```yaml
build:
  commands:
    - npm run build
    - npm run bundle:verify
```

## Monitoring

### Regular Checks

Run bundle analysis:
- **Weekly**: During development sprints
- **Before releases**: To catch regressions
- **After adding dependencies**: To assess impact

### Alerts

The verification script will:
- ✅ Exit with code 0 if all bundles are within limits
- ❌ Exit with code 1 if any bundle exceeds 200KB
- 📊 Provide detailed breakdown and recommendations

## Troubleshooting

### Bundle Too Large

1. **Identify the culprit:**
   ```bash
   npm run build:analyze
   ```

2. **Check for duplicate dependencies:**
   ```bash
   npm ls <package-name>
   ```

3. **Consider alternatives:**
   - Heavy animation library → CSS animations
   - Large UI library → Shadcn/UI (copy-paste components)
   - Moment.js → date-fns

### Build Fails

If `npm run build:analyze` fails:

1. **Clear cache:**
   ```bash
   rm -rf .next
   npm run build:analyze
   ```

2. **Check for webpack errors:**
   ```bash
   npm run build -- --debug
   ```

## Best Practices

1. **Measure before optimizing**: Use the analyzer to identify actual problems
2. **Lazy load below-the-fold**: Use dynamic imports for non-critical components
3. **Monitor regularly**: Add bundle verification to your CI/CD pipeline
4. **Document decisions**: Note why certain dependencies are included
5. **Review dependencies**: Audit new packages before adding them

## Related Requirements

- **Requirement 2.1**: Dynamic imports for below-the-fold sections
- **Requirement 2.2**: Defer heavy components with `ssr: false`
- **Requirement 2.5**: Initial JS bundles under 200KB

## Resources

- [Next.js Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
- [Webpack Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)
- [Next.js Performance Optimization](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web.dev Performance Budget](https://web.dev/performance-budgets-101/)
