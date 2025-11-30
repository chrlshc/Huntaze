# Responsive Utilities Guide

Comprehensive responsive utility classes using design tokens for consistent, mobile-first development.

## Table of Contents

- [Overview](#overview)
- [Breakpoints](#breakpoints)
- [Touch Targets](#touch-targets)
- [Spacing](#spacing)
- [Typography](#typography)
- [Layout](#layout)
- [Visibility](#visibility)
- [Components](#components)
- [Accessibility](#accessibility)
- [Best Practices](#best-practices)

## Overview

These utilities follow a mobile-first approach and use design tokens exclusively. All classes are prefixed with their purpose and end with `-responsive` for clarity.

### Key Principles

1. **Mobile-First**: Base styles for mobile, enhanced for larger screens
2. **Token-Based**: All values reference design tokens
3. **Touch-Friendly**: Minimum 44x44px touch targets (WCAG 2.5.5)
4. **Accessible**: Focus states, safe areas, and reduced motion support

## Breakpoints

Standard breakpoints defined in design tokens:

```css
--breakpoint-sm: 640px   /* Small tablets */
--breakpoint-md: 768px   /* Tablets */
--breakpoint-lg: 1024px  /* Laptops */
--breakpoint-xl: 1280px  /* Desktops */
--breakpoint-2xl: 1536px /* Large desktops */
```

## Touch Targets

### Minimum Touch Targets (44x44px)

```tsx
<button className="touch-target">
  <Icon />
</button>
```

### Ideal Touch Targets (48x48px)

```tsx
<button className="touch-target-lg">
  <Icon />
</button>
```

### Extended Touch Area

Increases hit area without affecting layout:

```tsx
<button className="touch-extend">
  Small Icon
</button>
```

### Touch Spacing

Ensures adequate spacing between interactive elements:

```tsx
<div className="flex">
  <button className="touch-spacing">Button 1</button>
  <button className="touch-spacing">Button 2</button>
</div>
```

## Spacing

### Responsive Padding

```tsx
{/* Scales: 16px → 24px → 32px */}
<div className="p-responsive">
  Content
</div>

{/* Horizontal only */}
<div className="px-responsive">
  Content
</div>

{/* Vertical only */}
<div className="py-responsive">
  Content
</div>
```

### Responsive Gap

```tsx
{/* For flex/grid containers */}
<div className="flex gap-responsive">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

## Typography

### Responsive Text Sizes

```tsx
{/* Small text: 14px → 16px */}
<p className="text-responsive-sm">Small text</p>

{/* Base text: 16px → 18px */}
<p className="text-responsive-base">Base text</p>

{/* Large text: 18px → 20px → 24px */}
<p className="text-responsive-lg">Large text</p>

{/* Extra large: 20px → 24px → 30px */}
<h2 className="text-responsive-xl">Heading</h2>

{/* 2XL: 24px → 30px → 36px */}
<h1 className="text-responsive-2xl">Title</h1>
```

### Text Alignment

```tsx
{/* Center on mobile, left on tablet+ */}
<p className="text-center-mobile">
  Responsive alignment
</p>

{/* Center until desktop, then left */}
<p className="text-left-desktop">
  Desktop alignment
</p>
```

## Layout

### Responsive Grid

```tsx
{/* 1 col → 2 cols → 3 cols */}
<div className="grid-responsive">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>

{/* 1 col → 2 cols */}
<div className="grid-responsive-2">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

{/* 2 cols → 3 cols → 4 cols */}
<div className="grid-responsive-4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
  <div>Item 4</div>
</div>
```

### Responsive Flex

```tsx
{/* Column on mobile, row on tablet+ */}
<div className="flex-responsive">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

{/* Column-reverse on mobile, row on tablet+ */}
<div className="flex-responsive-reverse">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

### Responsive Stack

```tsx
{/* Vertical stack with responsive gaps */}
<div className="stack-responsive">
  <div>Section 1</div>
  <div>Section 2</div>
  <div>Section 3</div>
</div>
```

### Responsive Container

```tsx
{/* Full-width with max-width constraints and responsive padding */}
<div className="container-responsive">
  <h1>Page Content</h1>
  <p>Automatically constrained and padded</p>
</div>
```

## Visibility

### Hide/Show by Breakpoint

```tsx
{/* Hidden on mobile, visible on tablet+ */}
<div className="hidden-mobile">
  Desktop content
</div>

{/* Visible on mobile, hidden on tablet+ */}
<div className="hidden-tablet-up">
  Mobile content
</div>

{/* Visible on desktop, hidden on smaller */}
<div className="hidden-desktop">
  Mobile/tablet content
</div>
```

### Show Only on Specific Breakpoints

```tsx
{/* Only on mobile */}
<div className="mobile-only">
  Mobile-specific UI
</div>

{/* Only on tablet */}
<div className="tablet-only">
  Tablet-specific UI
</div>

{/* Only on desktop */}
<div className="desktop-only">
  Desktop-specific UI
</div>
```

## Components

### Responsive Cards

```tsx
{/* Padding and radius scale with breakpoints */}
<div className="card-responsive glass">
  <h3>Card Title</h3>
  <p>Card content</p>
</div>
```

### Responsive Buttons

```tsx
{/* Meets touch target requirements, scales with breakpoints */}
<button className="button-responsive">
  Click Me
</button>
```

### Responsive Modals

```tsx
{/* Full-screen on mobile, constrained on larger screens */}
<div className="modal-responsive">
  <h2>Modal Title</h2>
  <p>Modal content</p>
</div>
```

### Responsive Images

```tsx
{/* Responsive width */}
<img src="..." className="img-responsive" alt="..." />

{/* Responsive height with object-fit */}
<img src="..." className="img-responsive-cover" alt="..." />
```

### Aspect Ratios

```tsx
{/* Square aspect ratio */}
<div className="aspect-responsive-square">
  <img src="..." alt="..." />
</div>

{/* 16:9 video aspect ratio */}
<div className="aspect-responsive-video">
  <video src="..." />
</div>

{/* Portrait aspect ratio (3:4 → 4:5) */}
<div className="aspect-responsive-portrait">
  <img src="..." alt="..." />
</div>
```

## Accessibility

### Safe Areas (Notched Devices)

```tsx
{/* Respects safe areas on all sides */}
<div className="safe-area-responsive">
  Content safe from notches
</div>
```

### Focus States

```tsx
{/* Enhanced focus ring, larger on mobile */}
<button className="focus-responsive">
  Accessible Button
</button>
```

### Overflow Handling

```tsx
{/* Horizontal scroll on mobile, visible on desktop */}
<div className="overflow-responsive">
  <table>...</table>
</div>
```

## Best Practices

### 1. Mobile-First Development

Always start with mobile styles and enhance for larger screens:

```tsx
// ✅ Good
<div className="p-4 md:p-6 lg:p-8">
  
// ❌ Bad
<div className="p-8 md:p-6 sm:p-4">
```

### 2. Use Utility Classes

Prefer utility classes over custom CSS:

```tsx
// ✅ Good
<div className="grid-responsive gap-responsive">

// ❌ Bad
<div style={{ display: 'grid', gap: '16px' }}>
```

### 3. Touch Target Compliance

Always ensure interactive elements meet minimum size:

```tsx
// ✅ Good
<button className="touch-target">
  <Icon size={20} />
</button>

// ❌ Bad
<button style={{ width: '32px', height: '32px' }}>
  <Icon size={20} />
</button>
```

### 4. Combine with Design Tokens

Use responsive utilities with other token-based classes:

```tsx
<div className="card-responsive glass-card">
  <h2 className="text-responsive-xl">Title</h2>
  <p className="text-responsive-base">Content</p>
</div>
```

### 5. Test on Real Devices

Always test responsive layouts on actual mobile devices, not just browser DevTools.

### 6. Consider Safe Areas

For full-screen or fixed-position elements:

```tsx
<nav className="fixed bottom-0 safe-area-responsive">
  Navigation
</nav>
```

### 7. Optimize Performance

Use hardware acceleration for animations:

```tsx
<div className="hardware-accelerated">
  Animated content
</div>
```

## Common Patterns

### Responsive Dashboard Layout

```tsx
<div className="container-responsive">
  <div className="grid-responsive gap-responsive">
    <div className="card-responsive glass">
      <h3 className="text-responsive-lg">Card 1</h3>
    </div>
    <div className="card-responsive glass">
      <h3 className="text-responsive-lg">Card 2</h3>
    </div>
    <div className="card-responsive glass">
      <h3 className="text-responsive-lg">Card 3</h3>
    </div>
  </div>
</div>
```

### Responsive Form

```tsx
<form className="stack-responsive">
  <div className="flex-responsive gap-responsive">
    <input type="text" className="flex-1" />
    <button className="button-responsive touch-target">
      Submit
    </button>
  </div>
</form>
```

### Responsive Navigation

```tsx
<nav className="flex-responsive gap-responsive">
  <a href="/" className="touch-target">Home</a>
  <a href="/about" className="touch-target">About</a>
  <a href="/contact" className="touch-target">Contact</a>
</nav>
```

## Migration Guide

### From Hardcoded Values

```tsx
// Before
<div style={{ padding: '16px' }}>

// After
<div className="p-responsive">
```

### From Tailwind Classes

```tsx
// Before
<div className="p-4 md:p-6 lg:p-8">

// After
<div className="p-responsive">
```

### From Custom Media Queries

```tsx
// Before
<div className="custom-responsive">
// custom-responsive.css:
// @media (min-width: 768px) { padding: 24px; }

// After
<div className="p-responsive">
```

## Requirements Validated

- ✅ **7.1**: Consistent mobile breakpoints using design tokens
- ✅ **7.3**: Responsive behavior maintained across all utilities
- ✅ **7.4**: Touch target sizes meet 44x44px minimum (WCAG 2.5.5)
- ✅ **7.5**: Mobile-specific styles applied consistently

## Related Files

- `styles/design-tokens.css` - Core design tokens
- `app/mobile.css` - Mobile-specific base styles
- `tests/unit/styles/responsive-utilities.test.ts` - Test suite
