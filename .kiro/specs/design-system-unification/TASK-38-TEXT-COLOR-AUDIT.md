# Task 38: Text Color Usage Audit

**Date:** November 30, 2025  
**Feature:** Design System Unification - Phase 2  
**Requirement:** 9.2 - Primary Text Color Lightness

## Objective

Update text color usage across components to ensure:
1. Primary content uses `--text-primary` (zinc-50) for maximum contrast
2. Headings (h1-h6) use `--text-primary` (zinc-50)
3. `--text-secondary` (zinc-400) is reserved ONLY for labels and metadata
4. Button text uses appropriate contrast colors
5. No mid-range grays (zinc-500+) are used for primary content

## Current State Analysis

### Design Token Text Colors

From `styles/design-tokens.css`:
```css
--text-primary: #fafafa;         /* zinc-50 - primary content */
--text-secondary: #a1a1aa;       /* zinc-400 - secondary content */
--text-tertiary: #71717a;        /* zinc-500 - muted content */
--text-quaternary: #52525b;      /* zinc-600 - disabled/subtle */
```

### Contrast Ratios

| Background | Text Color | Contrast Ratio | WCAG AA (4.5:1) | Usage |
|------------|-----------|----------------|-----------------|-------|
| zinc-800 | zinc-50 | 14.2:1 | ✅ PASS | Primary content |
| zinc-800 | zinc-400 | 4.8:1 | ✅ PASS | Labels, metadata |
| zinc-800 | zinc-500 | 3.2:1 | ❌ FAIL | ⚠️ TOO DARK |
| zinc-800 | zinc-600 | 2.1:1 | ❌ FAIL | ⚠️ TOO DARK |

**Key Finding:** Only zinc-50 and zinc-400 meet WCAG AA standards for text.

## Components Audit

### ✅ Components Already Using Design Tokens Correctly

1. **Button Component** (`components/ui/button.tsx`)
   - Uses `text-[var(--color-text-inverse)]` for primary buttons
   - Uses `text-[var(--color-text-secondary)]` for secondary/outline buttons
   - ✅ CORRECT

2. **Modal Component** (`components/ui/Modal.tsx`)
   - Uses `color: var(--text-secondary)` for body text
   - ✅ CORRECT (though body text should consider --text-primary)

3. **Integration Card** (`components/integrations/IntegrationCard.tsx`)
   - Uses `style={{ color: 'var(--text-secondary)' }}` for metadata
   - ✅ CORRECT

### ⚠️ Components Using Hardcoded Text Colors

#### 1. Analytics Components

**File:** `components/analytics/PlatformComparisonChart.tsx`
```tsx
// BEFORE
<h3 className="text-lg font-semibold mb-4">Platform Breakdown</h3>
<p className="text-gray-500 text-center py-8">No platform data available</p>

// SHOULD BE
<h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
  Platform Breakdown
</h3>
<p className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
  No platform data available
</p>
```

**File:** `components/analytics/TopContentGrid.tsx`
```tsx
// BEFORE
<h3 className="text-lg font-semibold mb-4">Top Performing Content</h3>
<h4 className="font-medium text-sm mb-3 line-clamp-2">{item.title}</h4>

// SHOULD BE
<h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
  Top Performing Content
</h3>
<h4 className="font-medium text-sm mb-3 line-clamp-2" style={{ color: 'var(--text-primary)' }}>
  {item.title}
</h4>
```

**File:** `components/analytics/InsightsPanel.tsx`
```tsx
// BEFORE
<h3 className="text-lg font-semibold mb-6">Insights & Recommendations</h3>
<h4 className="font-medium text-sm text-gray-700 mb-3">Significant Changes</h4>

// SHOULD BE
<h3 className="text-lg font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>
  Insights & Recommendations
</h3>
<h4 className="font-medium text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
  Significant Changes
</h4>
```

#### 2. Onboarding Components

