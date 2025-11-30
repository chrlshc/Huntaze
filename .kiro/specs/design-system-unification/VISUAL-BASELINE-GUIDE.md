# Visual Regression Testing Baseline Guide

## Overview

This guide documents the visual regression testing baseline for the Huntaze design system. Visual regression tests capture screenshots of components and pages to detect unintended visual changes.

## What Was Created

### 1. Visual Test Suite
**File**: `tests/visual/design-system-baseline.spec.ts`

Comprehensive test suite covering:
- ✅ Core UI components (Button, Card, Input)
- ✅ Dashboard pages (Home, Analytics, Integrations, Messages)
- ✅ Design token consistency (backgrounds, glass effects, typography)
- ✅ Responsive design (mobile, tablet, desktop viewports)
- ✅ Interactive states (hover, focus)
- ✅ Animation consistency
- ✅ Accessibility features (touch targets, focus indicators)

### 2. Documentation
**File**: `tests/visual/README.md`

Complete documentation including:
- Test structure and organization
- Running instructions
- Configuration details
- Best practices
- Troubleshooting guide
- CI/CD integration

### 3. Baseline Capture Script
**File**: `scripts/capture-visual-baseline.ts`

Automated script for:
- Prerequisites checking
- Baseline screenshot capture
- Report generation
- Cleanup utilities

### 4. NPM Scripts
Updated `package.json` with:
```json
{
  "test:visual": "playwright test tests/visual",
  "test:visual:baseline": "playwright test tests/visual/design-system-baseline.spec.ts",
  "test:visual:update": "playwright test tests/visual --update-snapshots",
  "test:visual:ui": "playwright test tests/visual --ui",
  "test:visual:headed": "playwright test tests/visual --headed",
  "test:visual:report": "playwright show-report"
}
```

## How to Use

### Initial Setup

1. **Install Playwright browsers** (if not already installed):
```bash
npx playwright install
```

2. **Start the development server**:
```bash
npm run dev
```

3. **Capture baseline screenshots**:
```bash
npm run test:visual:update
```

This will create baseline screenshots in `tests/visual/__screenshots__/`.

### Running Tests

**Run all visual regression tests**:
```bash
npm run test:visual
```

**Run only baseline tests**:
```bash
npm run test:visual:baseline
```

**Run with UI mode** (interactive):
```bash
npm run test:visual:ui
```

**Run in headed mode** (see browser):
```bash
npm run test:visual:headed
```

### Viewing Results

**View test report**:
```bash
npm run test:visual:report
```

This opens an HTML report showing:
- Test results
- Screenshot comparisons
- Diff images for failures
- Test execution timeline

### Updating Baselines

When you make intentional design changes:

```bash
npm run test:visual:update
```

**Important**: Only update baselines for intentional changes. Review diffs carefully before updating.

## Test Coverage

### Components Tested

1. **Button Component**
   - All variants (primary, secondary, ghost, danger)
   - Hover states
   - Focus states
   - Disabled states

2. **Card Component**
   - Glass effect variant
   - Hover effects
   - Border and shadow consistency

3. **Input Component**
   - Default state
   - Focus state
   - Error state

### Pages Tested

1. **Dashboard Home** (`/home`)
   - Full page screenshot
   - Background consistency
   - Layout structure

2. **Analytics** (`/analytics`)
   - Full page screenshot
   - Chart components
   - Data visualization

3. **Integrations** (`/integrations`)
   - Full page screenshot
   - Integration cards
   - Grid layout

4. **Messages** (`/messages`)
   - Full page screenshot
   - Message list
   - Chat interface

### Responsive Viewports

- **Mobile**: 375x667 (iPhone SE)
- **Tablet**: 768x1024 (iPad)
- **Desktop**: 1920x1080 (Full HD)

### Design Tokens Validated

- ✅ `--bg-primary` (zinc-950)
- ✅ `--bg-secondary` (zinc-900)
- ✅ `--bg-tertiary` (zinc-800)
- ✅ `--bg-glass` (glass effect)
- ✅ `--border-subtle` (border colors)
- ✅ `--shadow-inner-glow` (glow effects)
- ✅ Typography tokens (font sizes, weights)
- ✅ Spacing tokens (padding, margins)
- ✅ Animation tokens (transition durations)

