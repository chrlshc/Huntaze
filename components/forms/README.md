# Form Components - Linear Design System Migration

This directory contains form components migrated to use the Linear design system with design tokens.

## Overview

All form components have been updated to use:
- **Design tokens** from `styles/linear-design-tokens.css`
- **Standard heights**: 32px (dense) or 40px (standard)
- **4px grid system** for all spacing
- **Midnight Violet theme** colors
- **Inter typography** with Medium (500) and Regular (400) weights

## Components

### FormInput

Text input component with label, error, and helper text support.

```tsx
import { FormInput } from '@/components/forms/FormInput';

<FormInput
  label="Email Address"
  name="email"
  type="email"
  value={email}
  onChange={handleChange}
  placeholder="you@example.com"
  required
  error={errors.email}
  helperText="We'll never share your email"
  variant="standard" // or "dense"
/>
```

**Props:**
- `label?: string` - Label text
- `error?: string` - Error message to display
- `helperText?: string` - Helper text below input
- `variant?: 'dense' | 'standard'` - Height variant (32px or 40px)
- All standard HTML input attributes

**Design Token Usage:**
- Height: `var(--input-height-dense)` (32px) or `var(--input-height-standard)` (40px)
- Background: `var(--color-bg-input)`
- Border: `var(--color-border-subtle)`
- Text: `var(--color-text-primary)`
- Padding: `var(--spacing-3)` (12px) horizontal, `var(--spacing-2)` (8px) vertical

### FormTextarea

Textarea component with label, error, and helper text support.

```tsx
import { FormTextarea } from '@/components/forms/FormInput';

<FormTextarea
  label="Message"
  name="message"
  value={message}
  onChange={handleChange}
  placeholder="Enter your message..."
  rows={5}
  required
  error={errors.message}
/>
```

**Props:**
- Same as FormInput, plus all standard HTML textarea attributes

**Design Token Usage:**
- Background: `var(--color-bg-input)`
- Border: `var(--color-border-subtle)`
- Text: `var(--color-text-primary)`
- Padding: `var(--spacing-4)` (16px) horizontal, `var(--spacing-3)` (12px) vertical

### FormSelect

Select dropdown component with label, error, and helper text support.

```tsx
import { FormSelect } from '@/components/forms/FormInput';

<FormSelect
  label="Category"
  name="category"
  value={category}
  onChange={handleChange}
  required
  options={[
    { value: 'general', label: 'General Inquiry' },
    { value: 'support', label: 'Technical Support' },
  ]}
  variant="standard"
/>
```

**Props:**
- `options: Array<{ value: string; label: string }>` - Select options
- `variant?: 'dense' | 'standard'` - Height variant (32px or 40px)
- All standard HTML select attributes

**Design Token Usage:**
- Height: `var(--input-height-dense)` (32px) or `var(--input-height-standard)` (40px)
- Background: `var(--color-bg-input)`
- Border: `var(--color-border-subtle)`
- Text: `var(--color-text-primary)`

### FormCheckbox

Checkbox component with label and helper text support.

```tsx
import { FormCheckbox } from '@/components/forms/FormInput';

<FormCheckbox
  label="Subscribe to newsletter"
  name="subscribe"
  checked={subscribe}
  onChange={handleChange}
  helperText="Get updates about new features"
/>
```

**Props:**
- `label: string` - Label text (required)
- `helperText?: string` - Helper text below checkbox
- All standard HTML checkbox attributes (except `type`)

**Design Token Usage:**
- Size: 20px (5 × 4px grid)
- Border: `var(--color-border-subtle)`
- Checked color: `var(--color-accent-primary)`
- Background: `var(--color-bg-input)`

## Button Component

The Button component has also been migrated to use design tokens.

```tsx
import { Button } from '@/components/ui/button';

<Button variant="primary" size="md">
  Submit
</Button>

<Button variant="secondary" size="sm">
  Dense Button (32px)
</Button>
```

**Size Variants:**
- `sm`: 32px height (dense) - `var(--button-height-dense)`
- `md`: 40px height (standard) - `var(--button-height-standard)`
- `lg`: 48px height
- `xl`: 56px height
- `pill`: 44px height with full rounded corners

