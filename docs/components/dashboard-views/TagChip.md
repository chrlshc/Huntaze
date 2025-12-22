# TagChip Component

Display status, category, or tier information as compact, colored pills.

## Import

```tsx
import { TagChip } from '@/components/ui/TagChip';
// or
import { TagChip } from '@/components/ui';
```

## Basic Usage

```tsx
<TagChip label="VIP" variant="vip" />
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `label` | `string` | Yes | - | Text to display in the chip |
| `variant` | `TagVariant` | Yes | - | Visual variant determining colors |
| `className` | `string` | No | - | Additional CSS classes |

### TagVariant Type

```typescript
type TagVariant = 
  | 'vip'        // VIP tier
  | 'active'     // Active/Top Fan
  | 'at-risk'    // At-Risk
  | 'churned'    // Churned
  | 'churn-low'  // Low churn risk
  | 'churn-high' // High churn risk
  | 'nouveau';   // New/Nouveau
```

## Examples

### Tier Status

```tsx
<TagChip label="VIP" variant="vip" />
<TagChip label="Active" variant="active" />
<TagChip label="At-Risk" variant="at-risk" />
<TagChip label="Churned" variant="churned" />
```

### Churn Risk

```tsx
<TagChip label="Low" variant="churn-low" />
<TagChip label="High" variant="churn-high" />
```

### In a Table

```tsx
<table>
  <thead>
    <tr>
      <th>Fan Name</th>
      <th>Tier</th>
      <th>Churn Risk</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>John Doe</td>
      <td><TagChip label="VIP" variant="vip" /></td>
      <td><TagChip label="Low" variant="churn-low" /></td>
    </tr>
    <tr>
      <td>Jane Smith</td>
      <td><TagChip label="Active" variant="active" /></td>
      <td><TagChip label="High" variant="churn-high" /></td>
    </tr>
  </tbody>
</table>
```

### Multiple Chips

```tsx
<div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
  <TagChip label="VIP" variant="vip" />
  <TagChip label="Active" variant="active" />
  <TagChip label="Low Risk" variant="churn-low" />
</div>
```

## Color Variants

| Variant | Background | Text Color | Use Case |
|---------|-----------|------------|----------|
| `vip` | #FFF4E5 | #9A3412 | VIP tier status |
| `active` | #E5F0FF | #1D4ED8 | Active/Top Fan tier |
| `at-risk` | #FFF4E5 | #9A3412 | At-Risk fans |
| `churned` | #F3F4F6 | #4B5563 | Churned fans |
| `churn-low` | #ECFDF3 | #166534 | Low churn risk |
| `churn-high` | #FEF2F2 | #B91C1C | High churn risk |
| `nouveau` | #ECFDF3 | #166534 | New/Nouveau fans |

All color combinations meet WCAG AA contrast requirements (4.5:1 minimum).

## Styling

The component uses these design specifications:

- Font size: 10px
- Font weight: 500
- Padding: 2-6px vertical, 6-8px horizontal
- Border radius: 999px (pill shape)
- Line height: 1.2
- White space: nowrap

### Custom Styling

```tsx
<TagChip
  label="Custom"
  variant="vip"
  className="custom-tag"
/>
```

```css
.custom-tag {
  font-size: 11px;
  padding: 4px 10px;
  text-transform: uppercase;
}
```

## Accessibility

- Uses semantic HTML
- Meets WCAG AA contrast ratios
- Includes text labels (not icon-only)
- Screen reader friendly
- Color-blind friendly (uses text + color)

### ARIA Labels

```tsx
<TagChip
  label="VIP"
  variant="vip"
  aria-label="VIP tier status"
/>
```

## Responsive Behavior

TagChips maintain consistent sizing across all screen sizes. They use `white-space: nowrap` to prevent text wrapping.

For responsive layouts with multiple chips:

```tsx
<div className="flex flex-wrap gap-2">
  {tags.map(tag => (
    <TagChip key={tag.id} label={tag.label} variant={tag.variant} />
  ))}
</div>
```

## Performance

- Memoized with `React.memo`
- Lightweight DOM structure
- No JavaScript interactions (pure CSS)
- Minimal re-renders

## Testing

### Unit Test Example

```tsx
import { render, screen } from '@testing-library/react';
import { TagChip } from '@/components/ui/TagChip';

test('renders label with correct variant', () => {
  render(<TagChip label="VIP" variant="vip" />);
  
  const chip = screen.getByTestId('tag-chip');
  expect(chip).toHaveTextContent('VIP');
  expect(chip).toHaveClass('tag-chip--vip');
});

test('applies correct colors for variant', () => {
  const { container } = render(<TagChip label="VIP" variant="vip" />);
  
  const chip = container.firstChild as HTMLElement;
  const styles = window.getComputedStyle(chip);
  
  expect(styles.backgroundColor).toBe('rgb(255, 244, 229)'); // #FFF4E5
  expect(styles.color).toBe('rgb(154, 52, 18)'); // #9A3412
});
```

## Common Patterns

### Dynamic Variant

```tsx
function FanTierChip({ tier }: { tier: string }) {
  const variantMap: Record<string, TagVariant> = {
    'VIP': 'vip',
    'Active': 'active',
    'At-Risk': 'at-risk',
    'Churned': 'churned'
  };
  
  return (
    <TagChip
      label={tier}
      variant={variantMap[tier] || 'active'}
    />
  );
}
```

### Conditional Rendering

```tsx
{fan.tier && (
  <TagChip label={fan.tier} variant={getTierVariant(fan.tier)} />
)}
```

### With Tooltip

```tsx
<Tooltip content="VIP fans get priority support">
  <TagChip label="VIP" variant="vip" />
</Tooltip>
```

### In Card Footer

```tsx
<div className="card-footer">
  <span className="text-sm text-gray-600">Status:</span>
  <TagChip label="Active" variant="active" />
</div>
```

## Design Guidelines

### When to Use

- Displaying tier or status information
- Showing risk levels or categories
- Indicating fan segments
- Labeling content types

### When Not to Use

- For interactive buttons (use Button instead)
- For long text (use Badge or Label instead)
- For metrics (use StatCard instead)
- For navigation (use Tab or Link instead)

### Content Guidelines

- **Label**: Keep under 15 characters
- **Clarity**: Use clear, recognizable terms
- **Consistency**: Use same labels across the app
- **Case**: Use title case or uppercase consistently

## Variant Selection Guide

Choose the appropriate variant based on context:

- **vip**: Premium tier, high-value fans
- **active**: Engaged, active fans
- **at-risk**: Fans showing signs of disengagement
- **churned**: Fans who have left
- **churn-low**: Low risk of churn
- **churn-high**: High risk of churn
- **nouveau**: New or recently joined fans

## Related Components

- [StatCard](./StatCard.md) - For displaying metrics
- [InfoCard](./InfoCard.md) - For informational content
- [Badge](../Badge.md) - For notification counts
- [Label](../Label.md) - For form labels

## Changelog

- **v1.0.0** - Initial release
- Component created as part of Dashboard Views Unification project
- Validates Requirements 2.5, 2.6, 4.3
