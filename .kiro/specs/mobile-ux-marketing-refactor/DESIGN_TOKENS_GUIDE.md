# Design Tokens Implementation Guide

## Overview

The Linear Midnight design tokens have been successfully configured in the Huntaze application using Tailwind CSS v4's `@theme` directive.

## Implementation Details

### Files Modified

1. **app/tailwind.css** - Tailwind v4 theme configuration with HSL variables
2. **app/globals.css** - CSS variables for runtime access and safe area support

### Design Token Structure

#### Color Palette (Linear Midnight)

**Semantic Colors (HSL format for opacity variants):**
- `--color-background: 240 5% 6%` → `#0F0F10` (Linear Midnight)
- `--color-surface: 240 4% 12%` → `#1E1E20` (Elevated surfaces)
- `--color-primary: 234 56% 60%` → `#5E6AD2` (Magic Blue)
- `--color-foreground: 0 0% 93%` → `#EDEDED` (Primary text)
- `--color-muted: 220 9% 59%` → `#8A8F98` (Muted text)

**Alpha-based Borders (WhiteAlpha for glass effect):**
- `--color-border: rgba(255, 255, 255, 0.08)` - Default borders
- `--color-divider: rgba(255, 255, 255, 0.04)` - Subtle dividers

#### Safe Area Support

CSS variables for iOS notch support:
- `--sat: env(safe-area-inset-top)`
- `--sab: env(safe-area-inset-bottom)`
- `--sal: env(safe-area-inset-left)`
- `--sar: env(safe-area-inset-right)`

## Usage Examples

### Using Tailwind Classes

```tsx
// Background colors with opacity variants
<div className="bg-background">...</div>
<div className="bg-surface">...</div>
<div className="bg-primary/80">...</div> // 80% opacity

// Text colors
<p className="text-foreground">Primary text</p>
<p className="text-muted">Muted text</p>

// Borders (alpha-based)
<div className="border border-border">...</div>
```

### Using CSS Variables

```css
/* In custom CSS */
.custom-component {
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  border: 1px solid var(--border);
}

/* Safe area padding for iOS */
.header {
  padding-top: var(--sat);
}

.footer {
  padding-bottom: var(--sab);
}
```

### App Viewport Lock

For the (app) route group, use the viewport lock utility:

```tsx
<div className="app-viewport-lock flex flex-col">
  <header className="pt-[var(--sat)]">...</header>
  <main className="flex-1 overflow-y-auto">...</main>
  <footer className="pb-[var(--sab)]">...</footer>
</div>
```

## Runtime Theming Support

The design tokens support runtime theme switching via the `data-theme` attribute:

```tsx
// Switch to light mode (future)
<html data-theme="light">
```

Light mode variables are pre-configured in `app/globals.css`:
- Background: `#FFFFFF`
- Surface: `#F5F5F5`
- Borders: `rgba(0, 0, 0, 0.08)`

## Key Features

1. **HSL Format**: Allows Tailwind to generate opacity variants automatically (e.g., `bg-background/80`)
2. **Alpha Borders**: Creates subtle glass-like separators that adapt to different backgrounds
3. **Safe Areas**: Handles iOS notches and device cutouts automatically
4. **Runtime Theming**: Supports future light mode without rebuilding
5. **Semantic Naming**: Developer-friendly token names instead of hardcoded hex values

## Next Steps

- Task 2: Configure Inter font via next/font/google
- Task 3: Create route groups for (marketing) and (app)
- Task 4: Implement app layout with viewport lock
- Task 5: Add safe area components for headers and footers

## References

- Design Document: `.kiro/specs/mobile-ux-marketing-refactor/design.md`
- Requirements: `.kiro/specs/mobile-ux-marketing-refactor/requirements.md`
- Tailwind CSS v4 Documentation: https://tailwindcss.com/docs/v4-beta
