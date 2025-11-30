# Dashboard Background Uniformity Guide

## Overview

This guide explains how to use the dashboard background uniformity tools to ensure all dashboard pages use the standardized `--bg-primary` token (zinc-950).

## Quick Start

### Run the Property Test
```bash
npm test -- tests/unit/properties/dashboard-background-uniformity.property.test.ts --run
```

### Run the Violation Checker
```bash
npx tsx scripts/check-dashboard-background-violations.ts
```

## Understanding the Results

### Current State (as of Task 19 completion)
- **Total pages**: 64 dashboard pages
- **Compliance rate**: 31.3%
- **Total violations**: 461
- **Pages with violations**: 44

### Violation Types
1. **bg-gray-* classes** (281 occurrences) - Most common
2. **bg-white classes** (179 occurrences) - Second most common
3. **bg-neutral-* classes** (1 occurrence) - Rare

## Migration Priority

### 🔴 High Priority (User-facing, frequently accessed)
Start here for maximum impact:
- `/onlyfans/*` pages (ppv, settings, messages, fans)
- `/marketing/*` pages (campaigns, social, calendar)
- `/analytics/*` pages (churn, pricing, upsells, payouts)

**Top files to fix first:**
1. `app/(app)/onlyfans/ppv/page.tsx` - 46 violations
2. `app/(app)/onlyfans/settings/welcome/page.tsx` - 40 violations
3. `app/(app)/onlyfans/messages/mass/page.tsx` - 30 violations
4. `app/(app)/marketing/page.tsx` - 29 violations
5. `app/(app)/marketing/campaigns/new/page.tsx` - 27 violations

### 🟡 Medium Priority (Admin/configuration)
- `/configure/page.tsx` - 6 violations
- `/billing/page.tsx` - 6 violations
- `/automations/page.tsx` - 2 violations

### ⚪ Low Priority (Specialized features)
- `/diagnostics/page.tsx`
- `/chatbot/page.tsx`
- `/performance/page.tsx`
- Other specialized pages

## How to Fix Violations

### Pattern 1: Replace bg-white
```tsx
// ❌ BEFORE
<div className="bg-white dark:bg-gray-800">
  Content
</div>

// ✅ AFTER
<div className="bg-zinc-950">
  Content
</div>
```

### Pattern 2: Replace bg-gray-*
```tsx
// ❌ BEFORE
<div className="bg-gray-50 dark:bg-gray-900">
  Content
</div>

// ✅ AFTER
<div className="bg-zinc-950">
  Content
</div>
```

### Pattern 3: Replace inline styles
```tsx
// ❌ BEFORE
<div style={{ background: '#09090b' }}>
  Content
</div>

// ✅ AFTER
<div style={{ background: 'var(--bg-primary)' }}>
  Content
</div>
```

### Pattern 4: Glass effects
```tsx
// ❌ BEFORE
<div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800">
  Content
</div>

// ✅ AFTER - Use design token
<div className="glass-card">
  Content
</div>

// OR use the token directly
<div style={{ 
  background: 'var(--bg-glass)',
  backdropFilter: 'var(--blur-xl)'
}}>
  Content
</div>
```

## Workflow

### 1. Identify Violations
```bash
# Run the checker to see all violations
npx tsx scripts/check-dashboard-background-violations.ts
```

### 2. Fix a File
Choose a high-priority file and replace violations:
- Replace `bg-white` with `bg-zinc-950`
- Replace `bg-gray-*` with `bg-zinc-950`
- Replace inline hex colors with `var(--bg-primary)`

### 3. Verify Fix
```bash
# Run the property test
npm test -- tests/unit/properties/dashboard-background-uniformity.property.test.ts --run
```

### 4. Check Progress
```bash
# Run the checker again to see updated compliance rate
npx tsx scripts/check-dashboard-background-violations.ts
```

## Design Token Reference

### Available Background Tokens
```css
/* Primary backgrounds */
--bg-primary: #09090b;      /* zinc-950 - Main dashboard background */
--bg-secondary: #18181b;    /* zinc-900 - Secondary surfaces */
--bg-tertiary: #27272a;     /* zinc-800 - Tertiary surfaces */

/* Glass effects */
--bg-glass: rgba(255, 255, 255, 0.05);
--bg-glass-hover: rgba(255, 255, 255, 0.08);

/* Surface backgrounds */
--bg-surface: #ffffff;      /* Light mode surfaces */
```

### When to Use Each Token

- **--bg-primary**: Main page backgrounds, full-screen containers
- **--bg-secondary**: Cards, panels, elevated surfaces
- **--bg-tertiary**: Nested components, hover states
- **--bg-glass**: Overlay effects, modals, floating elements
- **--bg-surface**: Light mode compatibility (use with dark mode variants)

## Testing Strategy

### Property-Based Test
The property test (`dashboard-background-uniformity.property.test.ts`) runs automatically and:
- Scans all dashboard pages
- Identifies violations with line numbers
- Calculates compliance rate
- Fails if compliance < 80%

### Manual Verification
After fixing violations:
1. Visual inspection in browser
2. Check dark mode compatibility
3. Verify glass effects work correctly
4. Test responsive behavior

## Success Criteria

### Target Compliance: 80%+
- Currently at 31.3%
- Need to fix ~31 more pages to reach 80%
- Focus on high-priority pages first

### Zero Violations Goal
Ultimate goal is 100% compliance:
- All pages use `--bg-primary` or `bg-zinc-950`
- No hardcoded colors
- Consistent visual appearance

## Troubleshooting

### Test Fails After Fix
If the test still fails after fixing a file:
1. Check for dark mode variants (`dark:bg-*`)
2. Look for inline styles with hardcoded colors
3. Search for nested components with violations
4. Verify imports aren't bringing in old styles

### Visual Regression
If fixing backgrounds breaks the design:
1. Check if the component needs `--bg-secondary` instead
2. Verify z-index and layering
3. Test glass effects separately
4. Review border colors (should use `--border-subtle`)

### Performance Impact
Background changes should have minimal performance impact:
- CSS variables are efficient
- No additional DOM nodes
- Tailwind classes are optimized
- Glass effects use GPU acceleration

## Related Documentation

- [Design Tokens](../../styles/design-tokens.css) - All available tokens
- [Task 19 Complete](./TASK-19-COMPLETE.md) - Detailed results
- [Property Test](../../tests/unit/properties/dashboard-background-uniformity.property.test.ts) - Test implementation
- [Violation Checker](../../scripts/check-dashboard-background-violations.ts) - Analysis script

## Questions?

If you encounter issues or have questions:
1. Check the violation report: `.kiro/specs/design-system-unification/background-violations-report.json`
2. Review the property test output for specific line numbers
3. Compare with already-migrated pages (20 pages are compliant)
4. Refer to the design system documentation

---

**Last Updated**: Task 19 completion  
**Compliance Rate**: 31.3%  
**Next Target**: 50% (fix 12 more high-priority pages)
