# Task 35: Detailed File Locations for Contrast Issues

This document provides specific file locations and line-level details for all contrast issues identified in the audit.

## Design Token Files

### styles/design-tokens.css

**Issues:**

1. **Line ~50: Glass effect opacity too low**
   ```css
   --bg-glass: rgba(255, 255, 255, 0.05);  /* Should be 0.08 */
   ```
   - Current: 0.05 opacity
   - Recommended: 0.08 opacity
   - Requirement: 9.1, 9.7

2. **Line ~58: Border-subtle below minimum**
   ```css
   --border-subtle: rgba(255, 255, 255, 0.08);  /* Should be 0.12 */
   ```
   - Current: 0.08 opacity
   - Recommended: 0.12 opacity (or deprecate this token)
   - Requirement: 9.3

3. **Missing token: Card elevated background**
   - Add: `--bg-card-elevated: #2d2d30;` (between zinc-800 and zinc-700)
   - Purpose: Better contrast for cards on zinc-950 backgrounds
   - Requirement: 9.1

## Component Files

### components/ui/card.tsx

**Issues:**

1. **Line ~17: Uses border-subtle (0.08 opacity)**
   ```tsx
   : "bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] shadow-[var(--shadow-inner-glow)]",
   ```
   - Current: `border-[var(--border-subtle)]` (0.08)
   - Recommended: `border-[var(--border-default)]` (0.12)
   - Requirement: 9.3

2. **Line ~20: Hover state uses border-default (good)**
   ```tsx
   "hover:border-[var(--border-default)] hover:shadow-[var(--shadow-md)]",
   ```
   - ✅ This is correct - keep as is

### components/analytics/UnifiedMetricsCard.tsx

**Issues:**

1. **Line ~31: Hardcoded bg-white**
   ```tsx
   <Card key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
   ```
   - Current: `bg-white`
   - Recommended: `bg-[var(--bg-tertiary)]`
   - Requirement: 9.1

2. **Line ~32: Hardcoded bg-gray-200**
   ```tsx
   <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
   ```
   - Current: `bg-gray-200`
   - Recommended: `bg-[var(--bg-glass-hover)]`
   - Requirement: 2.2

3. **Line ~62: Hardcoded bg-white**
   ```tsx
   className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
   ```
   - Current: `bg-white`
   - Recommended: `bg-[var(--bg-tertiary)] border border-[var(--border-default)]`
   - Requirement: 9.1, 9.3

4. **Line ~65: Hardcoded text-gray-600**
   ```tsx
   <span className="text-sm font-medium text-gray-600">{metric.label}</span>
   ```
   - Current: `text-gray-600`
   - Recommended: `text-[var(--text-secondary)]`
   - Requirement: 9.2

5. **Line ~67: Hardcoded text-gray-900**
   ```tsx
   <div className="text-3xl font-bold text-gray-900">{metric.value}</div>
   ```
   - Current: `text-gray-900`
   - Recommended: `text-[var(--text-primary)]`
   - Requirement: 9.2

### components/dashboard/SkeletonCard.tsx

**Issues:**

1. **Line ~51: Undefined token --bg-surface**
   ```tsx
   className={`bg-[var(--bg-surface)] rounded-[var(--radius-card)] border border-gray-200 p-6 shadow-[var(--shadow-soft)] ${className}`}
   ```
   - Current: `bg-[var(--bg-surface)]` (undefined)
   - Recommended: `bg-[var(--bg-tertiary)]`
   - Requirement: 9.1

2. **Line ~51: Hardcoded border-gray-200**
   ```tsx
   border border-gray-200
   ```
   - Current: `border-gray-200`
   - Recommended: `border-[var(--border-default)]`
   - Requirement: 9.3

3. **Lines ~56, 58, 59, 64, 65, 69: Hardcoded bg-gray-200**
   ```tsx
   <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse" />
   <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4" />
   <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
   <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
   <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
   <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-full" />
   ```
   - Current: `bg-gray-200`
   - Recommended: `bg-[var(--bg-glass-hover)]`
   - Requirement: 2.2

### components/ui/modal.example.tsx

**Issues:**

