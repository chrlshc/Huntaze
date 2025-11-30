# Migration Guide

This guide helps you migrate existing code to use the Huntaze Design System.

## Overview

The migration process involves:
1. Replacing hardcoded values with design tokens
2. Adopting standard components
3. Following consistent patterns
4. Ensuring accessibility compliance

## 📚 Additional Resources

- **[Common Violations and Fixes](../../.kiro/specs/design-system-violations-fix/TASK-12-COMPLETE.md)** - Comprehensive guide to fixing violations
- **[Automated Migration Script](../../scripts/auto-migrate-violations.ts)** - Tool for bulk fixes

## 🤖 Automated Migration

Use the automated migration script to fix common patterns quickly:

```bash
# Preview changes without modifying files
npx tsx scripts/auto-migrate-violations.ts --dry-run

# Migrate specific violation types
npx tsx scripts/auto-migrate-violations.ts --type=fonts
npx tsx scripts/auto-migrate-violations.ts --type=typography
npx tsx scripts/auto-migrate-violations.ts --type=colors

# Migrate everything
npx tsx scripts/auto-migrate-violations.ts

# Rollback if needed
npx tsx scripts/auto-migrate-violations.ts --rollback
```

## Quick Wins

### Replace Hardcoded Colors

**Before:**
```tsx
<div style={{ background: '#27272a', color: '#fafafa' }}>
  Content
</div>
```

**After:**
```tsx
<div className="bg-[var(--bg-tertiary)] text-[var(--text-primary)]">
  Content
</div>
```

### Replace Hardcoded Spacing

**Before:**
```tsx
<div style={{ padding: '24px', marginBottom: '16px' }}>
  Content
</div>
```

**After:**
```tsx
<div className="p-[var(--space-6)] mb-[var(--space-4)]">
  Content
</div>
```

### Use Standard Components

**Before:**
```tsx
<button 
  style={{ 
    background: '#8b5cf6',
    padding: '8px 16px',
    borderRadius: '8px'
  }}
>
  Click me
</button>
```

**After:**
```tsx
<Button variant="primary">
  Click me
</Button>
```

## Step-by-Step Migration

### 1. Audit Current Code

Run the design token audit script:

```bash
npm run audit:design-tokens
```

This will identify:
- Hardcoded colors
- Arbitrary spacing values
- Custom font sizes
- Non-standard components

### 2. Replace Colors

#### Background Colors

```tsx
// Before
className="bg-zinc-950"
className="bg-zinc-900"
className="bg-zinc-800"
className="bg-gray-800"

// After
className="bg-[var(--bg-primary)]"
className="bg-[var(--bg-secondary)]"
className="bg-[var(--bg-tertiary)]"
className="bg-[var(--bg-tertiary)]"
```

#### Text Colors

```tsx
// Before
className="text-white"
className="text-zinc-400"
className="text-gray-500"

// After
className="text-[var(--text-primary)]"
className="text-[var(--text-secondary)]"
className="text-[var(--text-tertiary)]"
```

#### Border Colors

```tsx
// Before
className="border-gray-700"
className="border-white/10"

// After
className="border-[var(--border-subtle)]"
className="border-[var(--border-subtle)]"
```

### 3. Replace Spacing

#### Padding

```tsx
// Before
className="p-6"
className="px-4 py-2"
className="p-[24px]"

// After
className="p-[var(--space-6)]"
className="px-[var(--space-4)] py-[var(--space-2)]"
className="p-[var(--space-6)]"
```

#### Margin

```tsx
// Before
className="mb-4"
className="mt-8"
className="m-[16px]"

// After
className="mb-[var(--space-4)]"
className="mt-[var(--space-8)]"
className="m-[var(--space-4)]"
```

#### Gap

```tsx
// Before
className="gap-3"
className="space-y-4"

// After
className="gap-[var(--space-3)]"
className="space-y-[var(--space-4)]"
```

### 4. Replace Typography

#### Font Sizes

```tsx
// Before
className="text-2xl"
className="text-base"
className="text-sm"

// After
className="text-[var(--text-2xl)]"
className="text-[var(--text-base)]"
className="text-[var(--text-sm)]"
```

#### Font Weights

```tsx
// Before
className="font-semibold"
className="font-medium"

// After
className="font-[var(--font-weight-semibold)]"
className="font-[var(--font-weight-medium)]"
```

### 5. Adopt Standard Components

#### Buttons

**Before:**
```tsx
<button className="bg-violet-500 hover:bg-violet-600 text-white px-4 py-2 rounded-lg">
  Click me
</button>
```

**After:**
```tsx
<Button variant="primary">
  Click me
</Button>
```

#### Inputs

**Before:**
```tsx
<input 
  className="bg-zinc-900 border border-gray-700 text-white px-3 py-2 rounded-md"
  placeholder="Enter text"
/>
```

**After:**
```tsx
<Input placeholder="Enter text" />
```

#### Cards

**Before:**
```tsx
<div className="bg-zinc-800 border border-gray-700 rounded-2xl p-6">
  Content
</div>
```

**After:**
```tsx
<Card>
  Content
</Card>
```

### 6. Apply Glass Effects

**Before:**
```tsx
<div 
  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
  style={{ boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)' }}
>
  Content
</div>
```

**After:**
```tsx
<Card variant="glass">
  Content
</Card>

// Or use utility class
<div className="glass-card">
  Content
</div>
```

