# Button Hierarchy Audit

## Button Hierarchy System

### Primary Actions (Highest Priority)
- **Use case**: Main CTAs, form submissions, primary navigation
- **Class**: `shopify-btn shopify-btn--primary`
- **Style**: Solid background (black on light, white on dark)
- **Examples**: "Start Free", "Sign Up", "Get Started"

### Secondary Actions  
- **Use case**: Alternative actions, cancel buttons, secondary navigation
- **Class**: `shopify-btn shopify-btn--secondary`
- **Style**: Border only, transparent background
- **Examples**: "Learn More", "Cancel", "Browse Plans"

### Tertiary Actions
- **Use case**: Less important actions, links styled as buttons
- **Class**: `shopify-btn shopify-btn--tertiary`
- **Style**: No border, subtle hover state
- **Examples**: "Skip", "Maybe Later", "View Documentation"

## Size Hierarchy

### Large (lg) - Hero sections, main CTAs
- Height: 44px (2.75rem)
- Font: 16px (1rem)
- Padding: 0 32px (2rem)

### Medium (md) - Default, forms, cards
- Height: 36px (2.25rem)  
- Font: 14px (0.875rem)
- Padding: 0 24px (1.5rem)

### Small (sm) - Navigation, compact areas
- Height: 32px (2rem)
- Font: 13px (0.8125rem)
- Padding: 0 16px (1rem)

### Extra Small (xs) - Tags, inline actions
- Height: 28px (1.75rem)
- Font: 12px (0.75rem)
- Padding: 0 12px (0.75rem)

## Implementation Guidelines

### Navigation Buttons
```tsx
// Header navigation
<button className="shopify-btn shopify-btn--tertiary shopify-btn--sm">
  Features
</button>

// Header CTA
<button className="shopify-btn shopify-btn--primary shopify-btn--sm">
  Start Free Trial
</button>
```

### Hero Section
```tsx
// Primary CTA
<button className="shopify-btn shopify-btn--primary shopify-btn--lg">
  Get Started
</button>

// Secondary CTA  
<button className="shopify-btn shopify-btn--secondary shopify-btn--lg">
  Watch Demo
</button>
```

### Forms
```tsx
// Submit button
<button className="shopify-btn shopify-btn--primary shopify-btn--md shopify-btn--full">
  Submit
</button>

// Cancel button
<button className="shopify-btn shopify-btn--secondary shopify-btn--md">
  Cancel
</button>
```

### Cards & Lists
```tsx
// Action button in card
<button className="shopify-btn shopify-btn--primary shopify-btn--sm">
  View Details
</button>

// Inline action
<button className="shopify-btn shopify-btn--tertiary shopify-btn--xs">
  Edit
</button>
```

## Mobile Considerations

- All buttons have minimum 44px touch target on mobile
- Button groups stack vertically on mobile with `shopify-btn-group--stack-mobile`
- Full-width buttons on mobile forms with `shopify-btn--full`

## Current Issues Found

1. **Dashboard buttons** - Using custom classes, need to migrate to Shopify system
2. **Support page** - Inconsistent button styles, mix of custom and utility classes  
3. **Pricing page** - Using Radix UI Button component, needs styling alignment
4. **Form buttons** - Various custom implementations, should use consistent system

## Migration Checklist

- [ ] Replace all custom button classes with Shopify system
- [ ] Ensure proper size hierarchy (lg for hero, md for forms, sm for nav)
- [ ] Add proper loading states for async actions
- [ ] Verify all buttons meet 44px mobile touch target
- [ ] Test focus states for accessibility
- [ ] Ensure consistent hover/active states