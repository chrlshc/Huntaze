# Design System Pre-commit Hook

## Overview

The design system pre-commit hook (`pre-commit-design-system`) automatically checks for common design system violations before each commit, helping catch issues early in the development process.

## What It Checks

The hook performs quick checks for:

1. **Font Token Violations**
   - Hardcoded `font-family: Inter`
   - Hardcoded `fontFamily: "Inter"`

2. **Typography Token Violations**
   - Hardcoded `font-size: 16px`
   - Hardcoded `fontSize: "16px"`

3. **Tailwind Arbitrary Classes**
   - `text-[14px]` instead of `text-sm`
   - `text-[16px]` instead of `text-base`

4. **Component Usage**
   - Raw `<button>` elements without Button component import

## Installation

The hook is already created but not automatically enabled. To enable it:

### Option 1: Manual Activation (Recommended for Testing)

```bash
# Run the hook manually before committing
.husky/pre-commit-design-system
```

### Option 2: Integrate with Existing Pre-commit

Add to your existing `.husky/pre-commit` file:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run design system checks
.husky/pre-commit-design-system

# ... other pre-commit checks
```

### Option 3: Make it the Default Pre-commit

```bash
# Backup existing pre-commit if it exists
mv .husky/pre-commit .husky/pre-commit.backup 2>/dev/null

# Use design system hook as pre-commit
cp .husky/pre-commit-design-system .husky/pre-commit
chmod +x .husky/pre-commit
```

## Usage

Once enabled, the hook runs automatically on `git commit`:

```bash
git add .
git commit -m "feat: add new feature"

# Output:
# 🎨 Checking for design system violations...
#   Checking font tokens...
#   Checking typography tokens...
#   Checking Tailwind classes...
#   Checking component usage...
# ✅ No design system violations detected
```

### If Violations Are Found

```bash
git commit -m "feat: add new feature"

# Output:
# 🎨 Checking for design system violations...
#   Checking font tokens...
#     ⚠️  Font violation in: components/MyComponent.tsx
#   Checking typography tokens...
#     ⚠️  Typography violation in: styles/custom.css
# 
# ❌ Design system violations found!
# 
# To fix automatically:
#   npx tsx scripts/auto-migrate-violations.ts --dry-run
# 
# To see detailed violations:
#   npx tsx scripts/check-font-token-violations.ts
#   npx tsx scripts/check-color-palette-violations.ts
# 
# To bypass this check (not recommended):
#   git commit --no-verify
```

## Fixing Violations

### Automatic Fix

```bash
# Preview fixes
npx tsx scripts/auto-migrate-violations.ts --dry-run

# Apply fixes
npx tsx scripts/auto-migrate-violations.ts --type=fonts
npx tsx scripts/auto-migrate-violations.ts --type=typography

# Then commit again
git add .
git commit -m "fix: apply design system tokens"
```

### Manual Fix

See the [Common Violations Guide](../.kiro/specs/design-system-violations-fix/TASK-12-COMPLETE.md) for detailed fix instructions.

## Bypassing the Hook

**Not recommended**, but if you need to commit despite violations:

```bash
git commit --no-verify -m "WIP: work in progress"
```

**Note**: Violations will still be caught by property-based tests in CI/CD.

## Performance

The hook is designed to be fast:
- Only checks staged files (not entire codebase)
- Uses simple grep patterns (no heavy parsing)
- Typically completes in < 1 second

## Limitations

The pre-commit hook performs **quick checks only**:
- May have false positives (e.g., comments containing patterns)
- May miss complex violations
- Does not check color palette violations (too slow for pre-commit)

For comprehensive checking, run the full detection scripts:

```bash
npx tsx scripts/check-font-token-violations.ts
npx tsx scripts/check-color-palette-violations.ts
npx tsx scripts/check-button-component-violations.ts
```

## Disabling the Hook

### Temporarily

```bash
# Skip for one commit
git commit --no-verify

# Or set environment variable
HUSKY=0 git commit
```

### Permanently

```bash
# Remove or rename the hook
mv .husky/pre-commit-design-system .husky/pre-commit-design-system.disabled
```

## Troubleshooting

### Hook Not Running

```bash
# Ensure hook is executable
chmod +x .husky/pre-commit-design-system

# Check if Husky is installed
npm install husky --save-dev
npx husky install
```

### False Positives

If the hook reports violations in comments or strings:

```bash
# Bypass for this commit
git commit --no-verify

# Or fix the pattern in the hook file
# Edit .husky/pre-commit-design-system
```

### Hook Too Slow

The hook should be fast, but if it's slow:

```bash
# Check which files are being scanned
git diff --cached --name-only --diff-filter=ACM

# Consider excluding large generated files
# Edit .husky/pre-commit-design-system to add exclusions
```

## Related Documentation

- [Common Violations Guide](../.kiro/specs/design-system-violations-fix/TASK-12-COMPLETE.md)
- [Automated Migration Script](../scripts/auto-migrate-violations.ts)
- [Design System Documentation](../docs/design-system/README.md)
- [Migration Guide](../docs/design-system/migration-guide.md)
