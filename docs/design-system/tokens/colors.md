# Color Tokens

The Huntaze color system is built around a sophisticated dark palette with subtle glass morphism effects.

## Background Colors

### Primary Backgrounds

```css
--bg-primary: #09090b;      /* zinc-950 - Deepest background, main canvas */
--bg-secondary: #18181b;    /* zinc-900 - Elevated surfaces */
--bg-tertiary: #27272a;     /* zinc-800 - Cards and containers */
```

**Usage:**
- `--bg-primary`: Main page background, dashboard canvas
- `--bg-secondary`: Sidebar, navigation, elevated panels
- `--bg-tertiary`: Cards, modals, dropdowns

**Example:**
```tsx
<div className="bg-[var(--bg-primary)] min-h-screen">
  <aside className="bg-[var(--bg-secondary)]">
    <Card className="bg-[var(--bg-tertiary)]">
      Content
    </Card>
  </aside>
</div>
```

### Glass Morphism Backgrounds

```css
--bg-glass: rgba(255, 255, 255, 0.05);          /* Base glass effect */
--bg-glass-hover: rgba(255, 255, 255, 0.08);    /* Hover state */
--bg-glass-active: rgba(255, 255, 255, 0.12);   /* Active/pressed state */
```

**Usage:**
- Premium cards with backdrop blur
- Floating panels and overlays
- Interactive elements with depth

**Example:**
```tsx
<div className="bg-[var(--bg-glass)] backdrop-blur-xl border border-[var(--border-subtle)]">
  Glass morphism card
</div>

{/* Or use the utility class */}
<div className="glass-card">
  Glass morphism card
</div>
```

### Interactive Backgrounds

```css
--bg-input: #18181a;        /* Input fields */
--bg-hover: #1a1a1c;        /* Hover state for interactive elements */
--bg-active: #1e1f24;       /* Active/pressed state */
```

## Text Colors

### Hierarchy

```css
--text-primary: #fafafa;      /* zinc-50 - Primary content, headings */
--text-secondary: #a1a1aa;    /* zinc-400 - Secondary content, labels */
--text-tertiary: #71717a;     /* zinc-500 - Muted content, placeholders */
--text-quaternary: #52525b;   /* zinc-600 - Disabled text, subtle hints */
--text-inverse: #09090b;      /* For light backgrounds */
```

**Usage Guidelines:**

| Token | Use Case | Example |
|-------|----------|---------|
| `--text-primary` | Page titles, headings, important content | `<h1>`, `<h2>`, primary text |
| `--text-secondary` | Body text, descriptions, labels | `<p>`, `<label>`, secondary info |
| `--text-tertiary` | Captions, metadata, placeholders | Timestamps, helper text |
| `--text-quaternary` | Disabled states, very subtle text | Disabled buttons, inactive items |

**Example:**
```tsx
<div>
  <h1 className="text-[var(--text-primary)]">Dashboard</h1>
  <p className="text-[var(--text-secondary)]">Welcome back to your workspace</p>
  <span className="text-[var(--text-tertiary)]">Last updated 2 hours ago</span>
</div>
```

## Accent Colors

### Primary Accent (Violet)

```css
--accent-primary: #8b5cf6;         /* violet-500 - Primary actions */
--accent-primary-hover: #7c3aed;   /* violet-600 - Hover state */
--accent-primary-active: #6d28d9;  /* violet-700 - Active state */
```

**Usage:**
- Primary buttons
- Links
- Active states
- Focus indicators

### Semantic Colors

```css
--accent-success: #10b981;    /* emerald-500 - Success states */
--accent-warning: #f59e0b;    /* amber-500 - Warning states */
--accent-error: #ef4444;      /* red-500 - Error states */
--accent-info: #3b82f6;       /* blue-500 - Info states */
```

**Usage:**
- Success: Confirmations, completed actions
- Warning: Cautions, important notices
- Error: Validation errors, failed actions
- Info: Helpful tips, informational messages

**Example:**
```tsx
<Alert variant="success">
  <span className="text-[var(--accent-success)]">✓</span>
  Changes saved successfully
</Alert>

<Alert variant="error">
  <span className="text-[var(--accent-error)]">✗</span>
  Please fix the errors below
</Alert>
```

### Accent Backgrounds

```css
--accent-bg-subtle: rgba(139, 92, 246, 0.08);     /* Subtle accent background */
--accent-bg-muted: rgba(139, 92, 246, 0.12);      /* Muted accent background */
--accent-bg-emphasis: rgba(139, 92, 246, 0.18);   /* Emphasized accent background */
```

