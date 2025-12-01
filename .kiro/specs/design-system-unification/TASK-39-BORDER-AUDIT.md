# Task 39: Border Visibility Audit

**Date:** November 30, 2025  
**Feature:** Design System Unification - Phase 2  
**Requirements:** 9.3

## Executive Summary

This audit identifies all border declarations across the application that need to be updated to meet the minimum opacity requirement of 0.12. The primary issues are:

1. **Hardcoded border colors** (border-gray-200, border-blue-600, etc.)
2. **Inconsistent border usage** across similar components
3. **Missing borders** on interactive elements
4. **Insufficient contrast** for separators and dividers

## Border Token Standards

### Design Token Hierarchy

From `styles/design-tokens.css`:

```css
--border-subtle: rgba(255, 255, 255, 0.08)   /* ❌ Below minimum */
--border-default: rgba(255, 255, 255, 0.12)  /* ✅ Minimum standard */
--border-emphasis: rgba(255, 255, 255, 0.18) /* ✅ Interactive elements */
--border-strong: rgba(255, 255, 255, 0.24)   /* ✅ High contrast */
```

### Usage Guidelines

- **Default borders**: Use `--border-default` (0.12 opacity minimum)
- **Interactive elements**: Use `--border-emphasis` (0.18 opacity)
- **Hover states**: Use `--border-strong` (0.24 opacity)
- **Separators/dividers**: Use `--border-default` minimum

## Components Requiring Updates

### 1. Validation Components

#### ValidationHealthDashboard.tsx

**Current Issues:**
```tsx
// ❌ Hardcoded border-gray-200
<div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">

// ❌ Hardcoded border-gray-200 for separators
<div className="pt-2 mt-2 border-t border-gray-200">

// ❌ Hardcoded border-red-200
<div className="p-6 bg-red-50 border border-red-200 rounded-lg">

// ❌ Hardcoded border-gray-300
<button className="... border border-gray-300 ...">
```

**Required Changes:**
- Replace `border-gray-200` → `border-[var(--border-default)]`
- Replace `border-gray-300` → `border-[var(--border-emphasis)]`
- Replace `border-red-200` → `border-[var(--accent-error-border)]` (or `--border-emphasis` with error background)

### 2. Onboarding Components

#### AIConfiguration.tsx

**Current Issues:**
```tsx
// ❌ Hardcoded border-blue-600 for selected state
className={`... border-2 ${
  config.verbosity === option.value
    ? 'border-blue-600 bg-blue-50'
    : 'border-gray-200 hover:border-gray-300'
}`}

// ❌ Hardcoded border-gray-200 for card
<Card className="bg-white rounded-lg p-4 border border-gray-200">
```

**Required Changes:**
- Replace `border-blue-600` → `border-[var(--accent-primary)]`
- Replace `border-gray-200` → `border-[var(--border-default)]`
- Replace `hover:border-gray-300` → `hover:border-[var(--border-emphasis)]`

#### PlatformConnection.tsx

**Current Issues:**
```tsx
// ❌ Hardcoded border-green-500 for connected state
className={`... border-2 ${
  isConnected
    ? 'border-green-500 bg-green-50'
    : 'border-gray-200 hover:border-gray-300'
}`}

// ❌ Hardcoded border-yellow-200, border-green-200
<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
<div className="bg-green-50 border border-green-200 rounded-lg p-4">
```

**Required Changes:**
- Replace `border-green-500` → `border-[var(--accent-success)]`
- Replace `border-gray-200` → `border-[var(--border-default)]`
- Replace `border-yellow-200` → `border-[var(--accent-warning-border)]`
- Replace `border-green-200` → `border-[var(--accent-success-border)]`

#### GoalSelection.tsx

**Current Issues:**
```tsx
// ❌ Hardcoded border-blue-600 for selected goals
className={`... border-2 ${
  selectedGoals.includes(goal.id)
    ? 'border-blue-600 bg-blue-50'
    : 'border-gray-200 hover:border-gray-300'
}`}

// ❌ Hardcoded border-blue-200
<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
```

