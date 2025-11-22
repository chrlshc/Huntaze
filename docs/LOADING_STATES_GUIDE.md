# Loading States Guide

**Feature: beta-launch-ui-system, Phase 7: Loading States & Responsive Design**

This guide explains how to use the enhanced loading state components and hooks in the Huntaze application.

## Overview

The Phase 7 enhancements provide:
- Enhanced skeleton loading components with better animations
- Intelligent loading state management hooks
- Smooth transitions between loading and loaded states
- Accessibility improvements
- Performance optimizations

## Components

### 1. Enhanced Skeleton Components

#### StatsGridSkeleton
```tsx
import { StatsGridSkeleton, CompactStatsGridSkeleton } from '@/app/(app)/home/StatsGridSkeleton';

// Full version
<StatsGridSkeleton itemCount={4} className="my-custom-class" />

// Compact version
<CompactStatsGridSkeleton className="my-custom-class" />
```

#### QuickActionsSkeleton
```tsx
import { QuickActionsSkeleton, HorizontalQuickActionsSkeleton } from '@/app/(app)/home/QuickActionsSkeleton';

// Grid version
<QuickActionsSkeleton actionCount={6} className="my-custom-class" />

// Horizontal version
<HorizontalQuickActionsSkeleton className="my-custom-class" />
```

#### IntegrationsGridSkeleton
```tsx
import { IntegrationsGridSkeleton, CompactIntegrationsGridSkeleton } from '@/app/(app)/integrations/IntegrationsGridSkeleton';

// Grid version
<IntegrationsGridSkeleton itemCount={4} variant="grid" />

// List version
<IntegrationsGridSkeleton itemCount={4} variant="list" />

// Compact version
<CompactIntegrationsGridSkeleton className="my-custom-class" />
```

### 2. Base Skeleton Component

```tsx
import { Skeleton } from '@/src/components/ui/skeleton';

// Text skeleton
<Skeleton variant="text" className="w-32 h-4" />

// Multiple lines
<Skeleton variant="text" lines={3} />

// Avatar
<Skeleton variant="avatar" className="w-12 h-12" />

// Button
<Skeleton variant="button" className="w-24 h-10" />

// Card
<Skeleton variant="card" className="h-48" />
```

### 3. Loading Transition Component

```tsx
import LoadingTransition, { StaggeredListTransition } from '@/src/components/ui/loading-transition';

// Basic usage
<LoadingTransition
  isLoading={isLoading}
  error={error}
  skeleton={<StatsGridSkeleton />}
  transition="fade"
  duration={300}
>
  <YourContent />
</LoadingTransition>

// With staggered list
<StaggeredListTransition
  isLoading={isLoading}
  items={items.map(item => <ItemComponent key={item.id} {...item} />)}
  skeleton={<ListSkeleton />}
  staggerDelay={100}
/>
```

## Hooks

### 1. useLoadingState

Basic loading state management with minimum duration to prevent flashing.

```tsx
import { useLoadingState } from '@/hooks/useLoadingState';

function MyComponent() {
  const [loadingState, actions] = useLoadingState({
    minDuration: 500, // Minimum 500ms loading
    onLoadingStart: () => console.log('Loading started'),
    onLoadingEnd: () => console.log('Loading ended'),
    onError: (error) => console.error('Error:', error)
  });

  const fetchData = async () => {
    actions.startLoading();
    try {
      const data = await fetch('/api/data');
      // Process data
      actions.stopLoading();
    } catch (error) {
      actions.setError(error as Error);
    }
  };

  return (
    <div>
      {loadingState.isLoading && <Skeleton />}
      {loadingState.error && <ErrorMessage error={loadingState.error} />}
      {!loadingState.isLoading && !loadingState.error && <Content />}
    </div>
  );
}
```

### 2. useDataLoadingState

Specialized hook for data fetching with automatic loading management.

```tsx
import { useDataLoadingState } from '@/hooks/useLoadingState';

function MyComponent() {
  const { data, isLoading, error, refetch } = useDataLoadingState(
    async () => {
      const response = await fetch('/api/data');
      return response.json();
    },
    [] // Dependencies
  );

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorMessage error={error} />;
  
  return <Content data={data} onRefresh={refetch} />;
}
```

### 3. useStaggeredLoading

For staggered animations of list items.

```tsx
import { useStaggeredLoading } from '@/hooks/useLoadingState';

function MyList({ items }) {
  const { visibleCount, isComplete, shouldShow } = useStaggeredLoading(
    items.length,
    100 // 100ms delay between items
  );

  return (
    <div>
      {items.map((item, index) => (
        shouldShow(index) && <ListItem key={item.id} {...item} />
      ))}
    </div>
  );
}
```

## CSS Classes

### Animation Classes

```css
/* Shimmer animation */
.animate-shimmer

/* Enhanced pulse */
.animate-enhanced-pulse

/* Fade in/out */
.skeleton-fade-in
.skeleton-fade-out

/* Performance optimization */
.skeleton-optimized

/* Responsive adjustments */
.skeleton-responsive
.skeleton-text-mobile
.skeleton-card-mobile
.skeleton-grid-mobile
```

### Usage Example

```tsx
<div className="skeleton-fade-in skeleton-optimized">
  <Skeleton variant="text" className="skeleton-text-mobile" />
</div>
```

## Accessibility Features

All skeleton components include:

