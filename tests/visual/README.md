# Visual Regression Testing

This directory contains visual regression tests for the Huntaze design system. These tests capture baseline screenshots of components and pages to detect unintended visual changes.

## Overview

Visual regression testing helps ensure that:
- Design tokens are applied consistently
- Components maintain their visual appearance
- Responsive layouts work correctly across viewports
- Interactive states (hover, focus) are consistent
- Animations follow standardized timing

## Running Tests

### Generate Baseline Screenshots

First time setup - generate the baseline screenshots:

```bash
npm run test:visual:update
```

This will capture screenshots and save them in `tests/visual/__screenshots__/`.

### Run Visual Regression Tests

Compare current state against baseline:

```bash
npm run test:visual
```

### Update Baselines After Intentional Changes

When you make intentional design changes:

```bash
npm run test:visual:update
```

## Test Structure

### Core UI Components
- Button variants (primary, secondary, ghost, danger)
- Card component with glass effect
- Input component with focus states
- Modal component
- Alert/Toast component

### Dashboard Pages
- Home page
- Analytics page
- Integrations page
- Messages page

### Design Token Consistency
- Background colors (--bg-primary, --bg-secondary, --bg-tertiary)
- Glass effect cards (--bg-glass, --blur-xl)
- Typography hierarchy (font sizes, weights, line heights)
- Border colors (--border-subtle)
- Shadow effects (--shadow-inner-glow)

### Responsive Design
- Mobile viewport (375x667)
- Tablet viewport (768x1024)
- Desktop viewport (1920x1080)

### Interactive States
- Button hover transitions
- Card hover effects
- Input focus indicators
- Link hover states

### Animation Consistency
- Fade-in animations (--transition-base)
- Loading states
- Hover transitions

### Accessibility Features
- Touch target sizes (44x44px minimum)
- Focus indicators
- Keyboard navigation

## Configuration

Visual regression settings are configured in `playwright.config.ts`:

```typescript
expect: {
  toHaveScreenshot: {
    maxDiffPixels: 100,      // Maximum pixel difference
    threshold: 0.2,          // Color difference threshold (0-1)
    animations: 'disabled',  // Disable animations for consistency
  },
}
```

## Best Practices

### 1. Disable Animations
Screenshots should be taken with animations disabled for consistency:

```typescript
await page.addStyleTag({
  content: `
    *, *::before, *::after {
      animation-duration: 0s !important;
      transition-duration: 0s !important;
    }
  `
});
```

### 2. Wait for Network Idle
Always wait for the page to fully load:

```typescript
await page.waitForLoadState('networkidle');
```

### 3. Consistent Viewport
Use consistent viewport sizes and device scale factors:

```typescript
await page.setViewportSize({ width: 1920, height: 1080 });
```

### 4. Handle Dynamic Content
Wait for dynamic content to load:

```typescript
await page.waitForTimeout(1000);
```

### 5. Test Interactive States
Capture hover and focus states:

```typescript
await button.hover();
await page.waitForTimeout(300);
await expect(button).toHaveScreenshot('button-hover.png');
```

## Troubleshooting

### Screenshots Don't Match
1. Check if fonts are loaded correctly
2. Verify network requests completed
3. Ensure animations are disabled
4. Check for dynamic timestamps or random data

### Flaky Tests
1. Increase wait times for dynamic content
2. Use `waitForLoadState('networkidle')`
3. Disable animations globally
4. Mock time-dependent data

### Large Diffs
1. Review the diff images in `test-results/`
2. Check if changes are intentional
3. Update baselines if changes are correct
4. Adjust `maxDiffPixels` or `threshold` if needed

## CI/CD Integration

Visual regression tests run automatically in CI:

```yaml
- name: Run visual regression tests
  run: npm run test:visual
  
- name: Upload test results
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: visual-test-results
    path: test-results/
```

## Maintenance

### When to Update Baselines
- After intentional design system changes
- When updating design tokens
- After component refactoring
- When fixing visual bugs

### Review Process
1. Run tests locally before committing
2. Review diff images carefully
3. Update baselines only for intentional changes
4. Document visual changes in PR description

## Related Documentation

- [Design System Documentation](../../docs/design-system/README.md)
- [Design Tokens](../../styles/design-tokens.css)
- [Component Library](../../components/ui/)
- [Playwright Configuration](../../playwright.config.ts)

## Requirements Validation

This test suite validates the following requirements:

- **1.1**: Background Color Consistency - Verifies all dashboard pages use --bg-primary
- **1.2**: Glass Effect Consistency - Validates standardized glass effect tokens
- **1.3**: Button Hover Consistency - Tests button hover transitions
- **1.4**: Typography Hierarchy - Verifies font size and weight consistency
- **1.5**: Spacing Consistency - Validates padding and margin values

## Property Coverage

This visual regression test suite complements the property-based tests by providing:

- Visual validation of design token application
- Cross-browser rendering consistency
- Responsive design verification
- Interactive state validation
- Animation timing verification

Together with property-based tests, this provides comprehensive coverage of the design system requirements.
