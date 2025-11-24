# Lazy Loading Optimization Guide

## Overview

This guide documents the lazy loading optimization implemented for heavy components (>50KB) to improve initial page load performance.

## Requirements

- **7.1**: Identify heavy components (charts, editors) and load them using dynamic imports
- **7.2**: Defer loading of components not immediately visible until needed
- **7.3**: Load heavy components asynchronously without blocking the main thread
- **7.4**: Mark all components exceeding 50KB as candidates for lazy loading

## Heavy Components Identified

### 1. PhoneMockup3D (~950KB)
- **Dependencies**: @react-three/fiber, @react-three/drei, three
- **Reason**: Three.js library is extremely heavy
- **Lazy Component**: `LazyPhoneMockup3D`

### 2. LiveDashboard (~300KB)
- **Dependencies**: react-chartjs-2, chart.js
- **Reason**: Chart.js library and multiple chart instances
- **Lazy Component**: `LazyLiveDashboard`

### 3. ContentEditor (~130KB)
- **Dependencies**: @tiptap/react, @tiptap/starter-kit
- **Reason**: Rich text editor with multiple extensions
- **Lazy Component**: `LazyContentEditor`

### 4. Chart Components (~300KB)
- **Dependencies**: react-chartjs-2, chart.js
- **Reason**: Chart.js library
- **Lazy Components**: `LazyLineChart`, `LazyDoughnutChart`, `LazyBarChart`

### 5. Other Heavy Components
- PerformanceCharts
- ContentEditorWithAutoSave
- MediaPicker
- InteractiveDemo
- CookieConsent
- ContactSalesModal
- NotificationSettings

## Usage

### Basic Usage

```tsx
import { LazyPhoneMockup3D } from '@/components/performance/LazyHeavyComponents';

function MyPage() {
  return (
    <div>
      <h1>My Page</h1>
      {/* Component will be lazy loaded when rendered */}
      <LazyPhoneMockup3D className="my-custom-class" />
    </div>
  );
}
```

### With Custom Fallback

```tsx
import { LazyComponent } from '@/components/performance/LazyComponent';

function MyComponent() {
  return (
    <LazyComponent
      loader={() => import('./HeavyComponent')}
      fallback={<MyCustomSkeleton />}
      maxRetries={3}
      onLoad={() => console.log('Component loaded!')}
      onError={(error) => console.error('Failed to load:', error)}
    />
  );
}
```

### Conditional Loading

```tsx
import { LazyLiveDashboard } from '@/components/performance/LazyHeavyComponents';

function Dashboard() {
  const [showDashboard, setShowDashboard] = useState(false);

  return (
    <div>
      <button onClick={() => setShowDashboard(true)}>
        Show Dashboard
      </button>
      
      {/* Only loads when showDashboard is true */}
      {showDashboard && <LazyLiveDashboard />}
    </div>
  );
}
```

## Migration Guide

### Before (Direct Import)

```tsx
import PhoneMockup3D from '@/components/animations/PhoneMockup3D';

function LandingPage() {
  return <PhoneMockup3D />;
}
```

### After (Lazy Loaded)

```tsx
import { LazyPhoneMockup3D } from '@/components/performance/LazyHeavyComponents';

function LandingPage() {
  return <LazyPhoneMockup3D />;
}
```

## Bundle Size Analysis

Run the bundle analysis script to identify heavy components:

```bash
npm run analyze:bundle
# or
ts-node scripts/analyze-bundle-size.ts
```

This will generate a report at `.kiro/reports/bundle-analysis.json` with:
- List of components exceeding 50KB threshold
- Estimated sizes
- Heavy library dependencies
- Recommendations for lazy loading

## Performance Benefits

### Expected Improvements

1. **Initial Bundle Size**: Reduced by ~2MB (estimated)
2. **First Contentful Paint (FCP)**: Improved by 30-40%
3. **Time to Interactive (TTI)**: Improved by 40-50%
4. **Lighthouse Performance Score**: +10-15 points

### Measurement

Use the performance tests to verify improvements:

```bash
npm run test:performance
```

## Best Practices

### 1. Lazy Load Below the Fold

Components not immediately visible should always be lazy loaded:

```tsx
// Good: Lazy load below-the-fold content
{isInView && <LazyLiveDashboard />}

// Bad: Eager load everything
<LiveDashboard />
```

### 2. Provide Meaningful Fallbacks

Use skeleton screens that match the final content layout:

```tsx
<LazyComponent
  loader={() => import('./Chart')}
  fallback={<ChartSkeleton />} // Matches chart dimensions
/>
```

### 3. Handle Errors Gracefully

Always provide error handling:

```tsx
<LazyComponent
  loader={() => import('./Component')}
  maxRetries={3}
  onError={(error) => {
    // Log to monitoring service
    console.error('Component failed to load:', error);
  }}
/>
```

### 4. Preload Critical Components

For components that will definitely be needed, preload them:

```tsx
import { preloadComponent } from '@/components/lazy';

// Preload on hover
<button
  onMouseEnter={() => preloadComponent(LazyModal)}
  onClick={() => setShowModal(true)}
>
  Open Modal
</button>
```

## Testing

### Unit Tests

```bash
npm run test tests/unit/performance/lazy-loading.test.tsx
```

### Property Tests

```bash
npm run test tests/unit/components/lazy-loading.property.test.tsx
```

### Performance Tests

```bash
npm run test tests/unit/performance/bundle-size.test.ts
```

## Troubleshooting

### Component Not Loading

1. Check browser console for errors
2. Verify the import path is correct
3. Ensure the component has a default export
4. Check network tab for failed requests

### Slow Loading

1. Check network conditions
2. Verify CDN is working
3. Consider increasing retry attempts
4. Check for large dependencies

### Hydration Errors

1. Ensure component is client-side only (`'use client'`)
2. Use `ssr: false` in dynamic import options
3. Check for server/client state mismatches

## Related Files

- `components/performance/LazyComponent.tsx` - Base lazy loading wrapper
- `components/performance/LazyHeavyComponents.tsx` - Pre-configured lazy components
- `components/performance/DynamicComponents.tsx` - Next.js dynamic imports
- `scripts/analyze-bundle-size.ts` - Bundle analysis script
- `tests/unit/performance/lazy-loading.test.tsx` - Unit tests
- `tests/unit/performance/bundle-size.test.ts` - Performance tests

## References

- [Next.js Dynamic Imports](https://nextjs.org/docs/advanced-features/dynamic-import)
- [React.lazy Documentation](https://react.dev/reference/react/lazy)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse Performance](https://developer.chrome.com/docs/lighthouse/performance/)
