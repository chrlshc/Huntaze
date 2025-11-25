# Visual Regression Testing Guide

## Overview

Visual regression testing automatically detects unintended visual changes in the marketing pages by comparing screenshots against baseline images. This ensures that UI changes are intentional and reviewed.

## Why Visual Regression Testing?

- **Catch unintended changes**: Detect CSS bugs, layout shifts, and styling regressions
- **Verify interactive states**: Ensure hover and active states work correctly (Requirements 1.2, 1.4)
- **Cross-viewport consistency**: Test desktop, mobile, and tablet layouts
- **Dark mode validation**: Verify dark mode styling
- **Component consistency**: Ensure headers and footers are consistent across pages

## Quick Start

### 1. Run Tests Locally

```bash
# Start dev server (in one terminal)
npm run dev

# Run visual regression tests (in another terminal)
npm run test:visual
```

### 2. Review Results

If tests fail, open the HTML report:

```bash
npm run test:visual:report
```

Or use the comparison tool:

```bash
./scripts/compare-visual-diffs.sh
```

### 3. Update Baselines (if changes are intentional)

```bash
npm run test:visual:update
```

Then commit the updated screenshots:

```bash
git add tests/e2e/visual-regression.spec.ts-snapshots/
git commit -m "Update visual regression baselines"
```

## Test Coverage

### Pages
- Homepage (`/`)
- Features (`/features`)
- Pricing (`/pricing`)
- About (`/about`)
- Case Studies (`/case-studies`)

### Viewports
- Desktop: 1280x720
- Mobile: 375x667
- Tablet: 768x1024

### States Tested
- Default page state
- Navigation hover states
- Active navigation indicators
- CTA button hover states
- Feature card hover states
- Pricing card hover states
- Mobile navigation drawer (open/closed)
- Dark mode

## Common Workflows

### Making UI Changes

1. **Before making changes**: Run tests to establish baseline
   ```bash
   npm run test:visual
   ```

2. **Make your changes**: Update components, styles, etc.

3. **Run tests again**: Check for visual differences
   ```bash
   npm run test:visual
   ```

4. **Review differences**: 
   ```bash
   npm run test:visual:report
   ```

5. **Update baselines if intentional**:
   ```bash
   npm run test:visual:update
   ```

6. **Commit changes with updated baselines**:
   ```bash
   git add .
   git commit -m "feat: update button styling"
   ```

### Debugging Test Failures

#### Option 1: Use UI Mode (Recommended)

```bash
npm run test:visual:ui
```

This opens an interactive UI where you can:
- See tests running in real-time
- Inspect elements
- View screenshots side-by-side
- Debug step-by-step

#### Option 2: Use Headed Mode

```bash
npm run test:visual:headed
```

This runs tests in a visible browser window.

#### Option 3: Review HTML Report

```bash
npm run test:visual:report
```

This shows:
- Side-by-side comparison of expected vs actual
- Highlighted differences
- Test execution timeline

### Handling Flaky Tests

If tests are inconsistent:

1. **Check for animations**: Ensure animations are disabled
2. **Verify font loading**: Fonts should be fully loaded before screenshots
3. **Look for dynamic content**: Hide timestamps and changing data
4. **Increase wait times**: Adjust `waitForPageStable()` if needed

## CI/CD Integration

### Automatic Testing

Visual regression tests run automatically on:
- Pull requests that modify marketing pages, components, or styles
- Pushes to the main branch

### Reviewing CI Failures

1. **Check the GitHub Actions run**: Click on the failed check
2. **Download artifacts**: Get the `playwright-report` artifact
3. **Extract and open**: Open `index.html` in the report
4. **Review differences**: Decide if changes are intentional

### Updating Baselines in CI

If changes are intentional:

1. **Run locally**: `npm run test:visual:update`
2. **Commit baselines**: `git add tests/e2e/visual-regression.spec.ts-snapshots/`
3. **Push changes**: The next CI run will pass

## Best Practices

### DO ✅

- **Review diffs carefully**: Don't blindly update baselines
- **Test locally first**: Run tests before pushing
- **Update all affected pages**: If you change shared components
- **Document intentional changes**: Note visual changes in PR descriptions
- **Commit baselines**: Keep screenshots in version control
- **Test interactive states**: Verify hover and active states

### DON'T ❌

- **Don't ignore failures**: Investigate all visual differences
- **Don't update baselines without review**: Always check what changed
- **Don't test dynamic content**: Hide timestamps and random data
- **Don't rely solely on visual tests**: Use unit and integration tests too
- **Don't make baselines too strict**: Allow for minor rendering differences

## Configuration

### Playwright Config

Located in `playwright.config.ts`:

```typescript
expect: {
  toHaveScreenshot: {
    maxDiffPixels: 100,      // Max pixel differences allowed
    threshold: 0.2,          // Color difference threshold (0-1)
    animations: 'disabled',  // Disable animations
  },
}
```

### Adjusting Thresholds

If tests are too strict or too lenient:

- **Increase `maxDiffPixels`**: Allow more pixel differences
- **Increase `threshold`**: Allow more color variation
- **Decrease values**: Make tests stricter

## Troubleshooting

### "Dev server not detected"

**Solution**: Start the dev server first:
```bash
npm run dev
```

### "Screenshots don't match but look identical"

**Possible causes**:
- Font rendering differences
- Browser version mismatch
- Device scale factor differences

**Solution**: 
- Ensure consistent browser versions
- Check `deviceScaleFactor` in config (should be 1)
- Update baselines if differences are negligible

### "Tests timeout"

**Solution**:
- Increase timeout in `playwright.config.ts`
- Check if dev server is responding
- Verify network connectivity

### "Mobile navigation tests fail"

**Solution**:
- Check hamburger menu selector in test
- Verify mobile viewport is correct
- Ensure drawer animation completes before screenshot

## Advanced Usage

### Testing Specific Pages

```bash
npx playwright test tests/e2e/visual-regression.spec.ts --grep "homepage"
```

### Testing Specific Viewports

```bash
npx playwright test tests/e2e/visual-regression.spec.ts --project=chromium
```

### Debugging Specific Test

```bash
npx playwright test tests/e2e/visual-regression.spec.ts --grep "homepage - desktop viewport" --debug
```

### Updating Specific Baselines

```bash
npx playwright test tests/e2e/visual-regression.spec.ts --grep "homepage" --update-snapshots
```

## Performance Tips

1. **Run in parallel**: Playwright runs tests in parallel by default
2. **Use `--grep`**: Test only what you changed
3. **Reuse dev server**: Don't restart between test runs
4. **Use headed mode sparingly**: Headless is faster

## Related Documentation

- [Playwright Visual Comparisons](https://playwright.dev/docs/test-snapshots)
- [Test README](../tests/e2e/README.md)
- [Marketing Pages Design](../.kiro/specs/site-restructure-multipage/design.md)
- [Requirements](../.kiro/specs/site-restructure-multipage/requirements.md)

## Support

If you encounter issues:

1. Check this guide first
2. Review the [test README](../tests/e2e/README.md)
3. Check Playwright documentation
4. Ask the team in #engineering

## Maintenance

### Regular Tasks

- **Review baselines monthly**: Ensure they're still accurate
- **Update Playwright**: Keep browser versions current
- **Clean up old screenshots**: Remove unused baselines
- **Monitor CI performance**: Optimize if tests are slow

### When to Update This Guide

- New pages are added
- New viewports are tested
- Configuration changes
- New best practices emerge
