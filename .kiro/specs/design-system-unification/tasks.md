# Implementation Plan: Design System Unification

## Overview
This implementation plan transforms the Huntaze application from its current state of visual inconsistency into a unified, professional design system. The existing `styles/design-tokens.css` provides a strong foundation with comprehensive tokens already defined. The focus is on:
1. Auditing and migrating existing components to use design tokens
2. Creating missing base components
3. Eliminating hardcoded colors and inconsistent styling
4. Establishing property-based tests for design consistency

## Current State Analysis
- ✅ Design tokens file exists with comprehensive token definitions
- ✅ Some UI components already use tokens (Button, Input)
- ❌ Many components use hardcoded colors (found 50+ instances)
- ❌ Inconsistent styling across pages (bg-gray-*, bg-zinc-* mixed usage)
- ❌ Card component uses hardcoded colors instead of tokens
- ❌ No design system documentation
- ❌ No automated tests for design consistency

---

## Tasks

- [x] 1. Audit and document current design token usage
  - Scan all component files for hardcoded colors and styles
  - Create a migration map showing which components need updates
  - Document current token coverage vs. requirements
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - ✅ **COMPLETE** - See TASK-1-COMPLETE.md for details

- [x] 2. Update Card component to use design tokens
  - Replace hardcoded `border-gray-700` with `--border-subtle`
  - Replace hardcoded `bg-gray-800` with `--bg-tertiary`
  - Add glass effect variant using `--bg-glass` tokens
  - Add hover states using token-based transitions
  - _Requirements: 1.2, 3.2, 3.3, 4.3_
  - ✅ **COMPLETE** - See TASK-2-COMPLETE.md for details

- [x] 3. Create Container layout component
  - Implement max-width variants (sm, md, lg, xl, full)
  - Use spacing tokens for padding
  - Support responsive behavior with breakpoint tokens
  - _Requirements: 5.1, 5.2, 7.1, 7.2_
  - ✅ **COMPLETE** - See TASK-3-COMPLETE.md for details

- [x] 4. Create PageLayout component
  - Implement consistent page header with title/subtitle
  - Use typography tokens for text hierarchy
  - Include optional actions slot
  - Apply consistent spacing using spacing tokens
  - _Requirements: 5.1, 1.4, 1.5_
  - ✅ **COMPLETE** - See TASK-4-COMPLETE.md for details

- [x] 5. Create Modal component with design tokens
  - Use `--z-modal` and `--z-modal-backdrop` for layering
  - Apply glass effect using `--bg-glass` and `--blur-xl`
  - Use border and shadow tokens
  - Implement consistent animations with `--transition-base`
  - _Requirements: 4.4, 6.1, 6.4, 6.5_
  - ✅ **COMPLETE** - See TASK-5-COMPLETE.md for details

- [ ] 6. Create Alert/Toast component
  - Implement variants (success, warning, error, info) using accent tokens
  - Use consistent border radius and spacing
  - Apply fade-in animation with standard duration
  - _Requirements: 5.5, 6.1, 6.5_

- [x] 7. Migrate dashboard pages to use design tokens
  - Update all `bg-zinc-950` references to use `--bg-primary`
  - Replace inline glass effects with `.glass-card` utility class
  - Update border colors to use `--border-subtle`
  - Ensure consistent spacing using spacing tokens
  - _Requirements: 3.1, 3.2, 3.3, 1.1, 1.5_
  - ✅ **COMPLETE** - See TASK-7-COMPLETE.md for details

- [x] 8. Migrate analytics pages to use design tokens
  - Update all inline styles to use CSS classes
  - Replace hardcoded colors with design token variables
  - Ensure consistent spacing using spacing tokens
  - Create comprehensive unit tests for validation
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 3.3_
  - ✅ **COMPLETE** - See TASK-8-COMPLETE.md for details

- [x] 9. Migrate component library to eliminate hardcoded colors
  - Update PhoneMockup3D.tsx to use design tokens
  - Update AtomicBackground.tsx to use accent color tokens
  - Update ShadowEffect.tsx to use color palette tokens
  - Update all animation components to use transition tokens
  - _Requirements: 2.2, 3.5, 6.5_
  - ✅ **COMPLETE** - See TASK-11-COMPLETE.md for details

- [ ] 9. Create responsive utility classes
  - Add mobile-specific utility classes using breakpoint tokens
  - Ensure touch target sizes meet 44x44px minimum
  - Create responsive spacing utilities
  - _Requirements: 7.1, 7.3, 7.4, 7.5_

- [ ] 10. Write property test for background color consistency
  - **Property 1: Background Color Consistency**
  - **Validates: Requirements 1.1**
  - Test that all dashboard pages use `--bg-primary` token
  - Scan TSX files for hardcoded background colors

- [ ] 11. Write property test for glass effect consistency
  - **Property 2: Glass Effect Consistency**
  - **Validates: Requirements 1.2, 3.2**
  - Test that all cards use standardized glass effect token
  - Verify backdrop-filter and border values match tokens

- [ ] 12. Write property test for button hover consistency
  - **Property 3: Button Hover Consistency**
  - **Validates: Requirements 1.3**
  - Test that all button hover transitions use standard animation duration
  - Verify transition timing matches `--transition-base`

- [ ] 13. Write property test for typography token usage
  - **Property 4: Typography Hierarchy Consistency**
  - **Validates: Requirements 1.4**
  - Test that font sizes reference typography tokens
  - Scan for hardcoded font-size values

