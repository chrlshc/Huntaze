# Phase 13: Developer Quick Reference Guide

## Quick Start

### Running Tests
```bash
# Run all dashboard tests
npm test -- tests/unit/dashboard --run

# Run specific component tests
npm test -- tests/unit/dashboard/gamified-onboarding.property.test.tsx --run
npm test -- tests/unit/dashboard/button-styling.property.test.tsx --run

# Run cross-browser compatibility check
npx ts-node scripts/test-dashboard-cross-browser.ts
```

### Component Usage

#### GamifiedOnboarding Component

```tsx
import { GamifiedOnboarding } from '@/components/dashboard/GamifiedOnboarding';

<GamifiedOnboarding
  userName="Alice"
  hasConnectedAccounts={false}
  onConnectAccount={() => router.push('/integrations')}
  onCreateContent={() => router.push('/content/create')}
/>
```

**Props**:
- `userName`: string - User's first name for personalized greeting
- `hasConnectedAccounts`: boolean - Whether user has connected any accounts
- `onConnectAccount`: () => void - Callback for connect button
- `onCreateContent`: () => void - Callback for create button

**When to Use**:
- Show for new users who haven't completed onboarding
- Display at top of dashboard page
- Hide after user completes initial setup

#### Button Component

```tsx
import { Button } from '@/components/dashboard/Button';

// Primary button (Electric Indigo gradient)
<Button variant="primary" size="medium">
  Connect Account
</Button>

// Secondary button (outline style)
<Button variant="secondary" size="large">
  Learn More
</Button>

// Ghost button (minimal style)
<Button variant="ghost" size="small">
  Cancel
</Button>

// Loading state
<Button variant="primary" isLoading>
  Saving...
</Button>

// Disabled state
<Button variant="primary" disabled>
  Not Available
</Button>
```

**Props**:
- `variant`: 'primary' | 'secondary' | 'ghost' - Button style
- `size`: 'small' | 'medium' | 'large' - Button size
- `fullWidth`: boolean - Make button full width
- `isLoading`: boolean - Show loading spinner
- `disabled`: boolean - Disable button
- All standard button HTML attributes

## Design Tokens Reference

### Colors
```css
/* Primary */
--color-indigo: #6366f1;
--color-indigo-dark: #4f46e5;
--color-indigo-fade: rgba(99, 102, 241, 0.08);
--color-indigo-glow: rgba(99, 102, 241, 0.2);

/* Backgrounds */
--bg-app: #F8F9FB;
--bg-surface: #FFFFFF;

/* Text */
--color-text-heading: #111827;
--color-text-main: #1F2937;
--color-text-sub: #6B7280;

/* Semantic */
--color-success: #10B981;
--color-error: #EF4444;
```

### Spacing
```css
/* Card System */
--spacing-card-gap: 24px;
--spacing-card-padding: 24px;
--radius-card: 16px;

/* Content Blocks */
--spacing-content-block-gap: 32px;

/* Components */
--radius-button: 8px;
```

### Shadows
```css
/* Soft shadow (default) */
--shadow-soft: 0 4px 20px rgba(0, 0, 0, 0.05);

/* Card hover */
--shadow-card-hover: 0 12px 24px rgba(0, 0, 0, 0.1);
```

### Typography
```css
/* Font Families */
--font-heading: 'Poppins', 'Inter', sans-serif;
--font-body: 'Inter', system-ui, sans-serif;

/* Font Sizes */
--font-size-welcome: 24px;
--font-size-h2: 20px;
--font-size-h3: 18px;
--font-size-body: 16px;
--font-size-small: 14px;

/* Font Weights */
--font-weight-heading: 600;
--font-weight-medium: 500;
--font-weight-normal: 400;

/* Letter Spacing */
--letter-spacing-tight: -0.5px;
```

## CSS Classes Reference

### Layout Classes
```css
.huntaze-layout          /* Root grid container */
.huntaze-header          /* Sticky header */
.huntaze-sidebar         /* Fixed sidebar */
.huntaze-main            /* Scrollable main content */
```