**File:** `components/onboarding/FeatureUnlockModal.tsx`
```tsx
// BEFORE
<h2 className="text-2xl font-bold text-white mb-2">Feature Unlocked! 🎉</h2>
<h3 className="text-xl font-bold text-gray-900 mb-2">{feature.name}</h3>
<h4 className="font-semibold text-gray-900 mb-2">What you can do now:</h4>

// SHOULD BE
<h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
  Feature Unlocked! 🎉
</h2>
<h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
  {feature.name}
</h3>
<h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
  What you can do now:
</h4>
```

**File:** `components/onboarding/GoalSelection.tsx`
```tsx
// BEFORE
<h2 className="text-2xl font-bold text-gray-900 mb-2">What are your goals?</h2>
<h3 className="font-semibold text-gray-900 mb-1">{goal.title}</h3>

// SHOULD BE
<h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
  What are your goals?
</h2>
<h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
  {goal.title}
</h3>
```

#### 3. Animation Components

**File:** `components/animations/AnimatedHero.tsx`
```tsx
// BEFORE
<h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6">
  <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
    Huntaze AI
  </span>
</h1>

// This is OK - gradient text is intentional for hero sections
// ✅ KEEP AS IS
```

**File:** `components/animations/LiveDashboard.tsx`
```tsx
// BEFORE
<h3 className="text-lg text-gray-400 mb-2">Revenus Totaux Aujourd'hui</h3>
<h3 className="text-xl font-bold text-white mb-4">Messages Live</h3>

// SHOULD BE
<h3 className="text-lg mb-2" style={{ color: 'var(--text-secondary)' }}>
  Revenus Totaux Aujourd'hui
</h3>
<h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
  Messages Live
</h3>
```

#### 4. Validation Components

**File:** `components/validation/ValidationHealthDashboard.tsx`
```tsx
// BEFORE
<h3 className="text-lg font-semibold capitalize">{platform.platform}</h3>
<h2 className="text-2xl font-bold text-gray-900">OAuth Validation Health</h2>
<p className="text-gray-600 mt-1">Real-time status of OAuth credential validation</p>

// SHOULD BE
<h3 className="text-lg font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>
  {platform.platform}
</h3>
<h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
  OAuth Validation Health
</h2>
<p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
  Real-time status of OAuth credential validation
</p>
```

## Text Color Usage Guidelines

### When to Use Each Token

#### `--text-primary` (zinc-50)
**Use for:**
- All headings (h1-h6)
- Primary body content
- Important labels
- Button text on dark backgrounds
- Card titles
- Navigation items
- Form labels (primary)

**Examples:**
```tsx
<h1 style={{ color: 'var(--text-primary)' }}>Page Title</h1>
<p style={{ color: 'var(--text-primary)' }}>Main content paragraph</p>
<label style={{ color: 'var(--text-primary)' }}>Email Address</label>
```

#### `--text-secondary` (zinc-400)
**Use for:**
- Metadata (dates, timestamps, counts)
- Helper text
- Placeholder text
- Secondary labels
- Captions
- Subtle descriptions

**Examples:**
```tsx
<p style={{ color: 'var(--text-secondary)' }}>Posted 2 hours ago</p>
<span style={{ color: 'var(--text-secondary)' }}>Optional</span>
<p style={{ color: 'var(--text-secondary)' }}>Helper text for form field</p>
```

#### `--text-tertiary` (zinc-500)
**Use for:**
- Disabled text
- Very subtle hints
- Decorative text
- ⚠️ NEVER for readable body content

**Examples:**
```tsx
<button disabled style={{ color: 'var(--text-tertiary)' }}>Disabled Button</button>
<span style={{ color: 'var(--text-tertiary)' }}>Coming soon</span>
```

#### `--text-inverse` (zinc-950)
**Use for:**
- Text on light backgrounds
- Text on colored buttons
- Text on accent backgrounds

