# Maintenance Guidelines

This document establishes guidelines and automated checks to maintain codebase health and prevent regression of cleanup efforts.

## Pre-commit Hooks

### Prevent Backup Files

Add to `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Prevent backup files from being committed
BACKUP_FILES=$(git diff --cached --name-only | grep -E '\.(backup|bak|old)$|-(backup|old)\.')

if [ -n "$BACKUP_FILES" ]; then
  echo "❌ Error: Backup files detected in commit:"
  echo "$BACKUP_FILES"
  echo ""
  echo "Please remove backup files before committing."
  echo "Use proper version control instead of backup files."
  exit 1
fi

# Prevent duplicate CSS files
MOBILE_CSS_COUNT=$(git diff --cached --name-only | grep -E 'mobile.*\.css$' | wc -l)

if [ "$MOBILE_CSS_COUNT" -gt 1 ]; then
  echo "❌ Error: Multiple mobile CSS files detected"
  echo "Mobile styles should be consolidated in app/mobile.css"
  exit 1
fi

echo "✅ Pre-commit checks passed"
```

### Setup Instructions

```bash
# Install husky
npm install --save-dev husky

# Initialize husky
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run pre-commit"
```

Add to `package.json`:

```json
{
  "scripts": {
    "pre-commit": "npm run lint-staged && npm run check-backup-files",
    "check-backup-files": "! git diff --cached --name-only | grep -E '\\.(backup|bak|old)$'",
    "check-css-duplication": "node scripts/check-css-duplication.js"
  }
}
```

## CI/CD Checks

### GitHub Actions Workflow

Create `.github/workflows/codebase-health.yml`:

```yaml
name: Codebase Health Checks

on:
  pull_request:
    branches: [main, production-ready]
  push:
    branches: [main]

jobs:
  health-check:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Check for backup files
        run: |
          BACKUP_FILES=$(find . -type f \( -name "*.backup" -o -name "*.bak" -o -name "*.old" -o -name "*-backup.*" -o -name "*-old.*" \) | grep -v node_modules | grep -v .next | grep -v .git)
          if [ -n "$BACKUP_FILES" ]; then
            echo "❌ Backup files found:"
            echo "$BACKUP_FILES"
            exit 1
          fi
          echo "✅ No backup files found"
      
      - name: Check CSS duplication
        run: npm run check-css-duplication
      
      - name: Validate spec documentation limits
        run: |
          for spec_dir in .kiro/specs/*/; do
            FILE_COUNT=$(find "$spec_dir" -maxdepth 1 -type f | wc -l)
            if [ "$FILE_COUNT" -gt 10 ]; then
              echo "❌ Too many files in $spec_dir: $FILE_COUNT (max 10)"
              exit 1
            fi
          done
          echo "✅ All spec directories within limits"
      
      - name: Validate environment documentation
        run: |
          if [ ! -f "ENV-GUIDE.md" ]; then
            echo "❌ ENV-GUIDE.md is missing"
            exit 1
          fi
          if [ ! -f "CONFIG-GUIDE.md" ]; then
            echo "❌ CONFIG-GUIDE.md is missing"
            exit 1
          fi
          echo "✅ Documentation guides present"
      
      - name: Check for duplicate deployment guides
        run: |
          DEPLOYMENT_GUIDES=$(find . -maxdepth 1 -type f -name "*DEPLOY*.md" | grep -v node_modules | wc -l)
          if [ "$DEPLOYMENT_GUIDES" -gt 3 ]; then
            echo "❌ Too many deployment guides: $DEPLOYMENT_GUIDES"
            echo "Consolidate deployment documentation"
            exit 1
          fi
          echo "✅ Deployment documentation consolidated"
```

### CSS Duplication Check Script

Create `scripts/check-css-duplication.js`:

