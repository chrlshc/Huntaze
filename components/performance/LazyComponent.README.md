# LazyComponent

A robust wrapper component for lazy loading heavy components with automatic retry logic, error handling, and loading states.

## Overview

The `LazyComponent` wrapper enables code splitting and dynamic imports for heavy components (>50KB), improving initial page load performance by deferring non-critical component loading.

## Features

- **Dynamic Imports**: Automatic code splitting with React.lazy
- **Retry Logic**: Exponential backoff retry mechanism for failed loads
- **Error Handling**: Graceful error boundaries with user-friendly fallbacks
- **Loading States**: Configurable fallback UI during component loading
- **Threshold Detection**: Automatic detection of components that should be lazy loaded
- **Accessibility**: ARIA labels and live regions for screen readers

## Usage

### Basic Usage

```tsx
import { LazyComponent } from '@/components/performance/LazyComponent';

function MyPage() {
  return (
    <LazyComponent
      loader={() => import('./HeavyChart')}
      fallback={<div>Loading chart...</div>}
    />
  );
}
```

### With Custom Configuration

```tsx
<LazyComponent
  loader={() => import('./HeavyEditor')}
  fallback={<EditorSkeleton />}
  maxRetries={3}
  retryDelay={1000}
  threshold={50}
  onLoad={() => console.log('Editor loaded')}
  onError={(error) => console.error('Failed to load editor', error)}
  componentProps={{ initialValue: 'Hello' }}
/>
```

### Using the HOC Pattern

```tsx
import { withLazyLoading } from '@/components/performance/LazyComponent';

const LazyChart = withLazyLoading(
  () => import('./HeavyChart'),
  { 
    fallback: <ChartSkeleton />,
    maxRetries: 3 
  }
);

function Dashboard() {
  return <LazyChart data={chartData} />;
}
```

### Threshold Detection

```tsx
import { shouldLazyLoad } from '@/components/performance/LazyComponent';

// Check if a component should be lazy loaded
if (shouldLazyLoad(75, 50)) {
  // Component is >50KB, use lazy loading
  return <LazyComponent loader={() => import('./HeavyComponent')} />;
} else {
  // Component is small, load normally
  return <HeavyComponent />;
}
```

## API

### LazyComponentProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `loader` | `() => Promise<{ default: ComponentType }>` | Required | Function returning dynamic import |
| `fallback` | `React.ReactNode` | `<DefaultFallback />` | UI to show while loading |
| `threshold` | `number` | `50` | Size threshold in KB for lazy loading |
| `maxRetries` | `number` | `2` | Maximum retry attempts on failure |
| `retryDelay` | `number` | `1000` | Base delay between retries (ms) |
| `componentProps` | `Record<string, any>` | `{}` | Props to pass to loaded component |
| `onLoad` | `() => void` | `undefined` | Callback when component loads |
| `onError` | `(error: Error) => void` | `undefined` | Callback when loading fails |

## Error Handling

The component implements a three-tier error handling strategy:

1. **Retry Logic**: Automatically retries failed imports with exponential backoff
2. **Error Boundary**: Catches runtime errors in loaded components
3. **Error Fallback**: Displays user-friendly error UI with retry option

### Retry Behavior

- First retry: 1 second delay
- Second retry: 2 second delay (exponential backoff)
- Third retry: 4 second delay
- After max retries: Display error message

## Performance Considerations

### When to Use Lazy Loading

Use lazy loading for:
- Components >50KB in size
- Components not immediately visible (below the fold)
- Heavy dependencies (charts, editors, 3D renderers)
- Feature modules that may not be used by all users

### When NOT to Use Lazy Loading

Avoid lazy loading for:
- Critical above-the-fold content
- Small components (<50KB)
- Components needed for initial render
- Components with fast load times

## Accessibility

The component includes proper ARIA attributes:

- `role="status"` on loading fallback
- `role="alert"` on error fallback
- `aria-live="polite"` for loading states
- `aria-live="assertive"` for error states
- `aria-label` for screen reader context

## Testing

See test files:
- `tests/unit/components/lazy-component.test.tsx` - Unit tests
- `tests/unit/components/lazy-loading.property.test.tsx` - Property-based tests

## Requirements

Implements requirements from linear-ui-performance-refactor spec:
- Requirement 7.1: Dynamic imports for heavy components
- Requirement 7.2: Deferred loading for non-visible components
- Requirement 7.3: Asynchronous loading without blocking
- Requirement 7.4: 50KB threshold for lazy loading

## Related Components

- `SkeletonScreen` - Use as fallback UI
- `useModuleLazyLoader` - Hook for module-level lazy loading
- `PerformanceMonitor` - Track lazy loading metrics