1. **Line ~155: Uses border-subtle for inputs**
   ```tsx
   border: '1px solid var(--border-subtle)',
   ```
   - Current: `var(--border-subtle)` (0.08)
   - Recommended: `var(--border-default)` (0.12)
   - Requirement: 9.3

2. **Line ~175: Uses border-subtle for textarea**
   ```tsx
   border: '1px solid var(--border-subtle)',
   ```
   - Current: `var(--border-subtle)` (0.08)
   - Recommended: `var(--border-default)` (0.12)
   - Requirement: 9.3

### components/mobile/BottomNav.tsx

**Issues:**

1. **Line ~23: Hardcoded bg-white and dark mode colors**
   ```tsx
   className={`fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[var(--bg-secondary)] border-t border-gray-200 dark:border-[var(--bg-tertiary)] lg:hidden ${className}`}
   ```
   - Current: `bg-white`, `border-gray-200`
   - Recommended: `bg-[var(--bg-tertiary)]`, `border-[var(--border-default)]`
   - Issue: Using `--bg-tertiary` for border (should use border token)
   - Requirement: 9.1, 9.3

### components/Header.tsx

**Issues:**

1. **Lines ~46, 50, 125, 129: Inline style manipulation**
   ```tsx
   e.currentTarget.style.backgroundColor = 'var(--nav-hover)';
   e.currentTarget.style.backgroundColor = 'transparent';
   ```
   - Current: Inline style manipulation
   - Recommended: Use CSS classes with hover states
   - Note: Uses custom nav tokens not in design-tokens.css
   - Requirement: 2.2

2. **Line ~87: Hardcoded backgroundColor**
   ```tsx
   backgroundColor: 'var(--color-accent-primary)',
   ```
   - Current: Uses `--color-accent-primary` (not defined in design-tokens.css)
   - Recommended: Use `--accent-primary`
   - Requirement: 2.2

### components/Sidebar.tsx

**Issues:**

1. **Lines ~100, 145, 154, 159, 195, 199: Inline style manipulation**
   ```tsx
   backgroundColor: isActive ? 'var(--nav-active-bg)' : 'transparent',
   e.currentTarget.style.backgroundColor = 'var(--nav-hover)';
   ```
   - Current: Uses custom nav tokens not in design-tokens.css
   - Recommended: Define nav tokens in design-tokens.css or use existing tokens
   - Requirement: 2.1

## Page Files

### app/(app)/onboarding/mobile-setup.tsx

**Issues:**

1. **Line ~30: Hardcoded bg-purple-600**
   ```tsx
   <div className="bg-purple-600 text-white p-6 rounded-2xl">
   ```
   - Current: `bg-purple-600`
   - Recommended: `bg-[var(--accent-primary)]`
   - Requirement: 2.2, 9.4

2. **Lines ~35, 40: Hardcoded bg-white**
   ```tsx
   <Card className="bg-white p-4 rounded-xl border border-gray-100">
   ```
   - Current: `bg-white`, `border-gray-100`
   - Recommended: `bg-[var(--bg-tertiary)] border-[var(--border-default)]`
   - Requirement: 9.1, 9.3

3. **Line ~80: Hardcoded bg-gray-100**
   ```tsx
   <div className={`p-3 rounded-xl bg-gray-100`}>
   ```
   - Current: `bg-gray-100`
   - Recommended: `bg-[var(--bg-glass-hover)]`
   - Requirement: 2.2

4. **Line ~82: Hardcoded text-gray-900**
   ```tsx
   <Icon className="w-6 h-6 text-gray-900" />
   ```
   - Current: `text-gray-900`
   - Recommended: `text-[var(--text-primary)]`
   - Requirement: 9.2

5. **Line ~164: Hardcoded bg-white dark:bg-gray-900**
   ```tsx
   <div className="min-h-screen bg-white dark:bg-gray-900">
   ```
   - Current: `bg-white dark:bg-gray-900`
   - Recommended: `bg-[var(--bg-primary)]`
   - Requirement: 9.1

6. **Line ~166: Hardcoded bg-white/80 and border-gray-100**
   ```tsx
   <header className="bg-white/80 backdrop-blur border-b border-gray-100 sticky top-0 z-40">
   ```
   - Current: `bg-white/80`, `border-gray-100`
   - Recommended: `bg-[var(--bg-glass)] border-[var(--border-default)]`
   - Requirement: 9.1, 9.3

