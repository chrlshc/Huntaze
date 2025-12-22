# DashboardEmptyState Component

Provide clear guidance and call-to-action when no data is available in dashboard views.

## Import

```tsx
import { DashboardEmptyState } from '@/components/ui/DashboardEmptyState';
// or
import { DashboardEmptyState } from '@/components/ui';
```

## Basic Usage

```tsx
<DashboardEmptyState
  icon={<InboxIcon />}
  title="No data yet"
  description="Get started by creating your first item"
  cta={{
    label: "Create New",
    onClick: handleCreate
  }}
/>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `icon` | `React.ReactNode` | Yes | - | Icon or illustration (48px recommended) |
| `title` | `string` | Yes | - | Main heading text |
| `description` | `string` | Yes | - | Explanation or guidance text |
| `benefits` | `string[]` | No | - | Optional bullet points list |
| `cta` | `CTAObject` | Yes | - | Call-to-action button configuration |
| `className` | `string` | No | - | Additional CSS classes |

### CTA Object

```typescript
{
  label: string;           // Button text
  onClick: () => void;     // Click handler
  icon?: React.ReactNode;  // Optional button icon
}
```

## Examples

### Basic Empty State

```tsx
<DashboardEmptyState
  icon={<InboxIcon className="w-12 h-12" />}
  title="No data yet"
  description="Get started by creating your first item"
  cta={{
    label: "Create New",
    onClick: () => navigate('/create')
  }}
/>
```

### With Benefits List

```tsx
<DashboardEmptyState
  icon={<RulesIcon className="w-12 h-12" />}
  title="No smart rules yet"
  description="Create automated workflows to save time and engage fans more effectively"
  benefits={[
    "Auto-respond to new subscribers",
    "Re-engage inactive fans",
    "Prioritize VIP conversations"
  ]}
  cta={{
    label: "New Smart Rule",
    onClick: () => navigate('/smart-messages/new'),
    icon: <PlusIcon className="w-4 h-4" />
  }}
/>
```

### Error State

```tsx
<DashboardEmptyState
  icon={<AlertCircleIcon className="w-12 h-12" />}
  title="Failed to load data"
  description="We're having trouble loading this view. Please try again or contact support if the problem persists."
  cta={{
    label: "Retry",
    onClick: refetch,
    icon: <RefreshIcon className="w-4 h-4" />
  }}
/>
```

### No Results State

```tsx
<DashboardEmptyState
  icon={<SearchIcon className="w-12 h-12" />}
  title="No results found"
  description={`No fans match "${searchQuery}". Try adjusting your search or filters.`}
  cta={{
    label: "Clear Filters",
    onClick: clearFilters
  }}
/>
```

### Permission Denied State

```tsx
<DashboardEmptyState
  icon={<LockIcon className="w-12 h-12" />}
  title="Access restricted"
  description="You don't have permission to view this content. Contact your administrator for access."
  cta={{
    label: "Go Back",
    onClick: () => navigate(-1)
  }}
/>
```

## Styling

The component uses these design specifications:

- Container: max-width 600px, centered, 32px padding
- Background: #FFFFFF
- Border: 1px solid #E3E3E3
- Border radius: 16px
- Icon: 48px, #9CA3AF color, 16px bottom margin
- Title: 18px, 600 weight, #111111, 8px bottom margin
- Description: 14px, #6B7280, 1.5 line-height, 16px bottom margin
- Benefits: 13px, #6B7280, bullet points with #5B6BFF color, 8px gap
- CTA: Background #5B6BFF, color #FFFFFF, 8px border radius, 10px vertical padding, 20px horizontal padding
- CTA hover: Background #4F46E5, translateY(-1px), shadow 0 4px 12px rgba(91, 107, 255, 0.3)

### Custom Styling

```tsx
<DashboardEmptyState
  icon={<Icon />}
  title="Custom Empty State"
  description="With custom styling"
  cta={{ label: "Action", onClick: handleClick }}
  className="custom-empty-state"
