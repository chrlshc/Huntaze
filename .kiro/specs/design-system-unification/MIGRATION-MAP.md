# Design System Migration Map

Generated: 2025-11-28

## Executive Summary

The audit has identified **6,759 hardcoded style values** across **368 files** in the Huntaze codebase. This document provides a structured migration plan to unify the design system using the comprehensive design tokens already defined in `styles/design-tokens.css`.

## Current State

### ✅ Strengths
- **Comprehensive token system exists** in `styles/design-tokens.css`
- Tokens cover all necessary categories:
  - Colors (backgrounds, borders, text, accents)
  - Spacing (4px grid system, 0-32 scale)
  - Typography (fonts, sizes, weights, line heights)
  - Effects (shadows, glass morphism, blur)
  - Animations (transitions, easing)
  - Layout (breakpoints, z-index, component sizes)
- Utility classes defined (`.glass`, `.glass-card`, `.glass-hover`)
- Accessibility features (reduced motion, high contrast)

### ❌ Issues Identified
- **368 files** contain hardcoded values instead of using design tokens
- **187 high-priority files** with >10 hardcoded values each
- Inconsistent color usage across pages (mixing `bg-gray-*`, `bg-zinc-*`)
- Multiple competing token files creating confusion:
  - `styles/design-tokens.css` (main)
  - `styles/premium-design-tokens.css`
  - `styles/linear-design-tokens.css`
  - `styles/dashboard-shopify-tokens.css`
  - `styles/hz-theme.css`
  - `styles/design-system.css`
- Components using hardcoded colors instead of token references

## Migration Strategy

### Phase 1: Token Consolidation (Priority: CRITICAL)

**Goal**: Establish single source of truth for design tokens

**Actions**:
1. Audit competing token files
2. Merge unique tokens into main `design-tokens.css`
3. Deprecate redundant token files
4. Update imports to reference main token file only

**Files to consolidate**:
- `styles/premium-design-tokens.css` → merge into main
- `styles/linear-design-tokens.css` → merge into main
- `styles/dashboard-shopify-tokens.css` → merge into main
- `styles/hz-theme.css` → merge into main
- `styles/design-system.css` → merge into main

### Phase 2: Component Library Migration (Priority: HIGH)

**Goal**: Update all reusable components to use design tokens exclusively

**High-Priority Components** (most reused):
1. **Card Components**
   - `components/ui/ModuleCard.tsx` (35 issues)
   - `components/pricing/PricingCard.tsx` (16 issues)
   - `components/onboarding/FeatureCard.tsx` (13 issues)
   
   **Migration**: Replace hardcoded borders/backgrounds with:
   ```tsx
   // Before
   className="bg-gray-800 border-gray-700"
   
   // After
   className="bg-[var(--bg-tertiary)] border-[var(--border-subtle)]"
   // Or use utility class
   className="glass-card"
   ```

2. **Modal Components**
   - `components/ui/Modal.tsx` (12 issues)
   - `components/ContactSalesModal.tsx` (28 issues)
   - `components/pricing/UpgradeModal.tsx` (25 issues)
   - `components/smart-onboarding/CelebrationModal.tsx` (19 issues)
   
   **Migration**: Use z-index tokens and glass effects:
   ```tsx
   // Before
   style={{ zIndex: 9999, background: 'rgba(0,0,0,0.8)' }}
   
   // After
   style={{ 
     zIndex: 'var(--z-modal)',
     background: 'var(--bg-glass)'
   }}
   ```

3. **Button Components**
   - `components/dashboard/Button.example.tsx` (19 issues)
   
   **Migration**: Use button tokens:
   ```tsx
   // Before
   className="h-10 px-4 rounded-lg"
   
   // After
   style={{
     height: 'var(--button-height-md)',
     padding: '0 var(--button-padding-x)',
     borderRadius: 'var(--button-radius)'
   }}
   ```

4. **Loading Components**
   - `components/lazy/LoadingFallback.tsx` (53 issues)
   - `components/dashboard/LoadingStates.tsx` (34 issues)
   
   **Migration**: Standardize loading animations with transition tokens