1. **ARIA Labels**: Proper `role="status"` and `aria-label` attributes
2. **Screen Reader Announcements**: Live regions for loading state changes
3. **Reduced Motion Support**: Respects `prefers-reduced-motion` media query
4. **Semantic HTML**: Proper use of semantic elements

### Example

```tsx
<div 
  role="status" 
  aria-label="Loading statistics"
  aria-live="polite"
>
  <StatsGridSkeleton />
  <span className="sr-only">Loading 4 statistics cards...</span>
</div>
```

## Performance Optimizations

1. **Will-change**: Applied to animated elements
2. **Backface-visibility**: Hidden for better performance
3. **Staggered Animations**: Prevents layout thrashing
4. **Minimum Duration**: Prevents flashing for fast loads

## Best Practices

### 1. Always Use Minimum Duration

```tsx
// ✅ Good - prevents flashing
const [state, actions] = useLoadingState({ minDuration: 300 });

// ❌ Bad - can cause flashing
const [state, actions] = useLoadingState({ minDuration: 0 });
```

### 2. Match Skeleton to Content

```tsx
// ✅ Good - skeleton matches actual content structure
<LoadingTransition
  isLoading={isLoading}
  skeleton={<StatsGridSkeleton itemCount={stats.length} />}
>
  <StatsGrid stats={stats} />
</LoadingTransition>

// ❌ Bad - generic skeleton doesn't match
<LoadingTransition
  isLoading={isLoading}
  skeleton={<div>Loading...</div>}
>
  <StatsGrid stats={stats} />
</LoadingTransition>
```

### 3. Use Staggered Loading for Lists

```tsx
// ✅ Good - smooth staggered appearance
<StaggeredListTransition
  isLoading={isLoading}
  items={items}
  staggerDelay={100}
/>

// ❌ Bad - all items appear at once
{!isLoading && items.map(item => <Item key={item.id} {...item} />)}
```

### 4. Handle Errors Gracefully

```tsx
// ✅ Good - shows error state
<LoadingTransition
  isLoading={isLoading}
  error={error}
  skeleton={<Skeleton />}
>
  <Content />
</LoadingTransition>

// ❌ Bad - no error handling
{isLoading ? <Skeleton /> : <Content />}
```

## Migration Guide

### From Old Skeleton to Enhanced Skeleton

```tsx
// Before
<div className="skeleton">
  <div className="skeleton-text" style={{ width: '100px' }} />
</div>

// After
<Skeleton variant="text" className="w-24 h-4" />
```

### From Manual Loading State to Hook

```tsx
// Before
const [isLoading, setIsLoading] = useState(false);
const fetchData = async () => {
  setIsLoading(true);
  try {
    const data = await fetch('/api/data');
    // Process data
  } finally {
    setIsLoading(false);
  }
};

// After
const { data, isLoading, error } = useDataLoadingState(
  () => fetch('/api/data').then(r => r.json()),
  []
);
```

## Testing

### Unit Tests

```tsx
import { render, screen } from '@testing-library/react';
import { StatsGridSkeleton } from './StatsGridSkeleton';

test('renders skeleton with correct item count', () => {
  render(<StatsGridSkeleton itemCount={4} />);
  expect(screen.getByLabelText('Loading statistics')).toBeInTheDocument();
  expect(screen.getByText('Loading 4 statistics cards...')).toBeInTheDocument();
});
```

### Integration Tests

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { useDataLoadingState } from '@/hooks/useLoadingState';

test('shows skeleton then content', async () => {
  const TestComponent = () => {
    const { data, isLoading } = useDataLoadingState(
      async () => ({ value: 'test' }),
      []
    );
    
    return isLoading ? <div>Loading...</div> : <div>{data?.value}</div>;
  };

  render(<TestComponent />);
  expect(screen.getByText('Loading...')).toBeInTheDocument();
  
  await waitFor(() => {
    expect(screen.getByText('test')).toBeInTheDocument();
  });
});
```

## Troubleshooting

### Skeleton Doesn't Match Content

**Problem**: Skeleton layout doesn't match actual content.

**Solution**: Ensure skeleton component mirrors the structure of the actual content component.

### Flashing Loading State

**Problem**: Loading state flashes briefly.

**Solution**: Use `minDuration` option in `useLoadingState`:

```tsx
const [state, actions] = useLoadingState({ minDuration: 300 });
```

### Animations Not Working

**Problem**: Skeleton animations not visible.

**Solution**: Ensure `skeleton-animations.css` is imported in `app/layout.tsx`:

```tsx
import "@/styles/skeleton-animations.css";
```

### Performance Issues

**Problem**: Animations causing performance issues.

**Solution**: Add `skeleton-optimized` class and reduce stagger delay:

```tsx
<div className="skeleton-optimized">
  <StaggeredListTransition staggerDelay={50} />
</div>
```

## Related Documentation

- [Design System Guide](./DESIGN_SYSTEM_GUIDE.md)
- [Responsive Design Guide](./RESPONSIVE_DESIGN_GUIDE.md)
- [Accessibility Guide](./ACCESSIBILITY_GUIDE.md)
- [Performance Optimization Guide](./PERFORMANCE_GUIDE.md)

## Support

For questions or issues, please refer to:
- [Beta Launch UI System Requirements](.kiro/specs/beta-launch-ui-system/requirements.md)
- [Beta Launch UI System Design](.kiro/specs/beta-launch-ui-system/design.md)
- [Beta Launch UI System Tasks](.kiro/specs/beta-launch-ui-system/tasks.md)
