# Task 12 Complete: Documentation and Guidelines

## ✅ Summary

Created comprehensive documentation and guidelines for the design system violations fix project, including common violations guide, migration patterns, and developer guidelines.

## 📚 Documentation Created

### 1. Common Violations and Fixes Guide

<function_calls>
<invoke name="fsWrite">
<parameter name="path">docs/design-system/common-violations-and-fixes.md Design System Violations and Fixes

This guide documents the most common design system violations found in the codebase and how to fix them.

## Table of Contents

1. [Font Token Violations](#font-token-violations)
2. [Typography Token Violations](#typography-token-violations)
3. [Color Palette Violations](#color-palette-violations)
4. [Component Usage Violations](#component-usage-violations)
5. [Prevention Tips](#prevention-tips)

---

## Font Token Violations

### ❌ Violation: Hardcoded Font Family

**Problem**: Using hardcoded font-family values instead of design tokens.

```css
/* BAD */
.my-component {
  font-family: Inter;
  font-family: "Inter", sans-serif;
  font-family: system-ui;
}
```

```tsx
/* BAD */
<div style={{ fontFamily: "Inter" }}>Text</div>
```

**✅ Fix**: Use design tokens

```css
/* GOOD */
.my-component {
  font-family: var(--font-primary);
}
```

```tsx
/* GOOD */
<div style={{ fontFamily: "var(--font-primary)" }}>Text</div>
```

**Available Font Tokens**:
- `var(--font-primary)` - Inter (main UI font)
- `var(--font-mono)` - Geist Mono (code/monospace)

---

## Typography Token Violations

### ❌ Violation: Hardcoded Font Sizes

**Problem**: Using hardcoded pixel or rem values for font-size.

```css
/* BAD */
.heading {
  font-size: 24px;
}

.body {
  font-size: 16px;
}
```

```tsx
/* BAD */
<div style={{ fontSize: "14px" }}>Text</div>
```

**✅ Fix**: Use typography tokens

```css
/* GOOD */
.heading {
  font-size: var(--text-2xl);
}

.body {
  font-size: var(--text-base);
}
```

```tsx
/* GOOD */
<div style={{ fontSize: "var(--text-sm)" }}>Text</div>
```

**Available Typography Tokens**:
- `var(--text-xs)` - 12px
- `var(--text-sm)` - 14px
- `var(--text-base)` - 16px
- `var(--text-lg)` - 18px
- `var(--text-xl)` - 20px
- `var(--text-2xl)` - 24px
- `var(--text-3xl)` - 30px
- `var(--text-4xl)` - 36px
- `var(--text-5xl)` - 48px

### ❌ Violation: Tailwind Arbitrary Classes

**Problem**: Using arbitrary Tailwind classes instead of standard utilities.

```tsx
/* BAD */
<div className="text-[14px]">Text</div>
<div className="text-[16px]">Text</div>
```

**✅ Fix**: Use standard Tailwind classes

```tsx
/* GOOD */
<div className="text-sm">Text</div>
<div className="text-base">Text</div>
```

---

## Color Palette Violations

### ❌ Violation: Unapproved Colors

**Problem**: Using colors not in the approved design palette.

```css
/* BAD */
.component {
  background: #f5f5f5;
  color: #333333;
  border: 1px solid rgba(0, 0, 0, 0.1);
}
```

**✅ Fix**: Use approved color tokens

```css
/* GOOD */
.component {
  background: var(--color-gray-50);
  color: var(--color-gray-900);
  border: 1px solid var(--color-border);
}
```

**Common Approved Colors**:
- `var(--color-white)` - #ffffff
- `var(--color-black)` - #000000
- `var(--color-gray-50)` through `var(--color-gray-900)`
- `var(--color-primary)` - Brand primary color
- `var(--color-border)` - Standard border color
- `var(--color-background)` - Page background

**See**: `styles/design-tokens.css` for complete color palette

---

## Component Usage Violations

### ❌ Violation: Raw Button Elements

**Problem**: Using raw `<button>` elements instead of the Button component.

```tsx
/* BAD */
<button className="btn-primary" onClick={handleClick}>
  Click me
</button>
```

**✅ Fix**: Use Button component

```tsx
/* GOOD */
import { Button } from "@/components/ui/button";

<Button variant="primary" onClick={handleClick}>
  Click me
</Button>
```

**Available Button Variants**:
- `primary` - Main action button
- `secondary` - Secondary actions
- `outline` - Outlined style
- `ghost` - Minimal style
- `destructive` - Dangerous actions

### ❌ Violation: Raw Input Elements

**Problem**: Using raw `<input>` elements instead of the Input component.

```tsx
/* BAD */
<input 
  type="text" 
  placeholder="Enter name"
  className="form-input"
/>
```

**✅ Fix**: Use Input component

```tsx
/* GOOD */
import { Input } from "@/components/ui/input";

<Input 
  type="text" 
  placeholder="Enter name"
/>
```

### ❌ Violation: Raw Select Elements

**Problem**: Using raw `<select>` elements instead of the Select component.

```tsx
/* BAD */
<select className="form-select">
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
</select>
```

**✅ Fix**: Use Select component

```tsx
/* GOOD */
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Option 1</SelectItem>
    <SelectItem value="2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

### ❌ Violation: Card-like Divs

**Problem**: Using divs with card styling instead of the Card component.

```tsx
/* BAD */
<div className="bg-white rounded-lg shadow p-4">
  <h3>Title</h3>
  <p>Content</p>
</div>
```

**✅ Fix**: Use Card component

```tsx
/* GOOD */
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Content</p>
  </CardContent>
</Card>
```

---

## Prevention Tips

### 1. Use Design Tokens First

Always check if a design token exists before hardcoding values:

```css
/* Check styles/design-tokens.css first */
:root {
  --font-primary: ...;
  --text-base: ...;
  --color-primary: ...;
}
```

### 2. Use Design System Components

Before creating custom UI elements, check if a component exists:

- `components/ui/button.tsx`
- `components/ui/input.tsx`
- `components/ui/select.tsx`
- `components/ui/card.tsx`
- `components/ui/modal.tsx`
- `components/ui/alert.tsx`

### 3. Run Violation Checks Locally

Before committing, run the violation detection scripts:

```bash
# Check all violations
npx tsx scripts/check-font-token-violations.ts
npx tsx scripts/check-color-palette-violations.ts
npx tsx scripts/check-button-component-violations.ts
npx tsx scripts/check-input-component-violations.ts
npx tsx scripts/check-select-component-violations.ts
npx tsx scripts/check-card-component-violations.ts
```

### 4. Run Property Tests

Ensure your changes pass the property-based tests:

```bash
# Run all design system tests
npm run test -- tests/unit/properties/font-token-usage.property.test.ts --run
npm run test -- tests/unit/properties/typography-token-usage.property.test.ts --run
npm run test -- tests/unit/properties/color-palette-restriction.property.test.ts --run
npm run test -- tests/unit/properties/button-component-usage.property.test.ts --run
npm run test -- tests/unit/properties/input-component-usage.property.test.ts --run
npm run test -- tests/unit/properties/select-component-usage.property.test.ts --run
npm run test -- tests/unit/properties/card-component-usage.property.test.ts --run
```

### 5. Use the Automated Migration Script

For bulk fixes, use the automated migration script:

```bash
# Preview changes
npx tsx scripts/auto-migrate-violations.ts --dry-run

# Apply fixes
npx tsx scripts/auto-migrate-violations.ts --type=fonts
npx tsx scripts/auto-migrate-violations.ts --type=typography
npx tsx scripts/auto-migrate-violations.ts --type=colors
```

---

## Quick Reference

### When to Use What

| Situation | Use This | Not This |
|-----------|----------|----------|
| Font family | `var(--font-primary)` | `"Inter"` |
| Font size | `var(--text-base)` | `16px` |
| Text size class | `text-sm` | `text-[14px]` |
| Colors | `var(--color-primary)` | `#3b82f6` |
| Buttons | `<Button>` | `<button>` |
| Inputs | `<Input>` | `<input>` |
| Selects | `<Select>` | `<select>` |
| Cards | `<Card>` | `<div className="card">` |

---

## Getting Help

- **Design System Docs**: `docs/design-system/README.md`
- **Component Examples**: `components/ui/*.example.tsx`
- **Token Reference**: `styles/design-tokens.css`
- **Migration Guide**: `docs/design-system/migration-guide.md`

---

## Acceptable Exceptions

Some violations are acceptable in specific contexts:

1. **Email Templates** (`lib/email/`): Inline styles required for email clients
2. **Test Files** (`**/*.test.tsx`): May use raw elements for testing
3. **Third-party Integrations**: External libraries may have their own styling
4. **Legacy Code**: Documented in `ACCEPTABLE-VIOLATIONS.md`

See `.kiro/specs/design-system-violations-fix/ACCEPTABLE-VIOLATIONS.md` for the complete list.
