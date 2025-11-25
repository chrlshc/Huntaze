# Visual Regression Testing - Quick Reference

## Common Commands

```bash
# Run all visual regression tests
npm run test:visual

# Update baselines (after intentional changes)
npm run test:visual:update

# Open interactive UI mode
npm run test:visual:ui

# Run in headed mode (see browser)
npm run test:visual:headed

# View test report
npm run test:visual:report

# Compare diffs
./scripts/compare-visual-diffs.sh
```

## Quick Workflow

### 1. Making UI Changes

```bash
# Before changes
npm run test:visual

# Make your changes...

# After changes
npm run test:visual

# Review differences
npm run test:visual:report

# If intentional, update baselines
npm run test:visual:update

# Commit
git add tests/e2e/visual-regression.spec.ts-snapshots/
git commit -m "Update visual baselines"
```

### 2. Debugging Failures

```bash
# Option 1: Interactive UI (best for debugging)
npm run test:visual:ui

# Option 2: View report
npm run test:visual:report

# Option 3: Compare diffs
./scripts/compare-visual-diffs.sh
```

### 3. Testing Specific Pages

```bash
# Test only homepage
npx playwright test tests/e2e/visual-regression.spec.ts --grep "homepage"

# Test only mobile
npx playwright test tests/e2e/visual-regression.spec.ts --grep "mobile"

# Test only hover states
npx playwright test tests/e2e/visual-regression.spec.ts --grep "hover"
```

## What Gets Tested

✅ All marketing pages (/, /features, /pricing, /about, /case-studies)
✅ Desktop, mobile, and tablet viewports
✅ Navigation hover and active states
✅ CTA button hover states
✅ Feature and pricing card hover states
✅ Mobile navigation drawer
✅ Dark mode
✅ Footer consistency

## When Tests Fail

1. **Review the diff**: `npm run test:visual:report`
2. **Determine if intentional**:
   - YES → Update baselines: `npm run test:visual:update`
   - NO → Fix the code and re-run: `npm run test:visual`
3. **Commit baselines** if updated

## Common Issues

| Issue | Solution |
|-------|----------|
| Dev server not running | `npm run dev` first |
| Tests timeout | Increase timeout in `playwright.config.ts` |
| Flaky tests | Check animations, fonts, dynamic content |
| Screenshots look different | Ensure consistent browser versions |

## File Locations

- **Tests**: `tests/e2e/visual-regression.spec.ts`
- **Config**: `playwright.config.ts`
- **Baselines**: `tests/e2e/visual-regression.spec.ts-snapshots/`
- **Reports**: `playwright-report/`
- **Diffs**: `test-results/`

## Need Help?

📖 Full guide: `docs/VISUAL_REGRESSION_TESTING.md`
📖 Test README: `tests/e2e/README.md`
🔗 Playwright docs: https://playwright.dev/docs/test-snapshots