**Variant Styles:**
- `primary`: Accent color background
- `secondary`: Surface color with border
- `outline`: Transparent with border
- `ghost`: Transparent, no border
- `tonal`: Surface color, no border
- `danger`: Error color background
- `gradient`: Gradient accent colors
- `link`: Text-only with underline on hover

## Input Component

The base Input component has been migrated to use design tokens.

```tsx
import { Input } from '@/components/ui/input';

<Input
  placeholder="Enter text..."
  error="This field is required"
  variant="standard"
/>
```

**Props:**
- `error?: string` - Error message
- `variant?: 'dense' | 'standard'` - Height variant
- All standard HTML input attributes

## Layout Integration

### CenteredContainer

All form pages should use `CenteredContainer` for proper layout:

```tsx
import { CenteredContainer } from '@/components/layout/CenteredContainer';

<CenteredContainer maxWidth="sm" padding={24}>
  <form>
    {/* Form content */}
  </form>
</CenteredContainer>
```

**Props:**
- `maxWidth?: 'sm' | 'lg'` - Max width (1200px or 1280px)
- `padding?: number` - Internal padding (should be multiple of 4)

### Skeleton Loading States

Use `SkeletonScreen` for form loading states:

```tsx
import { SkeletonScreen } from '@/components/layout/SkeletonScreen';

{isLoading ? (
  <SkeletonScreen variant="form" animate={true} />
) : (
  <form>{/* Form content */}</form>
)}
```

## Design System Compliance

### Height Constraints

✓ **Input fields**: 32px (dense) or 40px (standard)
✓ **Buttons**: 32px (sm) or 40px (md) for standard sizes
✓ **Select dropdowns**: 32px (dense) or 40px (standard)

### Spacing System

✓ All margins and padding use multiples of 4px
✓ Spacing tokens: `var(--spacing-1)` through `var(--spacing-24)`

### Color System

✓ Background: `var(--color-bg-input)` (#18181A)
✓ Border: `var(--color-border-subtle)` (#2E2E33)
✓ Text: `var(--color-text-primary)` (#EDEDEF)
✓ Accent: `var(--color-accent-primary)` (#7D57C1)
✓ Error: `var(--color-error)` (#EF4444)

### Typography

✓ Font family: `var(--font-family-base)` (Inter)
✓ Font weights: 400 (Regular) and 500 (Medium) only
✓ Font sizes: `var(--font-size-xs)` through `var(--font-size-4xl)`

## Example Usage

See `components/forms/FormExample.tsx` for a complete example demonstrating:
- All form components
- Design token usage
- CenteredContainer layout
- Skeleton loading states
- Standard and dense variants
- Error handling
- Helper text

## Migration Checklist

When migrating existing forms:

- [ ] Replace hardcoded colors with design token CSS variables
- [ ] Update input heights to use `var(--input-height-dense)` or `var(--input-height-standard)`
- [ ] Update button heights to use `var(--button-height-dense)` or `var(--button-height-standard)`
- [ ] Replace hardcoded spacing with `var(--spacing-*)` tokens
- [ ] Wrap form in `CenteredContainer` component
- [ ] Add `SkeletonScreen` for loading states
- [ ] Ensure all spacing is multiples of 4px
- [ ] Use Inter font with weights 400 or 500 only
- [ ] Test focus states and accessibility

## Testing

Property-based tests validate:
- Input heights are 32px or 40px
- Button heights are 32px or 40px
- All padding/margin values are multiples of 4px
- Design tokens are properly applied

Run tests:
```bash
npm run test -- tests/unit/components/form-constraints.property.test.tsx
```

## Requirements Validated

- **1.1-1.7**: Midnight Violet color theme
- **2.1-2.4**: Inter typography system
- **3.1-3.5**: 4px grid spacing system
- **4.1-4.5**: CenteredContainer layout
- **6.1-6.5**: Skeleton loading states

## Related Files

- `styles/linear-design-tokens.css` - Design token definitions
- `types/design-tokens.ts` - TypeScript type definitions
- `components/layout/CenteredContainer.tsx` - Layout container
- `components/layout/SkeletonScreen.tsx` - Loading states
- `tests/unit/components/form-constraints.property.test.tsx` - Property tests
