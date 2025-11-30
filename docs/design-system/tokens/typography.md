# Typography Tokens

The Huntaze typography system provides a clear hierarchy and excellent readability across all devices.

## Font Families

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
--font-mono: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace;
--font-display: 'Poppins', var(--font-sans);
```

### Usage

| Token | Use Case | Example |
|-------|----------|---------|
| `--font-sans` | Body text, UI elements | Paragraphs, buttons, inputs |
| `--font-mono` | Code, technical content | Code blocks, API responses |
| `--font-display` | Headlines, marketing | Hero titles, landing pages |

**Example:**
```tsx
<h1 className="font-[var(--font-display)]">Welcome to Huntaze</h1>
<p className="font-[var(--font-sans)]">Your dashboard awaits</p>
<code className="font-[var(--font-mono)]">npm install huntaze</code>
```

## Font Sizes

```css
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */
--text-5xl: 3rem;        /* 48px */
--text-6xl: 3.75rem;     /* 60px */
```

### Size Guidelines

| Token | Size | Use Case |
|-------|------|----------|
| `--text-xs` | 12px | Captions, labels, metadata |
| `--text-sm` | 14px | Secondary text, helper text |
| `--text-base` | 16px | Body text, default size |
| `--text-lg` | 18px | Emphasized body text |
| `--text-xl` | 20px | Card titles, section headers |
| `--text-2xl` | 24px | Page subtitles, large headers |
| `--text-3xl` | 30px | Page titles |
| `--text-4xl` | 36px | Hero subtitles |
| `--text-5xl` | 48px | Hero titles |
| `--text-6xl` | 60px | Marketing headlines |

**Example:**
```tsx
<div>
  <h1 className="text-[var(--text-3xl)]">Dashboard</h1>
  <p className="text-[var(--text-base)]">Welcome back to your workspace</p>
  <span className="text-[var(--text-xs)]">Last updated 2 hours ago</span>
</div>
```

## Font Weights

```css
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

### Weight Guidelines

| Token | Weight | Use Case |
|-------|--------|----------|
| `--font-weight-normal` | 400 | Body text, descriptions |
| `--font-weight-medium` | 500 | Buttons, labels, emphasis |
| `--font-weight-semibold` | 600 | Headings, important text |
| `--font-weight-bold` | 700 | Strong emphasis, alerts |

**Example:**
```tsx
<div>
  <h2 className="font-[var(--font-weight-semibold)]">Section Title</h2>
  <p className="font-[var(--font-weight-normal)]">Regular body text</p>
  <Button className="font-[var(--font-weight-medium)]">Click me</Button>
</div>
```

## Line Heights

```css
--leading-none: 1;
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;
```

### Line Height Guidelines

| Token | Ratio | Use Case |
|-------|-------|----------|
| `--leading-none` | 1 | Icons, single-line text |
| `--leading-tight` | 1.25 | Headings, titles |
| `--leading-snug` | 1.375 | Compact text, UI elements |
| `--leading-normal` | 1.5 | Body text (default) |
| `--leading-relaxed` | 1.625 | Long-form content |
| `--leading-loose` | 2 | Poetry, special formatting |

**Example:**
```tsx
<div>
  <h1 className="leading-[var(--leading-tight)]">
    Tight Heading
  </h1>
  <p className="leading-[var(--leading-normal)]">
    Normal body text with comfortable line spacing for easy reading.
  </p>
  <article className="leading-[var(--leading-relaxed)]">
    Long-form content with extra breathing room between lines.
  </article>
</div>
```

## Letter Spacing

```css
--tracking-tighter: -0.05em;
--tracking-tight: -0.025em;
--tracking-normal: 0;
--tracking-wide: 0.025em;
--tracking-wider: 0.05em;
```

### Tracking Guidelines

| Token | Value | Use Case |
|-------|-------|----------|
| `--tracking-tighter` | -0.05em | Large headings |
| `--tracking-tight` | -0.025em | Titles, subtitles |
| `--tracking-normal` | 0 | Body text (default) |
| `--tracking-wide` | 0.025em | Uppercase text, labels |
| `--tracking-wider` | 0.05em | All-caps headings |

**Example:**
```tsx
<div>
  <h1 className="tracking-[var(--tracking-tighter)]">
    Large Heading
  </h1>
  <label className="uppercase tracking-[var(--tracking-wide)]">
    Form Label
  </label>
</div>
```

## Typography Scale

### Heading Hierarchy

```tsx
// H1 - Page Title
<h1 className="text-[var(--text-3xl)] font-[var(--font-weight-semibold)] leading-[var(--leading-tight)] text-[var(--text-primary)]">
  Page Title
</h1>

// H2 - Section Title
<h2 className="text-[var(--text-2xl)] font-[var(--font-weight-semibold)] leading-[var(--leading-tight)] text-[var(--text-primary)]">
  Section Title
</h2>

// H3 - Subsection Title
<h3 className="text-[var(--text-xl)] font-[var(--font-weight-semibold)] leading-[var(--leading-snug)] text-[var(--text-primary)]">
  Subsection Title
</h3>

// H4 - Card Title
<h4 className="text-[var(--text-lg)] font-[var(--font-weight-medium)] leading-[var(--leading-snug)] text-[var(--text-primary)]">
  Card Title
</h4>
```

