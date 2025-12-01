# Visual Regression Testing Strategy for Contrast Changes

## Overview
When implementing the hybrid approach to fix contrast ratios (Task 42), we need comprehensive visual regression testing to ensure:
1. The new colors maintain the "God Tier" dark aesthetic
2. No unintended visual hierarchy breaks occur
3. Glass and elevated variants remain visually distinct
4. All 231 card usages look correct

## Testing Approach

### Phase 1: Baseline Capture (Before Changes)
Capture current state before modifying design tokens.

```bash
# Run existing visual regression tests to establish baseline
npm run test:visual -- --update-snapshots

# This creates baseline screenshots in:
# tests/visual/__screenshots__/
```

### Phase 2: Token Updates
Apply the hybrid approach changes to `styles/design-tokens.css`:

```css
:root {
  /* Updated values for 3.2:1 contrast */
  --bg-primary: #0a0a0a;        /* Slightly lighter than pure black */
  --bg-secondary: #1c1c1c;      /* Adjusted zinc-900 */
  --bg-tertiary: #303030;       /* Adjusted zinc-800 */
  --bg-card-elevated: #303030;  /* Explicit card background */
  
  /* Enhanced border visibility */
  --border-default: rgba(255, 255, 255, 0.15); /* Increased from 0.12 */
  --border-emphasis: rgba(255, 255, 255, 0.20); /* Increased from 0.18 */
  
  /* Slightly increased glass opacity */
  --bg-glass: rgba(255, 255, 255, 0.12); /* Increased from 0.08 */
  --bg-glass-hover: rgba(255, 255, 255, 0.16); /* Increased from 0.12 */
}
```

### Phase 3: Automated Visual Comparison

#### 3.1 Run Visual Regression Tests
```bash
# Run tests without updating snapshots
npm run test:visual

# This will:
# 1. Capture new screenshots with updated tokens
# 2. Compare against baseline
# 3. Generate diff images showing changes
# 4. Report any differences exceeding threshold
```

#### 3.2 Enhanced Test Coverage
Create additional tests specifically for contrast validation:

**File**: `tests/visual/contrast-validation.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Contrast Validation - Post Token Update', () => {
  test('Card variants maintain visual distinction', async ({ page }) => {
    await page.goto('/test-page-with-all-card-variants');
    await page.waitForLoadState('networkidle');
    
    // Capture all card variants side-by-side
    await expect(page).toHaveScreenshot('card-variants-comparison.png', {
      maxDiffPixels: 100, // Allow minor rendering differences
    });
  });

  test('Nested cards show progressive lightening', async ({ page }) => {
    await page.goto('/test-page-with-nested-cards');
    await page.waitForLoadState('networkidle');
    
    // Verify visual hierarchy is maintained
    await expect(page).toHaveScreenshot('nested-cards-hierarchy.png');
  });

  test('Glass effect remains distinct from solid cards', async ({ page }) => {
    await page.goto('/test-page-with-glass-and-solid-cards');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('glass-vs-solid-comparison.png');
  });

  test('Dark aesthetic preserved across all pages', async ({ page }) => {
    const pages = ['/home', '/analytics', '/integrations', '/messages'];
    
    for (const path of pages) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      
      // Verify overall darkness is maintained
      const backgroundColor = await page.evaluate(() => {
        return window.getComputedStyle(document.body).backgroundColor;
      });
      
      // Should still be very dark (RGB values < 20)
      expect(backgroundColor).toMatch(/rgb\((\d|1\d), (\d|1\d), (\d|1\d)\)/);
    }
  });
});
```

### Phase 4: Pixel-Level Diff Analysis

#### 4.1 Use pixelmatch for Precise Comparison
```bash
npm install --save-dev pixelmatch pngjs
```

**File**: `scripts/compare-contrast-changes.ts`

```typescript
import fs from 'fs';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

interface ComparisonResult {
  file: string;
  diffPixels: number;
  diffPercentage: number;
  passed: boolean;
}

function compareImages(
  baselinePath: string,
  currentPath: string,
  diffPath: string,
  threshold: number = 0.1
): ComparisonResult {
  const baseline = PNG.sync.read(fs.readFileSync(baselinePath));
  const current = PNG.sync.read(fs.readFileSync(currentPath));
  const { width, height } = baseline;
  
  const diff = new PNG({ width, height });
  
  const diffPixels = pixelmatch(
    baseline.data,
    current.data,
    diff.data,
    width,
    height,
    { threshold }
  );
  
  fs.writeFileSync(diffPath, PNG.sync.write(diff));
  
  const totalPixels = width * height;
  const diffPercentage = (diffPixels / totalPixels) * 100;
  
  return {
    file: baselinePath,
    diffPixels,
    diffPercentage,
    passed: diffPercentage < 5, // Allow up to 5% difference
  };
}

// Compare all card screenshots
const cardScreenshots = [
  'card-component.png',
  'card-variants-comparison.png',
  'nested-cards-hierarchy.png',
  'glass-vs-solid-comparison.png',
];

const results: ComparisonResult[] = [];

for (const screenshot of cardScreenshots) {
  const result = compareImages(
    `tests/visual/__screenshots__/baseline/${screenshot}`,
    `tests/visual/__screenshots__/current/${screenshot}`,
    `tests/visual/__screenshots__/diff/${screenshot}`,
  );
  results.push(result);
}

// Generate report
console.log('\n📊 Visual Regression Report - Contrast Changes\n');
console.log('═'.repeat(70));

results.forEach(result => {
  const status = result.passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${result.file}`);
  console.log(`   Diff: ${result.diffPixels} pixels (${result.diffPercentage.toFixed(2)}%)`);
});

