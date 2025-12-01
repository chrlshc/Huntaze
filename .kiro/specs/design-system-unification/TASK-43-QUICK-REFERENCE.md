# Task 43 Quick Reference: Text Color Guidelines

## The Rule

**Primary content MUST use light colors (zinc-50/100) for maximum readability.**

## Quick Decision Tree

```
Is this text primary content?
├─ YES (headings, body text, main content)
│  └─ Use: var(--text-primary) or text-zinc-50
│
└─ NO (labels, captions, metadata)
   └─ Use: var(--text-secondary) or text-zinc-400
```

## Code Examples

### ✅ Correct Usage

```tsx
// Headings - Always primary
<h1 style={{ color: 'var(--text-primary)' }}>Title</h1>
<h2 className="text-zinc-50">Subtitle</h2>

// Body text - Always primary
<p style={{ color: 'var(--text-primary)' }}>Main content here</p>
<p className="text-zinc-50">More content</p>

// Navigation - Primary
<Link className="text-zinc-50">Dashboard</Link>

// Button labels - Primary
<button className="text-white">Submit</button>
```

### ❌ Incorrect Usage

```tsx
// DON'T use secondary colors for headings
<h4 style={{ color: 'var(--text-secondary)' }}>Title</h4>

// DON'T use mid-range grays for body text
<p className="text-gray-600">Content</p>

// DON'T use zinc-400+ for primary content
<p className="text-zinc-400">Main text</p>
```

### ✅ Secondary Content (Allowed)

```tsx
// Labels and captions
<label className="text-zinc-400">Email address</label>
<figcaption style={{ color: 'var(--text-secondary)' }}>Image caption</figcaption>

// Metadata
<span className="text-zinc-400">Posted 2 hours ago</span>
<div style={{ color: 'var(--text-secondary)' }}>Last updated: Nov 30</div>

// Helper text
<small className="text-zinc-400">Optional field</small>
```

## Color Reference

| Color | Hex | Contrast | Use For |
|-------|-----|----------|---------|
| zinc-50 | #fafafa | 19.5:1 | Primary content ✅ |
| zinc-100 | #f4f4f5 | 18.2:1 | Primary content ✅ |
| zinc-400 | #a1a1aa | 8.3:1 | Secondary only ⚠️ |
| zinc-500 | #71717a | 5.9:1 | Tertiary only ⚠️ |
| zinc-600 | #52525b | 4.2:1 | Never use ❌ |

## Token Reference

```css
--text-primary: #fafafa;    /* zinc-50 - Use for primary content */
--text-secondary: #a1a1aa;  /* zinc-400 - Use for labels/metadata */
--text-tertiary: #71717a;   /* zinc-500 - Use for disabled/subtle */
```

## Common Violations

### 1. Headings with Secondary Color
```tsx
// ❌ Wrong
<h4 style={{ color: 'var(--text-secondary)' }}>Section Title</h4>

// ✅ Correct
<h4 style={{ color: 'var(--text-primary)' }}>Section Title</h4>
```

### 2. Body Text with Gray
```tsx
// ❌ Wrong
<p className="text-gray-600">This is important content</p>

// ✅ Correct
<p className="text-zinc-50">This is important content</p>
```

### 3. Descriptions with Wrong Token
```tsx
// ❌ Wrong (if it's the main description)
<p style={{ color: 'var(--text-secondary)' }}>Product description</p>

// ✅ Correct
<p style={{ color: 'var(--text-primary)' }}>Product description</p>
```

## Testing

```bash
# Run the property test
npm test -- tests/unit/properties/primary-text-lightness.property.test.ts --run

# Check specific file
npm test -- tests/unit/properties/primary-text-lightness.property.test.ts --run | grep "your-file.tsx"
```

## Priority Fixes

1. **Analytics components** - 6 violations
2. **Integration cards** - 3 violations  
3. **Marketing pages** - 13 violations
4. **Example files** - 90 violations

## When in Doubt

**Ask yourself**: "Is this text the main content the user needs to read?"
- **YES** → Use `var(--text-primary)` or `text-zinc-50`
- **NO** → Use `var(--text-secondary)` or `text-zinc-400`

---

**Property 24** | **Requirements 9.2** | **WCAG AAA Compliant**