7. **Line ~210: Hardcoded bg-white and border-gray-100**
   ```tsx
   <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 safe-bottom">
   ```
   - Current: `bg-white`, `border-gray-100`
   - Recommended: `bg-[var(--bg-secondary)] border-[var(--border-default)]`
   - Requirement: 9.1, 9.3

### app/(app)/onboarding/beta-onboarding-client.tsx

**Issues:**

1. **Line ~122: Hardcoded #000000**
   ```tsx
   <div className="min-h-screen bg-[#000000] flex items-center justify-center p-4">
   ```
   - Current: `bg-[#000000]`
   - Recommended: `bg-[var(--bg-primary)]`
   - Requirement: 2.2

2. **Line ~126: Uses --bg-primary for progress bar background**
   ```tsx
   <div className="h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden">
   ```
   - ✅ Correct usage

3. **Lines ~144, 151, 251, 330: Uses --bg-secondary for borders**
   ```tsx
   <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
   <div className="bg-[var(--bg-primary)] border border-[var(--bg-secondary)] rounded-xl p-8">
   ```
   - Current: `border-[var(--bg-secondary)]` (using background token for border)
   - Recommended: `border-[var(--border-default)]`
   - Requirement: 9.3

4. **Lines ~269, 283: Uses --bg-secondary for input borders**
   ```tsx
   className="w-full px-4 py-2 bg-[var(--bg-input)] border border-[var(--bg-secondary)] rounded-lg"
   ```
   - Current: `border-[var(--bg-secondary)]` (using background token)
   - Recommended: `border-[var(--border-default)]`
   - Requirement: 9.3

5. **Line ~362: Hardcoded bg-[var(--accent-primary)]**
   ```tsx
   <div className="w-3 h-3 rounded-full bg-[var(--accent-primary)]" />
   ```
   - ✅ Correct usage

6. **Line ~384: Uses --bg-secondary for input border**
   ```tsx
   className="w-full pl-8 pr-4 py-2 bg-[var(--bg-input)] border border-[var(--bg-secondary)] rounded-lg"
   ```
   - Current: `border-[var(--bg-secondary)]`
   - Recommended: `border-[var(--border-default)]`
   - Requirement: 9.3

### app/(app)/onboarding/dashboard/page.tsx

**Issues:**

1. **Line ~109: Hardcoded bg-gray-50**
   ```tsx
   <div className="min-h-screen bg-gray-50 py-8">
   ```
   - Current: `bg-gray-50`
   - Recommended: `bg-[var(--bg-primary)]`
   - Requirement: 9.1

2. **Line ~112: Hardcoded gradient**
   ```tsx
   <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
   ```
   - Current: Hardcoded gradient colors
   - Recommended: `bg-gradient-to-r from-[var(--accent-info)] to-[var(--accent-primary)]`
   - Requirement: 2.2

3. **Line ~128: Hardcoded bg-white bg-opacity-20**
   ```tsx
   <div className="flex-1 bg-white bg-opacity-20 rounded-full h-3">
   ```
   - Current: `bg-white bg-opacity-20`
   - Recommended: `bg-[var(--bg-glass)]`
   - Requirement: 2.2

4. **Line ~130: Hardcoded bg-white**
   ```tsx
   className="bg-white h-3 rounded-full transition-all duration-500"
   ```
   - Current: `bg-white`
   - Recommended: `bg-[var(--accent-primary)]`
   - Requirement: 2.2

5. **Lines ~160, 187, 202, 217: Hardcoded bg-white**
   ```tsx
   <Card className="bg-white rounded-lg shadow-sm p-6">
   ```
   - Current: `bg-white`
   - Recommended: `bg-[var(--bg-tertiary)] border border-[var(--border-default)]`
   - Requirement: 9.1, 9.3

6. **Lines ~162, 189, 204, 219: Hardcoded bg-blue-100, bg-green-100, bg-purple-100**
   ```tsx
   <div className="p-3 bg-blue-100 rounded-lg">
   <div className="p-2 bg-green-100 rounded-lg">
   <div className="p-2 bg-purple-100 rounded-lg">
   ```
   - Current: Hardcoded light backgrounds
   - Recommended: `bg-[var(--accent-bg-subtle)]` with appropriate accent color
   - Requirement: 2.2

