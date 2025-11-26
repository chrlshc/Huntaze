# Dashboard Design System - Quick Reference

## Overview
This guide provides quick reference for using the Shopify-inspired dashboard design system.

## CSS Variables

### Colors
```css
/* Canvas & Surfaces */
--bg-app: #F8F9FB           /* Main canvas background */
--bg-surface: #FFFFFF        /* Cards, containers */

/* Brand - Electric Indigo */
--color-indigo: #6366f1      /* Primary actions */
--color-indigo-dark: #4f46e5 /* Gradients */
--color-indigo-light: #818cf8 /* Hover states */
--color-indigo-fade: rgba(99, 102, 241, 0.08) /* Backgrounds */
--color-indigo-glow: rgba(99, 102, 241, 0.2)  /* Focus states */

/* Text */
--color-text-main: #1F2937   /* Primary text */
--color-text-sub: #6B7280    /* Secondary text */
--color-text-heading: #111827 /* Headings */
--color-text-inactive: #6B7280 /* Inactive elements */

/* Borders */
--color-border-light: #6B7280
--color-border-medium: rgba(107, 114, 128, 0.5)
```

### Layout
```css
--huntaze-sidebar-width: 256px
--huntaze-header-height: 64px
--huntaze-z-index-header: 500
--huntaze-z-index-nav: 400
```

### Shadows
```css
--shadow-soft: 0 4px 20px rgba(0, 0, 0, 0.05)
--shadow-card-hover: 0 12px 24px rgba(0, 0, 0, 0.1)
--shadow-search-focus: 0 4px 12px rgba(0, 0, 0, 0.05)
```

### Spacing
```css
--spacing-content-block-gap: 24px
--spacing-card-padding: 24px
--spacing-card-gap: 24px
--spacing-content-padding: 32px
```

### Border Radius
```css
--radius-card: 16px
--radius-button: 8px
--radius-input: 8px
--radius-nav-item: 8px
```

## Layout Classes

### Grid Layout
```tsx
<div className="huntaze-layout">
  <header className="huntaze-header">...</header>
  <aside className="huntaze-sidebar">...</aside>
  <main className="huntaze-main">...</main>
</div>
```

### Content Blocks
```tsx
{/* Automatic spacing between blocks */}
<div className="huntaze-content-blocks">
  <div>Block 1</div>
  <div>Block 2</div>
</div>

{/* Grid with automatic spacing */}
<div className="huntaze-content-grid">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

### Cards
```tsx
{/* Single card */}
<div className="huntaze-card">
  Card content
</div>

{/* Card grid */}
<div className="huntaze-card-grid">
  <div className="huntaze-card">Card 1</div>
  <div className="huntaze-card">Card 2</div>
</div>
```

## Typography Classes

### Headings
```tsx
<h1 className="huntaze-h1">Main Heading</h1>
<h2 className="huntaze-h2">Section Heading</h2>
<h3 className="huntaze-h3">Subsection Heading</h3>
<div className="huntaze-welcome-title">Welcome Title</div>
```

### Body Text
```tsx
<p className="huntaze-body">Regular body text</p>
<p className="huntaze-body-small">Small body text</p>
<p className="huntaze-body-secondary">Secondary text</p>
<span className="huntaze-label">Label Text</span>
```

## Component Patterns

### Navigation Item
```tsx
<Link
  href="/dashboard"
  className="nav-item"
  data-active={isActive}
  style={{
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    gap: '12px',
    color: isActive ? 'var(--color-indigo)' : '#4B5563',
    backgroundColor: isActive ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
    textDecoration: 'none',
    transition: 'all 0.15s ease',
    borderRadius: '0 8px 8px 0',
    marginRight: '12px',
  }}
>
  <DuotoneIcon name="home" />
  Dashboard
</Link>
```

### Card with Hover Effect
```tsx
<div
  className="huntaze-card"
  style={{
    transition: 'all 0.2s ease',
    cursor: 'pointer',
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = 'translateY(-4px)';
    e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = 'var(--shadow-soft)';
  }}
>
  Card content
</div>
```

### Button with Gradient
```tsx
<button
  style={{
    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    color: '#FFFFFF',
    padding: '12px 24px',
    borderRadius: 'var(--radius-button)',
    border: 'none',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  }}