**Required Changes:**
- Replace `border-blue-600` → `border-[var(--accent-primary)]`
- Replace `border-gray-200` → `border-[var(--border-default)]`
- Replace `border-blue-200` → `border-[var(--accent-primary-border)]`

#### FeatureCard.tsx

**Current Issues:**
```tsx
// ❌ Hardcoded border-green-500 for unlocked features
className={`... border-2 ${
  isUnlocked
    ? 'border-green-500 bg-green-50 hover:shadow-md'
    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
}`}

// ❌ Hardcoded border-gray-300 for checkboxes
<div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 ...">
```

**Required Changes:**
- Replace `border-green-500` → `border-[var(--accent-success)]`
- Replace `border-gray-200` → `border-[var(--border-default)]`
- Replace `border-gray-300` → `border-[var(--border-emphasis)]`

#### AdditionalPlatforms.tsx

**Current Issues:**
```tsx
// ❌ Hardcoded border-blue-200
<div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 ...">

// ❌ Hardcoded border-green-500, border-gray-200
className={`... border-2 ${
  isConnected
    ? 'border-green-500 bg-green-50'
    : 'border-gray-200 hover:border-gray-300'
}`}

// ❌ Hardcoded border-green-200
<div className="bg-green-50 border border-green-200 rounded-lg p-4">
```

**Required Changes:**
- Replace `border-blue-200` → `border-[var(--accent-primary-border)]`
- Replace `border-green-500` → `border-[var(--accent-success)]`
- Replace `border-gray-200` → `border-[var(--border-default)]`
- Replace `border-green-200` → `border-[var(--accent-success-border)]`

#### StepNavigation.tsx

**Current Issues:**
```tsx
// ❌ Hardcoded border-gray-200 for separator
<div className="flex items-center justify-between pt-6 border-t border-gray-200">
```

**Required Changes:**
- Replace `border-gray-200` → `border-[var(--border-default)]`

#### ResumeBanner.tsx

**Current Issues:**
```tsx
// ❌ Hardcoded border-amber-200
<div className="... border border-amber-200 bg-amber-50 ...">
```

**Required Changes:**
- Replace `border-amber-200` → `border-[var(--accent-warning-border)]`

#### OnboardingWizard.tsx

**Current Issues:**
```tsx
// ❌ Hardcoded border-blue-600 for spinner
<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
```

**Required Changes:**
- Replace `border-blue-600` → `border-[var(--accent-primary)]`

#### ProgressTracker.tsx

**Current Issues:**
```tsx
// ❌ Hardcoded border-blue-200
className={`... ${
  index === currentStepIndex
    ? 'bg-blue-50 border border-blue-200'
    : ''
}`}
```

**Required Changes:**
- Replace `border-blue-200` → `border-[var(--accent-primary-border)]`

#### WhatsNew.tsx

**Current Issues:**
```tsx
// ❌ Hardcoded border-blue-600 for spinner
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>

// ❌ Hardcoded border-gray-200 for feature cards
<div className="border border-gray-200 rounded-lg p-6 ...">

// ❌ Hardcoded border-gray-200 for footer
<div className="border-t border-gray-200 p-4 bg-gray-50">
```

**Required Changes:**
- Replace `border-blue-600` → `border-[var(--accent-primary)]`
- Replace `border-gray-200` → `border-[var(--border-default)]`

#### SimplifiedOnboardingWizard.tsx

**Current Issues:**
```tsx
// ❌ Hardcoded border-gray-200, border-purple-300
<div className="... border border-gray-200 ... hover:border-purple-300 ...">

// ❌ Hardcoded border-purple-600
className={`... border-2 ${
  index < currentStep 
    ? 'bg-purple-600 border-purple-600 text-white' 
    : index === currentStep
      ? 'border-purple-600 text-purple-600 bg-white'
      : ...
}`}
```