- [ ] 14. Write property test for spacing consistency
  - **Property 5: Spacing Consistency**
  - **Validates: Requirements 1.5**
  - Test that padding/margin values reference spacing tokens
  - Verify no arbitrary spacing values exist

- [ ] 15. Write property test for no hardcoded colors
  - **Property 6: No Hardcoded Colors**
  - **Validates: Requirements 2.2**
  - Scan all CSS and styled components for hex/rgb values
  - Verify all colors reference design tokens

- [ ] 16. Write property test for spacing scale adherence
  - **Property 7: Spacing Scale Adherence**
  - **Validates: Requirements 2.3**
  - Test that all spacing values match standardized scale
  - Flag any non-standard spacing values

- [ ] 17. Write property test for font token usage
  - **Property 8: Font Token Usage**
  - **Validates: Requirements 2.4**
  - Test that font-family and font-size declarations reference tokens
  - Scan for inline font declarations

- [ ] 18. Write property test for effect token usage
  - **Property 9: Effect Token Usage**
  - **Validates: Requirements 2.5**
  - Test that box-shadow and backdrop-filter reference tokens
  - Verify no hardcoded shadow values

- [ ] 19. Write property test for dashboard background uniformity
  - **Property 10: Dashboard Background Uniformity**
  - **Validates: Requirements 3.1**
  - Test that all dashboard pages have zinc-950 background
  - Verify consistent use of `--bg-primary`

- [ ] 20. Write property test for border color consistency
  - **Property 11: Border Color Consistency**
  - **Validates: Requirements 3.3**
  - Test that border colors use `--border-subtle` token
  - Scan for hardcoded border colors

- [ ] 21. Write property test for inner glow consistency
  - **Property 12: Inner Glow Consistency**
  - **Validates: Requirements 3.4**
  - Test that interactive elements use `--shadow-inner-glow`
  - Verify consistent glow effect application

- [ ] 22. Write property test for color palette restriction
  - **Property 13: Color Palette Restriction**
  - **Validates: Requirements 3.5**
  - Test that only approved palette colors are used
  - Flag any colors not in design token definitions

- [ ] 23. Write property test for button component usage
  - **Property 14: Button Component Usage**
  - **Validates: Requirements 4.1**
  - Test that button elements use Button component
  - Scan for raw <button> tags without component wrapper

- [ ] 24. Write property test for input component usage
  - **Property 15: Input Component Usage**
  - **Validates: Requirements 4.2**
  - Test that input elements use Input component
  - Verify consistent input styling

- [ ] 25. Write property test for card component usage
  - **Property 16: Card Component Usage**
  - **Validates: Requirements 4.3**
  - Test that card-like containers use Card component
  - Identify divs that should be Cards

- [ ] 26. Write property test for fade-in animation consistency
  - **Property 17: Fade-in Animation Consistency**
  - **Validates: Requirements 6.1**
  - Test that fade-in animations use standard duration
  - Verify animation timing tokens

- [ ] 27. Write property test for hover transition timing
  - **Property 18: Hover Transition Timing**
  - **Validates: Requirements 6.2**
  - Test that hover transitions use approved duration tokens
  - Scan for custom transition durations

- [ ] 28. Write property test for loading state consistency
  - **Property 19: Loading State Consistency**
  - **Validates: Requirements 6.3**
  - Test that loading indicators use standardized component
  - Verify consistent loading patterns

- [ ] 29. Write property test for animation timing standardization
  - **Property 20: Animation Timing Standardization**
  - **Validates: Requirements 6.5**
  - Test that CSS transitions reference animation duration tokens
  - Flag custom timing functions

- [ ] 30. Write property test for mobile breakpoint consistency
  - **Property 21: Mobile Breakpoint Consistency**
  - **Validates: Requirements 7.1**
  - Test that media queries match standardized breakpoints
  - Verify no custom breakpoint values

- [ ] 31. Write property test for touch target size compliance
  - **Property 22: Touch Target Size Compliance**
  - **Validates: Requirements 7.4**
  - Test that interactive elements meet 44x44px minimum
  - Scan for undersized touch targets

- [ ] 32. Create design system documentation
  - Document all available design tokens with examples
  - Create component usage guide with code examples
  - Document design principles and "God Tier" aesthetic
  - Include do's and don'ts for developers
  - Add accessibility guidelines
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 33. Create visual regression test baseline
  - Capture screenshots of all major components
  - Document expected visual appearance
  - Set up comparison workflow for future changes
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 34. Final checkpoint - Ensure all tests pass
  - Run all property-based tests
  - Verify visual consistency across pages
  - Check accessibility compliance
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

### Testing Strategy
- Property-based tests use `fast-check` library with minimum 100 iterations
- Each test is tagged with: `**Feature: design-system-unification, Property {number}: {property_text}**`
- Tests focus on static analysis of code files to verify token usage
- Visual regression tests provide additional validation

### Migration Approach
- Gradual migration: new pages use design system immediately
- Existing pages migrated incrementally (Task 7)
- Both old and new styles coexist temporarily
- No breaking changes to existing functionality

### Success Criteria
- Zero hardcoded colors in component files
- All dashboard pages use consistent background
- All components reference design tokens
- All property tests passing
- Documentation complete and accessible
