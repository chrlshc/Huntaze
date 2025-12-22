# StatCard Component

Display key performance indicators with optional trend indicators and icons.

## Import

```tsx
import { StatCard } from '@/components/ui/StatCard';
```

## Basic Usage

```tsx
<StatCard
  label="Total Revenue"
  value="$4,196"
/>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `label` | `string` | Yes | - | Metric label displayed above value |
| `value` | `string \| number` | Yes | - | Metric value to display |
| `icon` | `React.ReactNode` | No | - | Optional icon displayed at top |
| `delta` | `DeltaObject` | No | - | Optional trend indicator |
| `variant` | `'default' \| 'success' \| 'warning' \| 'error'` | No | `'default'` | Visual variant |
| `className` | `string` | No | - | Additional CSS classes |

### Delta Object

```typescript
{
  value: string | number;  // Change amount (e.g., "+12%" or -5)
  trend: 'up' | 'down' | 'neutral';
}
```

## Examples

### With Icon

```tsx
<StatCard
  label="VIP Fans"
  value="127"
  icon={<StarIcon className="w-4 h-4" />}
/>
```

### With Positive Delta

```tsx
<StatCard
  label="Total Revenue"
  value="$4,196"
  delta={{ value: "+12%", trend: "up" }}
/>
```

### With Negative Delta

```tsx
<StatCard
  label="Churn Rate"
  value="3.2%"
  delta={{ value: "-0.5%", trend: "down" }}
  variant="success"  // Green because lower churn is good
/>
```

### Multiple Cards in Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
  <StatCard label="Total Revenue" value="$4,196" delta={{ value: "+12%", trend: "up" }} />
  <StatCard label="Total Sent" value="156" />
  <StatCard label="Open Rate" value="68%" delta={{ value: "+5%", trend: "up" }} />
  <StatCard label="Purchase Rate" value="23%" delta={{ value: "-2%", trend: "down" }} />
</div>
```

## Styling

The component uses CSS custom properties from `styles/dashboard-views.css`:

- `--dashboard-card-bg`: Background color (#FFFFFF)
- `--dashboard-card-border`: Border color (#E3E3E3)
- `--dashboard-card-radius`: Border radius (12px)
- `--dashboard-label-size`: Label font size (11px)
- `--dashboard-label-color`: Label color (#9CA3AF)
- `--dashboard-value-size`: Value font size (20px)
- `--dashboard-value-color`: Value color (#111111)

### Custom Styling

```tsx
<StatCard
  label="Custom Metric"
  value="999"
  className="custom-stat-card"
/>
```

```css
.custom-stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.custom-stat-card .stat-card__label {
  color: rgba(255, 255, 255, 0.8);
}

.custom-stat-card .stat-card__value {
  color: white;
}
```

## Accessibility

- Uses semantic HTML with proper structure
- Label is associated with value for screen readers
- Delta includes ARIA label describing trend direction
- Keyboard focusable when interactive
- Meets WCAG AA contrast requirements

### ARIA Labels

```tsx
<StatCard
  label="Revenue"
  value="$4,196"
  delta={{ value: "+12%", trend: "up" }}
  aria-label="Revenue: $4,196, up 12%"
/>
```

## Responsive Behavior

The component adapts to different screen sizes:

- **Mobile (< 768px)**: Full width, reduced padding
- **Tablet (768px - 1024px)**: 2-column grid
- **Desktop (> 1024px)**: Flexible row layout

## Performance

- Memoized with `React.memo` to prevent unnecessary re-renders
- Lightweight DOM structure
- CSS transitions for smooth hover effects

## Testing

### Unit Test Example

```tsx
import { render, screen } from '@testing-library/react';
import { StatCard } from '@/components/ui/StatCard';

test('renders label and value', () => {
  render(<StatCard label="Revenue" value="$100" />);
  
  expect(screen.getByText('REVENUE')).toBeInTheDocument();
  expect(screen.getByText('$100')).toBeInTheDocument();
});

test('applies correct styling for positive delta', () => {
  render(
    <StatCard
      label="Revenue"
      value="$100"
      delta={{ value: "+12%", trend: "up" }}
    />
  );
  
  const delta = screen.getByText('+12%');
  expect(delta).toHaveClass('stat-card__delta--positive');
});
```

## Common Patterns

### Loading State

```tsx
{isLoading ? (
  <Skeleton variant="stat-card" />
) : (
  <StatCard label="Revenue" value={data.revenue} />
)}
```

### Error State

```tsx
{error ? (
  <StatCard
    label="Revenue"
    value="--"
    variant="error"
  />
) : (
  <StatCard label="Revenue" value={data.revenue} />
)}
```

### Conditional Delta

```tsx
<StatCard
  label="Revenue"
  value="$4,196"
  delta={previousRevenue ? {
    value: calculateChange(revenue, previousRevenue),
    trend: revenue > previousRevenue ? 'up' : 'down'
  } : undefined}
/>
```

## Related Components

- [InfoCard](./InfoCard.md) - For informational content
- [TagChip](./TagChip.md) - For status indicators
- [EmptyState](./EmptyState.md) - For empty data states

## Changelog

- **v1.0.0** - Initial release
- Component created as part of Dashboard Views Unification project
- Validates Requirements 2.1, 2.2, 3.1, 4.1
