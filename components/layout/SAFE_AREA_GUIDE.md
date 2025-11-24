# Safe Area Components Guide

## Overview

Safe Area components provide iOS-safe padding for device notches, rounded corners, and system UI elements. They use CSS environment variables (`env()`) to automatically adapt to device-specific safe areas.

**Design Reference**: `.kiro/specs/mobile-ux-marketing-refactor/design.md`  
**Validates**: Requirements 1.4

## CSS Variables

The following CSS variables are defined in `app/globals.css`:

```css
--sat: env(safe-area-inset-top);
--sab: env(safe-area-inset-bottom);
--sal: env(safe-area-inset-left);
--sar: env(safe-area-inset-right);
```

These variables automatically resolve to:
- **0px** on devices without notches/safe areas
- **Device-specific values** on iOS devices with notches (iPhone X and later)

## React Components

### SafeAreaTop

Adds padding-top for device notches and status bars.

```tsx
import { SafeAreaTop } from '@/components/layout/SafeArea';

<SafeAreaTop>
  <header>Your header content</header>
</SafeAreaTop>
```

**Use cases:**
- Fixed headers
- Top navigation bars
- Top-positioned modals

### SafeAreaBottom

Adds padding-bottom for home indicators and bottom system UI.

```tsx
import { SafeAreaBottom } from '@/components/layout/SafeArea';

<SafeAreaBottom>
  <footer>Your footer content</footer>
</SafeAreaBottom>
```

**Use cases:**
- Fixed footers
- Tab bars
- Bottom sheets
- Bottom-positioned CTAs

### SafeAreaLeft / SafeAreaRight

Adds padding for device edges in landscape orientation.

```tsx
import { SafeAreaLeft, SafeAreaRight } from '@/components/layout/SafeArea';

<SafeAreaLeft>
  <aside>Left sidebar</aside>
</SafeAreaLeft>

<SafeAreaRight>
  <aside>Right sidebar</aside>
</SafeAreaRight>
```

**Use cases:**
- Fixed sidebars in landscape
- Edge-to-edge drawers
- Landscape-specific UI

### SafeAreaInset

Adds padding on all sides for complete safe area coverage.

```tsx
import { SafeAreaInset } from '@/components/layout/SafeArea';

<SafeAreaInset>
  <div className="fixed inset-0">
    Full-screen modal content
  </div>
</SafeAreaInset>
```

**Use cases:**
- Full-screen modals
- Full-screen overlays
- Camera/video views

### SafeAreaHeader (Pre-configured)

Pre-configured header with safe area padding and common styles.

```tsx
import { SafeAreaHeader } from '@/components/layout/SafeArea';

<SafeAreaHeader>
  <nav>Navigation content</nav>
</SafeAreaHeader>
```

**Includes:**
- Safe area top padding
- Sticky positioning
- Backdrop blur effect
- Border bottom
- Semi-transparent background

### SafeAreaFooter (Pre-configured)

Pre-configured footer with safe area padding and common styles.

```tsx
import { SafeAreaFooter } from '@/components/layout/SafeArea';

<SafeAreaFooter>
  <nav>Footer navigation</nav>
</SafeAreaFooter>
```

**Includes:**
- Safe area bottom padding
- Border top
- Surface background color

## Tailwind Utility Classes

For cases where you need direct control, use these utility classes:

### Individual Padding

```tsx
<div className="safe-area-top">Top padding</div>
<div className="safe-area-bottom">Bottom padding</div>
<div className="safe-area-left">Left padding</div>
<div className="safe-area-right">Right padding</div>
```

### Combined Padding

```tsx
<div className="safe-area-x">Horizontal padding (left + right)</div>
<div className="safe-area-y">Vertical padding (top + bottom)</div>
<div className="safe-area-inset">All sides padding</div>
```

### Margin Variants

```tsx
<div className="safe-area-mt">Top margin</div>
<div className="safe-area-mb">Bottom margin</div>
<div className="safe-area-ml">Left margin</div>
<div className="safe-area-mr">Right margin</div>
```

## Direct CSS Variable Usage

For custom implementations, use the CSS variables directly:

