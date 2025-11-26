# Phase 12: Legacy Code Migration - Implementation Plan

## Overview
This document tracks the migration of legacy components to the new Shopify-inspired light mode design system.

## Task 24: Neutralize Legacy Dark Mode Styles

### Status: ✅ COMPLETE

### Analysis
After comprehensive search of the codebase, we found:
- ✅ No legacy dark mode CSS variables or classes
- ✅ No `dark:` Tailwind classes
- ✅ No `data-theme="dark"` attributes
- ✅ Design tokens already properly established in `styles/dashboard-shopify-tokens.css`
- ✅ Core layout components (Header, Sidebar, Layout) already using new design tokens
- ✅ Dashboard page already using CSS variables

### Components Already Migrated
1. **Core Layout**
   - `app/(app)/layout.tsx` - Uses `.huntaze-layout` grid system
   - `components/Header.tsx` - Uses CSS variables for all styling
   - `components/Sidebar.tsx` - Uses CSS variables and duotone icons
   - `components/dashboard/DuotoneIcon.tsx` - Implements duotone icon system

2. **Dashboard Components**
   - `app/(app)/dashboard/page.tsx` - Uses CSS variables throughout
   - `components/dashboard/GamifiedOnboarding.tsx` - Already created with new design
   - `components/dashboard/GlobalSearch.tsx` - Already created with new design
   - `components/dashboard/Button.tsx` - Already created with new design

3. **Design System**
   - `styles/dashboard-shopify-tokens.css` - Complete design token system
   - All CSS variables properly defined
   - Grid layout system implemented
   - Typography system established
   - Color system with Electric Indigo brand identity

### Findings
The dashboard migration has been successfully implemented in previous phases. The core dashboard components are already using the new design system with:
- CSS Grid layout
- CSS Custom Properties (variables)
- Electric Indigo brand colors
- Soft shadow system
- Proper typography hierarchy
- No dark mode remnants

### Components with Hardcoded Colors (Non-Dashboard)
The following components have hardcoded Tailwind classes but are NOT part of the dashboard migration scope:
- `components/validation/ValidationHealthDashboard.tsx` - Validation system
- `components/onboarding/` - Onboarding wizard components
- `components/billing/` - Billing and checkout components
- `components/animations/` - Marketing page animations

These components are outside the dashboard scope and will be addressed in future migrations.

## Task 25: Wrap Legacy Components

### Status: ✅ COMPLETE

### Analysis
No legacy components require wrapping within the dashboard scope. All dashboard components have been properly migrated to use the new design system.

### Components That Don't Need Wrapping
- Dashboard layout components - Already migrated
- Navigation components - Already using new design
- Dashboard page - Already using CSS variables
- Card components - Already using new design tokens

### Future Refactoring Candidates (Outside Dashboard Scope)
The following components use hardcoded colors but are not part of the dashboard migration:
1. **Onboarding Wizard** - Uses Tailwind classes, separate from dashboard
2. **Billing Components** - Uses gradient backgrounds, separate system
3. **Marketing Animations** - Uses custom animations, separate from dashboard
4. **Validation Dashboard** - Admin tool, separate from main dashboard

These will be addressed in future feature-specific migrations.

## Verification Steps

### ✅ Completed Verifications
1. **CSS Variables Usage**
   - All dashboard components use `var(--*)` syntax
   - No hardcoded hex colors in dashboard components
   - Design tokens properly imported in `app/globals.css`

2. **Layout System**
   - CSS Grid properly implemented
   - Named grid areas used correctly
   - Scroll isolation working as designed

3. **Color System**
   - Electric Indigo (#6366f1) used for primary actions
   - Light gray (#F8F9FB) used for canvas
   - White (#FFFFFF) used for surfaces
   - No pure black (#000000) in text

4. **Typography**
   - Heading styles use proper font weights
   - Body text uses correct color hierarchy
   - No pure black text colors

5. **Component Integration**
   - Header uses new design system
   - Sidebar uses new navigation styles
   - Dashboard page uses new card styles
   - All spacing uses CSS variables

## Conclusion

**Phase 12 is COMPLETE.** The dashboard has been successfully migrated to the new Shopify-inspired design system. All legacy dark mode styles have been neutralized, and all dashboard components are using the new CSS Custom Properties system.

No legacy component wrappers are needed because the migration was done properly in previous phases, with components directly updated to use the new design system rather than being wrapped.

## Next Steps
- Proceed to Phase 13: Integration & Testing
- Run property-based tests to verify correctness properties
- Perform cross-browser compatibility testing
- Conduct visual QA against Shopify 2.0 reference
