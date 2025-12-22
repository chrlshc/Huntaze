# Dashboard Views Component Library

A collection of reusable UI components for building consistent, professional dashboard views across the application. These components follow the design system established in the Messages view and provide a cohesive SaaS experience.

## Components

- [StatCard](./StatCard.md) - Display key metrics with labels, values, and optional deltas
- [InfoCard](./InfoCard.md) - Show informational content with icons and descriptions
- [TagChip](./TagChip.md) - Display status or category information as colored pills
- [EmptyState](./EmptyState.md) - Provide guidance when no data is available

## Quick Start

```tsx
import { StatCard, InfoCard, TagChip, EmptyState } from '@/components/ui';

// Display a metric
<StatCard
  label="Total Revenue"
  value="$4,196"
  delta={{ value: "+12%", trend: "up" }}
/>

// Show information
<InfoCard
  icon={<LightningIcon />}
  title="Auto-respond to new subscribers"
  description="Send personalized welcome messages automatically"
/>

// Display status
<TagChip label="VIP" variant="vip" />

// Show empty state
<EmptyState
  icon={<InboxIcon />}
  title="No data yet"
  description="Get started by creating your first item"
  cta={{ label: "Create", onClick: handleCreate }}
/>
```

## Design Principles

All components follow these principles:

1. **Visual Consistency** - Use design tokens from `styles/dashboard-views.css`
2. **Accessibility** - WCAG AA compliant with keyboard navigation support
3. **Responsive** - Adapt gracefully to mobile, tablet, and desktop
4. **Performance** - Memoized and optimized for large datasets
5. **Composability** - Work together seamlessly across views

## StatCard

Display key performance indicators with optional trend indicators.

### Props

```typescript
interface StatCardProps {
  label: string;              // Metric label (e.g., "Total Revenue")
  value: string | number;     // Metric value (e.g., "$4,196" or 1234)
  icon?: React.ReactNode;     // Optional icon
  delta?: {                   // Optional trend indicator
    value: string | number;   // Change amount (e.g., "+12%" or -5)
    trend: 'up' | 'down' | 'neutral';
  };
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}
```

### Usage Examples

**Basic metric:**
```tsx
<StatCard
  label="Total Fans"
  value="1,234"
/>
```

**With icon:**
```tsx
<StatCard
  label="VIP Fans"
  value="127"
  icon={<StarIcon />}
/>
```

**With positive trend:**
```tsx
<StatCard
  label="Revenue"
  value="$4,196"
  delta={{ value: "+12%", trend: "up" }}
/>
```

**With negative trend:**
```tsx
<StatCard
  label="Churn Rate"
  value="3.2%"
  delta={{ value: "-0.5%", trend: "down" }}
  variant="success"
/>
```

### Styling

- Label: 11px uppercase, #9CA3AF, 0.05em letter-spacing
- Value: 20px, 600 weight, #111111
- Delta: 12px, #16A34A (positive) or #DC2626 (negative)
- Padding: 10-12px
- Border: 1px solid #E3E3E3
- Border radius: 12px
- Hover: Border #D0D0D0, shadow 0 2px 8px rgba(0, 0, 0, 0.06)

### Accessibility

- Semantic HTML with proper heading levels
- ARIA labels for screen readers
- Keyboard focusable when interactive
- Color-blind friendly (uses icons + colors)

## InfoCard

Display informational content in a compact, scannable format.

### Props

```typescript
interface InfoCardProps {
  icon: React.ReactNode;      // Icon (32px circular container)
  title: string;              // Card title
  description: string;        // Card description (max 2 lines)
  onClick?: () => void;       // Optional click handler
  className?: string;
}
```

### Usage Examples

**Basic info card:**
```tsx
<InfoCard
  icon={<LightningIcon />}
  title="Auto-respond to new subscribers"
  description="Send personalized welcome messages automatically when fans subscribe"
/>
```

**Clickable card:**
```tsx
<InfoCard
  icon={<ClockIcon />}
  title="Re-engage inactive fans"
  description="Automatically reach out to fans who haven't interacted in 30 days"
  onClick={() => navigate('/smart-messages/new')}
/>
```

**Side-by-side layout:**
```tsx
<div style={{ display: 'flex', gap: '12px' }}>
  <InfoCard
    icon={<Icon1 />}
    title="Feature 1"
    description="Description 1"
  />
  <InfoCard
    icon={<Icon2 />}
    title="Feature 2"
    description="Description 2"
  />
</div>
```

### Styling

- Icon container: 32px circular, #EEF2FF background, #5B6BFF color
- Title: 14px, 600 weight, #111111
- Description: 13px, #6B7280, 2-line clamp
- Gap: 12px between icon and content
- Padding: 12-14px
- Border: 1px solid #E3E3E3
- Border radius: 12px
- Hover: Background #F9FAFF, border #D0D0D0

### Accessibility

- Semantic HTML structure
- ARIA labels for icons
- Keyboard accessible when clickable
- Focus indicators on interactive cards

## TagChip

Display status, category, or tier information as colored pills.

### Props

```typescript
type TagVariant = 
  | 'vip'        // VIP tier
  | 'active'     // Active/Top Fan
  | 'at-risk'    // At-Risk
  | 'churned'    // Churned
  | 'churn-low'  // Low churn risk
  | 'churn-high' // High churn risk
  | 'nouveau';   // New/Nouveau

interface TagChipProps {
  label: string;
  variant: TagVariant;
  className?: string;
}
```

### Usage Examples