5. **Dashboard Widgets**
   - `components/platforms/TikTokDashboardWidget.tsx` (30 issues)
   - `components/platforms/RedditDashboardWidget.tsx` (24 issues)
   - `components/platforms/InstagramDashboardWidget.tsx` (12 issues)
   
   **Migration**: Apply consistent glass card styling

### Phase 3: Page Migration (Priority: HIGH)

**Goal**: Update all pages to use consistent design system

**Critical Pages** (highest traffic):
1. **Marketing Pages**
   - `app/(marketing)/page.tsx` (125 issues) ⚠️ HIGHEST PRIORITY
   - `app/(marketing)/pricing/page.tsx` (23 issues)
   - `app/(marketing)/privacy-policy/page.tsx` (70 issues)
   - `app/(marketing)/terms-of-service/page.tsx` (62 issues)

2. **Dashboard Pages**
   - `app/(app)/of-analytics/page.tsx` (90 issues)
   - `app/(app)/onboarding/beta-onboarding-client.tsx` (51 issues)
   - `app/(app)/schedule/page.tsx` (51 issues)
   - `app/(app)/configure/page.tsx` (37 issues)
   - `app/(app)/onlyfans/page.tsx` (35 issues)

3. **Auth Pages**
   - `app/auth/auth-client.tsx` (32 issues)
   - `app/auth/verify/page.tsx` (23 issues)
   - `components/auth/SignInForm.tsx` (29 issues)

**Migration Pattern for Pages**:
```tsx
// Before
<div className="min-h-screen bg-zinc-950">
  <div className="bg-gray-800 border-gray-700 rounded-xl p-6">
    <h1 className="text-2xl text-white">Title</h1>
  </div>
</div>

// After
<div className="min-h-screen bg-[var(--bg-primary)]">
  <div className="glass-card">
    <h1 style={{ 
      fontSize: 'var(--text-2xl)',
      color: 'var(--text-primary)'
    }}>Title</h1>
  </div>
</div>
```

### Phase 4: Content & Form Components (Priority: MEDIUM)

**Goal**: Standardize content management and form interfaces

**Components**:
- `components/content/ContentForm.tsx` (53 issues)
- `components/content/SchedulePicker.tsx` (51 issues)
- `components/content/VariationPerformance.tsx` (39 issues)
- `components/content/MediaUpload.tsx` (28 issues)
- `components/content/ContentCalendar.tsx` (25 issues)

**Migration**: Use input and card tokens consistently

### Phase 5: Monitoring & Debug Components (Priority: LOW)

**Goal**: Update internal tools and dashboards

**Components**:
- `components/monitoring/GoldenSignalsDashboard.tsx` (37 issues)
- `components/monitoring/ThreeJsHealthDashboard.tsx` (30 issues)
- `components/hydration/HydrationDiffViewer.tsx` (37 issues)
- `components/validation/ValidationHealthDashboard.tsx` (31 issues)

**Note**: These are internal tools, lower user impact

## Token Usage Guidelines

### Color Usage

**DO**:
```tsx
// Use CSS variables
style={{ background: 'var(--bg-primary)' }}

// Use Tailwind with arbitrary values
className="bg-[var(--bg-primary)]"

// Use utility classes
className="glass-card"
```

**DON'T**:
```tsx
// Hardcoded hex colors
style={{ background: '#09090b' }}

// Hardcoded Tailwind classes
className="bg-zinc-950"

// Inline rgba values
style={{ background: 'rgba(255, 255, 255, 0.05)' }}
```

### Spacing Usage

**DO**:
```tsx
// Use spacing tokens
style={{ padding: 'var(--space-6)' }}
className="p-[var(--space-6)]"
```

**DON'T**:
```tsx
// Hardcoded values
style={{ padding: '24px' }}
className="p-6"
```

### Typography Usage

**DO**:
```tsx
// Use typography tokens
style={{ 
  fontSize: 'var(--text-2xl)',
  fontWeight: 'var(--font-weight-semibold)',
  lineHeight: 'var(--leading-tight)'
}}
```

**DON'T**:
```tsx
// Hardcoded values
style={{ fontSize: '24px', fontWeight: 600 }}
className="text-2xl font-semibold"
```

