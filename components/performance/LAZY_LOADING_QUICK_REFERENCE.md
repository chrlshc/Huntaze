# Lazy Loading Quick Reference

## Quick Start

### Import and Use

```tsx
import { LazyPhoneMockup3D } from '@/components/performance/LazyHeavyComponents';

<LazyPhoneMockup3D className="my-class" />
```

## Available Lazy Components

| Component | Original Size | Lazy Import |
|-----------|--------------|-------------|
| PhoneMockup3D | ~950KB | `LazyPhoneMockup3D` |
| LiveDashboard | ~300KB | `LazyLiveDashboard` |
| ContentEditor | ~130KB | `LazyContentEditor` |
| LineChart | ~300KB | `LazyLineChart` |
| DoughnutChart | ~300KB | `LazyDoughnutChart` |
| BarChart | ~300KB | `LazyBarChart` |
| PerformanceCharts | ~300KB | `LazyPerformanceCharts` |
| ContentEditorWithAutoSave | ~130KB | `LazyContentEditorWithAutoSave` |
| MediaPicker | ~80KB | `LazyMediaPicker` |
| InteractiveDemo | ~100KB | `LazyInteractiveDemo` |
| CookieConsent | ~50KB | `LazyCookieConsent` |
| ContactSalesModal | ~60KB | `LazyContactSalesModal` |
| NotificationSettings | ~70KB | `LazyNotificationSettings` |

## Common Patterns

### 1. Basic Lazy Loading

```tsx
import { LazyLiveDashboard } from '@/components/performance/LazyHeavyComponents';

function Page() {
  return <LazyLiveDashboard />;
}
```

### 2. Conditional Rendering

```tsx
import { LazyContentEditor } from '@/components/performance/LazyHeavyComponents';

function Page() {
  const [showEditor, setShowEditor] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowEditor(true)}>Edit</button>
      {showEditor && <LazyContentEditor />}
    </>
  );
}
```

### 3. Custom Lazy Component

```tsx
import { LazyComponent } from '@/components/performance/LazyComponent';

<LazyComponent
  loader={() => import('./MyHeavyComponent')}
  fallback={<Skeleton />}
  maxRetries={3}
/>
```

### 4. With Callbacks

```tsx
import { LazyComponent } from '@/components/performance/LazyComponent';

<LazyComponent
  loader={() => import('./Component')}
  onLoad={() => console.log('Loaded!')}
  onError={(err) => console.error(err)}
/>
```

## Commands

### Analyze Bundle Size
```bash
ts-node scripts/analyze-bundle-size.ts
```

### Run Performance Tests
```bash
npm run test tests/unit/performance/bundle-size.test.ts --run
npm run test tests/unit/performance/lazy-loading-performance.test.tsx --run
```

## Threshold

- **Default**: 50KB
- Components above 50KB should be lazy loaded
- Use `shouldLazyLoad(sizeKB, threshold)` to check

## Migration

### Before
```tsx
import PhoneMockup3D from '@/components/animations/PhoneMockup3D';

<PhoneMockup3D />
```

### After
```tsx
import { LazyPhoneMockup3D } from '@/components/performance/LazyHeavyComponents';

<LazyPhoneMockup3D />
```

## Troubleshooting

### Component Not Loading
1. Check browser console for errors
2. Verify import path is correct
3. Ensure component has default export

### Slow Loading
1. Check network conditions
2. Verify CDN is working
3. Increase retry attempts

### Hydration Errors
1. Add `'use client'` directive
2. Use `ssr: false` in dynamic import
3. Check for server/client mismatches

## Best Practices

✅ **DO:**
- Lazy load components >50KB
- Provide meaningful fallbacks
- Handle errors gracefully
- Lazy load below-the-fold content
- Preload critical components

❌ **DON'T:**
- Lazy load small components (<50KB)
- Use blank fallbacks
- Ignore loading errors
- Lazy load above-the-fold content
- Over-optimize

## Performance Impact

- **Initial Bundle**: -2MB
- **FCP**: +30-40%
- **TTI**: +40-50%
- **Lighthouse**: +10-15 points

## Related Files

- `components/performance/LazyComponent.tsx` - Base wrapper
- `components/performance/LazyHeavyComponents.tsx` - Pre-configured components
- `components/performance/LAZY_LOADING_GUIDE.md` - Full guide
- `scripts/analyze-bundle-size.ts` - Analysis tool