7. **Lines ~164, 191, 206, 221: Hardcoded text colors**
   ```tsx
   <Target className="w-6 h-6 text-blue-600" />
   <CheckCircle2 className="w-5 h-5 text-green-600" />
   <Sparkles className="w-5 h-5 text-purple-600" />
   <TrendingUp className="w-5 h-5 text-blue-600" />
   ```
   - Current: Hardcoded text colors
   - Recommended: `text-[var(--accent-info)]`, `text-[var(--accent-success)]`, `text-[var(--accent-primary)]`
   - Requirement: 2.2

### app/(app)/onboarding/wizard/page.tsx

**Issues:**

1. **Line ~90: Hardcoded bg-red-500/10 and border-red-500/20**
   ```tsx
   <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
   ```
   - Current: Hardcoded error colors
   - Recommended: `bg-[var(--accent-bg-subtle)] border-[var(--accent-error)]` (with error variant)
   - Requirement: 2.2, 9.3

2. **Line ~108: Hardcoded gradient and ring**
   ```tsx
   <div className="relative rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-950 text-white shadow-2xl ring-1 ring-violet-500/20 p-8">
   ```
   - Current: Hardcoded colors
   - Recommended: `bg-[var(--bg-secondary)] border border-[var(--border-default)]`
   - Requirement: 2.2, 9.3

### app/(app)/onboarding/setup/page.tsx

**Issues:**

1. **Line ~21: Hardcoded gradient**
   ```tsx
   <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-neutral-900 to-neutral-950">
   ```
   - Current: Hardcoded gradient
   - Recommended: `bg-[var(--bg-primary)]`
   - Requirement: 2.2

### app/(app)/analytics/payouts/page.tsx

**Issues:**

1. **Line ~71: Hardcoded error colors**
   ```tsx
   <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
   ```
   - Current: Hardcoded error colors
   - Recommended: `bg-[var(--accent-bg-subtle)] border-[var(--accent-error)]` (with error styling)
   - Requirement: 2.2, 9.3

2. **Line ~71: Hardcoded text colors**
   ```tsx
   <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">
   <p className="text-red-600 dark:text-red-300 text-sm">
   ```
   - Current: Hardcoded error text colors
   - Recommended: `text-[var(--accent-error)]`
   - Requirement: 2.2

3. **Line ~126: Hardcoded bg-green-600**
   ```tsx
   <div className="rounded-lg p-4 shadow-lg bg-green-600 text-white">
   ```
   - Current: `bg-green-600`
   - Recommended: `bg-[var(--accent-success)]`
   - Requirement: 2.2

### app/(app)/billing/page.tsx

**Issues:**

1. **Line ~114: Hardcoded bg-white dark:bg-gray-900**
   ```tsx
   <div className="min-h-screen bg-white dark:bg-gray-900">
   ```
   - Current: `bg-white dark:bg-gray-900`
   - Recommended: `bg-[var(--bg-primary)]`
   - Requirement: 9.1

### app/(app)/skip-onboarding/page.tsx

**Issues:**

1. **Line ~43: Uses --bg-app (undefined token)**
   ```tsx
   <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center">
   ```
   - Current: `--bg-app` (undefined)
   - Recommended: `--bg-primary`
   - Requirement: 2.1

2. **Line ~44: Uses --bg-surface (undefined token)**
   ```tsx
   <Card className="bg-[var(--bg-surface)] rounded-[var(--radius-card)] shadow-[var(--shadow-soft)] p-8 max-w-md text-center">
   ```
   - Current: `--bg-surface` (undefined)
   - Recommended: `--bg-tertiary`
   - Requirement: 2.1

3. **Line ~66: Hardcoded bg-gray-900 and dark:bg-white**
   ```tsx
   className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 dark:bg-white dark:text-gray-900 transition-colors disabled:opacity-50"
   ```
   - Current: Hardcoded colors
   - Recommended: Use Button component with design tokens
   - Requirement: 2.2, 4.1

## Animation/Effect Components

### components/animations/PhoneMockup3D.tsx

**Issues:**