### Body Text

```tsx
// Large body text
<p className="text-[var(--text-lg)] leading-[var(--leading-relaxed)] text-[var(--text-secondary)]">
  Large body text for emphasis
</p>

// Regular body text
<p className="text-[var(--text-base)] leading-[var(--leading-normal)] text-[var(--text-secondary)]">
  Regular body text for most content
</p>

// Small body text
<p className="text-[var(--text-sm)] leading-[var(--leading-normal)] text-[var(--text-tertiary)]">
  Small body text for secondary information
</p>
```

### UI Text

```tsx
// Button text
<button className="text-[var(--text-sm)] font-[var(--font-weight-medium)]">
  Button Text
</button>

// Label text
<label className="text-[var(--text-sm)] font-[var(--font-weight-medium)] text-[var(--text-secondary)]">
  Label Text
</label>

// Caption text
<span className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
  Caption or metadata
</span>
```

## Responsive Typography

Adjust font sizes for different screen sizes:

```tsx
// Responsive heading
<h1 className="text-[var(--text-2xl)] md:text-[var(--text-3xl)] lg:text-[var(--text-4xl)]">
  Responsive Heading
</h1>

// Responsive body text
<p className="text-[var(--text-sm)] md:text-[var(--text-base)]">
  Responsive body text
</p>
```

## Best Practices

### ✅ Do

```tsx
// Use typography tokens
<h1 className="text-[var(--text-3xl)] font-[var(--font-weight-semibold)]">
  Dashboard
</h1>

// Maintain hierarchy
<div>
  <h2 className="text-[var(--text-2xl)]">Section</h2>
  <h3 className="text-[var(--text-xl)]">Subsection</h3>
  <p className="text-[var(--text-base)]">Content</p>
</div>

// Use appropriate line heights
<p className="text-[var(--text-base)] leading-[var(--leading-normal)]">
  Body text with comfortable line spacing
</p>
```

### ❌ Don't

```tsx
// Don't use arbitrary font sizes
<h1 style={{ fontSize: '27px' }}>
  Dashboard
</h1>

// Don't skip heading levels
<div>
  <h1>Title</h1>
  <h4>Subsection</h4> {/* Should be h2 */}
</div>

// Don't use tight line heights for body text
<p className="leading-[1.1]">
  Hard to read body text
</p>
```

## Accessibility

### Minimum Font Sizes

- Body text: Minimum 16px (`--text-base`)
- Small text: Minimum 14px (`--text-sm`)
- Captions: Minimum 12px (`--text-xs`)

### Contrast Requirements

All text meets WCAG 2.1 AA standards:

| Text Size | Background | Minimum Contrast |
|-----------|------------|------------------|
| < 18px | `--bg-primary` | 4.5:1 |
| ≥ 18px | `--bg-primary` | 3:1 |
| Bold ≥ 14px | `--bg-primary` | 3:1 |

### Semantic HTML

Always use semantic HTML elements:

```tsx
// ✅ Good
<h1>Page Title</h1>
<h2>Section Title</h2>
<p>Body text</p>

// ❌ Bad
<div className="text-[var(--text-3xl)]">Page Title</div>
<div className="text-[var(--text-2xl)]">Section Title</div>
<div>Body text</div>
```

## Common Patterns

### Page Header

```tsx
<header className="mb-[var(--space-8)]">
  <h1 className="text-[var(--text-3xl)] font-[var(--font-weight-semibold)] text-[var(--text-primary)] mb-[var(--space-2)]">
    Dashboard
  </h1>
  <p className="text-[var(--text-base)] text-[var(--text-secondary)]">
    Welcome back to your workspace
  </p>
</header>
```

### Card Header

```tsx
<div className="mb-[var(--space-4)]">
  <h3 className="text-[var(--text-xl)] font-[var(--font-weight-semibold)] text-[var(--text-primary)] mb-[var(--space-1)]">
    Card Title
  </h3>
  <p className="text-[var(--text-sm)] text-[var(--text-tertiary)]">
    Card description or metadata
  </p>
</div>
```

### Form Label

```tsx
<div className="space-y-[var(--space-2)]">
  <label className="text-[var(--text-sm)] font-[var(--font-weight-medium)] text-[var(--text-secondary)]">
    Email Address
  </label>
  <Input type="email" />
  <p className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
    We'll never share your email
  </p>
</div>
```

### Article Content

```tsx
<article className="prose">
  <h1 className="text-[var(--text-4xl)] font-[var(--font-weight-semibold)] leading-[var(--leading-tight)] mb-[var(--space-6)]">
    Article Title
  </h1>
  
  <p className="text-[var(--text-lg)] text-[var(--text-secondary)] leading-[var(--leading-relaxed)] mb-[var(--space-6)]">
    Introduction paragraph with larger text
  </p>
  
  <div className="space-y-[var(--space-4)]">
    <p className="text-[var(--text-base)] leading-[var(--leading-relaxed)]">
      Regular body paragraph
    </p>
    <p className="text-[var(--text-base)] leading-[var(--leading-relaxed)]">
      Another paragraph
    </p>
  </div>
</article>
```

---

[← Back to Spacing](./spacing.md) | [Next: Effects →](./effects.md)
