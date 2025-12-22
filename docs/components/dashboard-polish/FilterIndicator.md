# FilterIndicator Component

A small violet dot indicator that appears on filter buttons to show when active filters are applied. Part of the Dashboard Global Polish design system.

## Overview

The FilterIndicator component provides a subtle but noticeable visual cue that filters are currently active, following modern SaaS design patterns seen in applications like Notion and Linear.

## Design Specifications

- **Size**: 6px circle
- **Color**: Violet (`var(--accent-primary)`)
- **Border**: 1px solid background color for separation
- **Position**: Absolute positioning (top-right of parent button)
- **Visibility**: Only shown when filters differ from default state

## Requirements

Validates Requirements: 10.1, 10.2, 10.3, 10.4, 10.5

## Usage

### Basic Usage

```tsx
import { FilterIndicator } from '@/components/ppv/FilterIndicator';

function FilterButton() {
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  return (
    <button style={{ position: 'relative' }}>
      Filters
      {hasActiveFilters && <FilterIndicator />}
    </button>
  );
}
```

### PPV Page Integration

```tsx
function PPVFilters() {
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'all-time',
  });

  // Check if any filters differ from default
  const hasActiveFilters = 
    filters.status !== 'all' || 
    filters.dateRange !== 'all-time';

  return (
    <button style={{ position: 'relative' }}>
      All Filters
      {hasActiveFilters && <FilterIndicator />}
    </button>
  );
}
```

### Multiple Filter Buttons

```tsx
function MultipleFilters() {
  const [statusFilter, setStatusFilter] = useState(false);
  const [dateFilter, setDateFilter] = useState(false);

  return (
    <div>
      <button style={{ position: 'relative' }}>
        Status
        {statusFilter && <FilterIndicator />}
      </button>
      
      <button style={{ position: 'relative' }}>
        Date Range
        {dateFilter && <FilterIndicator />}
      </button>
    </div>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes to apply |

## Accessibility

The FilterIndicator component is designed with accessibility in mind:

- **ARIA Label**: Includes `aria-label="Active filters applied"` for screen readers
- **Role**: Uses `role="status"` to announce changes to assistive technologies
- **Keyboard Navigation**: Does not interfere with button focus or keyboard interaction
- **Pointer Events**: Set to `pointer-events: none` to avoid blocking button clicks

## Styling

The component uses CSS custom properties from the dashboard polish token system:

```css
.filter-indicator {
  width: var(--polish-filter-dot-size);        /* 6px */
  height: var(--polish-filter-dot-size);       /* 6px */
  background: var(--polish-filter-dot-color);  /* violet */
  border: var(--polish-filter-dot-border);     /* 1px solid */
  border-radius: 50%;
}
```

### Custom Styling

You can apply custom styles using the `className` prop:

```tsx
<FilterIndicator className="custom-indicator" />
```

```css
.custom-indicator {
  top: 4px;
  right: 4px;
  width: 8px;
  height: 8px;
}
```

## Design Tokens

The component uses the following design tokens from `dashboard-polish-tokens.css`:

- `--polish-filter-dot-size`: 6px
- `--polish-filter-dot-color`: var(--accent-primary)
- `--polish-filter-dot-border`: 1px solid var(--bg-primary)

## Best Practices

### ✅ Do

- Position the parent button with `position: relative`
- Only show the indicator when filters differ from default state
- Use conditional rendering based on filter state
- Maintain consistent indicator placement across all filter buttons

### ❌ Don't

- Don't show the indicator when all filters are at default values
- Don't use the indicator for non-filter buttons
- Don't override the size significantly (keep it subtle)
- Don't forget to set `position: relative` on the parent button

## Examples

See `FilterIndicator.example.tsx` for complete working examples including:

1. Basic usage with filter button
2. Multiple filter buttons
3. PPV page integration
4. Custom styling
5. Accessibility demonstration

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Responsive Behavior

The indicator adjusts its positioning on mobile devices:

- **Desktop**: `top: 8px; right: 8px;`
- **Mobile (<768px)**: `top: 6px; right: 6px;`

## Animation

The indicator includes a subtle entrance animation:

- **Duration**: 200ms
- **Easing**: ease-out
- **Effect**: Fade in + scale from 0.5 to 1
- **Reduced Motion**: Animation is disabled when `prefers-reduced-motion: reduce`

## Testing

The component includes comprehensive property-based tests:

```bash
npm run test -- tests/unit/dashboard-polish/active-filter-indicator-visibility.property.test.tsx
```

Tests validate:
- Correct rendering and structure
- Accessibility attributes
- Conditional rendering
- Multiple instances
- Custom className support
- Keyboard navigation
- Screen reader compatibility

## Related Components

- **FilterPill**: Shows active filter name with remove button (Fans page)
- **SegmentCard**: Segment selection cards with active state (Fans page)
- **PageLayout**: Unified page layout component

## Design Inspiration

The FilterIndicator follows patterns from:

- **Notion**: Subtle dot indicators on filter buttons
- **Linear**: Minimal visual cues for active states
- **Shopify**: Clean, professional filter indicators

## Version History

- **v1.0.0**: Initial implementation with property-based tests
