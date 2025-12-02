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

- [X] 6. Create Alert/Toast component
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

- [x] 9.1 Create responsive utility classes
  - Add mobile-specific utility classes using breakpoint tokens
  - Ensure touch target sizes meet 44x44px minimum
  - Create responsive spacing utilities
  - _Requirements: 7.1, 7.3, 7.4, 7.5_
  - ✅ **COMPLETE** - See TASK-12-COMPLETE.md for details

- [x] 10. Write property test for background color consistency
  - **Property 1: Background Color Consistency**
  - **Validates: Requirements 1.1**
  - Test that all dashboard pages use `--bg-primary` token
  - Scan TSX files for hardcoded background colors
  - ✅ **COMPLETE** - See TASK-10-COMPLETE.md for details

- [x] 11. Write property test for glass effect consistency
  - **Property 2: Glass Effect Consistency**
  - **Validates: Requirements 1.2, 3.2**
  - Test that all cards use standardized glass effect token
  - Verify backdrop-filter and border values match tokens
  - ✅ **COMPLETE** - See TASK-11-GLASS-EFFECT-TEST-COMPLETE.md for details

- [x] 12. Write property test for button hover consistency
  - **Property 3: Button Hover Consistency**
  - **Validates: Requirements 1.3**
  - Test that all button hover transitions use standard animation duration
  - Verify transition timing matches `--transition-base`
  - ✅ **COMPLETE** - See TASK-12-BUTTON-HOVER-TEST-COMPLETE.md for details

- [x] 13. Write property test for typography token usage
  - **Property 4: Typography Hierarchy Consistency**
  - **Validates: Requirements 1.4**
  - Test that font sizes reference typography tokens
  - Scan for hardcoded font-size values
  - ✅ **COMPLETE** - See TASK-13-COMPLETE.md for details

- [x] 14. Write property test for spacing consistency
  - **Property 5: Spacing Consistency**
  - **Validates: Requirements 1.5**
  - Test that padding/margin values reference spacing tokens
  - Verify no arbitrary spacing values exist
  - ✅ **COMPLETE** - See TASK-14-COMPLETE.md for details

- [x] 15. Write property test for no hardcoded colors
  - **Property 6: No Hardcoded Colors**
  - **Validates: Requirements 2.2**
  - Scan all CSS and styled components for hex/rgb values
  - Verify all colors reference design tokens
  - ✅ **COMPLETE** - See TASK-15-COMPLETE.md for details

- [x] 16. Write property test for spacing scale adherence
  - **Property 7: Spacing Scale Adherence**
  - **Validates: Requirements 2.3**
  - Test that all spacing values match standardized scale
  - Flag any non-standard spacing values
  - ✅ **COMPLETE** - See TASK-16-COMPLETE.md for details

- [x] 17. Write property test for font token usage
  - **Property 8: Font Token Usage**
  - **Validates: Requirements 2.4**
  - Test that font-family and font-size declarations reference tokens
  - Scan for inline font declarations
  - ✅ **COMPLETE** - See TASK-17-COMPLETE.md for details

- [x] 18. Write property test for effect token usage
  - **Property 9: Effect Token Usage**
  - **Validates: Requirements 2.5**
  - Test that box-shadow and backdrop-filter reference tokens
  - Verify no hardcoded shadow values
  - ✅ **COMPLETE** - See TASK-18-COMPLETE.md for details

- [x] 19. Write property test for dashboard background uniformity
  - **Property 10: Dashboard Background Uniformity**
  - **Validates: Requirements 3.1**
  - Test that all dashboard pages have zinc-950 background
  - Verify consistent use of `--bg-primary`
  - ✅ **COMPLETE** - See TASK-19-COMPLETE.md for details

- [x] 20. Write property test for border color consistency
  - **Property 11: Border Color Consistency**
  - **Validates: Requirements 3.3**
  - Test that border colors use `--border-subtle` token
  - Scan for hardcoded border colors
  - ✅ **COMPLETE** - See TASK-20-COMPLETE.md for details

- [x] 21. Write property test for inner glow consistency
  - **Property 12: Inner Glow Consistency**
  - **Validates: Requirements 3.4**
  - Test that interactive elements use `--shadow-inner-glow`
  - Verify consistent glow effect application
  - ✅ **COMPLETE** - See TASK-21-COMPLETE.md for details

- [x] 22. Write property test for color palette restriction
  - **Property 13: Color Palette Restriction**
  - **Validates: Requirements 3.5**
  - Test that only approved palette colors are used
  - Flag any colors not in design token definitions
  - ✅ **COMPLETE** - See TASK-22-COMPLETE.md for details

- [x] 23. Write property test for button component usage
  - **Property 14: Button Component Usage**
  - **Validates: Requirements 4.1**
  - Test that button elements use Button component
  - Scan for raw <button> tags without component wrapper
  - ✅ **COMPLETE** - See TASK-23-COMPLETE.md for details