**Examples:**
```tsx
<button style={{ background: 'var(--accent-primary)', color: 'var(--text-inverse)' }}>
  Primary Action
</button>
```

## Migration Strategy

### Phase 1: Core UI Components (This Task)
1. Update all heading elements to use `--text-primary`
2. Update primary content to use `--text-primary`
3. Ensure metadata uses `--text-secondary`
4. Update button text colors for proper contrast

### Phase 2: Page-Level Components (Task 50)
1. Migrate dashboard pages
2. Migrate analytics pages
3. Migrate onboarding flows
4. Migrate settings pages

### Phase 3: Validation (Task 43)
1. Run property-based test for text color lightness
2. Verify WCAG AA compliance
3. Check visual consistency

## Implementation Approach

### Option 1: Inline Styles (Immediate)
```tsx
<h1 style={{ color: 'var(--text-primary)' }}>Title</h1>
```

**Pros:**
- Immediate, no CSS changes needed
- Explicit and clear
- Works with existing Tailwind classes

**Cons:**
- Verbose
- Harder to maintain

### Option 2: Utility Classes (Preferred)
```tsx
<h1 className="text-primary">Title</h1>
```

**Requires:** Adding utility classes to `globals.css` or Tailwind config

**Pros:**
- Clean, concise
- Consistent with Tailwind approach
- Easy to maintain

**Cons:**
- Requires CSS setup first

### Option 3: Component-Level Defaults
```tsx
// In component CSS module or styled component
h1, h2, h3, h4, h5, h6 {
  color: var(--text-primary);
}
```

**Pros:**
- Automatic for all headings
- Less repetition

**Cons:**
- Can be overridden accidentally
- Less explicit

### Recommended Approach

**For this task, use Option 1 (inline styles) for targeted updates.**

Rationale:
- Immediate impact
- No risk of breaking existing styles
- Clear and explicit
- Can be refactored to utility classes later

## Files to Update

### High Priority (Headings + Primary Content)

1. ✅ `components/analytics/PlatformComparisonChart.tsx`
2. ✅ `components/analytics/TopContentGrid.tsx`
3. ✅ `components/analytics/InsightsPanel.tsx`
4. ✅ `components/validation/ValidationHealthDashboard.tsx`
5. ✅ `components/onboarding/FeatureUnlockModal.tsx`
6. ✅ `components/onboarding/GoalSelection.tsx`
7. ✅ `components/onboarding/AIConfiguration.tsx`
8. ✅ `components/onboarding/PlatformConnection.tsx`
9. ✅ `components/onboarding/AdditionalPlatforms.tsx`
10. ✅ `components/onboarding/OnboardingWizard.tsx`
11. ✅ `components/onboarding/ProgressTracker.tsx`
12. ✅ `components/onboarding/FeatureCard.tsx`
13. ✅ `components/onboarding/SimplifiedOnboardingWizard.tsx`
14. ✅ `components/animations/LiveDashboard.tsx`

### Medium Priority (Secondary Text)

15. ✅ `components/layout/CenteredContainer.example.tsx`
16. ✅ `components/layout/SkeletonScreen.example.tsx`
17. ✅ `components/forms/FormExample.tsx`

### Low Priority (Already Mostly Correct)

- `components/ui/button.tsx` - ✅ Already correct
- `components/ui/Modal.tsx` - ✅ Already correct
- `components/integrations/IntegrationCard.tsx` - ✅ Already correct

## Success Criteria

✅ All headings (h1-h6) use `--text-primary`  
✅ Primary content uses `--text-primary`  
✅ Metadata and labels use `--text-secondary`  
✅ No hardcoded `text-gray-*` classes for primary content  
✅ Button text has appropriate contrast  
✅ All text meets WCAG AA contrast requirements (4.5:1)

## Next Steps

1. Update components listed above
2. Run property-based test (Task 43)
3. Visual QA check
4. Document changes in completion report

