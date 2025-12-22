# Dashboard Views Visual Regression Testing

This document explains how to run and review visual regression tests for the Dashboard Views Unification project.

## Overview

Visual regression tests capture screenshots of dashboard views and components to ensure visual consistency across the application. Any unintended visual changes will be flagged for review.

## Test Coverage

### Dashboard Views
- **Smart Messages View**
  - Empty state (no rules)
  - With highlights and rules
  - Highlight hover states
  
- **Fans View**
  - All segments and fans table
  - Segment card hover states
  - Table row hover states
  - Search and filters active
  
- **PPV Content View**
  - Metrics and content cards
  - Content card hover states
  - Tab navigation

### Components (Isolated)
- StatCard (default, positive delta, negative delta)
- InfoCard
- TagChip (all variants)
- EmptyState (default, CTA hover)

### Responsive Behavior
- Mobile (375px) - all views
- Tablet (768px) - Fans and PPV views
- Desktop (1280px) - all views

### Dark Mode
- All views in dark mode (if applicable)

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Run Visual Tests Locally

```bash
# Run all visual tests
npm run test:visual

# Run specific test file
npx playwright test tests/visual/dashboard-views.spec.ts

# Run in headed mode (see browser)
npx playwright test tests/visual/dashboard-views.spec.ts --headed

# Run specific test
npx playwright test tests/visual/dashboard-views.spec.ts -g "Smart Messages - empty state"

# Update snapshots (when intentional changes are made)
npx playwright test tests/visual/dashboard-views.spec.ts --update-snapshots
```

### Run with Percy (Recommended)

Percy provides a visual review workflow with baseline comparison and approval process.

```bash
# Set Percy token (get from percy.io dashboard)
export PERCY_TOKEN=your_token_here

# Run tests with Percy
npx percy exec -- playwright test tests/visual/dashboard-views.spec.ts
```

### Run with Chromatic (Alternative)

```bash
# Set Chromatic token
export CHROMATIC_PROJECT_TOKEN=your_token_here

# Run tests with Chromatic
npx chromatic --playwright
```

## Reviewing Visual Changes

### Percy Workflow

1. **Run tests** - Percy captures screenshots and compares with baseline
2. **Review in Percy dashboard** - https://percy.io/your-org/your-project
3. **Approve or reject changes**:
   - ✅ **Approve** - Intentional design changes
   - ❌ **Reject** - Unintended regressions
4. **New baseline** - Approved changes become the new baseline

### Local Workflow

1. **Run tests** - Playwright captures screenshots
2. **Review diffs** - Check `test-results/` folder for failed tests
3. **Update snapshots** - If changes are intentional:
   ```bash
   npx playwright test --update-snapshots
   ```

## Test Maintenance

### When to Update Snapshots

Update snapshots when you make **intentional** visual changes:

- Design system token updates
- Component styling changes
- Layout adjustments
- New features with visual impact

### When to Fix Code

Fix code when tests fail due to **unintended** changes:

- Broken CSS
- Missing styles
- Incorrect component rendering
- Regression bugs

### Adding New Tests

When adding new dashboard views or components:

1. Add test case to `tests/visual/dashboard-views.spec.ts`
2. Run test to generate baseline snapshot
3. Review snapshot to ensure it looks correct
4. Commit snapshot to repository

Example:

```typescript
test('New Component - default state', async ({ page }) => {
  await page.goto('/test-components/new-component');
  await page.waitForSelector('[data-testid="new-component"]');
  await expect(page).toHaveScreenshot('component-new-component.png');
});
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Visual Regression Tests

on: [push, pull_request]

jobs:
  visual-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run visual tests with Percy
        run: npx percy exec -- playwright test tests/visual/
        env:
          PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}
```

### Pull Request Checks

Visual tests run automatically on pull requests:

1. **Percy check** - Shows visual diffs in PR
2. **Review required** - PR cannot merge until visual changes are approved
3. **Auto-approve** - Minor changes can be auto-approved with rules

## Troubleshooting

### Tests Failing Locally

**Issue**: Tests pass in CI but fail locally

**Solution**: Ensure consistent environment
```bash
# Use same viewport size
# Use same browser version
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npx playwright install
```

### Flaky Tests

**Issue**: Tests sometimes pass, sometimes fail

**Solution**: Add wait conditions
```typescript
// Wait for animations to complete
await page.waitForTimeout(500);

// Wait for specific element state
await page.waitForSelector('[data-testid="card"]', { state: 'visible' });

// Wait for network idle
await page.waitForLoadState('networkidle');
```

### Large Diffs

**Issue**: Small code change causes large visual diff

**Solution**: Check for:
- Font loading issues (use `font-display: swap`)
- Image loading issues (use placeholders)
- Animation timing (disable animations in tests)
- Dynamic content (use fixed test data)

## Best Practices

### 1. Use Test IDs

Always use `data-testid` attributes for reliable selectors:

```tsx
<div data-testid="stat-card">
  <span data-testid="stat-card-label">Revenue</span>
  <span data-testid="stat-card-value">$4,196</span>
</div>
```

### 2. Wait for Content

Always wait for content to load before capturing:

```typescript
await page.waitForSelector('[data-testid="content"]');
await page.waitForLoadState('networkidle');
```

### 3. Mock Dynamic Data

Use consistent test data to avoid flaky tests:

```typescript
await page.route('**/api/fans', async (route) => {
  await route.fulfill({
    status: 200,
    body: JSON.stringify(mockFansData)
  });
});
```

### 4. Test Hover States

Capture hover states for interactive elements:

```typescript
const button = page.locator('[data-testid="button"]');
await button.hover();
await expect(page).toHaveScreenshot('button-hover.png');
```

### 5. Test Responsive Layouts

Test at multiple viewport sizes:

```typescript
await page.setViewportSize({ width: 375, height: 667 }); // Mobile
await page.setViewportSize({ width: 768, height: 1024 }); // Tablet
await page.setViewportSize({ width: 1280, height: 720 }); // Desktop
```

## Resources

- [Playwright Visual Comparisons](https://playwright.dev/docs/test-snapshots)
- [Percy Documentation](https://docs.percy.io/)
- [Chromatic Documentation](https://www.chromatic.com/docs/)
- [Visual Regression Testing Best Practices](https://www.browserstack.com/guide/visual-regression-testing)

## Support

For questions or issues:
- Check existing test failures in CI
- Review Percy/Chromatic dashboard
- Ask in #frontend-testing Slack channel
- Create issue in GitHub repository