**Tier status:**
```tsx
<TagChip label="VIP" variant="vip" />
<TagChip label="Active" variant="active" />
<TagChip label="At-Risk" variant="at-risk" />
<TagChip label="Churned" variant="churned" />
```

**Churn risk:**
```tsx
<TagChip label="Low" variant="churn-low" />
<TagChip label="High" variant="churn-high" />
```

**In a table:**
```tsx
<table>
  <tr>
    <td>John Doe</td>
    <td><TagChip label="VIP" variant="vip" /></td>
    <td><TagChip label="Low" variant="churn-low" /></td>
  </tr>
</table>
```

### Color Variants

| Variant | Background | Text Color | Use Case |
|---------|-----------|------------|----------|
| `vip` | #FFF4E5 | #9A3412 | VIP tier status |
| `active` | #E5F0FF | #1D4ED8 | Active/Top Fan |
| `at-risk` | #FFF4E5 | #9A3412 | At-Risk fans |
| `churned` | #F3F4F6 | #4B5563 | Churned fans |
| `churn-low` | #ECFDF3 | #166534 | Low churn risk |
| `churn-high` | #FEF2F2 | #B91C1C | High churn risk |
| `nouveau` | #ECFDF3 | #166534 | New/Nouveau |

### Styling

- Font size: 10px
- Font weight: 500
- Padding: 2-6px vertical, 6-8px horizontal
- Border radius: 999px (pill shape)
- Line height: 1.2
- White space: nowrap

### Accessibility

- WCAG AA contrast ratios
- Non-color indicators (text labels)
- Screen reader friendly
- Semantic HTML

## EmptyState

Provide clear guidance and call-to-action when no data is available.

### Props

```typescript
interface EmptyStateProps {
  icon: React.ReactNode;      // Icon or illustration
  title: string;              // Empty state title
  description: string;        // Explanation text
  benefits?: string[];        // Optional bullet points
  cta: {                      // Call-to-action button
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  className?: string;
}
```

### Usage Examples

**Basic empty state:**
```tsx
<EmptyState
  icon={<InboxIcon />}
  title="No data yet"
  description="Get started by creating your first item"
  cta={{
    label: "Create New",
    onClick: handleCreate
  }}
/>
```

**With benefits:**
```tsx
<EmptyState
  icon={<RulesIcon />}
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
    icon: <PlusIcon />
  }}
/>
```

**Error state:**
```tsx
<EmptyState
  icon={<AlertIcon />}
  title="Failed to load data"
  description="We're having trouble loading this view. Please try again."
  cta={{
    label: "Retry",
    onClick: refetch
  }}
/>
```

### Styling

- Container: max-width 600px, centered, 32px padding
- Icon: 48px, #9CA3AF
- Title: 18px, 600 weight, #111111
- Description: 14px, #6B7280, 1.5 line-height
- Benefits: 13px, #6B7280, bullet points with #5B6BFF
- CTA: Background #5B6BFF, color #FFFFFF, 8px border radius
- CTA hover: Background #4F46E5, translateY(-1px), shadow

### Accessibility

- Semantic HTML structure
- ARIA labels for icons
- Keyboard accessible CTA
- Focus indicators
- Screen reader friendly

## Responsive Behavior

All components adapt to different screen sizes:

### Mobile (< 768px)
- StatCards stack vertically with full width
- InfoCards stack vertically
- Reduced padding (8px gaps, 12px padding)
- Smaller text sizes where appropriate

### Tablet (768px - 1024px)
- StatCards in 2-column grid
- InfoCards in 2-column grid
- Standard padding

### Desktop (> 1024px)
- StatCards in flexible row layout
- InfoCards side-by-side
- Optimal spacing and sizing

## Performance

All components are optimized for performance:

- **Memoized** with `React.memo`
- **Lazy loaded** when used in views
- **Virtual scrolling** for large lists
- **Debounced** interactions where appropriate

## Testing

Components are thoroughly tested:

- **Unit tests** - Component rendering and props
- **Property tests** - Visual consistency and behavior
- **Integration tests** - Component interactions
- **Accessibility tests** - WCAG compliance
- **Visual regression tests** - Screenshot comparison

Run tests:
```bash
npm run test:unit -- dashboard-views
npm run test:visual
npm run test:a11y
```

## Migration Guide

Migrating from old components:

### Old StatCard → New StatCard
```tsx
// Before
<OldMetricCard metric="Revenue" value="$4,196" change="+12%" />

// After
<StatCard
  label="Revenue"
  value="$4,196"
  delta={{ value: "+12%", trend: "up" }}
/>
```

### Old InfoBlock → New InfoCard
```tsx
// Before
<InfoBlock icon="lightning" title="Auto-respond" text="..." />

// After
<InfoCard
  icon={<LightningIcon />}
  title="Auto-respond"
  description="..."
/>
```

### Old StatusBadge → New TagChip
```tsx
// Before
<StatusBadge status="vip" />

// After
<TagChip label="VIP" variant="vip" />
```

## Related Documentation

- [Design System](../../design-system/README.md)
- [Design Tokens](../../../styles/dashboard-views.css)
- [Testing Guide](../../../tests/visual/DASHBOARD-VIEWS-TESTING.md)
- [Accessibility Guidelines](../../accessibility/README.md)

## Support

For questions or issues:
- Check existing tests for usage examples
- Review design document: `.kiro/specs/dashboard-views-unification/design.md`
- Create issue in GitHub repository
- Ask in #frontend Slack channel