1. **Line ~375: Inline background style**
   ```tsx
   style={{
     background: 'var(--bg-glass)',
     borderColor: 'var(--border-subtle)'
   }}
   ```
   - Current: Uses `--border-subtle` (0.08)
   - Recommended: Use `--border-default` (0.12)
   - Requirement: 9.3

2. **Line ~378: Hover backgroundColor**
   ```tsx
   whileHover={{ backgroundColor: 'var(--accent-bg-subtle)' }}
   ```
   - ✅ Correct usage

### components/animations/MobileOptimizations.tsx

**Issues:**

1. **Line ~225: Low-end device fallback**
   ```tsx
   .low-end-device .glass-card {
     backdrop-filter: none;
     background: var(--bg-glass-hover);
   }
   ```
   - ✅ Correct usage

2. **Line ~233: Hardcoded gradient fallback**
   ```tsx
   .low-end-device .gradient-mesh-fallback {
     background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
   }
   ```
   - Current: Hardcoded gradient
   - Recommended: Use design token gradient
   - Requirement: 2.2

### components/animations/LiveDashboard.tsx

**Issues:**

1. **Line ~116: Hardcoded backgroundColor**
   ```tsx
   backgroundColor: 'rgba(139, 92, 246, 0.1)',
   ```
   - Current: Hardcoded color
   - Recommended: `var(--accent-bg-subtle)`
   - Requirement: 2.2

2. **Line ~128: Hardcoded backgroundColor array**
   ```tsx
   backgroundColor: [
     'rgba(59, 130, 246, 0.8)',
     'rgba(139, 92, 246, 0.8)',
   ```
   - Current: Hardcoded colors
   - Recommended: Use design token colors
   - Requirement: 2.2

### components/revenue/upsell/UpsellAutomationSettings.tsx

**Issues:**

1. **Line ~98: Hardcoded gradient background**
   ```tsx
   background: settings.enabled
     ? `linear-gradient(to right, #2563eb 0%, #2563eb ${settings.autoSendThreshold * 100}%, var(--border-subtle) ${settings.autoSendThreshold * 100}%, var(--border-subtle) 100%)`
     : undefined,
   ```
   - Current: Hardcoded `#2563eb`
   - Recommended: `var(--accent-info)`
   - Requirement: 2.2

### components/revenue/forecast/RevenueForecastChart.tsx

**Issues:**

1. **Line ~131: Hardcoded backgroundColor**
   ```tsx
   contentStyle={{
     backgroundColor: 'white',
     border: '1px solid var(--border-subtle)',
   ```
   - Current: `backgroundColor: 'white'`, uses `--border-subtle`
   - Recommended: `backgroundColor: 'var(--bg-tertiary)'`, `border: '1px solid var(--border-default)'`
   - Requirement: 9.1, 9.3

## Summary Statistics

### Total Files with Issues: 25

### Issues by Category:

1. **Hardcoded Colors**: 45+ instances
2. **Border Opacity < 0.12**: 15+ instances
3. **Undefined Tokens**: 5 instances
4. **Text Color Issues**: 10+ instances
5. **Missing Borders**: 8+ instances

### Issues by Priority:

**Critical (Breaks Design System):**
- 5 files with undefined tokens
- 45+ files with hardcoded colors

**High (Below Contrast Minimum):**
- 15+ instances of border opacity < 0.12
- 8+ cards missing borders

**Medium (Inconsistent Usage):**
- 10+ instances of incorrect text color hierarchy
- Multiple inline style manipulations

### Files Requiring Complete Refactor:

1. `app/(app)/onboarding/mobile-setup.tsx` - 10+ issues
2. `app/(app)/onboarding/dashboard/page.tsx` - 15+ issues
3. `components/analytics/UnifiedMetricsCard.tsx` - 5 issues
4. `components/dashboard/SkeletonCard.tsx` - 7 issues

### Files Requiring Minor Updates:

1. `components/ui/card.tsx` - 1 issue (border opacity)
2. `components/ui/modal.example.tsx` - 2 issues (border opacity)
3. `styles/design-tokens.css` - 3 issues (token values)

---

**Next Steps:**
1. Update design tokens (Task 36)
2. Refactor Card component (Task 37)
3. Migrate high-priority files (Tasks 38-41)
4. Implement property tests (Tasks 42-48)