/>
```

```css
.custom-empty-state {
  max-width: 800px;
  padding: 48px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.custom-empty-state .dashboard-empty-state__title {
  font-size: 24px;
  color: #1a202c;
}
```

## Accessibility

- Semantic HTML structure with proper heading levels
- ARIA labels for screen readers
- Keyboard accessible CTA button
- Focus indicators on interactive elements
- Proper heading hierarchy (h3 for title)
- Region role with labelledby and describedby

### ARIA Attributes

The component automatically includes:
- `role="region"` on container
- `aria-labelledby` pointing to title
- `aria-describedby` pointing to description
- `aria-label` on CTA button

## Responsive Behavior

The component adapts to different screen sizes:

- **Mobile (< 768px)**: Reduced padding (24px), smaller icon (40px)
- **Tablet (768px - 1024px)**: Standard sizing
- **Desktop (> 1024px)**: Full sizing with max-width constraint

### Responsive Example

```tsx
<div className="container mx-auto px-4">
  <DashboardEmptyState
    icon={<Icon />}
    title="No data"
    description="Get started"
    cta={{ label: "Create", onClick: handleCreate }}
  />
</div>
```

## Performance

- Memoized with `React.memo`
- Lightweight DOM structure
- No expensive computations
- Minimal re-renders

## Testing

### Unit Test Example

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardEmptyState } from '@/components/ui/DashboardEmptyState';

test('renders all elements', () => {
  render(
    <DashboardEmptyState
      icon={<div>Icon</div>}
      title="Test Title"
      description="Test description"
      benefits={["Benefit 1", "Benefit 2"]}
      cta={{ label: "Action", onClick: jest.fn() }}
    />
  );
  
  expect(screen.getByText('Test Title')).toBeInTheDocument();
  expect(screen.getByText('Test description')).toBeInTheDocument();
  expect(screen.getByText('Benefit 1')).toBeInTheDocument();
  expect(screen.getByText('Benefit 2')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
});

test('calls onClick when CTA is clicked', () => {
  const handleClick = jest.fn();
  
  render(
    <DashboardEmptyState
      icon={<div>Icon</div>}
      title="Title"
      description="Description"
      cta={{ label: "Click Me", onClick: handleClick }}
    />
  );
  
  fireEvent.click(screen.getByRole('button', { name: 'Click Me' }));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

## Common Patterns

### Loading State Transition

```tsx
{isLoading ? (
  <Skeleton variant="empty-state" />
) : data.length === 0 ? (
  <DashboardEmptyState
    icon={<InboxIcon />}
    title="No data yet"
    description="Get started"
    cta={{ label: "Create", onClick: handleCreate }}
  />
) : (
  <DataView data={data} />
)}
```

### Conditional Benefits

```tsx
<DashboardEmptyState
  icon={<Icon />}
  title="No rules"
  description="Create automated workflows"
  benefits={isNewUser ? [
    "Auto-respond to subscribers",
    "Re-engage inactive fans",
    "Prioritize VIP conversations"
  ] : undefined}
  cta={{ label: "Create Rule", onClick: handleCreate }}
/>
```

### With Navigation

```tsx
import { useNavigate } from 'react-router-dom';

function EmptyFansView() {
  const navigate = useNavigate();
  
  return (
    <DashboardEmptyState
      icon={<UsersIcon />}
      title="No fans yet"
      description="Connect your OnlyFans account to start tracking fans"
      cta={{
        label: "Connect Account",
        onClick: () => navigate('/settings/integrations')
      }}
    />
  );
}
```

### Error Boundary Fallback

```tsx
class ErrorBoundary extends React.Component {
  render() {
    if (this.state.hasError) {
      return (
        <DashboardEmptyState
          icon={<AlertIcon />}
          title="Something went wrong"
          description="We're having trouble loading this view"
          cta={{
            label: "Refresh Page",
            onClick: () => window.location.reload()
          }}
        />
      );
    }
    
    return this.props.children;
  }
}
```

## Design Guidelines

### When to Use

- No data available in a view
- Empty search results
- Error states requiring user action
- Permission denied states
- Onboarding empty states

### When Not to Use

- Loading states (use Skeleton instead)
- Inline errors (use inline error messages)
- Success messages (use Toast or Banner)
- Navigation prompts (use Modal or Dialog)

### Content Guidelines

- **Title**: Clear, concise (under 50 characters)
- **Description**: Explain why empty and what to do (under 150 characters)
- **Benefits**: 3-5 bullet points maximum
- **CTA**: Action-oriented verb (Create, Add, Connect, etc.)

### Icon Guidelines

- Use 48px size for consistency
- Choose icons that represent the content type
- Use neutral colors (#9CA3AF) for empty states
- Use warning colors for error states
- Ensure icons are recognizable at small sizes

## State-Specific Examples

### Empty Data

```tsx
<DashboardEmptyState
  icon={<InboxIcon />}
  title="No {resource} yet"
  description="Get started by creating your first {resource}"
  cta={{ label: "Create {Resource}", onClick: handleCreate }}
/>
```

### No Search Results

```tsx
<DashboardEmptyState
  icon={<SearchIcon />}
  title="No results found"
  description="Try adjusting your search or filters"
  cta={{ label: "Clear Filters", onClick: clearFilters }}
/>
```

### Error State

```tsx
<DashboardEmptyState
  icon={<AlertCircleIcon />}
  title="Failed to load"
  description="Please try again or contact support"
  cta={{ label: "Retry", onClick: refetch }}
/>
```

### Permission Denied

```tsx
<DashboardEmptyState
  icon={<LockIcon />}
  title="Access restricted"
  description="Contact your administrator for access"
  cta={{ label: "Go Back", onClick: goBack }}
/>
```

## Related Components

- [StatCard](./StatCard.md) - For displaying metrics
- [InfoCard](./InfoCard.md) - For informational content
- [Skeleton](../Skeleton.md) - For loading states
- [Banner](../Banner.md) - For inline messages

## Changelog

- **v1.0.0** - Initial release
- Component created as part of Dashboard Views Unification project
- Validates Requirements 1.2, 5.5
