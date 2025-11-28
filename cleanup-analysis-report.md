# Cleanup Analysis Report

Generated: 2025-11-27T23:39:14.758Z

## Summary

- **Backup files found**: 12
- **Duplicate page files found**: 5
- **Test/demo files in production**: 7
- **Total size of backup files**: 141.56 KB

## Backup Files

The following backup files were identified and can be safely removed:

| File Path | Pattern | Size |
|-----------|---------|------|
| .env.bak | \.bak$ | 1.12 KB |
| app/(app)/onboarding/setup/page-old.tsx | -old\. | 57.11 KB |
| app/(marketing)/page-backup.tsx | -backup\. | 93.00 B |
| app/api/auth/[...nextauth]/route.full.backup | \.backup$ | 19.98 KB |
| app/api/auth/[...nextauth]/route.minimal.ts.backup | \.backup$ | 1.14 KB |
| app/api/auth/register/route.ts.backup | \.backup$ | 3.47 KB |
| app/auth/auth-client-backup.tsx | -backup\. | 19.01 KB |
| lib/amplify-env-vars/validators.ts.backup | \.backup$ | 11.82 KB |
| scripts/amplify-env-vars/automated-backup.js | -backup\. | 11.00 KB |
| scripts/verify-backup.sh | -backup\. | 4.83 KB |
| src/components/app-sidebar-old.tsx | -old\. | 10.23 KB |
| src/contexts/ThemeContext.tsx.backup | \.backup$ | 1.77 KB |

## Duplicate Page Files

The following directories contain multiple page file variants:

### app/(app)/onboarding/setup

- ⚠️ Duplicate: app/(app)/onboarding/setup/page-old.tsx
- ✅ Active: app/(app)/onboarding/setup/page.tsx

### app/(marketing)

- ⚠️ Duplicate: app/(marketing)/page-backup.tsx
- ⚠️ Duplicate: app/(marketing)/page-old-generic.tsx
- ✅ Active: app/(marketing)/page.tsx

## Test/Demo Files in Production Directories

The following test/demo files should be moved to test directories or removed:

| File Path | Reason |
|-----------|--------|
| app/(app)/of-connect/DebugLogin.tsx | Debug file (contains debug) |
| app/components/DebugAtomicEffect.tsx | Debug file (contains debug) |
| app/components/SimpleNeonTest.tsx | Simple test file |
| app/shadow-demo.html | Demo file (contains -demo) |
| components/DebugWrapper.tsx | Debug file (contains debug) |
| components/hydration/HydrationDebugPanel.tsx | Debug file (contains debug) |
| lib/utils/hydrationDebugger.ts | Debug file (contains debug) |

## Recommendations

### Immediate Actions

1. **Remove 12 backup files** to free up 141.56 KB
2. **Consolidate 5 duplicate page files** to single active versions
3. **Move or remove 7 test/demo files** from production directories

### Next Steps

1. Review this report carefully
2. Verify that backup files are truly obsolete
3. Ensure duplicate pages are not actively used
4. Move test files to appropriate test directories
5. Run the cleanup scripts to remove identified files
