# Button Component

The Button component provides consistent, accessible buttons with multiple variants and states.

## Import

```tsx
import { Button } from '@/components/ui';
```

## Basic Usage

```tsx
<Button variant="primary">Click me</Button>
```

## Props

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'tonal' | 'danger' | 'gradient' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'pill';
  loading?: boolean;
}
```

## Variants

### Primary

The main call-to-action button with accent color background.

```tsx
<Button variant="primary">
  Save Changes
</Button>
```

### Secondary

Secondary actions with subtle background and border.

```tsx
<Button variant="secondary">
  Cancel
</Button>
```

### Outline

Transparent background with border, for tertiary actions.

```tsx
<Button variant="outline">
  Learn More
</Button>
```

### Ghost

Minimal button with no background or border.

```tsx
<Button variant="ghost">
  Skip
</Button>
```

### Danger

For destructive actions like delete or remove.

```tsx
<Button variant="danger">
  Delete Account
</Button>
```

### Gradient

Premium button with gradient background.

```tsx
<Button variant="gradient">
  Upgrade to Pro
</Button>
```

## Sizes

```tsx
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
<Button size="xl">Extra Large</Button>
<Button size="pill">Pill Shape</Button>
```

## States

### Loading

Shows a spinner and disables the button.

```tsx
<Button loading>
  Processing...
</Button>
```

### Disabled

```tsx
<Button disabled>
  Disabled Button
</Button>
```

## Examples

### Button Group

```tsx
<div className="flex gap-[var(--space-3)]">
  <Button variant="secondary">Cancel</Button>
  <Button variant="primary">Save</Button>
</div>
```

### With Icon

```tsx
import { Plus } from 'lucide-react';

<Button variant="primary">
  <Plus className="w-4 h-4" />
  Add Item
</Button>
```

### Full Width

```tsx
<Button variant="primary" className="w-full">
  Continue
</Button>
```

### Async Action

```tsx
function MyComponent() {
  const [loading, setLoading] = useState(false);
  
  const handleClick = async () => {
    setLoading(true);
    await saveData();
    setLoading(false);
  };
  
  return (
    <Button 
      variant="primary" 
      loading={loading}
      onClick={handleClick}
    >
      Save
    </Button>
  );
}
```

## Accessibility

- Uses semantic `<button>` element
- Includes `aria-busy` when loading
- Includes `aria-disabled` when disabled
- Keyboard accessible (Enter and Space)
- Visible focus indicator
- Minimum 44x44px touch target on mobile

## Design Tokens Used

```css
/* Colors */
--accent-primary
--accent-primary-hover
--bg-surface
--bg-hover
--border-subtle
--text-primary
--text-secondary

/* Spacing */
--space-2 (vertical padding)
--space-3 (gap between icon and text)
--space-4 (horizontal padding)

/* Typography */
--font-weight-medium
--text-xs (small)
--text-sm (medium)
--text-base (large)

/* Effects */
--shadow-sm
--transition-base
--focus-ring-width
--focus-ring-color
--focus-ring-offset

/* Sizing */
--button-height-dense (sm)
--button-height-standard (md)
--button-border-radius
```

## Best Practices

### ✅ Do

```tsx
// Use appropriate variants
<Button variant="primary">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>

// Show loading state for async actions
<Button loading={isSubmitting}>Submit</Button>

// Use button groups for related actions
<div className="flex gap-[var(--space-3)]">
  <Button variant="secondary">Cancel</Button>
  <Button variant="primary">Confirm</Button>
</div>
```

### ❌ Don't

```tsx
// Don't use primary for everything
<Button variant="primary">Cancel</Button>
<Button variant="primary">Delete</Button>

// Don't forget loading states
<Button onClick={asyncAction}>Submit</Button>

// Don't use buttons for navigation
<Button onClick={() => router.push('/page')}>Go to Page</Button>
// Use Link instead
```

## Variants Comparison

| Variant | Use Case | Visual Style |
|---------|----------|--------------|
| Primary | Main actions | Accent background, white text |
| Secondary | Secondary actions | Subtle background, border |
| Outline | Tertiary actions | Transparent, border only |
| Ghost | Minimal actions | Transparent, no border |
| Danger | Destructive actions | Red background |
| Gradient | Premium features | Gradient background |
| Link | Inline actions | Text only, underline on hover |

---

[← Back to Components](./README.md) | [Next: Input →](./input.md)
