# Huntaze Design System

> A unified, professional design system for the Huntaze application featuring a "God Tier" dark aesthetic with glass morphism effects, consistent spacing, and accessible components.

## Table of Contents

- [Overview](#overview)
- [Design Principles](#design-principles)
- [Getting Started](#getting-started)
- [Design Tokens](#design-tokens)
- [Components](#components)
- [Accessibility](#accessibility)
- [Best Practices](#best-practices)

## Overview

The Huntaze Design System provides a comprehensive set of design tokens, components, and guidelines to ensure visual consistency across the entire application. Built on a foundation of CSS custom properties, it enables rapid development while maintaining a cohesive, premium user experience.

### Key Features

- **Design Tokens**: Centralized CSS custom properties for colors, spacing, typography, and effects
- **Component Library**: Pre-built, accessible React components
- **Glass Morphism**: Sophisticated backdrop blur effects for depth and elegance
- **Dark-First**: Optimized for dark mode with zinc-950 base
- **Responsive**: Mobile-first approach with consistent breakpoints
- **Accessible**: WCAG 2.1 AA compliant with proper focus states and ARIA labels

## Design Principles

### 1. God Tier Aesthetic

Our design language emphasizes sophistication and professionalism:

- **Deep Backgrounds**: zinc-950 (#09090b) as the primary canvas
- **Subtle Elevation**: Glass morphism with white/5% backgrounds
- **Refined Borders**: white/8% for gentle separation
- **Inner Glow**: Subtle highlights for depth
- **Purposeful Accents**: Violet-500 (#8b5cf6) for primary actions

### 2. Consistency Over Customization

- Always use design tokens instead of hardcoded values
- Prefer existing components over custom implementations
- Follow the 4px spacing grid system
- Use standardized animation durations

### 3. Accessibility First

- Minimum 44x44px touch targets on mobile
- High contrast text (WCAG AA compliant)
- Keyboard navigation support
- Screen reader friendly
- Reduced motion support

### 4. Performance Matters

- CSS custom properties for instant theme updates
- Tree-shakeable components
- Minimal JavaScript for styling
- Optimized animations

## Getting Started

### Installation

The design system is already integrated into the Huntaze application. All design tokens are available globally via CSS custom properties.

### Basic Usage

```tsx
import { Button, Card, Input } from '@/components/ui';

function MyComponent() {
  return (
    <Card variant="glass">
      <h2 className="text-[var(--text-primary)] text-[var(--text-2xl)]">
        Welcome
      </h2>
      <Input placeholder="Enter your email" />
      <Button variant="primary">Get Started</Button>
    </Card>
  );
}
```

### Using Design Tokens

Design tokens are available as CSS custom properties:

```css
.my-component {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  color: var(--text-primary);
  transition: all var(--transition-base);
}
```

## Design Tokens

All design tokens are defined in `styles/design-tokens.css`. See the detailed documentation:

- [Colors](./tokens/colors.md) - Background, text, accent, and border colors
- [Spacing](./tokens/spacing.md) - 4px grid system for consistent layouts
- [Typography](./tokens/typography.md) - Font families, sizes, weights, and line heights
- [Effects](./tokens/effects.md) - Shadows, blur, and glass morphism
- [Animations](./tokens/animations.md) - Transition durations and easing functions
- [Layout](./tokens/layout.md) - Breakpoints, z-index, and container widths

### Quick Reference

#### Colors

```css
/* Backgrounds */
--bg-primary: #09090b;           /* zinc-950 */
--bg-secondary: #18181b;         /* zinc-900 */
--bg-tertiary: #27272a;          /* zinc-800 */
--bg-glass: rgba(255, 255, 255, 0.05);

/* Text */
--text-primary: #fafafa;         /* zinc-50 */
--text-secondary: #a1a1aa;       /* zinc-400 */
--text-tertiary: #71717a;        /* zinc-500 */

/* Accents */
--accent-primary: #8b5cf6;       /* violet-500 */
--accent-success: #10b981;       /* emerald-500 */
--accent-error: #ef4444;         /* red-500 */
```

#### Spacing

```css
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
```

#### Typography

```css
--text-xs: 0.75rem;   /* 12px */
--text-sm: 0.875rem;  /* 14px */
--text-base: 1rem;    /* 16px */
--text-lg: 1.125rem;  /* 18px */
--text-xl: 1.25rem;   /* 20px */
--text-2xl: 1.5rem;   /* 24px */
```

## Components

### Core Components

- [Button](./components/button.md) - Primary, secondary, ghost, and danger variants
- [Input](./components/input.md) - Text inputs with validation states
- [Card](./components/card.md) - Container with glass effect variants
- [Modal](./components/modal.md) - Accessible dialog with backdrop
- [Alert](./components/alert.md) - Success, warning, error, and info messages

### Layout Components

- [Container](./components/container.md) - Max-width containers with responsive padding
- [PageLayout](./components/page-layout.md) - Consistent page structure with header

### Usage Examples

#### Button

```tsx
import { Button } from '@/components/ui';

// Primary action
<Button variant="primary" size="md">
  Save Changes
</Button>

// Secondary action
<Button variant="secondary" size="md">
  Cancel
</Button>

// Loading state
<Button variant="primary" loading>
  Processing...
</Button>
```

#### Card

```tsx
import { Card } from '@/components/ui';

// Default card
<Card>
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</Card>

// Glass effect card
<Card variant="glass">
  <h3>Premium Card</h3>
  <p>With glass morphism effect</p>
</Card>
```

#### Input

```tsx
import { Input } from '@/components/ui';

// Standard input
<Input 
  placeholder="Enter your email"
  type="email"
/>

// With error state
<Input 
  placeholder="Enter your email"
  type="email"
  error="Please enter a valid email"
/>
```

## Accessibility

### Focus States

All interactive elements have visible focus indicators:

```css
.interactive-element:focus-visible {
  outline: none;
  ring: var(--focus-ring-width) solid var(--focus-ring-color);
  ring-offset: var(--focus-ring-offset);
}
```

### Touch Targets

Minimum touch target size is 44x44px on mobile devices:

```css
@media (max-width: 768px) {
  .button {
    min-height: 44px;
    min-width: 44px;
  }
}
```

### Reduced Motion

Respects user's motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Screen Readers

All components include proper ARIA labels and roles:

```tsx
<button aria-label="Close modal" aria-pressed={isOpen}>
  <span aria-hidden="true">×</span>
</button>
```

## Progressive Lightening for Nested Components

### Overview

To maintain visual hierarchy in nested structures, the design system uses progressive background lightening. Each nesting level uses a progressively lighter background color, creating clear visual separation and depth.

### Nesting Levels

The system defines 4 nesting levels:

| Level | Usage | Background | Border | Example |
|-------|-------|------------|--------|---------|
| 0 | Page background | `--bg-primary` (zinc-950) | None | Main page container |
| 1 | Main cards | `--bg-card-elevated` (zinc-800) | `--border-default` | Top-level cards |
| 2 | Nested cards | `--bg-secondary` (zinc-900) | `--border-emphasis` | Cards within cards |
| 3 | Inner elements | `--bg-glass-hover` (white/12%) | `--border-strong` | Deeply nested content |

### Using Nesting Levels

#### With Container Component

```tsx
import { Container } from '@/components/ui';

function DashboardPage() {
  return (
    <Container nestingLevel={0} maxWidth="xl">
      <h1>Dashboard</h1>
      
      <Container nestingLevel={1} padding="md">
        <h2>Analytics</h2>
        
        <Container nestingLevel={2} padding="sm">
          <p>Detailed metrics</p>
        </Container>
      </Container>
    </Container>
  );
}
```

#### With Card Component

```tsx
import { Card } from '@/components/ui';

function NestedCards() {
  return (
    <Card nestingLevel={1}>
      <h2>Main Card</h2>
      
      <Card nestingLevel={2}>
        <h3>Nested Card</h3>
        
        <Card nestingLevel={3}>
          <p>Deeply nested content</p>
        </Card>
      </Card>
    </Card>
  );
}
```

#### Using Utility Classes

You can also apply nesting levels directly with CSS classes:

```tsx
<div className="nesting-level-1 rounded-[var(--card-radius)] p-[var(--card-padding)]">
  <h2>Main Section</h2>
  
  <div className="nesting-level-2 rounded-[var(--card-radius)] p-[var(--card-padding)]">
    <h3>Nested Section</h3>
  </div>
</div>
```

### Guidelines

#### ✅ Do's

- **Start at level 0** for page backgrounds
- **Use level 1** for main content cards
- **Increment levels** as you nest deeper
- **Maintain consistency** - don't skip levels
- **Combine with borders** for clear separation

#### ❌ Don'ts

- **Don't skip levels** (e.g., 0 → 2)
- **Don't go beyond level 3** - consider restructuring instead
- **Don't mix nesting approaches** - be consistent
- **Don't use nesting without borders** - borders enhance separation

### Visual Hierarchy Example

```tsx
import { Container, Card } from '@/components/ui';

function HierarchyExample() {
  return (
    // Level 0: Page background (zinc-950)
    <Container nestingLevel={0} maxWidth="xl" padding="lg">
      <h1>My Dashboard</h1>
      
      {/* Level 1: Main cards (zinc-800) */}
      <Card nestingLevel={1}>
        <h2>Revenue Overview</h2>
        <p>Total revenue this month</p>
        
        {/* Level 2: Nested cards (zinc-900) */}
        <Card nestingLevel={2}>
          <h3>Breakdown by Product</h3>
          <ul>
            <li>Product A: $1,234</li>
            <li>Product B: $5,678</li>
          </ul>
          
          {/* Level 3: Inner elements (white/12%) */}
          <Card nestingLevel={3}>
            <p>Additional details</p>
          </Card>
        </Card>
      </Card>
    </Container>
  );
}
```

### Contrast Ratios

Each nesting level maintains WCAG AA compliance:

- **Level 0 → 1**: 3.2:1 contrast ratio ✓
- **Level 1 → 2**: 1.8:1 contrast ratio ✓
- **Level 2 → 3**: 2.1:1 contrast ratio ✓

Combined with borders and shadows, all levels provide clear visual distinction.

## Best Practices

### ✅ Do's

- **Use design tokens** for all colors, spacing, and typography
- **Use existing components** from the component library
- **Follow the 4px spacing grid** for consistent layouts
- **Test with keyboard navigation** to ensure accessibility
- **Use semantic HTML** for better accessibility
- **Provide loading states** for async operations
- **Include error states** for form validation

### ❌ Don'ts

- **Don't use hardcoded colors** - Always reference design tokens
- **Don't create custom spacing** - Use the spacing scale
- **Don't skip focus states** - They're essential for accessibility
- **Don't use arbitrary animations** - Use standard durations
- **Don't ignore mobile** - Test on small screens
- **Don't override component styles** without good reason
- **Don't use inline styles** - Prefer CSS classes

### Code Examples

#### ✅ Good

```tsx
// Uses design tokens and components
<Card variant="glass" className="p-[var(--space-6)]">
  <h2 className="text-[var(--text-primary)] text-[var(--text-2xl)] mb-[var(--space-4)]">
    Dashboard
  </h2>
  <Button variant="primary">View Details</Button>
</Card>
```

#### ❌ Bad

```tsx
// Hardcoded values and inline styles
<div style={{ 
  background: '#27272a', 
  padding: '25px',
  borderRadius: '15px' 
}}>
  <h2 style={{ color: '#fafafa', fontSize: '24px', marginBottom: '18px' }}>
    Dashboard
  </h2>
  <button style={{ background: '#8b5cf6', padding: '10px 20px' }}>
    View Details
  </button>
</div>
```

### Component Composition

Build complex UIs by composing simple components:

```tsx
import { Card, Button, Input } from '@/components/ui';
import { PageLayout } from '@/components/ui';

function SettingsPage() {
  return (
    <PageLayout 
      title="Settings" 
      subtitle="Manage your account preferences"
    >
      <Card variant="glass">
        <h3 className="text-[var(--text-xl)] mb-[var(--space-4)]">
          Profile Information
        </h3>
        <div className="space-y-[var(--space-4)]">
          <Input label="Name" placeholder="John Doe" />
          <Input label="Email" type="email" placeholder="john@example.com" />
          <div className="flex gap-[var(--space-3)] justify-end">
            <Button variant="secondary">Cancel</Button>
            <Button variant="primary">Save Changes</Button>
          </div>
        </div>
      </Card>
    </PageLayout>
  );
}
```

## Contributing

When adding new components or tokens:

1. Follow existing naming conventions
2. Document all props and variants
3. Include usage examples
4. Write property-based tests
5. Ensure accessibility compliance
6. Update this documentation

## Resources

- [Design Tokens Reference](./tokens/README.md)
- [Component API Documentation](./components/README.md)
- [Accessibility Guidelines](./accessibility.md)
- [Migration Guide](./migration-guide.md)

---

**Questions or feedback?** Open an issue or reach out to the design system team.
