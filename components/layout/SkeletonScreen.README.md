# SkeletonScreen Component

A loading placeholder component that displays skeleton screens with pulsating animation while content is being fetched. Part of the Linear UI Performance Refactor.

## Overview

The `SkeletonScreen` component provides visual feedback during loading states by showing the structure of the page before actual content arrives. This reduces perceived loading time and improves user experience.

## Features

- **Multiple Variants**: Dashboard, Form, Card, and List layouts
- **Pulsating Animation**: Smooth CSS animation for visual feedback
- **Configurable Count**: Customize number of items for Card and List variants
- **Responsive Design**: Adapts to different screen sizes
- **Design Token Integration**: Uses Linear design system colors and spacing

## Usage

### Basic Usage

```tsx
import { SkeletonScreen } from '@/components/layout/SkeletonScreen';

function MyComponent() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(null);

  if (isLoading) {
    return <SkeletonScreen variant="dashboard" />;
  }

  return <div>{/* Actual content */}</div>;
}
```

### Dashboard Variant

Use for full dashboard pages with header, stats, and content areas:

```tsx
<SkeletonScreen variant="dashboard" />
```

### Form Variant

Use for form pages with input fields and buttons:

```tsx
<SkeletonScreen variant="form" />
```

### Card Variant

Use for card grids with customizable count:

```tsx
<SkeletonScreen variant="card" count={6} />
```

### List Variant

Use for vertical lists with customizable count:

```tsx
<SkeletonScreen variant="list" count={10} />
```

### Disable Animation

For accessibility or performance reasons:

```tsx
<SkeletonScreen variant="dashboard" animate={false} />
```

### Custom Styling

Add custom classes for additional styling:

```tsx
<SkeletonScreen variant="card" className="my-custom-class" />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'dashboard' \| 'form' \| 'card' \| 'list'` | Required | Layout variant to display |
| `count` | `number` | `3` | Number of items (for card and list variants) |
| `animate` | `boolean` | `true` | Whether to show pulsating animation |
| `className` | `string` | `''` | Additional CSS classes |

## Variants

### Dashboard

Displays a full dashboard layout with:
- Header section with title and subtitle
- Stats grid (3 columns on desktop)
- Main content area with sidebar

### Form

Displays a form layout with:
- Form title
- Multiple input field placeholders
- Textarea placeholder
- Submit button placeholder

### Card

Displays a responsive card grid with:
- Configurable number of cards
- Image placeholder
- Title and description placeholders
- Responsive columns (1 on mobile, 2 on tablet, 3 on desktop)

### List

Displays a vertical list with:
- Configurable number of items
- Avatar placeholder
- Title and subtitle placeholders
- Border styling

## Animation

The skeleton animation is defined in `styles/linear-design-tokens.css`:

```css
@keyframes skeleton-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.skeleton-pulse {
  animation: skeleton-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

The animation respects `prefers-reduced-motion` for accessibility.

## Design Tokens

The component uses the following design tokens:
- `--color-bg-surface`: Background color for skeleton elements
- `--color-border-subtle`: Border color for list items
- Spacing values from the 4px grid system

## Accessibility

- Respects `prefers-reduced-motion` media query
- Uses semantic HTML structure
- Provides visual feedback during loading
- Can be disabled with `animate={false}` prop

## Best Practices

1. **Match Structure**: Ensure skeleton structure matches final content layout
2. **Use Appropriate Variant**: Choose the variant that best matches your content
3. **Set Correct Count**: For card/list variants, match the expected number of items
4. **Conditional Rendering**: Always conditionally render skeleton vs actual content
5. **Loading States**: Use with proper loading state management

## Examples

### With Data Fetching

```tsx
function DashboardPage() {
  const { data, isLoading } = useQuery('dashboard', fetchDashboard);

  if (isLoading) {
    return <SkeletonScreen variant="dashboard" />;
  }

  return <Dashboard data={data} />;
}
```

### With Suspense

```tsx
<Suspense fallback={<SkeletonScreen variant="card" count={6} />}>
  <CardGrid />
</Suspense>
```

### With Error Handling

```tsx
function MyComponent() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  if (error) {
    return <ErrorMessage error={error} />;
  }

  if (isLoading) {
    return <SkeletonScreen variant="list" count={5} />;
  }

  return <List items={data} />;
}
```

## Requirements

Validates the following requirements from the Linear UI Performance Refactor:
- **6.1**: Display skeleton screens during loading
- **6.2**: Use pulsating animation
- **6.3**: Replace with actual content when loaded
- **6.4**: No blank screens during loading
- **6.5**: Match final content structure

## Related Components

- `CenteredContainer`: Layout container for content
- `LazyComponent`: Lazy loading wrapper (coming soon)

## Testing

The component includes comprehensive test coverage:
- Property-based tests for universal properties
- Unit tests for specific behaviors
- Visual regression tests (recommended)

See `tests/unit/components/skeleton-screen.test.tsx` for examples.