>
  Primary Action
</button>
```

### Search Input
```tsx
<input
  type="text"
  placeholder="Search..."
  style={{
    background: '#F3F4F6',
    border: '1px solid transparent',
    borderRadius: 'var(--radius-input)',
    padding: '10px 16px',
    width: '400px',
    transition: 'all 0.2s ease',
  }}
  onFocus={(e) => {
    e.currentTarget.style.background = '#FFFFFF';
    e.currentTarget.style.borderColor = 'var(--color-indigo)';
    e.currentTarget.style.boxShadow = '0 0 0 2px var(--color-indigo-glow)';
  }}
  onBlur={(e) => {
    e.currentTarget.style.background = '#F3F4F6';
    e.currentTarget.style.borderColor = 'transparent';
    e.currentTarget.style.boxShadow = 'none';
  }}
/>
```

## Duotone Icons

### Usage
```tsx
import { DuotoneIcon } from '@/components/dashboard/DuotoneIcon';

<DuotoneIcon
  name="home"
  size={20}
  primaryColor="var(--color-indigo)"
  secondaryColor="var(--color-indigo)"
/>
```

### Available Icons
- `home` - Dashboard home
- `analytics` - Analytics/charts
- `content` - Content management
- `messages` - Messages/chat
- `integrations` - Integrations/connections
- `settings` - Settings/configuration

## Responsive Breakpoints

### Mobile (< 1024px)
```css
@media (max-width: 1023px) {
  /* Sidebar collapses to drawer */
  /* Typography scales down */
  /* Content padding reduces */
}
```

### Usage in Components
```tsx
<div className="hidden md:block">
  {/* Desktop only */}
</div>

<div className="md:hidden">
  {/* Mobile only */}
</div>
```

## Best Practices

### ✅ DO
- Use CSS variables for all colors
- Use `huntaze-*` classes for layout
- Apply minimum 24px spacing between content blocks
- Use Electric Indigo (#6366f1) for primary actions
- Use soft shadows (--shadow-soft)
- Avoid pure black (#000000)

### ❌ DON'T
- Hardcode hex colors
- Use inline styles for colors (use CSS variables)
- Use dark mode classes
- Use pure black for text
- Use hardcoded margins (use gap instead)
- Mix old and new design systems

## Common Patterns

### Stats Card
```tsx
<div className="huntaze-card">
  <h3 style={{ 
    fontSize: 'var(--font-size-small)',
    color: 'var(--color-text-sub)',
    fontWeight: '400'
  }}>
    Total Revenue
  </h3>
  <p style={{
    marginTop: 'var(--spacing-sm)',
    fontSize: 'var(--font-size-h1)',
    fontWeight: '500',
    color: 'var(--color-text-main)'
  }}>
    $12,345
  </p>
  <p style={{
    marginTop: 'var(--spacing-xs)',
    fontSize: 'var(--font-size-small)',
    color: 'var(--color-success)'
  }}>
    +12.5% from last month
  </p>
</div>
```

### Empty State
```tsx
<div className="huntaze-card" style={{ textAlign: 'center', padding: '48px' }}>
  <svg style={{ 
    width: '64px', 
    height: '64px', 
    color: 'var(--color-text-sub)',
    margin: '0 auto 16px'
  }}>
    {/* Icon */}
  </svg>
  <h3 className="huntaze-h3" style={{ marginBottom: '8px' }}>
    No data yet
  </h3>
  <p className="huntaze-body-secondary">
    Connect your accounts to see analytics
  </p>
  <button style={{
    marginTop: '24px',
    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    color: '#FFFFFF',
    padding: '12px 24px',
    borderRadius: 'var(--radius-button)',
    border: 'none',
    fontWeight: '500',
    cursor: 'pointer',
  }}>
    Connect Account
  </button>
</div>
```

## Verification

Run the verification script to ensure compliance:
```bash
npx tsx scripts/verify-dashboard-migration.ts
```

Expected output:
```
✅ All required design tokens present
✅ Grid layout properly implemented
✅ All required CSS files imported
✅ All components properly migrated
```

## Support

For questions or issues:
1. Check this quick reference
2. Review `styles/dashboard-shopify-tokens.css`
3. Look at existing dashboard components for examples
4. Run verification script to check compliance
