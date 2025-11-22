# Design System Usage Guide

## Beta Launch UI System - Professional Black Theme

This design system implements a Shopify-inspired professional black theme with minimal rainbow accents for the Huntaze beta launch.

## Core Design Rules

### 1. ✅ Rainbow Gradient Usage
**ONLY use on:**
- Primary CTA buttons (`.btn-primary`)
- Marketing page gradient text (`.gradient-text`)
- Focus states (automatic via `:focus-visible`)

**NEVER use on:**
- Backgrounds
- Cards or surfaces
- Secondary buttons
- Regular text

### 2. ✅ Background Colors
- **Main app**: Pure black `#000000` (`--bg-app`)
- **Surfaces**: Very subtle grays (`--bg-surface`, `--bg-card`)
- **NO gradients** on any backgrounds or surfaces

### 3. ✅ Text Colors
- **Primary**: Pure white `#FFFFFF` (`--text-primary`)
- **Secondary**: Medium gray (`--text-secondary`)
- **Muted**: Darker gray (`--text-muted`)
- High contrast for readability

### 4. ✅ Borders
- **Minimal contrast**: Barely visible (`--border-default`)
- **Emphasis**: Subtle (`--border-emphasis`)
- **Focus**: Brand color accent (`--border-focus`)

### 5. ✅ Beta Badges
- Very subtle, muted colors
- Low opacity backgrounds (`--beta-bg`)
- Muted text color (`--beta-text`)

## Token Categories

### Colors
```css
/* Backgrounds */
--bg-app: #000000;           /* Pure black */
--bg-surface: #0a0a0a;       /* Subtle lift */
--bg-card: #0f0f0f;          /* Card background */
--bg-hover: #1a1a1a;         /* Hover state */
--bg-input: #141414;         /* Form inputs */

/* Text */
--text-primary: #FFFFFF;     /* Primary text */
--text-secondary: #a3a3a3;   /* Secondary text */
--text-muted: #737373;       /* Muted text */

/* Brand */
--brand-primary: #8B5CF6;    /* Purple */
--brand-secondary: #EC4899;  /* Pink */
--brand-gradient: linear-gradient(...); /* Rainbow gradient */
```

### Spacing (8px Grid System)
```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
```

### Typography
```css
/* Font Families */
--font-sans: -apple-system, BlinkMacSystemFont, ...;
--font-mono: 'SF Mono', Monaco, ...;

/* Font Sizes */
--text-xs: 11px;
--text-sm: 13px;
--text-base: 15px;
--text-lg: 17px;
--text-xl: 20px;
--text-2xl: 24px;
--text-3xl: 30px;
--text-4xl: 36px;

/* Font Weights */
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

### Border Radius
```css
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-full: 9999px;
```

### Shadows
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
```

### Transitions
```css
--transition-fast: 150ms ease;
--transition-base: 200ms ease;
--transition-slow: 300ms ease;
```

## Component Classes

### Buttons
```html
<!-- Primary CTA (with rainbow gradient) -->
<button class="btn-primary">Get Started</button>

<!-- Secondary (no gradient) -->
<button class="btn-secondary">Learn More</button>

<!-- Ghost (minimal) -->
<button class="btn-ghost">Cancel</button>
```

### Cards
```html
<!-- Standard card -->
<div class="card">
  <!-- Content -->
</div>

<!-- Surface -->
<div class="surface">
  <!-- Content -->
</div>
```

### Form Elements
```html
<!-- Input with label -->
<label class="label" for="email">Email</label>
<input type="email" id="email" class="input" placeholder="you@example.com">
```

### Beta Badge
```html
<span class="beta-badge">
  <span class="beta-badge-dot"></span>
  Now in Beta
</span>
```

### Gradient Text (Marketing Only)
```html
<h1 class="gradient-text">
  Transform Your Creator Business
</h1>
```

## Accessibility

### Focus States
All interactive elements automatically receive a subtle rainbow glow on focus:
```css
*:focus-visible {
  outline: none;
  box-shadow: var(--brand-glow);
}
```

### Reduced Motion
The design system respects user preferences:
```css
@media (prefers-reduced-motion: reduce) {
  /* Animations disabled or minimized */
}
```

## Best Practices

### ✅ DO
- Use CSS custom properties for all values
- Follow the 8px spacing grid
- Use high contrast text colors
- Apply rainbow gradient only to primary CTAs
- Use subtle borders and shadows
- Respect reduced motion preferences

### ❌ DON'T
- Use gradients on backgrounds or surfaces
- Use rainbow colors on secondary elements
- Use low contrast text colors
- Hardcode color values
- Ignore spacing tokens
- Create custom animations without reduced motion support

## Testing

All design tokens are validated with property-based tests:
```bash
npm run test -- tests/unit/design-system/design-system-token-completeness.property.test.ts --run
```

The tests verify:
- All required tokens are defined
- Spacing follows 8px grid
- Typography tokens are complete
- Brand gradient usage is restricted
- Beta badges are subtle
- Transitions have reasonable durations
- Reduced motion support is present
- Pure black background is used
- Focus states use brand glow

## Requirements Coverage

This design system satisfies:
- **Requirement 1.1**: Color tokens (backgrounds, text, borders, brand)
- **Requirement 1.2**: Spacing tokens (8px grid system)
- **Requirement 1.3**: Typography tokens (fonts, sizes, weights)
- **Requirement 1.4**: Border radius tokens
- **Requirement 1.5**: Shadow tokens
- **Requirement 1.6**: Brand gradient with animation support
- **Requirement 1.7**: Hover states with gradient shifts