## Requirements Validation

This visual baseline validates:

- **Requirement 1.1**: Background Color Consistency
  - All dashboard pages use `--bg-primary` token
  - Verified through full-page screenshots

- **Requirement 1.2**: Glass Effect Consistency
  - Cards use standardized glass effect
  - Verified through component screenshots

- **Requirement 1.3**: Button Hover Consistency
  - Hover transitions use standard duration
  - Verified through interactive state screenshots

- **Requirement 1.4**: Typography Hierarchy
  - Font sizes and weights are consistent
  - Verified through text element screenshots

- **Requirement 1.5**: Spacing Consistency
  - Padding and margins follow spacing scale
  - Verified through layout screenshots

## Best Practices

### 1. Disable Animations
Tests automatically disable animations for consistency:
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

### 2. Wait for Content
Always wait for pages to fully load:
```typescript
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000); // Additional buffer
```

### 3. Consistent Viewports
Use standardized viewport sizes:
```typescript
await page.setViewportSize({ width: 1920, height: 1080 });
```

### 4. Review Diffs Carefully
Before updating baselines:
1. Review diff images in `test-results/`
2. Verify changes are intentional
3. Check multiple viewports
4. Test interactive states

## Troubleshooting

### Tests Fail with Small Differences

**Cause**: Font rendering, anti-aliasing, or timing differences

**Solution**: 
- Adjust `maxDiffPixels` in `playwright.config.ts`
- Increase wait times for dynamic content
- Ensure fonts are loaded before capturing

### Flaky Tests

**Cause**: Dynamic content, animations, or network timing

**Solution**:
- Use `waitForLoadState('networkidle')`
- Add explicit waits for dynamic elements
- Mock time-dependent data
- Disable animations globally

### Screenshots Look Different Locally vs CI

**Cause**: Different OS, fonts, or rendering engines

**Solution**:
- Use Docker for consistent environment
- Ensure same Playwright version
- Use `deviceScaleFactor: 1` for consistency
- Commit baseline screenshots from CI

## CI/CD Integration

Visual tests run automatically in CI:

```yaml
- name: Install Playwright
  run: npx playwright install --with-deps

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

✅ **Update baselines when**:
- Making intentional design system changes
- Updating design tokens
- Refactoring components (if visual output changes)
- Fixing visual bugs

❌ **Don't update baselines for**:
- Flaky test failures
- CI environment differences
- Temporary content changes
- Random test failures

### Review Process

1. **Local Testing**:
   ```bash
   npm run test:visual
   ```

2. **Review Diffs**:
   ```bash
   npm run test:visual:report
   ```

3. **Update if Intentional**:
   ```bash
   npm run test:visual:update
   ```

4. **Commit Changes**:
   ```bash
   git add tests/visual/__screenshots__/
   git commit -m "Update visual baselines for [reason]"
   ```

## Related Documentation

- [Visual Testing README](../../tests/visual/README.md)
- [Design System Documentation](../../docs/design-system/README.md)
- [Playwright Configuration](../../playwright.config.ts)
- [Design Tokens](../../styles/design-tokens.css)

## Next Steps

After establishing the baseline:

1. ✅ Commit baseline screenshots to version control
2. ✅ Run tests in CI to verify consistency
3. ✅ Document any platform-specific differences
4. ✅ Set up automated baseline updates for design changes
5. ✅ Train team on visual regression workflow

## Success Metrics

- ✅ All major components have baseline screenshots
- ✅ All dashboard pages have baseline screenshots
- ✅ Responsive viewports are covered
- ✅ Interactive states are captured
- ✅ Tests pass consistently in CI
- ✅ Team understands update workflow

## Conclusion

The visual regression testing baseline is now established for the Huntaze design system. This provides:

- **Automated visual validation** of design token consistency
- **Early detection** of unintended visual changes
- **Confidence** when refactoring components
- **Documentation** of expected visual appearance
- **Quality assurance** for design system implementation

The baseline will evolve with the design system, providing continuous validation of visual consistency across the application.
