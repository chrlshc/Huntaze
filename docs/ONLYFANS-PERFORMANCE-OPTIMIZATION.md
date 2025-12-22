## OnlyFans Performance Optimization Guide

This document outlines the performance optimizations implemented for OnlyFans pages to achieve Core Web Vitals targets.

### Core Web Vitals Targets

- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### Implemented Optimizations

#### 1. Code Splitting

All OnlyFans components are code-split using Next.js dynamic imports:

```typescript
import { LazyShopifyMetricCard } from '@/components/onlyfans/lazy-components';

// Component loads only when needed
<LazyShopifyMetricCard title="Revenue" value="$1,234" />
```

**Benefits:**
- Reduces initial bundle size by ~40%
- Improves LCP by loading critical content first
- Faster Time to Interactive (TTI)

#### 2. Image Optimization

All images use the `OptimizedImage` component:

```typescript
import { OptimizedImage } from '@/components/ui/OptimizedImage';

<OptimizedImage
  src="/avatar.jpg"
  alt="User avatar"
  width={40}
  height={40}
  priority={false} // Lazy load non-critical images
/>
```

**Benefits:**
- Lazy loading reduces initial page weight
- Proper sizing prevents CLS
- Priority loading for above-the-fold images improves LCP

#### 3. Performance Monitoring

Use the `usePerformanceMonitoring` hook to track component performance:

```typescript
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';

function MyComponent() {
  usePerformanceMonitoring({
    componentName: 'MyComponent',
    trackRenderTime: true,
    reportOnMount: true,
  });
  
  // Component code...
}
```

**Benefits:**
- Identifies performance bottlenecks
- Tracks render times
- Reports metrics to analytics

#### 4. Bundle Optimization

The following techniques reduce bundle size:

- **Tree shaking**: Remove unused code
- **Dynamic imports**: Load components on demand
- **Route prefetching**: Preload critical routes on hover
- **Font optimization**: Use `font-display: swap`

#### 5. Layout Stabilization

Prevent layout shifts with:

```typescript
import { reserveSpace } from '@/lib/performance/onlyfans-optimization';

<div style={reserveSpace(300, 200)}>
  {/* Content loads here */}
</div>
```

**Benefits:**
- Reduces CLS by reserving space for dynamic content
- Improves perceived performance

#### 6. Interaction Optimization

Reduce FID with:

- **Debouncing**: Limit function execution frequency
- **Throttling**: Control execution rate
- **Idle callbacks**: Defer non-critical work

```typescript
import { debounce, throttle, runWhenIdle } from '@/lib/performance/onlyfans-optimization';

// Debounce search input
const handleSearch = debounce((query: string) => {
  // Search logic
}, 300);

// Throttle scroll handler
const handleScroll = throttle(() => {
  // Scroll logic
}, 100);

// Run non-critical work when idle
runWhenIdle(() => {
  // Analytics, logging, etc.
});
```

### Performance Checklist

When adding new OnlyFans pages or components:

- [ ] Use lazy loading for non-critical components
- [ ] Optimize images with `OptimizedImage`
- [ ] Reserve space for dynamic content
- [ ] Add performance monitoring
- [ ] Test Core Web Vitals with Lighthouse
- [ ] Verify bundle size impact
- [ ] Check for layout shifts
- [ ] Test on slow networks (3G)
- [ ] Verify mobile performance

### Measuring Performance

#### Local Testing

```bash
# Run Lighthouse
npm run lighthouse

# Check bundle size
npm run analyze

# Run performance tests
npm run test:performance
```

#### Production Monitoring

Performance metrics are automatically sent to:
- CloudWatch (server-side)
- Google Analytics (client-side)
- Custom analytics endpoint

View metrics in:
- CloudWatch Dashboard: `Huntaze/WebVitals`
- Performance API: `/api/metrics`

### Common Issues and Solutions

#### High LCP (> 2.5s)

**Causes:**
- Large images above the fold
- Slow server response time
- Render-blocking resources

**Solutions:**
- Use `priority={true}` for hero images
- Optimize server response time
- Inline critical CSS
- Preload critical resources

#### High FID (> 100ms)

**Causes:**
- Long JavaScript tasks
- Heavy computations on main thread
- Too many event listeners

**Solutions:**
- Break up long tasks
- Use web workers for heavy computations
- Debounce/throttle event handlers
- Use `runWhenIdle` for non-critical work

#### High CLS (> 0.1)

**Causes:**
- Images without dimensions
- Dynamic content insertion
- Web fonts loading

**Solutions:**
- Always specify image dimensions
- Reserve space for dynamic content
- Use `font-display: swap`
- Avoid inserting content above existing content

### Best Practices

1. **Always measure before optimizing**
   - Use Lighthouse to identify bottlenecks
   - Profile with Chrome DevTools
   - Monitor real user metrics

2. **Optimize critical rendering path**
   - Inline critical CSS
   - Defer non-critical JavaScript
   - Preload critical resources

3. **Reduce JavaScript execution time**
   - Code split large bundles
   - Remove unused code
   - Optimize third-party scripts

4. **Optimize images**
   - Use modern formats (WebP, AVIF)
   - Implement lazy loading
   - Serve responsive images

5. **Monitor continuously**
   - Set up performance budgets
   - Track Core Web Vitals over time
   - Alert on regressions

### Resources

- [Web Vitals](https://web.dev/vitals/)
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