const allPassed = results.every(r => r.passed);
console.log('\n' + '═'.repeat(70));
console.log(allPassed ? '✅ All tests passed!' : '❌ Some tests failed');

process.exit(allPassed ? 0 : 1);
```

### Phase 5: Manual QA Checklist

Even with automated tests, manual review is essential:

#### Critical Pages to Review
- [ ] **Dashboard Home** (`/home`)
  - Card contrast against background
  - Nested card hierarchy
  - Glass effect visibility
  
- [ ] **Analytics** (`/analytics/*`)
  - Chart cards
  - Stat cards
  - Filter panels
  
- [ ] **Integrations** (`/integrations`)
  - Integration cards
  - Connection status indicators
  - Modal overlays
  
- [ ] **Messages** (`/messages`)
  - Message cards
  - Conversation list
  - Input fields

#### Visual Checks
- [ ] Cards are clearly distinguishable from background
- [ ] Nested cards show progressive lightening
- [ ] Glass effects maintain translucent appearance
- [ ] Borders are visible but not overpowering
- [ ] Text remains highly readable
- [ ] Hover states provide clear feedback
- [ ] Focus indicators are prominent
- [ ] Dark aesthetic is preserved
- [ ] No "muddy" or washed-out appearance

#### Accessibility Checks
- [ ] Run contrast test: `npm test -- card-background-contrast.property.test.ts`
- [ ] All tests pass (6/6)
- [ ] Lighthouse accessibility score ≥ 95
- [ ] axe DevTools reports no contrast violations
- [ ] Manual testing with screen reader
- [ ] Manual testing with high contrast mode

### Phase 6: Cross-Browser Validation

Test on multiple browsers to ensure consistent rendering:

```bash
# Playwright supports multiple browsers
npm run test:visual -- --project=chromium
npm run test:visual -- --project=firefox
npm run test:visual -- --project=webkit
```

#### Browser-Specific Checks
- **Chrome/Edge**: Verify backdrop-filter rendering
- **Firefox**: Check rgba opacity rendering
- **Safari**: Validate glass effect appearance
- **Mobile Safari**: Test on actual iOS device

### Phase 7: Performance Impact

Verify that visual changes don't impact performance:

```bash
# Run Lighthouse performance audit
npm run lighthouse -- --url=http://localhost:3000/home

# Check for:
# - First Contentful Paint (FCP) < 1.8s
# - Largest Contentful Paint (LCP) < 2.5s
# - Cumulative Layout Shift (CLS) < 0.1
```

## Acceptance Criteria

### Automated Tests
- ✅ All property-based tests pass (6/6)
- ✅ Visual regression tests pass (< 5% pixel difference)
- ✅ No new accessibility violations
- ✅ Performance metrics unchanged

### Manual Review
- ✅ Design team approves visual changes
- ✅ Product team confirms aesthetic maintained
- ✅ QA team validates across browsers
- ✅ Accessibility specialist reviews

### Metrics
- ✅ Contrast ratio: 3.2:1 (meets WCAG AA)
- ✅ Lighthouse accessibility: ≥ 95
- ✅ Zero axe violations
- ✅ 231 card usages validated

## Rollback Plan

If visual regression tests reveal unacceptable changes:

### Option A: Adjust Token Values
Fine-tune the color values:
```css
/* Try slightly different values */
--bg-tertiary: #2d2d2d; /* Darker than #303030 */
--border-default: rgba(255, 255, 255, 0.14); /* Between 0.12 and 0.15 */
```

### Option B: Gradual Rollout
Apply changes to specific pages first:
1. Start with `/home` page only
2. Validate and iterate
3. Expand to other pages incrementally

### Option C: Revert and Reconsider
If changes are too disruptive:
1. Revert to baseline tokens
2. Explore alternative solutions (e.g., border-only approach)
3. Conduct user testing before re-attempting

## Timeline

1. **Day 1**: Capture baseline screenshots
2. **Day 2**: Apply token changes + run automated tests
3. **Day 3**: Manual QA + cross-browser testing
4. **Day 4**: Design/product review + iterations
5. **Day 5**: Final validation + deployment

## Tools & Commands

```bash
# Capture baseline
npm run test:visual -- --update-snapshots

# Run visual regression tests
npm run test:visual

# Run contrast property test
npm test -- card-background-contrast.property.test.ts

# Run pixel diff comparison
npm run compare-contrast-changes

# Run Lighthouse audit
npm run lighthouse

# Run axe accessibility scan
npm run test:a11y
```

## Success Metrics

- **Contrast Compliance**: 100% of cards meet 3:1 ratio
- **Visual Consistency**: < 5% pixel difference in non-card areas
- **Accessibility Score**: Lighthouse ≥ 95
- **Performance**: No regression in Core Web Vitals
- **Aesthetic Approval**: Design team sign-off

## Conclusion

This comprehensive visual regression strategy ensures that contrast improvements don't compromise the "God Tier" dark aesthetic while achieving WCAG AA compliance. The combination of automated testing, pixel-level comparison, and manual review provides confidence in the changes.
