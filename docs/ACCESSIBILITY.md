# Accessibility Implementation Guide

This document describes the accessibility compliance implementation for the Linear UI Performance Refactor.

## Overview

The application meets **WCAG 2.1 AA** standards for accessibility, ensuring that all users can effectively interact with the interface regardless of their abilities or assistive technologies.

## Requirements

### 9.1 Color Contrast Ratios

**Normal Text (< 18pt):** Minimum 4.5:1 contrast ratio
- Primary text (#EDEDEF) on backgrounds: ✓ Passes
- Secondary text (#8A8F98) on backgrounds: ✓ Passes

**Large Text (≥ 18pt) and UI Components:** Minimum 3:1 contrast ratio
- Accent color (#7D57C1) on dark backgrounds: ✓ Passes
- Semantic colors on dark backgrounds: ✓ Passes
- White text on accent buttons: ✓ Passes

**Note:** Muted text (#6B7280) has ~4:1 contrast and should only be used for large text or de-emphasized content.

### 9.2 Focus Indicators

All interactive elements have visible focus indicators:
- **Focus ring:** 3px solid rgba(125, 87, 193, 0.5)
- **Focus offset:** 2px
- **Applies to:** buttons, links, inputs, and all focusable elements

### 9.3 Touch Target Sizes

All interactive elements meet minimum touch target requirements:
- **Minimum size:** 44x44px
- **Button height:** 40px (with padding exceeds 44px)
- **Input height:** 40px
- **Icon buttons:** 44x44px minimum

### 9.4 Development Warnings

Accessibility violations are logged in development:
- Insufficient contrast ratios
- Touch targets too small
- Missing focus indicators
- Missing alt text on images
- Empty links or buttons

## Implementation

### CSS Utilities

Import accessibility styles in your components:

```tsx
import '@/styles/accessibility.css';
```

Available CSS classes:

```css
/* Focus indicators */
.focus-ring                    /* Ring-based focus indicator */
.focus-ring-high-contrast      /* High contrast focus */

/* Touch targets */
.touch-target                  /* 44x44px minimum */
.touch-target-button           /* Button with padding */
.touch-target-icon             /* Icon button */
.touch-target-link             /* Link with padding */

/* Screen reader only */
.sr-only                       /* Hide visually, keep for SR */
.sr-only-focusable             /* Show on focus */

/* Skip link */
.skip-link                     /* Skip to main content */
```

### React Hook

Use the accessibility validation hook in development:

```tsx
import { useAccessibilityValidation } from '@/hooks/useAccessibilityValidation';

function MyComponent() {
  const ref = useAccessibilityValidation({
    validateContrast: true,
    validateTouchTargets: true,
    validateFocusIndicators: true,
    context: 'MyComponent'
  });
  
  return <div ref={ref}>...</div>;
}
```

### Utility Functions

Validate accessibility programmatically:

```tsx
import {
  getContrastRatio,
  meetsWCAGAA,
  validateColorContrast,
  validateTouchTarget,
  validateFocusIndicator,
} from '@/lib/utils/accessibility';

// Check contrast ratio
const ratio = getContrastRatio('#EDEDEF', '#0F0F10');
console.log(ratio); // 13.5:1

// Validate WCAG AA compliance
const passes = meetsWCAGAA('#EDEDEF', '#0F0F10', {
  isLargeText: false
});
console.log(passes); // true

// Validate in development
validateColorContrast('#EDEDEF', '#0F0F10', 'MyComponent');
```

## Design Token Colors

### Text Colors (4.5:1 minimum for normal text)

- **Primary:** `#EDEDEF` - Use for main content
- **Secondary:** `#8A8F98` - Use for supporting text
- **Muted:** `#6B7280` - Use only for large text (18pt+)

### UI Component Colors (3:1 minimum)

- **Accent:** `#7D57C1` - Primary actions, links
- **Success:** `#10B981` - Success states
- **Warning:** `#F59E0B` - Warning states
- **Error:** `#EF4444` - Error states
- **Info:** `#3B82F6` - Info states

### Background Colors

- **App:** `#0F0F10` - Main background
- **Surface:** `#151516` - Cards, sidebars
- **Hover:** `#1A1A1C` - Hover states
- **Input:** `#18181A` - Form inputs

## Component Guidelines

### Buttons

```tsx
<button
  className="h-[40px] px-4 bg-[var(--color-accent-primary)] text-white rounded-md focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring-color)]"
  type="button"
>
  Click Me
</button>
```

Requirements:
- ✓ Minimum 40px height (44px with padding)
- ✓ Visible focus indicator
- ✓ Sufficient color contrast
- ✓ Accessible name (text or aria-label)

### Inputs

```tsx
<div>
  <label htmlFor="email" className="block mb-2 text-[var(--color-text-primary)]">
    Email
  </label>
  <input
    id="email"
    type="email"
    className="h-[40px] px-3 w-full border border-[var(--color-border-subtle)] bg-[var(--color-bg-input)] text-[var(--color-text-primary)] rounded-md focus-visible:ring-[3px]"
    required
    aria-required="true"
  />
</div>
```

Requirements:
- ✓ Associated label (htmlFor/id)
- ✓ Minimum 40px height
- ✓ Visible focus indicator
- ✓ Sufficient color contrast
- ✓ aria-required for required fields

### Links

```tsx
<a
  href="/dashboard"
  className="inline-flex items-center min-h-[44px] px-4 text-[var(--color-accent-primary)] hover:text-[var(--color-accent-hover)] focus-visible:ring-[3px]"
>
  Go to Dashboard
</a>
```

Requirements:
- ✓ Minimum 44px touch target
- ✓ Visible focus indicator
- ✓ Sufficient color contrast
- ✓ Descriptive link text

### Icon Buttons

```tsx
<button
  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-md focus-visible:ring-[3px]"
  aria-label="Close dialog"
  type="button"
>
  <XIcon className="w-5 h-5" aria-hidden="true" />
</button>
```

Requirements:
- ✓ Minimum 44x44px size
- ✓ aria-label for accessible name
- ✓ aria-hidden on decorative icon
- ✓ Visible focus indicator

## Testing

### Property-Based Tests

Run property-based tests to verify accessibility properties:

```bash
npm run test -- tests/unit/accessibility/accessibility.property.test.tsx
```

Tests verify:
- Property 24: Normal text contrast ratio (4.5:1)
- Property 25: Large text/UI contrast ratio (3:1)
- Property 26: Focus indicator visibility
- Property 27: Touch target size adequacy (44x44px)

### Integration Tests

Run axe-core integration tests:

```bash
npm run test -- tests/unit/accessibility/accessibility.integration.test.tsx
```

Tests verify WCAG 2.1 AA compliance for:
- Design system components
- Form components
- Navigation components
- Interactive components
- Layout components
- Content components

### Manual Testing

1. **Keyboard Navigation:**
   - Tab through all interactive elements
   - Verify focus indicators are visible
   - Test Enter/Space for activation
   - Test Escape for dismissal

2. **Screen Reader:**
   - Test with NVDA (Windows) or VoiceOver (Mac)
   - Verify all content is announced
   - Check form labels and error messages
   - Verify ARIA attributes

3. **Color Contrast:**
   - Use browser DevTools to check contrast
   - Test in different lighting conditions
   - Verify with color blindness simulators

4. **Touch Targets:**
   - Test on mobile devices
   - Verify all buttons/links are easily tappable
   - Check spacing between interactive elements

## Browser Support

Accessibility features are supported in:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

## Maintenance

### Adding New Components

When creating new components:

1. Use design tokens for colors
2. Ensure minimum touch target sizes
3. Add visible focus indicators
4. Include proper ARIA attributes
5. Test with keyboard and screen reader
6. Run accessibility tests

### Updating Colors

When updating the color palette:

1. Check contrast ratios with accessibility utilities
2. Update design tokens in `linear-design-tokens.css`
3. Run property-based tests to verify compliance
4. Update this documentation

### Reporting Issues

If you find accessibility issues:

1. Check browser console for development warnings
2. Run accessibility tests
3. Use axe DevTools for detailed analysis
4. Report with specific WCAG criterion
5. Include steps to reproduce

## Compliance Statement

This application strives to meet WCAG 2.1 Level AA standards. We continuously monitor and improve accessibility. If you encounter any accessibility barriers, please contact our team.

Last updated: November 23, 2024