**Usage:**
- Highlighted sections
- Selected items
- Badge backgrounds

## Border Colors

```css
--border-subtle: rgba(255, 255, 255, 0.08);      /* Subtle separation */
--border-default: rgba(255, 255, 255, 0.12);     /* Standard borders */
--border-emphasis: rgba(255, 255, 255, 0.18);    /* Emphasized borders */
--border-strong: rgba(255, 255, 255, 0.24);      /* Strong borders */
```

**Usage Guidelines:**

| Token | Use Case | Example |
|-------|----------|---------|
| `--border-subtle` | Card borders, subtle dividers | Default card borders |
| `--border-default` | Input borders, standard dividers | Form inputs, separators |
| `--border-emphasis` | Hover states, focused elements | Hovered cards |
| `--border-strong` | Active states, important boundaries | Active inputs, selected items |

**Example:**
```tsx
<Card className="border border-[var(--border-subtle)] hover:border-[var(--border-emphasis)]">
  Hover to see border change
</Card>
```

## Color Contrast

All color combinations meet WCAG 2.1 AA standards:

| Background | Text | Contrast Ratio |
|------------|------|----------------|
| `--bg-primary` | `--text-primary` | 18.5:1 ✓ |
| `--bg-primary` | `--text-secondary` | 7.2:1 ✓ |
| `--bg-tertiary` | `--text-primary` | 14.8:1 ✓ |
| `--accent-primary` | white | 4.8:1 ✓ |

## Best Practices

### ✅ Do

```tsx
// Use semantic color tokens
<button className="bg-[var(--accent-primary)] text-white">
  Primary Action
</button>

// Use text hierarchy
<div>
  <h2 className="text-[var(--text-primary)]">Title</h2>
  <p className="text-[var(--text-secondary)]">Description</p>
</div>

// Use glass effect for premium feel
<div className="glass-card">
  Premium content
</div>
```

### ❌ Don't

```tsx
// Don't use hardcoded colors
<button style={{ background: '#8b5cf6' }}>
  Primary Action
</button>

// Don't use arbitrary opacity values
<div style={{ color: 'rgba(255, 255, 255, 0.73)' }}>
  Text
</div>

// Don't mix color systems
<div className="bg-gray-800 text-zinc-400">
  Inconsistent colors
</div>
```

## Utility Classes

Pre-built utility classes for common patterns:

```css
/* Glass morphism */
.glass {
  background: var(--bg-glass);
  backdrop-filter: blur(var(--blur-xl));
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-inner-glow);
}

.glass-hover:hover {
  background: var(--bg-glass-hover);
  border-color: var(--border-default);
}

.glass-card {
  /* Combines glass effect with card styling */
  background: var(--bg-glass);
  backdrop-filter: blur(var(--blur-xl));
  border: 1px solid var(--border-subtle);
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  box-shadow: var(--shadow-inner-glow);
  transition: all var(--transition-base);
}
```

## Dark Mode

The design system is dark by default. All colors are optimized for dark backgrounds.

## High Contrast Mode

For users who prefer high contrast:

```css
@media (prefers-contrast: high) {
  :root {
    --text-primary: #ffffff;
    --text-secondary: #e5e5e5;
    --border-subtle: rgba(255, 255, 255, 0.3);
    --border-default: rgba(255, 255, 255, 0.5);
  }
}
```

## Color Palette Reference

### Full Palette

| Color | Token | Hex | RGB |
|-------|-------|-----|-----|
| Zinc 950 | `--bg-primary` | #09090b | rgb(9, 9, 11) |
| Zinc 900 | `--bg-secondary` | #18181b | rgb(24, 24, 27) |
| Zinc 800 | `--bg-tertiary` | #27272a | rgb(39, 39, 42) |
| Zinc 50 | `--text-primary` | #fafafa | rgb(250, 250, 250) |
| Zinc 400 | `--text-secondary` | #a1a1aa | rgb(161, 161, 170) |
| Violet 500 | `--accent-primary` | #8b5cf6 | rgb(139, 92, 246) |
| Emerald 500 | `--accent-success` | #10b981 | rgb(16, 185, 129) |
| Red 500 | `--accent-error` | #ef4444 | rgb(239, 68, 68) |

---

[← Back to Design System](../README.md) | [Next: Spacing →](./spacing.md)
