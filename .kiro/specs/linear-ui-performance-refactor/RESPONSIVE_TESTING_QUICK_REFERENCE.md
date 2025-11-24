# Responsive Testing Quick Reference

## Quick Commands

```bash
# Run responsive behavior tests
npm run test:integration -- tests/integration/layout/responsive-behavior.integration.test.ts --run

# Run all layout tests
npm run test:integration -- tests/integration/layout --run

# Run with watch mode (development)
npm run test:integration -- tests/integration/layout
```

## Viewport Sizes

| Device | Width | Max-Width Applied | Dead Zone |
|--------|-------|-------------------|-----------|
| Mobile | 375px | No (< 1280px) | 0px |
| Tablet | 768px | No (< 1280px) | 0px |
| Desktop | 1280px | Yes (= 1280px) | 0px |
| Large Desktop | 1920px | Yes (> 1280px) | 320px/side |
| 2K Display | 2560px | Yes (> 1280px) | 640px/side |
| 4K Display | 3840px | Yes (> 1280px) | 1280px/side |

## Max-Width Variants

```tsx
// Small variant (1200px)
<CenteredContainer maxWidth="sm">
  {/* Content */}
</CenteredContainer>

// Large variant (1280px) - default
<CenteredContainer maxWidth="lg">
  {/* Content */}
</CenteredContainer>
```

## Dead Zone Formula

```typescript
deadZone = (viewportWidth - maxWidth) / 2

// Examples:
// 1920px viewport: (1920 - 1280) / 2 = 320px per side
// 2560px viewport: (2560 - 1280) / 2 = 640px per side
```

## Browser Testing Checklist

### Chrome
- [ ] Desktop layout
- [ ] Mobile responsive
- [ ] DevTools device emulation
- [ ] Hardware acceleration

### Firefox
- [ ] Desktop layout
- [ ] Mobile responsive
- [ ] Responsive design mode
- [ ] CSS custom properties

### Safari
- [ ] macOS desktop
- [ ] iOS mobile (iPhone)
- [ ] iOS tablet (iPad)
- [ ] Safe area insets

### Edge
- [ ] Desktop layout
- [ ] Chromium compatibility

## Manual Testing Steps

1. **Open DevTools** (F12 or Cmd+Option+I)
2. **Toggle Device Toolbar** (Cmd+Shift+M)
3. **Select Device Presets**:
   - iPhone SE (375px)
   - iPad (768px)
   - Desktop (1280px)
   - Responsive (custom)
4. **Verify**:
   - Content is centered
   - Max-width is enforced
   - Padding is consistent
   - No horizontal scroll
   - Dead zones appear on large screens

## Common Issues

### Issue: Content Not Centered
**Solution**: Verify `margin-left: auto` and `margin-right: auto` are applied

### Issue: No Dead Zones on Large Screens
**Solution**: Check max-width is set correctly (1200px or 1280px)

### Issue: Horizontal Scroll on Mobile
**Solution**: Ensure padding is included in width calculations

### Issue: Content Too Wide
**Solution**: Verify max-width constraint is applied

## Test Coverage

- ✅ 38 integration tests
- ✅ 8 viewport configurations
- ✅ 2 max-width variants
- ✅ Dead zone calculations
- ✅ Edge cases (320px to 5120px)

## Requirements Validated

- ✅ 4.1: Max-width constraints
- ✅ 4.2: Horizontal centering
- ✅ 4.3: Internal padding
- ✅ 4.4: Responsive behavior
- ✅ 4.5: Content encapsulation

## Related Files

- `tests/integration/layout/responsive-behavior.integration.test.ts`
- `components/layout/CenteredContainer.tsx`
- `components/layout/CenteredContainer.README.md`
- `.kiro/specs/linear-ui-performance-refactor/TASK_14_COMPLETION.md`
