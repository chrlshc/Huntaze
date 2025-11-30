# Spacing Tokens

The Huntaze spacing system is based on a 4px grid, providing consistent and predictable layouts across the application.

## Spacing Scale

```css
--space-0: 0;
--space-1: 0.25rem;    /* 4px */
--space-2: 0.5rem;     /* 8px */
--space-3: 0.75rem;    /* 12px */
--space-4: 1rem;       /* 16px */
--space-5: 1.25rem;    /* 20px */
--space-6: 1.5rem;     /* 24px */
--space-7: 1.75rem;    /* 28px */
--space-8: 2rem;       /* 32px */
--space-10: 2.5rem;    /* 40px */
--space-12: 3rem;      /* 48px */
--space-16: 4rem;      /* 64px */
--space-20: 5rem;      /* 80px */
--space-24: 6rem;      /* 96px */
--space-32: 8rem;      /* 128px */
```

## Usage Guidelines

### Component Spacing

| Token | Size | Common Use Cases |
|-------|------|------------------|
| `--space-1` | 4px | Icon spacing, tight gaps |
| `--space-2` | 8px | Button padding (vertical), small gaps |
| `--space-3` | 12px | Input padding, compact spacing |
| `--space-4` | 16px | Button padding (horizontal), standard gaps |
| `--space-6` | 24px | Card padding, section spacing |
| `--space-8` | 32px | Large section spacing |
| `--space-12` | 48px | Page section spacing |
| `--space-16` | 64px | Major section breaks |

### Padding Examples

```tsx
// Button padding
<button className="px-[var(--space-4)] py-[var(--space-2)]">
  Click me
</button>

// Card padding
<Card className="p-[var(--space-6)]">
  Card content
</Card>

// Input padding
<input className="px-[var(--space-3)] py-[var(--space-2)]" />
```

### Margin Examples

```tsx
// Stack spacing
<div className="space-y-[var(--space-4)]">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>

// Section spacing
<section className="mb-[var(--space-12)]">
  Section content
</section>

// Inline spacing
<div className="flex gap-[var(--space-3)]">
  <Button>Cancel</Button>
  <Button>Save</Button>
</div>
```

## Layout Patterns

### Card Layout

```tsx
<Card className="p-[var(--space-6)]">
  <h2 className="mb-[var(--space-4)]">Card Title</h2>
  <p className="mb-[var(--space-6)]">Card description</p>
  <div className="flex gap-[var(--space-3)]">
    <Button>Action 1</Button>
    <Button>Action 2</Button>
  </div>
</Card>
```

### Form Layout

```tsx
<form className="space-y-[var(--space-6)]">
  <div className="space-y-[var(--space-2)]">
    <label>Name</label>
    <Input />
  </div>
  <div className="space-y-[var(--space-2)]">
    <label>Email</label>
    <Input type="email" />
  </div>
  <div className="flex gap-[var(--space-3)] justify-end">
    <Button variant="secondary">Cancel</Button>
    <Button variant="primary">Submit</Button>
  </div>
</form>
```

### Page Layout

```tsx
<div className="p-[var(--space-8)]">
  <header className="mb-[var(--space-8)]">
    <h1 className="mb-[var(--space-2)]">Page Title</h1>
    <p>Page description</p>
  </header>
  
  <main className="space-y-[var(--space-12)]">
    <section>Section 1</section>
    <section>Section 2</section>
  </main>
</div>
```

## Component-Specific Tokens

### Button Spacing

```css
--button-padding-x: var(--space-4);    /* 16px horizontal */
--button-padding-y: var(--space-2);    /* 8px vertical */
```

### Input Spacing

```css
--input-padding-x: var(--space-3);     /* 12px horizontal */
--input-padding-y: var(--space-2);     /* 8px vertical */
```

### Card Spacing

```css
--card-padding: var(--space-6);        /* 24px all sides */
```

## Responsive Spacing

Adjust spacing for different screen sizes:

