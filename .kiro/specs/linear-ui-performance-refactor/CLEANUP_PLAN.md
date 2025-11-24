# Legacy Style Cleanup Plan

**Status:** Migration is 33.33% complete (5/15 components migrated)  
**Requirement:** 11.3 - Remove legacy styles after migration complete

## Current State

The migration tracker shows:
- **Total Components:** 15
- **Migrated:** 5 (33.33%)
- **In Progress:** 0
- **Legacy:** 10 (66.67%)

## Cleanup Strategy

### Phase 1: Immediate Cleanup (Safe to Remove Now)

These files are backup files that are no longer needed and can be safely removed:

1. **app/layout-backup.tsx** - Old layout backup, replaced by current layout.tsx
2. **app/page-backup.tsx** - Old page backup, replaced by current page.tsx

### Phase 2: Legacy CSS Files (Remove After 100% Migration)

These CSS files contain legacy styles that should be removed ONLY after all components are migrated:

1. **app/animations.css** - Legacy animation styles
   - Replaced by: Design token animations in `styles/linear-design-tokens.css`
   - Used by: Legacy components not yet migrated

2. **app/glass.css** - Legacy glassmorphism styles
   - Replaced by: Modern design tokens
   - Used by: Legacy components not yet migrated

3. **app/mobile-emergency-fix.css** - Emergency mobile fixes
   - Replaced by: Proper responsive design in new system
   - Used by: Legacy mobile components

4. **app/mobile-optimized.css** - Legacy mobile optimizations
   - Replaced by: `styles/accessibility.css` and responsive design tokens
   - Used by: Legacy mobile components

5. **app/mobile.css** - Legacy mobile styles
   - Replaced by: Modern responsive design system
   - Used by: Legacy mobile components

6. **app/nuclear-mobile-fix.css** - Nuclear mobile fixes
   - Replaced by: Proper theme system
   - Used by: Legacy mobile components

7. **app/responsive-enhancements.css** - Legacy responsive enhancements
   - Replaced by: Modern responsive utilities in design tokens
   - Used by: Legacy responsive components

### Phase 3: Migration Tracking System (Remove After 100% Migration)

Once all components are migrated, the migration tracking system itself can be removed:

1. **Files to Remove:**
   - `.kiro/specs/linear-ui-performance-refactor/migration-tracker.json`
   - `lib/utils/migration-tracker.ts`
   - `scripts/migration-tracker.ts`
   - `types/migration.ts`
   - `.kiro/specs/linear-ui-performance-refactor/MIGRATION_README.md`
   - `.kiro/specs/linear-ui-performance-refactor/MIGRATION_TRACKING_GUIDE.md`
   - `.kiro/specs/linear-ui-performance-refactor/MIGRATION_QUICK_REFERENCE.md`

2. **package.json Scripts to Remove:**
   - `migration:status`
   - `migration:next`
   - `migration:report`
   - `migration:list`
   - `migration:update`

### Phase 4: Import Cleanup

After removing legacy CSS files, clean up imports in:

1. **app/layout.tsx** - Remove imports of legacy CSS files
2. **app/globals.css** - Verify only new design system imports remain

## Verification Checklist

Before removing any legacy CSS files, verify:

- [ ] All 15 components show status "migrated" in migration tracker
- [ ] Run `npm run migration:status` shows 100% completion
- [ ] All pages render correctly without legacy CSS
- [ ] Mobile responsiveness works without legacy mobile CSS
- [ ] No visual regressions detected
- [ ] All tests pass

## Conflicts Analysis

### Current Conflicts: NONE DETECTED

The new design system (`styles/linear-design-tokens.css`) and legacy CSS files are currently coexisting without conflicts because:

1. **Namespace Separation:** New system uses CSS custom properties (--color-*, --spacing-*, etc.)
2. **Class Naming:** Legacy uses utility classes, new system uses design tokens
3. **Specificity:** No overlapping selectors causing conflicts

### Potential Issues After Cleanup

None expected. The new design system is self-contained and doesn't depend on legacy styles.

## Execution Plan

### When Migration Reaches 100%:

1. **Run Final Verification:**
   ```bash
   npm run migration:status
   npm run migration:report
   ```

2. **Execute Cleanup Script:**
   ```bash
   npm run cleanup:legacy-styles
   ```

3. **Manual Verification:**
   - Test all pages in development
   - Run visual regression tests
   - Test mobile responsiveness
   - Verify accessibility compliance

4. **Commit Changes:**
   ```bash
   git add .
   git commit -m "chore: remove legacy styles after migration completion"
   ```

## Rollback Plan

If issues are discovered after cleanup:

1. **Restore from Git:**
   ```bash
   git revert HEAD
   ```

2. **Identify Problem Components:**
   - Use browser DevTools to identify missing styles
   - Check migration tracker for components that may have been incorrectly marked as migrated

3. **Fix and Re-migrate:**
   - Update affected components
   - Re-run cleanup after verification

## Notes

- **DO NOT** remove legacy CSS files until migration is 100% complete
- **DO NOT** remove migration tracking system until verified all components work
- Keep this cleanup plan updated as migration progresses
- Document any new legacy files discovered during migration

## Related Requirements

- **Requirement 11.1:** Coexistence of old and new styles during migration ✅ SATISFIED
- **Requirement 11.2:** Mark migrated components in codebase ✅ SATISFIED
- **Requirement 11.3:** Remove legacy styles after migration complete ⏳ PENDING (33% complete)