### Typography Classes
```css
.huntaze-h1              /* Main heading */
.huntaze-h2              /* Section heading */
.huntaze-h3              /* Subsection heading */
.huntaze-body            /* Body text */
.huntaze-body-small      /* Small body text */
.huntaze-body-secondary  /* Secondary text */
.huntaze-label           /* Label text */
```

### Component Classes
```css
.huntaze-card            /* Card container */
.huntaze-card-grid       /* Card grid layout */
.huntaze-nav-item        /* Navigation item */
.huntaze-nav-item.active /* Active navigation */
```

## Common Patterns

### Card Layout
```tsx
<div className="huntaze-card-grid">
  <div className="huntaze-card">
    <h3 className="huntaze-label">Total Revenue</h3>
    <p className="huntaze-h1">$12,345</p>
    <p className="huntaze-body-small">+12.5% from last month</p>
  </div>
  {/* More cards... */}
</div>
```

### Stats Card with Color
```tsx
<div className="huntaze-card">
  <h3 className="huntaze-label">Active Fans</h3>
  <p className="huntaze-h1">{formatNumber(fans)}</p>
  <p 
    className="huntaze-body-small"
    style={{
      color: change >= 0 ? 'var(--color-success)' : 'var(--color-error)'
    }}
  >
    {formatPercentage(change)} from last month
  </p>
</div>
```

### Action Card with Button
```tsx
<div className="huntaze-card">
  <div className="flex items-center justify-center" style={{
    width: '48px',
    height: '48px',
    backgroundColor: 'var(--color-indigo-fade)',
    borderRadius: '8px',
    marginBottom: 'var(--spacing-lg)'
  }}>
    <svg style={{ width: '24px', height: '24px', color: 'var(--color-indigo)' }}>
      {/* Icon path */}
    </svg>
  </div>
  <h3 className="huntaze-h3">Card Title</h3>
  <p className="huntaze-body-secondary">Card description</p>
  <Button variant="primary" fullWidth>
    Take Action
  </Button>
</div>
```

## Responsive Design

### Breakpoints
```css
/* Mobile */
@media (max-width: 767px) {
  /* 1-column layout */
}

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) {
  /* 2-column layout */
}

/* Desktop */
@media (min-width: 1024px) {
  /* 3-column layout */
}
```

### Mobile-First Grid
```css
.huntaze-card-grid {
  display: grid;
  grid-template-columns: 1fr; /* Mobile: 1 column */
  gap: var(--spacing-card-gap);
}

@media (min-width: 768px) {
  .huntaze-card-grid {
    grid-template-columns: repeat(2, 1fr); /* Tablet: 2 columns */
  }
}

@media (min-width: 1024px) {
  .huntaze-card-grid {
    grid-template-columns: repeat(3, 1fr); /* Desktop: 3 columns */
  }
}
```

## Accessibility Guidelines

### Color Contrast
```tsx
// ✅ Good: Sufficient contrast
<p style={{ color: 'var(--color-text-main)' }}>Main text</p>

// ❌ Bad: Insufficient contrast
<p style={{ color: '#CCCCCC' }}>Light gray text</p>
```

### Focus Indicators
```css
/* Always provide visible focus indicators */
.button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--color-indigo-glow);
}
```

### Keyboard Navigation
```tsx
// Ensure all interactive elements are keyboard accessible
<button
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Click me
</button>
```

### Reduced Motion
```css
/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Performance Best Practices

### GPU Acceleration
```css
/* Use transforms for animations (GPU-accelerated) */
.card:hover {
  transform: translateY(-4px); /* ✅ Good */
}