```tsx
// Mobile: smaller padding
// Desktop: larger padding
<div className="p-[var(--space-4)] md:p-[var(--space-8)]">
  Responsive padding
</div>

// Mobile: tight spacing
// Desktop: comfortable spacing
<div className="space-y-[var(--space-4)] md:space-y-[var(--space-8)]">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

## Best Practices

### ✅ Do

```tsx
// Use spacing tokens
<div className="p-[var(--space-6)] mb-[var(--space-4)]">
  Content
</div>

// Use consistent spacing in stacks
<div className="space-y-[var(--space-4)]">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

// Use gap for flex layouts
<div className="flex gap-[var(--space-3)]">
  <Button>Cancel</Button>
  <Button>Save</Button>
</div>
```

### ❌ Don't

```tsx
// Don't use arbitrary values
<div style={{ padding: '23px', margin: '17px' }}>
  Content
</div>

// Don't use Tailwind arbitrary values
<div className="p-[23px] mb-[17px]">
  Content
</div>

// Don't mix spacing systems
<div className="p-5 mb-[var(--space-4)]">
  Inconsistent spacing
</div>
```

## Spacing Decision Tree

```
Need spacing?
├─ Between inline elements? → Use gap-[var(--space-X)]
├─ Between stacked elements? → Use space-y-[var(--space-X)]
├─ Inside component? → Use p-[var(--space-X)]
└─ Outside component? → Use m-[var(--space-X)]

How much space?
├─ Tight (icons, small gaps) → --space-1 or --space-2
├─ Compact (buttons, inputs) → --space-3 or --space-4
├─ Comfortable (cards, sections) → --space-6 or --space-8
└─ Spacious (page sections) → --space-12 or --space-16
```

## Common Patterns

### Button Group

```tsx
<div className="flex gap-[var(--space-3)]">
  <Button>Cancel</Button>
  <Button>Save</Button>
</div>
```

### Form Field

```tsx
<div className="space-y-[var(--space-2)]">
  <label>Field Label</label>
  <Input />
  <p className="text-[var(--text-tertiary)]">Helper text</p>
</div>
```

### Card Grid

```tsx
<div className="grid grid-cols-3 gap-[var(--space-6)]">
  <Card>Card 1</Card>
  <Card>Card 2</Card>
  <Card>Card 3</Card>
</div>
```

### Section Spacing

```tsx
<div className="space-y-[var(--space-12)]">
  <section>
    <h2 className="mb-[var(--space-6)]">Section 1</h2>
    <div className="space-y-[var(--space-4)]">
      <p>Content</p>
      <p>Content</p>
    </div>
  </section>
  
  <section>
    <h2 className="mb-[var(--space-6)]">Section 2</h2>
    <div className="space-y-[var(--space-4)]">
      <p>Content</p>
      <p>Content</p>
    </div>
  </section>
</div>
```

## Accessibility

### Touch Targets

Ensure minimum 44x44px touch targets on mobile:

```tsx
// Button with adequate padding
<button className="px-[var(--space-4)] py-[var(--space-3)] min-h-[44px]">
  Touch-friendly button
</button>

// Icon button with padding
<button className="p-[var(--space-3)] min-w-[44px] min-h-[44px]">
  <Icon />
</button>
```

### Focus Spacing

Provide adequate space for focus indicators:

```css
.interactive-element {
  padding: var(--space-3);
  /* Focus ring has offset */
  outline-offset: var(--focus-ring-offset); /* 2px */
}
```

## Visual Rhythm

Create visual hierarchy with consistent spacing:

```tsx
<article>
  {/* Large spacing for major sections */}
  <header className="mb-[var(--space-12)]">
    <h1 className="mb-[var(--space-2)]">Article Title</h1>
    <p className="text-[var(--text-secondary)]">Subtitle</p>
  </header>
  
  {/* Medium spacing for paragraphs */}
  <div className="space-y-[var(--space-6)]">
    <p>Paragraph 1</p>
    <p>Paragraph 2</p>
    <p>Paragraph 3</p>
  </div>
  
  {/* Small spacing for related items */}
  <footer className="mt-[var(--space-12)] flex gap-[var(--space-3)]">
    <Button>Share</Button>
    <Button>Save</Button>
  </footer>
</article>
```

---

[← Back to Colors](./colors.md) | [Next: Typography →](./typography.md)