- [x] 24. Write property test for input component usage
  - **Property 15: Input Component Usage**
  - **Validates: Requirements 4.2**
  - Test that input elements use Input component
  - Verify consistent input styling
  - ✅ **COMPLETE** - See TASK-24-COMPLETE.md for details

- [x] 25. Write property test for card component usage
  - **Property 16: Card Component Usage**
  - **Validates: Requirements 4.3**
  - Test that card-like containers use Card component
  - Identify divs that should be Cards
  - ✅ **COMPLETE** - See TASK-25-COMPLETE.md for details

- [x] 26. Write property test for fade-in animation consistency
  - **Property 17: Fade-in Animation Consistency**
  - **Validates: Requirements 6.1**
  - Test that fade-in animations use standard duration
  - Verify animation timing tokens
  - ✅ **COMPLETE** - See TASK-26-COMPLETE.md for details

- [x] 27. Write property test for hover transition timing
  - **Property 18: Hover Transition Timing**
  - **Validates: Requirements 6.2**
  - Test that hover transitions use approved duration tokens
  - Scan for custom transition durations
  - ✅ **COMPLETE** - See TASK-27-COMPLETE.md for details

- [x] 28. Write property test for loading state consistency
  - **Property 19: Loading State Consistency**
  - **Validates: Requirements 6.3**
  - Test that loading indicators use standardized component
  - Verify consistent loading patterns
  - ✅ **COMPLETE** - See TASK-28-COMPLETE.md for details

- [x] 29. Write property test for animation timing standardization
  - **Property 20: Animation Timing Standardization**
  - **Validates: Requirements 6.5**
  - Test that CSS transitions reference animation duration tokens
  - Flag custom timing functions
  - ✅ **COMPLETE** - See TASK-29-COMPLETE.md for details

- [x] 30. Write property test for mobile breakpoint consistency
  - **Property 21: Mobile Breakpoint Consistency**
  - **Validates: Requirements 7.1**
  - Test that media queries match standardized breakpoints
  - Verify no custom breakpoint values
  - ✅ **COMPLETE** - See TASK-30-COMPLETE.md for details

- [x] 31. Write property test for touch target size compliance
  - **Property 22: Touch Target Size Compliance**
  - **Validates: Requirements 7.4**
  - Test that interactive elements meet 44x44px minimum
  - Scan for undersized touch targets
  - ✅ **COMPLETE** - See TASK-31-COMPLETE.md for details

- [x] 32. Create design system documentation
  - Document all available design tokens with examples
  - Create component usage guide with code examples
  - Document design principles and "God Tier" aesthetic
  - Include do's and don'ts for developers
  - Add accessibility guidelines
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  - ✅ **COMPLETE** - See TASK-32-COMPLETE.md for details

- [x] 33. Create visual regression test baseline
  - Capture screenshots of all major components
  - Document expected visual appearance
  - Set up comparison workflow for future changes
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - ✅ **COMPLETE** - See TASK-33-COMPLETE.md for details

- [x] 34. Final checkpoint - Ensure all tests pass
  - Run all property-based tests
  - Verify visual consistency across pages
  - Check accessibility compliance
  - Ensure all tests pass, ask the user if questions arise.
  - ✅ **COMPLETE** - See TASK-34-COMPLETE.md for details

---

## Phase 2: Color Harmonization & Contrast Enhancement

- [x] 35. Audit current color usage for contrast issues
  - Scan all component files for zinc-900/zinc-950 usage patterns
  - Identify cards using insufficient contrast backgrounds
  - Document border opacity values below 0.12
  - List text elements using mid-range grays (zinc-400+) for primary content
  - Create contrast issue report with specific file locations
  - _Requirements: 9.1, 9.2, 9.3, 9.6_
  - ✅ **COMPLETE** - See TASK-35-COMPLETE.md for details

- [x] 36. Update design tokens for enhanced contrast
  - Increase glass effect opacity: `--bg-glass` from 0.05 to 0.08
  - Ensure `--border-default` uses minimum 0.12 opacity
  - Add new token `--bg-card-elevated` for better card contrast
  - Document token usage guidelines in design-tokens.css comments
  - _Requirements: 9.1, 9.3, 9.7_
  - ✅ **COMPLETE** - See TASK-36-COMPLETE.md for details

- [x] 37. Refactor Card component for better contrast
  - Update default card background to use `--bg-tertiary` (zinc-800) instead of `--bg-secondary`
  - Ensure all card variants include visible borders with `--border-default`
  - Add inner glow shadow to all cards: `box-shadow: var(--shadow-inner-glow)`
  - Implement progressive background lightening for nested cards
  - Update hover states to use `--border-emphasis`
  - _Requirements: 9.1, 9.4, 9.5, 9.7_
  - ✅ **COMPLETE** - See TASK-37-COMPLETE.md for details