/* Avoid animating layout properties */
.card:hover {
  margin-top: -4px; /* ❌ Bad: causes layout thrashing */
}
```

### Lazy Loading
```tsx
// Lazy load heavy components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <SkeletonScreen />,
  ssr: false
});
```

### Memoization
```tsx
// Memoize expensive calculations
const formattedValue = useMemo(() => {
  return formatCurrency(value);
}, [value]);
```

## Testing Guidelines

### Property-Based Tests
```tsx
// Feature: dashboard-shopify-migration, Property 22: Card Border Radius Consistency
test('all action cards have consistent border radius', () => {
  fc.assert(
    fc.property(fc.string(), fc.boolean(), (userName, hasAccounts) => {
      const { container } = render(
        <GamifiedOnboarding
          userName={userName}
          hasConnectedAccounts={hasAccounts}
          onConnectAccount={() => {}}
          onCreateContent={() => {}}
        />
      );
      
      const cards = container.querySelectorAll('.actionCard');
      expect(cards.length).toBe(3);
      
      cards.forEach((card) => {
        const styles = window.getComputedStyle(card);
        expect(styles.borderRadius).toBe('16px');
      });
    }),
    { numRuns: 100 }
  );
});
```

### Unit Tests
```tsx
test('button displays loading state', () => {
  const { getByRole } = render(
    <Button variant="primary" isLoading>
      Save
    </Button>
  );
  
  const button = getByRole('button');
  expect(button).toBeDisabled();
  expect(button.querySelector('.loadingSpinner')).toBeInTheDocument();
});
```

## Troubleshooting

### Issue: Cards not spacing correctly
**Solution**: Ensure parent has `.huntaze-card-grid` class
```tsx
// ✅ Correct
<div className="huntaze-card-grid">
  <div className="huntaze-card">...</div>
</div>

// ❌ Incorrect
<div>
  <div className="huntaze-card">...</div>
</div>
```

### Issue: Button gradient not showing
**Solution**: Check CSS custom properties are loaded
```tsx
// Ensure design tokens are imported
import '@/styles/dashboard-shopify-tokens.css';
```

### Issue: Hover effects not working
**Solution**: Check for conflicting styles or disabled state
```tsx
// ✅ Hover works
<Button variant="primary">Click me</Button>

// ❌ Hover disabled
<Button variant="primary" disabled>Click me</Button>
```

### Issue: Mobile drawer not sliding
**Solution**: Verify viewport width detection
```tsx
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const checkMobile = () => {
    setIsMobile(window.innerWidth < 1024);
  };
  
  checkMobile();
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
}, []);
```

## Browser-Specific Notes

### Safari
- Scrollbar styling limited (uses default)
- Use `-webkit-` prefixes for some properties
- Test touch interactions on iOS devices

### Firefox
- Scrollbar styling works with `scrollbar-width` and `scrollbar-color`
- CSS Grid fully supported

### Chrome/Edge
- Full support for all features
- Best performance for animations

## Deployment Checklist

- [ ] All tests passing (113/113)
- [ ] Cross-browser compatibility verified
- [ ] Accessibility audit complete
- [ ] Performance metrics acceptable
- [ ] Design tokens documented
- [ ] Component usage documented
- [ ] Mobile responsive tested
- [ ] Reduced motion support verified
- [ ] Focus indicators visible
- [ ] Color contrast compliant

## Resources

### Documentation
- [Design System Tokens](./DESIGN_SYSTEM_QUICK_REFERENCE.md)
- [Phase 13 Complete](./PHASE_13_COMPLETE.md)
- [Visual Summary](./PHASE_13_VISUAL_SUMMARY.md)

### Testing
- [Cross-Browser Script](../../scripts/test-dashboard-cross-browser.ts)
- [Property Tests](../../tests/unit/dashboard/)

### Components
- [GamifiedOnboarding](../../components/dashboard/GamifiedOnboarding.tsx)
- [Button](../../components/dashboard/Button.tsx)
- [Dashboard Page](../../app/(app)/dashboard/page.tsx)

---

**Last Updated**: November 25, 2024
**Phase**: 13 - Integration & Testing
**Status**: ✅ Complete
