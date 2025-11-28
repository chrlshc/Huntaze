# CSS Consolidation Plan

Generated: 2025-11-27T23:42:30.986Z

## Summary

- **Total CSS files**: 35
- **Total CSS size**: 179.46 KB
- **Duplicate properties found**: 143
- **Mobile CSS files**: 4
- **Inline styles found**: 265

## Duplicate CSS Properties

The following CSS properties are defined in multiple files and should be consolidated:

| Property | Files | Unique Values | Occurrences |
|----------|-------|---------------|-------------|
| `color` | 24 | 58 | 187 |
| `background` | 28 | 89 | 167 |
| `transform` | 23 | 41 | 131 |
| `font-size` | 19 | 34 | 120 |
| `display` | 21 | 10 | 107 |
| `padding` | 24 | 57 | 103 |
| `border-radius` | 24 | 31 | 97 |
| `opacity` | 21 | 9 | 82 |
| `animation` | 19 | 48 | 80 |
| `height` | 18 | 33 | 78 |
| `gap` | 17 | 21 | 72 |
| `font-weight` | 19 | 11 | 69 |
| `transition` | 23 | 47 | 66 |
| `width` | 20 | 24 | 65 |
| `position` | 18 | 4 | 63 |
| `align-items` | 19 | 3 | 60 |
| `border` | 21 | 23 | 55 |
| `box-shadow` | 23 | 39 | 55 |
| `line-height` | 15 | 11 | 53 |
| `margin-bottom` | 14 | 20 | 46 |

*Showing top 20 of 143 duplicate properties*

## Mobile CSS Files Analysis

The following mobile CSS files should be consolidated:

| File | Size | Media Queries | Viewport Fixes |
|------|------|---------------|----------------|
| /Users/765h/Huntaze/app/mobile.css | 6.56 KB | 6 | 1 |
| /Users/765h/Huntaze/app/mobile-optimized.css | 7.77 KB | 2 | 1 |
| /Users/765h/Huntaze/app/mobile-emergency-fix.css | 3.91 KB | 3 | 1 |
| /Users/765h/Huntaze/app/nuclear-mobile-fix.css | 3.46 KB | 3 | 0 |

**Consolidation Strategy:**
- Merge all mobile CSS files into `app/mobile.css`
- Remove duplicate viewport fixes
- Convert media queries to Tailwind responsive utilities where possible
- Use `@container` queries for component-level responsiveness

## Inline Styles Analysis

Found **265** inline style declarations in TSX/JSX files.

**Recommendation:**
- Convert inline styles to Tailwind utility classes
- Use CSS modules for complex component-specific styles
- Reserve inline styles only for dynamic values

## Consolidation Recommendations

### 1. Create Design Tokens File

Create `styles/design-tokens.css` with standardized values:
```css
:root {
  /* Background colors */
  --bg-primary: theme(colors.zinc.950);
  --bg-card: linear-gradient(to-br, rgba(255,255,255,0.03), transparent);
  
  /* Borders */
  --border-subtle: rgba(255,255,255,0.08);
  
  /* Shadows */
  --shadow-inner-glow: inset 0 1px 0 0 rgba(255,255,255,0.05);
  
  /* Text colors */
  --text-primary: theme(colors.zinc.100);
  --text-secondary: theme(colors.zinc.500);
  --text-accent: theme(colors.emerald.400);
}
```

### 2. Consolidate Mobile CSS

Merge mobile CSS files in this order:
1. /Users/765h/Huntaze/app/mobile.css
2. /Users/765h/Huntaze/app/mobile-optimized.css
3. /Users/765h/Huntaze/app/mobile-emergency-fix.css
4. /Users/765h/Huntaze/app/nuclear-mobile-fix.css

### 3. Refactor Glass Effects

Standardize glass effects to use:
- `bg-white/5` for background
- `backdrop-blur-xl` for blur
- `border-white/10` for borders

### 4. Priority Actions

1. **High Priority**: Consolidate mobile CSS files (saves space, reduces complexity)
2. **Medium Priority**: Create design tokens file (establishes consistency)
3. **Medium Priority**: Refactor top 10 duplicate properties
4. **Low Priority**: Convert inline styles to Tailwind (gradual improvement)

## All CSS Files

| File | Size | Properties | Selectors |
|------|------|------------|-----------|
| app/(app)/home/home.css | 6.20 KB | 128 | 42 |
| app/(app)/home/platform-status.css | 5.82 KB | 129 | 44 |
| app/(app)/home/quick-actions.css | 4.98 KB | 76 | 27 |
| app/(app)/home/recent-activity.css | 5.18 KB | 107 | 36 |
| app/(app)/integrations/integrations.css | 5.09 KB | 102 | 38 |
| app/(app)/onboarding/setup/onboarding-styles.css | 7.40 KB | 57 | 70 |
| app/(marketing)/beta/beta.css | 7.87 KB | 151 | 45 |
| app/animations.css | 4.34 KB | 83 | 42 |
| app/glass.css | 2.65 KB | 54 | 19 |
| app/globals.css | 5.31 KB | 96 | 41 |
| app/mobile-emergency-fix.css | 3.91 KB | 44 | 8 |
| app/mobile-optimized.css | 7.77 KB | 218 | 50 |
| app/mobile.css | 6.56 KB | 112 | 45 |
| app/nuclear-mobile-fix.css | 3.46 KB | 40 | 10 |
| app/responsive-enhancements.css | 10.28 KB | 121 | 63 |
| app/tailwind.css | 3.19 KB | 45 | 18 |
| styles/accessibility.css | 5.67 KB | 72 | 21 |
| styles/accessible-colors.css | 4.19 KB | 69 | 20 |
| styles/chat-interface.css | 49.00 B | 0 | 0 |
| styles/dashboard-shopify-tokens.css | 13.29 KB | 215 | 34 |
| styles/design-system.css | 12.78 KB | 200 | 41 |
| styles/globals.css | 3.32 KB | 23 | 29 |
| styles/huntaze-ai.css | 96.00 B | 0 | 0 |
| styles/hz-theme.css | 9.57 KB | 300 | 78 |
| styles/linear-design-tokens.css | 6.57 KB | 81 | 5 |
| styles/loading.css | 5.53 KB | 122 | 42 |
| styles/navigation.css | 2.91 KB | 82 | 23 |
| styles/premium-design-tokens.css | 6.76 KB | 71 | 9 |
| styles/simple-animations.css | 3.18 KB | 64 | 44 |
| styles/skeleton-animations.css | 2.81 KB | 46 | 25 |
| components/accessibility/skip-link.css | 1.02 KB | 20 | 5 |
| components/dashboard/Button.module.css | 2.80 KB | 65 | 17 |
| components/dashboard/GamifiedOnboarding.module.css | 3.17 KB | 81 | 19 |
| components/dashboard/GlobalSearch.module.css | 1.91 KB | 58 | 15 |
| components/landing/beta-stats-section.css | 3.82 KB | 67 | 19 |
