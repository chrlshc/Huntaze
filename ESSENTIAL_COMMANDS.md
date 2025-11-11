# Essential Commands - Quick Reference

## 🚀 Most Used Commands

### Type Tests
```bash
# Run type validation tests
npm test -- tests/unit/smart-onboarding/types-validation.test.ts --run

# Validate type consistency
node scripts/validate-type-consistency.js

# Build (validates types)
npm run build
```

### Smoke Tests
```bash
# Automated (recommended)
./scripts/run-smoke-tests.sh

# Manual
npm run dev &
npx wait-on http://localhost:3000
npm run e2e:smoke
```

### Commit Changes
```bash
# Automated (all commits)
./GIT_COMMIT_COMMANDS.sh

# Manual (types only)
git add TYPE_COVERAGE_REPORT.md lib/smart-onboarding/TYPE_CONVENTIONS.md SMART_ONBOARDING_TYPE*.md scripts/validate-type-consistency.js tests/unit/smart-onboarding/
git commit -F SMART_ONBOARDING_TYPES_FINAL_COMMIT.txt

# Manual (smoke tests only)
git add SMOKE_TESTS_*.md scripts/run-smoke-tests.sh
git commit -F SMOKE_TESTS_COMMIT.txt
```

---

## 📚 Documentation

### Quick Start
```bash
# Read this first
cat START_HERE_SESSION_SUMMARY.md

# Daily reference
cat SMART_ONBOARDING_TYPES_QUICK_REF.md

# Smoke tests guide
cat SMOKE_TESTS_GUIDE.md
```

### Complete Documentation
```bash
# Full session summary
cat SESSION_COMPLETE_TYPES_AND_TESTS.md

# Visual metrics
cat SESSION_VISUAL_CELEBRATION.md

# File index
cat SESSION_FILES_COMPLETE_INDEX.md
```

---

## 🔍 Verification

### Check Status
```bash
# Type tests
npm test -- tests/unit/smart-onboarding/types-validation.test.ts --run

# Type consistency
node scripts/validate-type-consistency.js | head -50

# Build
npm run build 2>&1 | grep -E "(error|warning)" | head -20
```

### List Created Files
```bash
# All session files
ls -lh START_HERE_SESSION_SUMMARY.md \
       SESSION_COMPLETE_TYPES_AND_TESTS.md \
       SMART_ONBOARDING_TYPE*.md \
       SMOKE_TESTS_*.md \
       TYPE_COVERAGE_REPORT.md

# Scripts
ls -lh scripts/validate-type-consistency.js \
       scripts/run-smoke-tests.sh

# Tests
ls -lh tests/unit/smart-onboarding/types-validation.test.ts
```

---

## 🎯 Common Tasks

### Add New Type
```bash
# 1. Edit types file
vim lib/smart-onboarding/types/index.ts

# 2. Validate
node scripts/validate-type-consistency.js

# 3. Test
npm test -- tests/unit/smart-onboarding/types-validation.test.ts --run

# 4. Build
npm run build
```

### Run All Validations
```bash
# Quick validation
npm test -- tests/unit/smart-onboarding/types-validation.test.ts --run && \
node scripts/validate-type-consistency.js && \
npm run build

# With smoke tests (requires server)
npm run dev &
SERVER_PID=$!
npx wait-on http://localhost:3000
npm run e2e:smoke
kill $SERVER_PID
```

### Clean Up
```bash
# Remove generated files
rm -rf dist/ .next/ playwright-report/ test-results/

# Reset to clean state
git clean -fdx
npm install
```

---

## 🐛 Troubleshooting

### Type Tests Failing
```bash
# Check diagnostics
npm run typecheck

# Validate consistency
node scripts/validate-type-consistency.js

# Check build
npm run build
```

### Smoke Tests Not Running
```bash
# Check if server is running
curl http://localhost:3000

# Start server manually
npm run dev

# Run tests
npm run e2e:smoke
```

### Build Errors
```bash
# Check TypeScript errors
npm run typecheck

# Check for syntax errors
npm run lint

# Clean and rebuild
rm -rf .next/ dist/
npm run build
```

---

## 📊 Status Check

### Quick Status
```bash
echo "Type Tests:"
npm test -- tests/unit/smart-onboarding/types-validation.test.ts --run 2>&1 | grep -E "(PASS|FAIL|✓)"

echo -e "\nType Consistency:"
node scripts/validate-type-consistency.js 2>&1 | grep -E "(✅|❌|⚠️)" | head -10

echo -e "\nBuild Status:"
npm run build 2>&1 | tail -5
```

### Full Status
```bash
# Run all checks
./scripts/validate-type-consistency.js > type-consistency-report.txt
npm test -- tests/unit/smart-onboarding/ --run > type-tests-report.txt
npm run build > build-report.txt 2>&1

# View reports
cat type-consistency-report.txt
cat type-tests-report.txt
tail -20 build-report.txt
```

---

## 🎯 One-Liners

```bash
# Quick type validation
npm test -- tests/unit/smart-onboarding/types-validation.test.ts --run && echo "✅ Types OK"

# Quick consistency check
node scripts/validate-type-consistency.js | grep "Summary" -A 5

# Quick build check
npm run build 2>&1 | tail -3

# Quick smoke test
./scripts/run-smoke-tests.sh

# Commit everything
./GIT_COMMIT_COMMANDS.sh && echo "✅ All committed"
```

---

## 📚 Help

### Get Help
```bash
# Type validation help
node scripts/validate-type-consistency.js --help

# Smoke tests help
./scripts/run-smoke-tests.sh --help

# Test help
npm test -- --help
```

### Documentation
```bash
# Quick reference
cat SMART_ONBOARDING_TYPES_QUICK_REF.md

# Full guide
cat lib/smart-onboarding/TYPE_CONVENTIONS.md

# Smoke tests
cat SMOKE_TESTS_GUIDE.md
```

---

**Last Updated**: 2024-11-10  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