## Common Patterns

### Page Layout

**Before:**
```tsx
<div className="min-h-screen bg-zinc-950 p-8">
  <div className="max-w-7xl mx-auto">
    <h1 className="text-3xl font-semibold text-white mb-2">
      Dashboard
    </h1>
    <p className="text-zinc-400 mb-8">
      Welcome back
    </p>
    <div className="grid grid-cols-3 gap-6">
      {/* Cards */}
    </div>
  </div>
</div>
```

**After:**
```tsx
<div className="min-h-screen bg-[var(--bg-primary)] p-[var(--space-8)]">
  <div className="max-w-7xl mx-auto">
    <h1 className="text-[var(--text-3xl)] font-[var(--font-weight-semibold)] text-[var(--text-primary)] mb-[var(--space-2)]">
      Dashboard
    </h1>
    <p className="text-[var(--text-secondary)] mb-[var(--space-8)]">
      Welcome back
    </p>
    <div className="grid grid-cols-3 gap-[var(--space-6)]">
      {/* Cards */}
    </div>
  </div>
</div>

// Or use PageLayout component
<PageLayout 
  title="Dashboard" 
  subtitle="Welcome back"
>
  <div className="grid grid-cols-3 gap-[var(--space-6)]">
    {/* Cards */}
  </div>
</PageLayout>
```

### Form Layout

**Before:**
```tsx
<form className="space-y-6">
  <div>
    <label className="block text-sm font-medium text-zinc-400 mb-2">
      Email
    </label>
    <input 
      type="email"
      className="w-full bg-zinc-900 border border-gray-700 text-white px-3 py-2 rounded-md"
    />
  </div>
  <div className="flex gap-3 justify-end">
    <button className="px-4 py-2 border border-gray-700 rounded-lg">
      Cancel
    </button>
    <button className="px-4 py-2 bg-violet-500 text-white rounded-lg">
      Submit
    </button>
  </div>
</form>
```

**After:**
```tsx
<form className="space-y-[var(--space-6)]">
  <div className="space-y-[var(--space-2)]">
    <label className="block text-[var(--text-sm)] font-[var(--font-weight-medium)] text-[var(--text-secondary)]">
      Email
    </label>
    <Input type="email" />
  </div>
  <div className="flex gap-[var(--space-3)] justify-end">
    <Button variant="secondary">Cancel</Button>
    <Button variant="primary">Submit</Button>
  </div>
</form>
```

## Automated Migration

### Find and Replace

Use these regex patterns for bulk replacements:

#### Colors
```
Find: bg-zinc-950
Replace: bg-[var(--bg-primary)]

Find: bg-zinc-900
Replace: bg-[var(--bg-secondary)]

Find: text-white
Replace: text-[var(--text-primary)]

Find: text-zinc-400
Replace: text-[var(--text-secondary)]
```

#### Spacing
```
Find: p-6
Replace: p-[var(--space-6)]

Find: mb-4
Replace: mb-[var(--space-4)]

Find: gap-3
Replace: gap-[var(--space-3)]
```

### Migration Script

Run the automated migration script:

```bash
npm run migrate:design-system
```

This will:
1. Scan all component files
2. Replace common patterns
3. Generate a report of changes
4. Create a backup of original files

## Testing After Migration

### Visual Testing

1. Compare screenshots before and after
2. Check all pages in different viewports
3. Verify hover and focus states
4. Test dark mode (if applicable)

### Functional Testing

1. Run existing test suite
2. Test keyboard navigation
3. Test with screen reader
4. Verify all interactions work

### Property-Based Tests

Run the design system property tests:

```bash
npm run test:properties
```

This verifies:
- No hardcoded colors remain
- All spacing uses tokens
- Typography follows standards
- Components use design system

## Rollback Plan

If issues arise:

1. **Revert specific files:**
   ```bash
   git checkout HEAD -- path/to/file.tsx
   ```

2. **Revert entire migration:**
   ```bash
   git revert <migration-commit-hash>
   ```

3. **Use backup files:**
   ```bash
   cp backups/file.tsx.backup src/file.tsx
   ```

## Gradual Migration

You don't have to migrate everything at once:

### Phase 1: New Features
- All new components use design system
- New pages follow patterns

### Phase 2: High-Traffic Pages
- Migrate dashboard home
- Migrate main navigation
- Migrate authentication pages

### Phase 3: Remaining Pages
- Migrate settings pages
- Migrate admin pages
- Migrate edge cases

### Phase 4: Cleanup
- Remove old CSS files
- Remove unused utilities
- Update documentation

## Getting Help

### Common Issues

**Issue: Colors look different**
- Check if you're using the correct token
- Verify the token value in design-tokens.css
- Compare with design mockups

**Issue: Spacing is off**
- Ensure you're using the 4px grid
- Check responsive breakpoints
- Verify padding vs margin usage

**Issue: Components don't match design**
- Check component variant
- Verify props are correct
- Review component documentation

### Resources

- [Design System Documentation](./README.md)
- [Component API Reference](./components/README.md)
- [Design Tokens Reference](./tokens/README.md)
- [Accessibility Guidelines](./accessibility.md)

### Support

- Open an issue on GitHub
- Ask in #design-system Slack channel
- Contact the design system team

---

[← Back to Design System](./README.md)
