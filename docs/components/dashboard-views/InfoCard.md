# InfoCard Component

Display informational content with icons, titles, and descriptions in a compact, scannable format.

## Import

```tsx
import { InfoCard } from '@/components/ui/InfoCard';
```

## Basic Usage

```tsx
<InfoCard
  icon={<LightningIcon />}
  title="Auto-respond to new subscribers"
  description="Send personalized welcome messages automatically when fans subscribe"
/>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `icon` | `React.ReactNode` | Yes | - | Icon displayed in circular container |
| `title` | `string` | Yes | - | Card title (14px, 600 weight) |
| `description` | `string` | Yes | - | Card description (max 2 lines) |
| `onClick` | `() => void` | No | - | Optional click handler |
| `className` | `string` | No | - | Additional CSS classes |

## Examples

### Basic Info Card

```tsx
<InfoCard
  icon={<LightningIcon />}
  title="Auto-respond to new subscribers"
  description="Send personalized welcome messages automatically when fans subscribe"
/>
```

### Clickable Card

```tsx
<InfoCard
  icon={<ClockIcon />}
  title="Re-engage inactive fans"
  description="Automatically reach out to fans who haven't interacted in 30 days"
  onClick={() => navigate('/smart-messages/new')}
/>
```

### Side-by-Side Layout

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
  <InfoCard
    icon={<LightningIcon />}
    title="Auto-respond to new subscribers"
    description="Send personalized welcome messages automatically when fans subscribe"
  />
  <InfoCard
    icon={<ClockIcon />}
    title="Re-engage inactive fans"
    description="Automatically reach out to fans who haven't interacted in 30 days"
  />
</div>
```

### With Custom Icons

```tsx
import { Sparkles, Users, TrendingUp } from 'lucide-react';

<InfoCard
  icon={<Sparkles className="w-4 h-4" />}
  title="AI-Powered Insights"
  description="Get intelligent recommendations based on fan behavior patterns"
/>
```

## Styling

The component uses CSS custom properties from `styles/dashboard-views.css`:

- `--dashboard-card-bg`: Background color (#FFFFFF)
- `--dashboard-card-border`: Border color (#E3E3E3)
- `--dashboard-card-radius`: Border radius (12px)
- `--dashboard-card-hover-bg`: Hover background (#F9FAFF)

### Icon Container

- Size: 32px × 32px
- Shape: Circular (border-radius: 50%)
- Background: #EEF2FF
- Icon color: #5B6BFF
- Flex-shrink: 0 (prevents squishing)

### Text Styling

- **Title**: 14px, 600 weight, #111111, line-height 1.3
- **Description**: 13px, #6B7280, line-height 1.4, 2-line clamp

### Custom Styling

```tsx
<InfoCard
  icon={<Icon />}
  title="Custom Card"
  description="With custom styling"
  className="custom-info-card"
/>
```

```css
.custom-info-card {
  border: 2px solid #5B6BFF;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.custom-info-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
```

## Accessibility

- Semantic HTML structure with proper heading levels
- Icon has `aria-hidden="true"` (decorative)
- Title uses appropriate heading tag
- Keyboard accessible when clickable
- Focus indicators on interactive cards
- WCAG AA contrast ratios

### Interactive Cards

When `onClick` is provided:
- Card becomes a button element
- Keyboard accessible (Enter/Space)
- Focus indicator visible
- Cursor changes to pointer

```tsx
<InfoCard
  icon={<Icon />}
  title="Clickable Card"
  description="Press Enter or Space to activate"
  onClick={handleClick}
  role="button"
  tabIndex={0}
/>
```

## Responsive Behavior

- **Mobile (< 768px)**: Full width, stacks vertically
- **Tablet (768px - 1024px)**: 2-column grid
- **Desktop (> 1024px)**: Side-by-side layout

### Responsive Grid

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
  {highlights.map(highlight => (
    <InfoCard key={highlight.id} {...highlight} />
  ))}
</div>
```

## Performance

- Memoized with `React.memo`
- Description uses CSS line-clamp for performance
- Lightweight DOM structure
- Smooth CSS transitions

## Testing

### Unit Test Example

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { InfoCard } from '@/components/ui/InfoCard';

test('renders title and description', () => {
  render(
    <InfoCard
      icon={<div>Icon</div>}
      title="Test Title"
      description="Test description"
    />
  );
  
  expect(screen.getByText('Test Title')).toBeInTheDocument();
  expect(screen.getByText('Test description')).toBeInTheDocument();
});

test('calls onClick when clicked', () => {
  const handleClick = jest.fn();
  
  render(
    <InfoCard
      icon={<div>Icon</div>}
      title="Clickable"
      description="Click me"
      onClick={handleClick}
    />
  );
  
  fireEvent.click(screen.getByText('Clickable'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});

test('truncates long descriptions', () => {
  const longDescription = 'A'.repeat(200);
  
  const { container } = render(
    <InfoCard
      icon={<div>Icon</div>}
      title="Title"
      description={longDescription}
    />
  );
  
  const description = container.querySelector('.info-card__description');
  expect(description).toHaveStyle({
    display: '-webkit-box',
    '-webkit-line-clamp': '2'
  });
});
```

## Common Patterns

### Loading State

```tsx
{isLoading ? (
  <Skeleton variant="info-card" />
) : (
  <InfoCard icon={<Icon />} title="Title" description="Description" />
)}
```

### Conditional Rendering

```tsx
{highlights.length > 0 && (
  <div className="grid grid-cols-2 gap-3">
    {highlights.map(highlight => (
      <InfoCard key={highlight.id} {...highlight} />
    ))}
  </div>
)}
```

### With Navigation

```tsx
import { useNavigate } from 'react-router-dom';

function HighlightsSection() {
  const navigate = useNavigate();
  
  return (
    <InfoCard
      icon={<LightningIcon />}
      title="Create Smart Rule"
      description="Automate your workflow"
      onClick={() => navigate('/smart-messages/new')}
    />
  );
}
```

### Dynamic Content

```tsx
const highlights = [
  {
    icon: <LightningIcon />,
    title: "Auto-respond",
    description: "Respond to new subscribers automatically"
  },
  {
    icon: <ClockIcon />,
    title: "Re-engage",
    description: "Reach out to inactive fans"
  }
];

<div className="grid grid-cols-2 gap-3">
  {highlights.map((highlight, index) => (
    <InfoCard key={index} {...highlight} />
  ))}
</div>
```

## Design Guidelines

### When to Use

- Highlighting key features or capabilities
- Providing quick information snippets
- Guiding users to important actions
- Displaying benefits or value propositions

### When Not to Use

- For displaying metrics (use StatCard instead)
- For status indicators (use TagChip instead)
- For empty states (use EmptyState instead)
- For long-form content (use regular cards)

### Content Guidelines

- **Title**: Keep under 50 characters
- **Description**: Keep under 120 characters (2 lines)
- **Icon**: Use simple, recognizable icons
- **Action**: Make clickable cards obvious with hover states

## Related Components

- [StatCard](./StatCard.md) - For displaying metrics
- [TagChip](./TagChip.md) - For status indicators
- [EmptyState](./EmptyState.md) - For empty data states

## Changelog

- **v1.0.0** - Initial release
- Component created as part of Dashboard Views Unification project
- Validates Requirements 1.1, 1.4, 1.5, 4.2