**Required Changes:**
- Replace `border-gray-200` → `border-[var(--border-default)]`
- Replace `border-purple-300` → `border-[var(--border-emphasis)]`
- Replace `border-purple-600` → `border-[var(--accent-primary)]`

### 3. Animation Components

#### LiveDashboard.tsx

**Current Issues:**
```tsx
// ❌ Hardcoded border colors in gradient styles
const styles = {
  success: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
  warning: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
  info: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30'
};
```

**Required Changes:**
- Replace with design token-based borders
- Use `--accent-success`, `--accent-warning`, `--accent-info` with appropriate opacity

#### PhoneMockup3DWrapper.tsx

**Current Issues:**
```tsx
// ❌ Hardcoded border-purple-500
<div className="... border-4 border-purple-500 border-t-transparent" />
```

**Required Changes:**
- Replace `border-purple-500` → `border-[var(--accent-primary)]`

### 4. Analytics Components

#### TopContentGrid.tsx

**Current Issues:**
```tsx
// ❌ Generic "border" without color specification
<div className="border rounded-lg overflow-hidden ...">
```

**Required Changes:**
- Add explicit border color: `border border-[var(--border-default)]`

## New Design Tokens Needed

To support status-specific borders, we should add these tokens to `design-tokens.css`:

```css
/* Status Border Tokens */
--accent-primary-border: rgba(59, 130, 246, 0.3);    /* blue-500 at 30% */
--accent-success-border: rgba(34, 197, 94, 0.3);     /* green-500 at 30% */
--accent-warning-border: rgba(245, 158, 11, 0.3);    /* amber-500 at 30% */
--accent-error-border: rgba(239, 68, 68, 0.3);       /* red-500 at 30% */
--accent-info-border: rgba(59, 130, 246, 0.3);       /* blue-500 at 30% */
```

## Summary Statistics

### Components Requiring Updates

| Component Category | Files | Border Issues |
|-------------------|-------|---------------|
| Validation | 1 | 4 patterns |
| Onboarding | 11 | 25+ patterns |
| Animation | 2 | 3 patterns |
| Analytics | 1 | 1 pattern |
| **Total** | **15** | **33+ patterns** |

### Border Color Distribution

| Hardcoded Color | Occurrences | Replacement Token |
|----------------|-------------|-------------------|
| border-gray-200 | 18 | --border-default |
| border-gray-300 | 5 | --border-emphasis |
| border-blue-600 | 6 | --accent-primary |
| border-green-500 | 3 | --accent-success |
| border-yellow-200 | 2 | --accent-warning-border |
| border-red-200 | 1 | --accent-error-border |
| border-amber-200 | 1 | --accent-warning-border |
| border-purple-500/600 | 3 | --accent-primary |

## Implementation Strategy

### Phase 1: Add New Tokens (Immediate)
1. Add status-specific border tokens to `design-tokens.css`
2. Document usage guidelines

### Phase 2: Update Components (Systematic)
1. **Validation components** - High visibility, user-facing
2. **Onboarding components** - Critical user journey
3. **Animation components** - Visual consistency
4. **Analytics components** - Data presentation

### Phase 3: Verification
1. Visual inspection of all updated components
2. Run property test for border opacity (Task 44)
3. Check for any remaining hardcoded borders

## Testing Checklist

- [ ] All borders use design tokens
- [ ] No hardcoded border colors remain
- [ ] Border opacity meets 0.12 minimum
- [ ] Interactive elements have emphasized borders
- [ ] Status borders use appropriate accent colors
- [ ] Separators/dividers are visible
- [ ] Hover states increase border visibility

## Next Steps

1. Update `design-tokens.css` with new status border tokens
2. Begin systematic component updates
3. Test visual consistency across all pages
4. Run automated property test (Task 44)

---

**Estimated Effort:** 2-3 hours  
**Priority:** High (affects visual hierarchy across application)  
**Dependencies:** Task 36 (design tokens updated)