```javascript
#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function checkCssDuplication() {
  const cssFiles = [
    'app/globals.css',
    'app/mobile.css',
    'app/animations.css',
    'app/glass.css',
    'styles/design-tokens.css'
  ];
  
  const properties = new Map();
  let duplicates = 0;
  
  cssFiles.forEach(file => {
    if (!fs.existsSync(file)) return;
    
    const content = fs.readFileSync(file, 'utf-8');
    const propertyRegex = /([a-z-]+):\s*([^;]+);/g;
    let match;
    
    while ((match = propertyRegex.exec(content)) !== null) {
      const [, prop, value] = match;
      const key = `${prop}:${value.trim()}`;
      
      if (properties.has(key)) {
        properties.get(key).push(file);
        duplicates++;
      } else {
        properties.set(key, [file]);
      }
    }
  });
  
  if (duplicates > 5) {
    console.error(`❌ Found ${duplicates} duplicate CSS properties`);
    console.error('Run CSS consolidation to reduce duplication');
    process.exit(1);
  }
  
  console.log(`✅ CSS duplication within acceptable limits (${duplicates} duplicates)`);
}

checkCssDuplication();
```

## Quarterly Audit Schedule

### Audit Checklist

Run every 3 months (schedule in calendar):

#### 1. File Organization Audit

```bash
# Check for backup files
find . -type f \( -name "*.backup" -o -name "*.bak" -o -name "*.old" \) | grep -v node_modules

# Check for duplicate components
find components/ -type f -name "*.tsx" | sort | uniq -d

# Check spec documentation limits
for dir in .kiro/specs/*/; do
  echo "$dir: $(find "$dir" -maxdepth 1 -type f | wc -l) files"
done
```

#### 2. CSS Health Check

```bash
# Run CSS duplication check
npm run check-css-duplication

# Check for inline styles that should use Tailwind
grep -r "style={{" app/ components/ | wc -l

# Verify design tokens are being used
grep -r "var(--" app/ components/ | wc -l
```

#### 3. Documentation Review

```bash
# Check for outdated documentation
find docs/ -type f -mtime +180  # Files not modified in 6 months

# Verify all specs have FINAL-REPORT.md
for dir in .kiro/specs/*/; do
  if [ ! -f "$dir/FINAL-REPORT.md" ]; then
    echo "Missing FINAL-REPORT.md in $dir"
  fi
done

# Check ENV-GUIDE.md is up to date
ENV_COUNT=$(find . -maxdepth 1 -name ".env*" | wc -l)
DOCUMENTED_COUNT=$(grep -c "^###" ENV-GUIDE.md)
echo "Environment files: $ENV_COUNT, Documented: $DOCUMENTED_COUNT"
```

#### 4. Configuration Audit

```bash
# Verify all configs are documented
for config in tsconfig*.json vitest.config*.ts; do
  if ! grep -q "$config" CONFIG-GUIDE.md; then
    echo "⚠️  $config not documented in CONFIG-GUIDE.md"
  fi
done

# Check for unused configs
find . -maxdepth 1 -name "*.config.*" -type f
```

#### 5. Bundle Size Check

```bash
# Build and check bundle size
npm run build
npm run analyze-bundle

# Compare with previous quarter
# Target: Keep bundle size under 500KB for main chunk
```

### Audit Report Template

Create `AUDIT-REPORT-YYYY-QQ.md`:

```markdown
# Quarterly Codebase Health Audit - Q[X] [YEAR]

**Audit Date**: [DATE]
**Auditor**: [NAME]

## File Organization
- [ ] No backup files found
- [ ] No duplicate components
- [ ] All spec directories within limits (≤10 files)

## CSS Health
- [ ] CSS duplication within limits (≤5 duplicates)
- [ ] Inline styles minimized
- [ ] Design tokens being used

## Documentation
- [ ] All documentation up to date
- [ ] All specs have FINAL-REPORT.md
- [ ] ENV-GUIDE.md reflects current .env files
- [ ] CONFIG-GUIDE.md reflects current configs

## Configuration
- [ ] All configs documented
- [ ] No unused configs
- [ ] TypeScript configs optimized

## Bundle Size
- [ ] Main bundle: [SIZE] KB (target: <500KB)
- [ ] Total bundle: [SIZE] MB (target: <2MB)
- [ ] Change from last quarter: [+/-X%]

## Action Items
1. [Action item 1]
2. [Action item 2]

## Next Audit
**Scheduled**: [DATE + 3 months]
```

## Automated Monitoring

### Bundle Size Monitoring

Add to `package.json`:

```json
{
  "scripts": {
    "analyze-bundle": "ANALYZE=true npm run build",
    "check-bundle-size": "node scripts/check-bundle-size.js"
  }
}
```