## Common Patterns & Solutions

### Pattern 1: Glass Card

**Before**:
```tsx
<div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6">
```

**After**:
```tsx
<div className="glass-card">
```

### Pattern 2: Dashboard Background

**Before**:
```tsx
<div className="min-h-screen bg-zinc-950">
```

**After**:
```tsx
<div className="min-h-screen bg-[var(--bg-primary)]">
```

### Pattern 3: Hover States

**Before**:
```tsx
<button className="bg-gray-800 hover:bg-gray-700 transition-colors duration-200">
```

**After**:
```tsx
<button 
  className="bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)]"
  style={{ transition: 'var(--transition-base)' }}
>
```

### Pattern 4: Text Hierarchy

**Before**:
```tsx
<h1 className="text-3xl font-bold text-white">
<p className="text-base text-gray-400">
```

**After**:
```tsx
<h1 style={{ 
  fontSize: 'var(--text-3xl)',
  fontWeight: 'var(--font-weight-bold)',
  color: 'var(--text-primary)'
}}>
<p style={{
  fontSize: 'var(--text-base)',
  color: 'var(--text-secondary)'
}}>
```

## Migration Checklist

### Per-File Checklist

- [ ] Replace all hardcoded hex colors with CSS variables
- [ ] Replace Tailwind color classes with token-based classes
- [ ] Update spacing to use spacing tokens
- [ ] Update typography to use typography tokens
- [ ] Replace inline styles with token references
- [ ] Use utility classes where appropriate (`.glass-card`, etc.)
- [ ] Test visual appearance matches original
- [ ] Verify responsive behavior
- [ ] Check accessibility (contrast, focus states)

### Per-Component Checklist

- [ ] Audit all color usage
- [ ] Audit all spacing usage
- [ ] Audit all typography usage
- [ ] Update prop types if needed
- [ ] Add TypeScript types for token usage
- [ ] Update component documentation
- [ ] Add usage examples
- [ ] Write property-based tests

## Success Metrics

### Quantitative
- **0 hardcoded colors** in component files
- **100% token coverage** for colors, spacing, typography
- **All property tests passing** (22 properties)
- **Zero visual regressions** in screenshot tests

### Qualitative
- Consistent "God Tier" aesthetic across all pages
- Faster development with reusable components
- Easier maintenance with centralized tokens
- Better accessibility compliance

## Timeline Estimate

- **Phase 1** (Token Consolidation): 1-2 days
- **Phase 2** (Component Library): 3-5 days
- **Phase 3** (Page Migration): 5-7 days
- **Phase 4** (Content Components): 2-3 days
- **Phase 5** (Monitoring Tools): 1-2 days

**Total**: 12-19 days (2-4 weeks)

## Risk Mitigation

### Risk 1: Visual Regressions
**Mitigation**: 
- Implement visual regression testing before migration
- Capture baseline screenshots
- Review changes in staging environment

### Risk 2: Breaking Changes
**Mitigation**:
- Migrate incrementally, one component at a time
- Keep old styles temporarily for rollback
- Use feature flags for gradual rollout

### Risk 3: Developer Confusion
**Mitigation**:
- Create comprehensive documentation
- Provide code examples and patterns
- Conduct team training session
- Set up linting rules to enforce token usage

## Next Steps

1. ✅ **Complete audit** (DONE)
2. **Review this migration map** with team
3. **Prioritize files** for migration
4. **Start with Phase 1** (token consolidation)
5. **Create property-based tests** for validation
6. **Begin component migration** (Phase 2)
7. **Monitor progress** with metrics dashboard

## Resources

- **Design Tokens**: `styles/design-tokens.css`
- **Audit Report**: `.kiro/specs/design-system-unification/AUDIT-REPORT.md`
- **Design Document**: `.kiro/specs/design-system-unification/design.md`
- **Requirements**: `.kiro/specs/design-system-unification/requirements.md`
- **Tasks**: `.kiro/specs/design-system-unification/tasks.md`

---

**Status**: Ready for Phase 1 implementation
**Last Updated**: 2025-11-28
**Owner**: Design System Team
