# Safe Area Quick Reference

## Import

```tsx
import {
  SafeAreaTop,
  SafeAreaBottom,
  SafeAreaLeft,
  SafeAreaRight,
  SafeAreaInset,
  SafeAreaHeader,
  SafeAreaFooter,
} from '@/components/layout/SafeArea';
```

## Components

| Component | Use Case | CSS Applied |
|-----------|----------|-------------|
| `SafeAreaTop` | Headers, top elements | `pt-[var(--sat)]` |
| `SafeAreaBottom` | Footers, tab bars | `pb-[var(--sab)]` |
| `SafeAreaLeft` | Left sidebars | `pl-[var(--sal)]` |
| `SafeAreaRight` | Right sidebars | `pr-[var(--sar)]` |
| `SafeAreaInset` | Full-screen modals | All 4 sides |
| `SafeAreaHeader` | Pre-styled header | Top + sticky + blur |
| `SafeAreaFooter` | Pre-styled footer | Bottom + border |

## Utility Classes

| Class | Effect |
|-------|--------|
| `safe-area-top` | Top padding |
| `safe-area-bottom` | Bottom padding |
| `safe-area-left` | Left padding |
| `safe-area-right` | Right padding |
| `safe-area-x` | Left + right padding |
| `safe-area-y` | Top + bottom padding |
| `safe-area-inset` | All sides padding |

## CSS Variables

| Variable | Value |
|----------|-------|
| `--sat` | `env(safe-area-inset-top)` |
| `--sab` | `env(safe-area-inset-bottom)` |
| `--sal` | `env(safe-area-inset-left)` |
| `--sar` | `env(safe-area-inset-right)` |

## Common Patterns

### Fixed Header
```tsx
<SafeAreaHeader>
  <nav>Navigation</nav>
</SafeAreaHeader>
```

### Fixed Footer
```tsx
<SafeAreaFooter>
  <nav>Footer Nav</nav>
</SafeAreaFooter>
```

### Full-Screen Modal
```tsx
<SafeAreaInset>
  <div className="fixed inset-0">
    Modal content
  </div>
</SafeAreaInset>
```

### Custom Header
```tsx
<header className="fixed top-0 safe-area-top bg-background">
  Header
</header>
```

### Direct CSS Variable
```tsx
<div className="pt-[var(--sat)] pb-[var(--sab)]">
  Content
</div>
```

## When to Use

✅ **DO use for:**
- Fixed headers
- Fixed footers
- Tab bars
- Full-screen modals
- Bottom sheets
- Sticky headers

❌ **DON'T use for:**
- Scrollable content
- Regular page content
- Non-fixed elements

## Testing

```bash
# Run unit tests
npm test -- tests/unit/components/safe-area.test.tsx --run
```

## More Info

See [SAFE_AREA_GUIDE.md](./SAFE_AREA_GUIDE.md) for complete documentation.