Create `scripts/check-bundle-size.js`:

```javascript
#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const MAX_MAIN_BUNDLE_SIZE = 500 * 1024; // 500KB
const MAX_TOTAL_SIZE = 2 * 1024 * 1024; // 2MB

function checkBundleSize() {
  const buildDir = '.next/static/chunks';
  
  if (!fs.existsSync(buildDir)) {
    console.error('❌ Build directory not found. Run npm run build first.');
    process.exit(1);
  }
  
  let totalSize = 0;
  let mainBundleSize = 0;
  
  const files = fs.readdirSync(buildDir);
  files.forEach(file => {
    const filePath = path.join(buildDir, file);
    const stats = fs.statSync(filePath);
    totalSize += stats.size;
    
    if (file.includes('main')) {
      mainBundleSize += stats.size;
    }
  });
  
  console.log(`Main bundle size: ${(mainBundleSize / 1024).toFixed(2)} KB`);
  console.log(`Total bundle size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  
  if (mainBundleSize > MAX_MAIN_BUNDLE_SIZE) {
    console.error(`❌ Main bundle exceeds limit: ${(mainBundleSize / 1024).toFixed(2)} KB > ${MAX_MAIN_BUNDLE_SIZE / 1024} KB`);
    process.exit(1);
  }
  
  if (totalSize > MAX_TOTAL_SIZE) {
    console.error(`❌ Total bundle exceeds limit: ${(totalSize / 1024 / 1024).toFixed(2)} MB > ${MAX_TOTAL_SIZE / 1024 / 1024} MB`);
    process.exit(1);
  }
  
  console.log('✅ Bundle size within limits');
}

checkBundleSize();
```

## Best Practices

### When Adding New Files

1. **No backup files**: Use git for version control
2. **Follow naming conventions**: 
   - Components: PascalCase.tsx
   - Utilities: camelCase.ts
   - Styles: kebab-case.css
3. **Update documentation**: Add to relevant guide (ENV-GUIDE.md, CONFIG-GUIDE.md)
4. **Consider consolidation**: Can this be merged with existing files?

### When Adding CSS

1. **Check design tokens first**: Use existing CSS custom properties
2. **Prefer Tailwind**: Use utility classes over custom CSS
3. **Document custom properties**: Add to styles/design-tokens.css with comments
4. **Avoid duplication**: Search for similar styles before creating new ones

### When Adding Documentation

1. **Check spec limits**: Max 10 files per spec directory
2. **Use FINAL-REPORT.md**: Consolidate completion reports
3. **Archive old files**: Move to archive/ subdirectory
4. **Update guides**: Keep ENV-GUIDE.md and CONFIG-GUIDE.md current

### When Adding Configuration

1. **Document immediately**: Add to CONFIG-GUIDE.md
2. **Follow naming conventions**: 
   - TypeScript: tsconfig.[purpose].json
   - Vitest: vitest.config.[type].ts
3. **Avoid duplication**: Extend existing configs when possible

## Troubleshooting

### Build Fails After Changes

```bash
# Check for missing CSS imports
npm run build 2>&1 | grep "Can't resolve"

# Verify all imports are correct
npm run type-check

# Check for circular dependencies
npm run build -- --debug
```

### Tests Fail After Cleanup

```bash
# Run specific test suite
npm run test -- [test-file]

# Check for broken imports in tests
npm run type-check

# Verify test configs are correct
cat vitest.config.ts
```

### Documentation Out of Sync

```bash
# Regenerate cleanup metrics
npx tsx scripts/generate-cleanup-metrics.ts

# Update guides
# - ENV-GUIDE.md: Document new .env variables
# - CONFIG-GUIDE.md: Document new config files
# - README.md: Update project structure if needed
```

## Contact

For questions about maintenance guidelines:
- Review [CLEANUP-REPORT.md](CLEANUP-REPORT.md) for cleanup metrics
- Check [CONFIG-GUIDE.md](CONFIG-GUIDE.md) for configuration details
- See [ENV-GUIDE.md](ENV-GUIDE.md) for environment setup

---

**Last Updated**: 2025-11-27
**Next Review**: 2026-02-27 (3 months)