- [x] 38. Update text color usage across components
  - Replace zinc-400/zinc-500 with `--text-primary` for all primary content
  - Ensure headings use `--text-primary` (zinc-50)
  - Reserve `--text-secondary` only for labels and metadata
  - Update button text to use appropriate contrast colors
  - _Requirements: 9.2_
  - ✅ **COMPLETE** - See TASK-38-COMPLETE.md for details

- [x] 39. Enhance border visibility across application
  - Update all border declarations to use minimum `--border-default` (0.12 opacity)
  - Replace subtle borders (< 0.12 opacity) with `--border-default`
  - Add emphasized borders to interactive elements
  - Ensure separators use visible border colors
  - _Requirements: 9.3_
  - ✅ **COMPLETE** - See TASK-39-COMPLETE.md for details

- [x] 40. Implement progressive lightening for nested components
  - Create utility classes for nested background hierarchy
  - Update Container component to support nesting levels
  - Ensure nested cards use progressively lighter backgrounds
  - Document nesting guidelines in component documentation
  - _Requirements: 9.5_
  - ✅ **COMPLETE** - See TASK-40-COMPLETE.md for details

- [x] 41. Add visual distinction to interactive elements
  - Ensure all buttons have borders + shadows + distinct colors
  - Update input fields with clear borders and focus rings
  - Add hover states with increased brightness to all interactive elements
  - Verify links have color + underline or clear hover effects
  - _Requirements: 9.4_
  - ✅ **COMPLETE** - See TASK-41-COMPLETE.md for details

- [x] 42. Write property test for card-background contrast ratio
  - **Property 23: Card-Background Contrast Ratio**
  - **Validates: Requirements 9.1**
  - Test that all cards have minimum 3:1 contrast ratio with backgrounds
  - Calculate contrast ratios for card/background color pairs
  - Flag any cards with insufficient contrast
  - ✅ **COMPLETE** - See TASK-42-COMPLETE.md and TASK-42-CONTRAST-FINDINGS.md for details

- [x] 43. Write property test for primary text color lightness
  - **Property 24: Primary Text Color Lightness**
  - **Validates: Requirements 9.2**
  - Test that primary text uses light colors (zinc-50/100)
  - Scan for primary content using mid-range grays
  - Verify text hierarchy follows lightness guidelines
  - ✅ **COMPLETE** - See TASK-43-COMPLETE.md for details

- [ ] 44. Write property test for border opacity minimum
  - **Property 25: Border Opacity Minimum**
  - **Validates: Requirements 9.3**
  - Test that all border colors have opacity >= 0.12
  - Scan CSS and component files for border declarations
  - Flag borders with insufficient opacity

- [ ] 45. Write property test for interactive element visual distinction
  - **Property 26: Interactive Element Visual Distinction**
  - **Validates: Requirements 9.4**
  - Test that interactive elements have color, border, or shadow
  - Verify buttons, links, inputs have clear visual affordance
  - Flag interactive elements lacking distinction

- [ ] 46. Write property test for nested background hierarchy
  - **Property 27: Nested Background Hierarchy**
  - **Validates: Requirements 9.5**
  - Test that nested elements have progressively lighter backgrounds
  - Analyze component nesting depth and background colors
  - Verify visual hierarchy through background progression

- [ ] 47. Write property test for adjacent element contrast
  - **Property 28: Adjacent Element Contrast**
  - **Validates: Requirements 9.6**
  - Test that adjacent siblings don't use similar dark shades
  - Scan for zinc-900/zinc-950 used in adjacent elements
  - Calculate contrast between adjacent element backgrounds

- [ ] 48. Write property test for card light accent presence
  - **Property 29: Card Light Accent Presence**
  - **Validates: Requirements 9.7**
  - Test that all cards include light accent features
  - Verify presence of white borders, inner glows, or light shadows
  - Flag cards lacking visual breathing room

- [ ] 49. Update design system documentation with contrast guidelines
  - Add "Color Harmonization" section to documentation
  - Document contrast ratio requirements (3:1 for cards, 4.5:1 for text)
  - Provide before/after examples of good vs bad contrast
  - Include guidelines for progressive lightening in nested components
  - Add visual examples of proper border opacity usage
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [ ] 50. Migrate existing pages to use enhanced contrast tokens
  - Update dashboard pages to use new card contrast patterns
  - Replace low-contrast borders with visible borders
  - Update text colors to use proper hierarchy
  - Ensure all pages follow progressive lightening for nested elements
  - _Requirements: 9.1, 9.2, 9.3, 9.5_

- [ ] 51. Create visual regression tests for contrast improvements
  - Capture screenshots of updated components
  - Compare contrast ratios before and after changes
  - Verify WCAG AA compliance across all pages
  - Document contrast improvements in test report
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 52. Final checkpoint - Verify contrast improvements
  - Run all new property-based tests (Properties 23-29)
  - Verify all contrast ratios meet WCAG AA standards
  - Check visual consistency across all pages
  - Ensure no regression in existing functionality
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