```tsx
<div className="pt-[var(--sat)] pb-[var(--sab)]">
  Custom safe area implementation
</div>
```

## Common Patterns

### Fixed Header with Safe Area

```tsx
<header className="fixed top-0 left-0 right-0 z-50 pt-[var(--sat)] bg-background">
  <div className="h-16 px-6 flex items-center">
    Header content
  </div>
</header>
```

### Fixed Footer with Safe Area

```tsx
<footer className="fixed bottom-0 left-0 right-0 z-50 pb-[var(--sab)] bg-surface">
  <div className="h-16 px-6 flex items-center justify-around">
    Tab bar items
  </div>
</footer>
```

### Full-Screen Modal

```tsx
<div className="fixed inset-0 z-50 safe-area-inset">
  <div className="h-full flex flex-col">
    <header className="flex-shrink-0">Modal header</header>
    <main className="flex-1 overflow-y-auto">Modal content</main>
    <footer className="flex-shrink-0">Modal footer</footer>
  </div>
</div>
```

### Viewport-Locked App Layout

```tsx
<div className="app-viewport-lock flex flex-col">
  <header className="pt-[var(--sat)] flex-shrink-0">
    Header
  </header>
  
  <main className="flex-1 overflow-y-auto">
    Scrollable content
  </main>
  
  <footer className="pb-[var(--sab)] flex-shrink-0">
    Footer
  </footer>
</div>
```

## Testing Safe Areas

### Desktop Browser Testing

Safe areas will be **0px** on desktop browsers. To test:

1. Use Chrome DevTools Device Mode
2. Select an iPhone X or later model
3. Enable "Show device frame" to see the notch
4. Verify padding appears around the notch

### iOS Simulator Testing

1. Open Xcode Simulator
2. Select iPhone 14 Pro or later (with notch)
3. Navigate to your app
4. Verify content doesn't overlap with notch or home indicator

### Physical Device Testing

1. Deploy to a physical iPhone X or later
2. Test in both portrait and landscape orientations
3. Verify safe areas adapt correctly

## Browser Support

Safe area insets are supported in:
- ✅ iOS Safari 11.0+
- ✅ Chrome on iOS
- ✅ Firefox on iOS
- ✅ All iOS WebView-based apps

On unsupported browsers, `env(safe-area-inset-*)` gracefully falls back to `0px`.

## Viewport Meta Tag

Ensure your root layout includes the correct viewport meta tag:

```tsx
export const metadata: Metadata = {
  viewport: {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover', // Required for safe area support
  },
};
```

The `viewport-fit=cover` directive is **critical** for iOS devices with notches.

## Best Practices

### ✅ DO

- Use SafeArea components for all fixed headers and footers
- Test on actual iOS devices with notches
- Combine safe area padding with your own padding (they stack)
- Use semantic component names (SafeAreaHeader, SafeAreaFooter)

### ❌ DON'T

- Don't use fixed pixel values for notch padding
- Don't assume all iOS devices have the same safe area values
- Don't forget to test in landscape orientation
- Don't use safe areas on scrollable content (only fixed elements)

## Troubleshooting

### Safe areas not working

1. Check viewport meta tag includes `viewport-fit=cover`
2. Verify CSS variables are defined in `app/globals.css`
3. Test on actual iOS device or simulator (not desktop browser)

### Content still overlapping notch

1. Ensure parent element has safe area padding
2. Check for conflicting negative margins
3. Verify element is actually fixed/sticky positioned

### Safe areas too large

1. Check for duplicate safe area padding (stacking)
2. Verify you're not combining margin and padding
3. Test on different device models

## Related Documentation

- [Design Document](.kiro/specs/mobile-ux-marketing-refactor/design.md)
- [Requirements Document](.kiro/specs/mobile-ux-marketing-refactor/requirements.md)
- [Route Architecture Guide](.kiro/specs/mobile-ux-marketing-refactor/ROUTE_ARCHITECTURE_MIGRATION.md)
- [Design Tokens Guide](.kiro/specs/mobile-ux-marketing-refactor/DESIGN_TOKENS_GUIDE.md)
