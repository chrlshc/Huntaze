# Legacy Style Cleanup - Quick Reference

## Current Status

🟡 **Migration: 33% Complete** (5/15 components)  
⏳ **Cleanup: Awaiting Migration Completion**

## Quick Commands

```bash
# Check migration status
npm run migration:status

# See next components to migrate
npm run migration:next

# When migration is 100% complete, run cleanup
npm run cleanup:legacy-styles
```

## What's Been Cleaned Up

✅ Backup files removed:
- `app/layout-backup.tsx`
- `app/page-backup.tsx`

## What's Waiting for Cleanup

⏳ Legacy CSS files (~46.6 KB):
- `app/animations.css`
- `app/glass.css`
- `app/mobile-emergency-fix.css`
- `app/mobile-optimized.css`
- `app/mobile.css`
- `app/nuclear-mobile-fix.css`
- `app/responsive-enhancements.css`

⏳ Migration tracking system:
- `.kiro/specs/linear-ui-performance-refactor/migration-tracker.json`
- `lib/utils/migration-tracker.ts`
- `scripts/migration-tracker.ts`
- `types/migration.ts`
- Migration documentation files

## Why Not Clean Up Now?

**Requirement 11.3** states: "WHEN the migration is complete THEN the system SHALL remove all legacy style definitions."

10 components are still using legacy styles:
- Landing Page
- About Page
- Pricing Page
- Integrations Page
- Analytics Page
- Campaigns Page
- Settings Page
- Onboarding Page
- Profile Page
- Billing Page

Removing legacy styles now would break these pages.

## When Can We Clean Up?

When `npm run migration:status` shows:
```
Migrated: 15 (100%)
Legacy: 0
```

## Safety Checks

The cleanup script will:
1. ✅ Check migration is 100% complete
2. ✅ Abort if migration is incomplete
3. ✅ Remove legacy files safely
4. ✅ Update package.json
5. ✅ Provide rollback instructions

## Rollback

If something breaks after cleanup:
```bash
git revert HEAD
```

## More Info

- **Full Plan:** `.kiro/specs/linear-ui-performance-refactor/CLEANUP_PLAN.md`
- **Completion Report:** `.kiro/specs/linear-ui-performance-refactor/TASK_12_COMPLETION.md`
- **Cleanup Script:** `scripts/cleanup-legacy-styles.ts`

