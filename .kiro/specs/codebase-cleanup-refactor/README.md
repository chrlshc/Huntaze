# Codebase Cleanup and Refactor

## Overview

This spec defines a comprehensive cleanup and refactoring initiative for the Huntaze codebase. Following the completion of major projects (dashboard-home-analytics-fix, dashboard-routing-fix, performance-optimization-aws), the codebase has accumulated technical debt that needs systematic cleanup.

## Goals

1. **CSS Consolidation**: Merge 4+ mobile CSS files, eliminate duplicate properties, establish "God Tier" design system
2. **Component Organization**: Consolidate 13+ duplicate components (shadow effects, neon canvas, atomic backgrounds)
3. **Documentation Cleanup**: Organize 100+ documentation files across 5 completed specs
4. **Configuration Management**: Consolidate 10+ environment files and document all configs
5. **Codebase Health**: Achieve 30%+ file reduction, zero CSS duplications, improved build times

## Design System

Based on the PUSH-COMPLETE guidelines, we're establishing a unified "God Tier" design system:

- **Background**: `bg-zinc-950` (not pure black)
- **Card Background**: `bg-gradient-to-br from-white/[0.03] to-transparent`
- **Borders**: `border-white/[0.08]` (subtle, not harsh)
- **Inner Glow**: `shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]`
- **Text**: Primary `text-zinc-100`, Secondary `text-zinc-500`, Accent `text-emerald-400`
- **Glassmorphism**: `bg-white/5 backdrop-blur-xl border-white/10`

## Key Deliverables

### Phase 1: Analysis (Non-Destructive)
- `cleanup-analysis-report.md` - File counts and recommendations
- `css-consolidation-plan.md` - CSS merge strategies
- `component-consolidation-plan.md` - Component mapping

### Phase 2: CSS Consolidation
- `styles/design-tokens.css` - Standardized design values
- Consolidated `app/mobile.css` (from 4 files)
- Refactored `app/glass.css` (Tailwind utilities)
- Minimized `app/animations.css`

### Phase 3: Component Organization
- `components/effects/ShadowEffect.tsx` (from 7 components)
- `components/effects/NeonCanvas.tsx` (from 3 components)
- `components/effects/AtomicBackground.tsx` (from 3 components)
- `components/debug/` (organized debug components)

### Phase 4-5: Documentation
- Each spec: Single `FINAL-REPORT.md`, archived task files
- Root: Consolidated deployment and getting started guides
- `docs/aws/` - Organized AWS documentation
- Bilingual organization (EN default, FR with `-FR` suffix)

### Phase 6: Configuration
- `ENV-GUIDE.md` - Environment file documentation
- `CONFIG-GUIDE.md` - TypeScript and build config documentation
- Consolidated `.env.example`
- Organized test configurations

### Phase 7: Verification
- `CLEANUP-REPORT.md` - Metrics and results
- Updated main `README.md`
- Maintenance guidelines

## Success Metrics

- **Files Removed**: 30%+ reduction in total file count
- **CSS Duplications**: Zero duplicate properties
- **Build Time**: Measurable improvement
- **Bundle Size**: Measurable CSS reduction
- **Import Health**: Zero broken imports
- **Build Success**: Clean build with no errors

## Getting Started

1. Review `requirements.md` for detailed acceptance criteria
2. Review `design.md` for architecture and implementation strategy
3. Follow `tasks.md` for step-by-step implementation
4. Run Phase 1 analysis scripts first (non-destructive)
5. Review analysis reports before proceeding with cleanup

## Safety Measures

- **Git Branch**: Create `cleanup/automated-YYYY-MM-DD` before starting
- **Incremental**: Commit after each major phase
- **Verification**: Checkpoints after CSS, components, and documentation phases
- **Rollback**: Clear rollback instructions if verification fails
- **Testing**: Property-based tests validate correctness at each phase

## Documentation

- `requirements.md` - User stories and acceptance criteria
- `design.md` - Architecture, components, and implementation phases
- `tasks.md` - Detailed implementation tasks with checkpoints

## Status

🚀 **Ready to Start** - All planning complete, awaiting execution

## Next Steps

Execute tasks in order:
1. Start with Phase 1 (Analysis) - generates reports without changes
2. Review analysis reports and approve consolidation plans
3. Proceed with Phase 2 (CSS) after approval
4. Continue through phases with checkpoints for verification
