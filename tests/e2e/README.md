# Visual Regression Testing

This directory contains end-to-end visual regression tests for the Huntaze marketing pages.

## Overview

Visual regression testing captures screenshots of pages and compares them against baseline images to detect unintended visual changes. This helps ensure that:

- UI changes are intentional and reviewed
- Hover and active states work correctly (Requirements 1.2, 1.4)
- Pages render consistently across viewports
- Dark mode styling is correct
- Footer and header remain consistent across pages

## Test Coverage

### Pages Tested
- Homepage (`/`)
- Features (`/features`)
- Pricing (`/pricing`)
- About (`/about`)
- Case Studies (`/case-studies`)

### Viewports
- **Desktop**: 1280x720
- **Mobile**: 375x667 (iPhone SE)
- **Tablet**: 768x1024

### Interactive States
- Navigation link hover states
- Active navigation indicators
- CTA button hover states
- Feature card hover states
- Pricing card hover states
- Mobile navigation drawer (open/closed)

### Color Schemes
- Light mode (default)
- Dark mode

## Running Tests

### Prerequisites

Make sure the development server is running:
```bash
npm run dev
```

### Run All Visual Regression Tests

```bash
# Using the helper script (recommended)
./scripts/visual-regression.sh

# Or directly with Playwright
npx playwright test tests/e2e/visual-regression.spec.ts
```

### Update Baseline Screenshots

When you make intentional visual changes, update the baselines:

```bash
# Using the helper script
./scripts/visual-regression.sh --update-baselines

# Or directly with Playwright
npx playwright test tests/e2e/visual-regression.spec.ts --update-snapshots
```

### Debug Mode

Run tests in headed mode to see what's happening:

```bash
./scripts/visual-regression.sh --headed --debug
```

### Interactive UI Mode

Use Playwright's UI mode for debugging:

```bash
./scripts/visual-regression.sh --ui
```

## Screenshot Organization

Screenshots are stored in:
```
tests/e2e/visual-regression.spec.ts-snapshots/
├── chromium/
│   ├── homepage-desktop.png
│   ├── homepage-mobile.png
│   ├── features-desktop.png
│   └── ...
└── mobile-chrome/
    ├── homepage-mobile.png
    └── ...
```

## CI/CD Integration

In CI environments:
- Tests run automatically on pull requests
- Failures generate visual diff reports
- Reports are uploaded as artifacts
- Baselines should be committed to the repository

### GitHub Actions Example

```yaml
- name: Run Visual Regression Tests
  run: npx playwright test tests/e2e/visual-regression.spec.ts

- name: Upload Test Results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Handling Test Failures

When a visual regression test fails:

1. **Review the diff**: Check the HTML report for visual differences
   ```bash
   npx playwright show-report
   ```

2. **Determine if the change is intentional**:
   - If YES: Update baselines with `--update-snapshots`
   - If NO: Fix the code causing the unintended change

3. **Common causes of failures**:
   - Font loading timing issues
   - Animation timing
   - Dynamic content (timestamps, random data)
   - Browser version differences

## Best Practices

### Writing Visual Tests

1. **Wait for stability**: Always wait for page load and animations to complete
2. **Hide dynamic content**: Use CSS to hide timestamps and changing data
3. **Disable animations**: Set `animations: 'disabled'` in screenshot options
4. **Use consistent viewports**: Stick to defined viewport sizes
5. **Test interactive states**: Capture hover and active states separately

### Maintaining Tests

1. **Review diffs carefully**: Don't blindly update baselines
2. **Keep baselines in version control**: Commit baseline screenshots
3. **Update baselines together**: Update all affected pages at once
4. **Document intentional changes**: Note visual changes in PR descriptions

### Performance Tips

1. **Run specific tests**: Use `--grep` to run subset of tests
   ```bash
   npx playwright test --grep "homepage"
   ```

2. **Parallel execution**: Playwright runs tests in parallel by default
3. **Reuse dev server**: The script reuses existing dev server if running

## Troubleshooting

### Tests are flaky

- Increase wait times in `waitForPageStable()`
- Check for animations that aren't being disabled
- Ensure fonts are fully loaded before capturing

### Screenshots look different locally vs CI

- Check browser versions match
- Ensure consistent device scale factor (set to 1)
- Verify font rendering settings

### Dev server not starting

- Check if port 3000 is already in use
- Increase timeout in `playwright.config.ts`
- Start dev server manually before running tests

## Configuration

Visual regression settings are in `playwright.config.ts`:

```typescript
expect: {
  toHaveScreenshot: {
    maxDiffPixels: 100,      // Max pixel differences allowed
    threshold: 0.2,          // Color difference threshold (0-1)
    animations: 'disabled',  // Disable animations
  },
}
```

Adjust these values if tests are too strict or too lenient.

## Related Documentation

- [Playwright Visual Comparisons](https://playwright.dev/docs/test-snapshots)
- [Marketing Pages Design](../../.kiro/specs/site-restructure-multipage/design.md)
- [Requirements](../../.kiro/specs/site-restructure-multipage/requirements.md)
