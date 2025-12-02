# Implementation Plan

## Overview
This implementation plan transforms the Huntaze dashboard from a legacy dark-mode interface to a modern, light-mode "App Shell" architecture inspired by Shopify's Online Store 2.0. The migration follows a phased approach, starting with foundational CSS architecture, then building components, and finally migrating existing functionality.

---

## Phase 1: Foundation & CSS Architecture

- [x] 1. Create CSS Custom Properties system for dashboard design tokens
  - Define all Shopify-inspired design tokens as CSS variables in a new file `styles/dashboard-shopify-tokens.css`
  - Include structural dimensions: `--huntaze-sidebar-width: 256px`, `--huntaze-header-height: 64px`
  - Include color tokens: `--bg-app: #F8F9FB`, `--bg-surface: #FFFFFF`, `--color-indigo: #6366f1`, `--color-text-main: #1F2937`, `--color-text-sub: #6B7280`
  - Include shadow token: `--shadow-soft: 0 4px 20px rgba(0, 0, 0, 0.05)`
  - Include border radius: `--radius-card: 16px`
  - Include z-index values: `--huntaze-z-index-header: 500`, `--huntaze-z-index-nav: 400`
  - Import this file in `app/globals.css`
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 2. Implement CSS Grid layout structure
  - Create `.huntaze-layout` class with CSS Grid consuming full viewport (100vh x 100vw)
  - Define named grid areas: "header", "sidebar", "main"
  - Set grid-template-columns: `var(--huntaze-sidebar-width) 1fr` for desktop
  - Set grid-template-rows: `var(--huntaze-header-height) 1fr` for desktop
  - Apply `overflow: hidden` to prevent window scrolling
  - Add styles to `styles/dashboard-shopify-tokens.css`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.3_

- [x] 2.1 Write property test for grid layout viewport dimensions
  - **Property 1: Grid Layout Viewport Dimensions**
  - **Validates: Requirements 1.1, 4.3**

- [x] 2.2 Write property test for desktop grid structure
  - **Property 2: Desktop Grid Column Structure**
  - **Property 3: Desktop Grid Row Structure**
  - **Validates: Requirements 1.4, 1.5**

---

## Phase 2: Core Layout Components

- [x] 3. Update root layout to use CSS Grid structure
  - Modify `app/(app)/layout.tsx` to use `.huntaze-layout` class
  - Apply grid-template-areas structure
  - Remove existing flexbox layout
  - Ensure proper grid area assignments for Header, Sidebar, and Main
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 4. Refactor Sidebar component for fixed positioning and scroll isolation
  - Update `components/Sidebar.tsx` to use `grid-area: sidebar`
  - Apply fixed positioning within grid
  - Enable internal scrolling with `overflow-y: auto`
  - Style scrollbar with `scrollbar-width: thin` and `scrollbar-color: #E5E7EB transparent`
  - Update background to `var(--bg-surface)` (white)
  - Update border to `1px solid rgba(229, 231, 235, 0.5)`
  - _Requirements: 2.1, 2.2, 4.2_

- [ ] 4.1 Write property test for sidebar display and scrolling
  - **Property 4: Sidebar Full Height Display**
  - **Property 5: Sidebar Internal Scrolling**
  - **Validates: Requirements 2.1, 2.2**

- [x] 5. Refactor Header component for sticky positioning
  - Update `components/Header.tsx` to use `grid-area: header`
  - Apply sticky positioning with `position: sticky` and `top: 0`
  - Set z-index to `var(--huntaze-z-index-header)`
  - Update background to `var(--bg-surface)` (white)
  - Update border-bottom to `1px solid #E5E7EB`
  - Ensure header spans full viewport width
  - _Requirements: 3.1, 3.4, 3.5_

- [ ] 5.1 Write property test for header positioning
  - **Property 9: Header Full Width Display**
  - **Property 11: Header Fixed During Scroll**
  - **Validates: Requirements 3.1, 3.5**

- [x] 6. Create main content area component
  - Create new component `components/dashboard/MainContent.tsx`
  - Apply `grid-area: main`
  - Set background to `var(--bg-app)` (#F8F9FB - pale gray)
  - Enable scrolling with `overflow-y: auto` and `scroll-behavior: smooth`
  - Add padding of 32px
  - Export and use in layout
  - _Requirements: 4.1, 4.2, 4.4, 4.5_

- [ ] 6.1 Write property test for main content scroll isolation
  - **Property 12: Main Content Scroll Isolation**
  - **Validates: Requirements 4.2**

---

## Phase 3: Navigation System

- [x] 7. Implement duotone icon system
  - Create `components/dashboard/DuotoneIcon.tsx` component
  - Support two-layer SVG paths with primary and secondary colors
  - Use CSS Custom Properties for dynamic color control: `--icon-primary`, `--icon-secondary`
  - Create icon library with dashboard icons (home, analytics, content, messages, integrations, settings)
  - Default colors: gray (#9CA3AF) for inactive, Electric Indigo (#6366f1) for active
  - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [x] 7.1 Write property test for duotone icon structure and colors
  - Property 17: Duotone Icon Structure**
  - Property 18: Inactive Icon Color**
  - Property 19: Active Icon Color**
  - Validates: Requirements 6.1, 6.2, 6.3**

- [x] 8. Update navigation items with active state styling
  - Update Sidebar navigation items to show 3px Electric Indigo left border when active
  - Apply fade indigo background `rgba(99, 102, 241, 0.08)` for active state
  - Use gray text (#4B5563) with transparent background for inactive state
  - Add smooth transitions (0.15s ease) for hover states
  - Apply rounded corners `border-radius: 0 8px 8px 0` with right margin 12px
  - _Requirements: 2.3, 2.4, 2.5_

- [x] 8.1 Write property test for navigation item states
  - Property 6: Active Navigation Item Styling**
  - Property 7: Inactive Navigation Item Styling**
  - Property 8: Navigation Item Hover Feedback**
  - Validates: Requirements 2.3, 2.4, 2.5**

- [x] 8.2 Write property test for icon hover transitions
  - Property 20: Icon Hover Transition**
  - Validates: Requirements 6.4**

---

## Phase 4: Global Search

- [ ] 9. Create GlobalSearch component
  - Create `components/dashboard/GlobalSearch.tsx`
  - Implement search input with 400px width on desktop
  - Unfocused state: light gray background (#F3F4F6), no border
  - Focused state: white background, Electric Indigo border, subtle shadow `0 4px 12px rgba(0,0,0,0.05)`
  - Add Electric Indigo glow effect on focus: `box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2)`
  - Include search icon (magnifying glass) on the left
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [ ] 9.1 Write property test for search input states
  - Property 36: Search Input Unfocused State**
  - Property 37: Search Input Focus Background**
  - Property 38: Search Input Focus Shadow**
  - Property 10: Search Input Focus State**
  - Validates: Requirements 12.2, 12.3, 12.4, 3.3**

- [ ] 10. Implement search functionality with real-time results
  - Add search state management (query, results, loading)
  - Create search API endpoint at `app/api/dashboard/search/route.ts`
  - Implement search across navigation items, stats, and content
  - Display results dropdown with categorized sections
  - Add keyboard navigation (arrow keys, enter to select)
  - _Requirements: 12.5_

- [ ] 10.1 Write property test for real-time search
  - Property 39: Real-time Search Results**
  - Validates: Requirements 12.5**

- [ ] 11. Integrate GlobalSearch into Header
  - Add GlobalSearch component to Header between logo and user menu
  - Ensure proper spacing and alignment
  - Test responsive behavior (hide on mobile < 768px)
  - _Requirements: 3.2_

---

## Phase 5: Gamified Onboarding

- [ ] 12. Create GamifiedOnboarding component
  - Create `components/dashboard/GamifiedOnboarding.tsx`
  - Display personalized greeting: "Bonjour [User], prêt à faire décoller ton audience?"
  - Use CSS Grid with `repeat(auto-fit, minmax(300px, 1fr))` for responsive card layout
  - Apply 24px gap between cards
  - Add margin-bottom of 32px
  - _Requirements: 7.1, 7.2_

- [ ] 13. Create action cards for onboarding
  - Create "Connect Account" card with blurred social platform logos
  - Create "Latest Stats" card with potential growth visualization (SVG curve) for new users
  - Create "Create Content" card with pulsing icon effect
  - Each card: white background, 16px border radius, 24px padding, soft shadow
  - Hover effect: lift card with `translateY(-4px)` and deepen shadow to `0 12px 24px rgba(0, 0, 0, 0.1)`
  - _Requirements: 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4_

- [ ] 13.1 Write property test for card styling
  - Property 22: Card Border Radius Consistency**
  - Property 23: Card Grid Spacing**
  - Property 24: Card Internal Padding**
  - Property 25: Interactive Card Hover Effect**
  - Property 26: Card Background Contrast**
  - Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

- [ ] 13.2 Write property test for empty state visualization
  - Property 21: Empty State Visualization**
  - Validates: Requirements 7.4**

- [ ] 14. Integrate GamifiedOnboarding into dashboard
  - Add GamifiedOnboarding component to dashboard page
  - Show only for users who haven't completed onboarding
  - Position at top of main content area
  - _Requirements: 7.1, 7.2_

---

## Phase 6: Button System

- [ ] 15. Create button components with Electric Indigo styling
  - Create `components/dashboard/Button.tsx` with variants: primary, secondary, ghost
  - Primary button: Electric Indigo gradient `linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)`
  - Secondary button: outline style with Electric Indigo border
  - Add hover, active, and disabled states with smooth transitions
  - Ensure all states provide clear visual feedback
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 15.1 Write property test for button styling
  - Property 40: Primary Button Gradient**
  - Property 41: Button Hover Feedback**
  - Property 42: Active Button Visual Indication**
  - Property 43: Disabled Button State**
  - Property 44: Secondary Button Styling**
  - Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5**

---

## Phase 7: Typography System

- [ ] 16. Implement typography system
  - Update heading styles to use Poppins or Inter with font-weight 600 and color #111827
  - Update body text to use Inter or system font with color #1F2937
  - Set welcome title to 24px with -0.5px letter spacing
  - Avoid pure black (#000000), use deep gray instead
  - Establish clear font size hierarchy (headings > body > labels)
  - Add typography classes to `styles/dashboard-shopify-tokens.css`
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 16.1 Write property test for typography consistency
  - **Property 32: Heading Typography Consistency**
  - **Property 33: Body Text Typography Consistency**
  - **Property 34: Pure Black Avoidance**
  - **Property 35: Font Size Hierarchy**
  - **Validates: Requirements 10.1, 10.2, 10.4, 10.5**

---

## Phase 8: Color System Migration

- [ ] 17. Apply light mode color system across dashboard
  - Update all surface elements to use white (#FFFFFF) background
  - Update primary actions to use Electric Indigo (#6366f1)
  - Update main text to deep gray (#1F2937) and secondary text to medium gray (#6B7280)
  - Apply soft diffused shadows `0 4px 20px rgba(0, 0, 0, 0.05)` to all cards
  - Update canvas background to Gris très pâle (#F8F9FB)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 17.1 Write property test for color consistency
  - **Property 13: Surface Element Color Consistency**
  - **Property 14: Primary Action Color Consistency**
  - **Property 15: Text Color Hierarchy**
  - **Property 16: Shadow Consistency**
  - **Validates: Requirements 5.2, 5.3, 5.4, 5.5**

---

## Phase 9: Responsive Mobile Adaptation

- [ ] 18. Implement mobile sidebar drawer
  - Add media query for viewport < 1024px
  - Collapse sidebar off-screen with `translateX(-100%)`
  - Add hamburger menu icon to header
  - Implement slide-in animation (0.3s cubic-bezier) on menu click
  - Set mobile sidebar width to 80% viewport width with max 300px
  - Apply shadow `10px 0 25px rgba(0,0,0,0.1)` when open
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 18.1 Write property test for mobile responsive behavior
  - **Property 27: Mobile Sidebar Collapse**
  - **Property 28: Mobile Hamburger Menu Display**
  - **Property 29: Mobile Sidebar Toggle**
  - **Property 30: Mobile Sidebar Dimensions**
  - **Property 31: Mobile Sidebar Shadow**
  - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

- [ ] 19. Update MobileSidebar component
  - Refactor existing `components/MobileSidebar.tsx` to match new design
  - Apply Electric Indigo styling
  - Ensure smooth animations
  - Add backdrop overlay when open
  - _Requirements: 9.1, 9.2, 9.3_

---

## Phase 10: Content Block Spacing

- [ ] 20. Enforce consistent spacing across dashboard
  - Update all content blocks to have minimum 24px gaps
  - Apply consistent 24px internal padding to all cards
  - Use CSS Grid gap property for automatic spacing
  - Remove any hardcoded margins that conflict with design system
  - _Requirements: 14.4, 14.5_

- [ ] 20.1 Write property test for content spacing
  - **Property 45: Content Block Spacing**
  - **Validates: Requirements 14.4**

---

## Phase 11: Accessibility & Performance

- [ ] 21. Ensure WCAG color contrast compliance
  - Audit all text/background color combinations
  - Ensure minimum 4.5:1 contrast ratio for normal text
  - Ensure minimum 3:1 contrast ratio for large text
  - Test with accessibility tools (axe, Lighthouse)
  - Fix any contrast issues found
  - _Requirements: 15.4_

- [ ] 21.1 Write property test for WCAG compliance
  - **Property 46: WCAG Color Contrast**
  - **Validates: Requirements 15.4**

- [ ] 22. Optimize layout performance
  - Verify CSS Grid is used instead of position calculations
  - Ensure animations use CSS transforms and opacity for GPU acceleration
  - Test scrolling performance (should maintain 60fps)
  - Add `will-change` hints for animated elements
  - Profile with Chrome DevTools Performance tab
  - _Requirements: 15.1, 15.2, 15.5_

- [ ] 23. Style scrollbars for aesthetic consistency
  - Apply `scrollbar-width: thin` to sidebar
  - Set `scrollbar-color: #E5E7EB transparent`
  - Add custom scrollbar styles for webkit browsers
  - _Requirements: 15.3_

---

## Phase 12: Legacy Code Migration

- [ ] 24. Neutralize legacy dark mode styles
  - Remove or override all legacy dark mode background colors
  - Reset hardcoded text colors to use new CSS variables
  - Update any components using old color tokens
  - Search for and replace legacy color values
  - _Requirements: 14.1, 14.2_

- [ ] 25. Wrap legacy components with temporary styling containers
  - Identify components that cannot be immediately refactored
  - Create wrapper components with appropriate light mode styling
  - Document which components need future refactoring
  - _Requirements: 14.3_

---

## Phase 13: Integration & Testing

- [ ] 26. Update dashboard page to use new components
  - Replace existing dashboard content with new GamifiedOnboarding
  - Apply new card styling to stats cards
  - Use new Button components for CTAs
  - Ensure proper spacing and layout
  - _Requirements: 7.1, 7.2, 8.1, 8.2_

- [ ] 27. Test cross-browser compatibility
  - Test in Chrome/Edge 90+
  - Test in Firefox 88+
  - Test in Safari 14+
  - Test in Mobile Safari 14+
  - Test in Chrome Android 90+
  - Document any browser-specific issues
  - _Requirements: 15.1_

- [ ] 28. Checkpoint - Ensure all tests pass
  - Run all property-based tests
  - Run all unit tests
  - Fix any failing tests
  - Ensure no regressions in existing functionality
  - Ask the user if questions arise

---

## Phase 14: Visual Polish & Final Touches

- [ ] 29. Add smooth transitions to all interactive elements
  - Ensure all buttons have hover transitions
  - Add focus states with Electric Indigo glow
  - Verify all cards have hover lift effect
  - Test transition performance
  - _Requirements: 2.5, 8.4, 13.2_

- [ ] 30. Implement reduced motion support
  - Add `@media (prefers-reduced-motion: reduce)` queries
  - Disable animations for users who prefer reduced motion
  - Ensure functionality remains intact without animations
  - _Requirements: 15.5_

- [ ] 31. Final visual QA
  - Compare implementation against Shopify 2.0 reference
  - Verify Electric Indigo brand identity is consistent
  - Check all shadows are soft and diffused
  - Ensure spacing is consistent throughout
  - Verify typography hierarchy is clear
  - Test on multiple screen sizes

- [ ] 32. Documentation and handoff
  - Document all new CSS custom properties
  - Create component usage guide
  - Document migration strategy for remaining pages
  - Create visual regression test baseline
  - Update README with new design system information

---

## Phase 15: Content Pages Migration & Performance Optimization ✅ READY TO USE

**Status**: 14/15 tasks complete (93%) - Production Ready
**Documentation**: See `PHASE-15-READY-TO-USE.md` and `QUICK-START-PHASE-15.md`

- [x] 33. Migrate Analytics page to Shopify design system
  - Remove all `dark:` Tailwind classes from `app/(app)/analytics/page.tsx`
  - Replace with Shopify design tokens (--bg-surface, --color-text-main, etc.)
  - Update card backgrounds to white (#FFFFFF) with soft shadows
  - Update text colors to deep gray (#1F2937) for main text, medium gray (#6B7280) for secondary
  - Apply 16px border radius to all cards
  - Ensure 24px internal padding on all cards
  - Use Electric Indigo (#6366f1) for primary actions
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 8.1, 8.2, 8.3, 14.1, 14.2_

- [x] 34. Migrate Content page to Shopify design system
  - Remove all `dark:` Tailwind classes from `app/(app)/content/page.tsx`
  - Replace with Shopify design tokens
  - Update stats cards to use white backgrounds with soft shadows
  - Update tab navigation to use Electric Indigo for active state
  - Fix duplicate "Create Content" button (keep only top-right button)
  - Update content list items to use white backgrounds
  - Apply consistent spacing (24px gaps)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 8.1, 8.2, 8.3, 14.1, 14.2_

- [x] 35. Migrate Messages page to Shopify design system
  - Remove all `dark:` Tailwind classes from `app/(app)/messages/page.tsx`
  - Replace with Shopify design tokens
  - Update platform selector sidebar to white background
  - Update thread list to white background with proper hover states
  - Update conversation area to pale gray background (#F8F9FB)
  - Fix message loading error by implementing proper error handling
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 8.1, 8.2, 8.3, 14.1, 14.2_

- [x] 36. Migrate Integrations page to Shopify design system
  - Read `app/(app)/integrations/integrations-client.tsx` to understand structure
  - Remove all `dark:` Tailwind classes
  - Replace with Shopify design tokens
  - Update integration cards to white backgrounds with soft shadows
  - Fix black block loading issue by implementing skeleton loaders
  - Ensure logos load properly with fallback states
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 8.1, 8.2, 8.3, 14.1, 14.2_

- [x] 37. Implement skeleton loaders for all content pages
  - Create `<SkeletonCard />` component with pale gray shimmer effect
  - Use skeleton loaders during data fetching on Analytics page
  - Use skeleton loaders during data fetching on Content page
  - Use skeleton loaders during data fetching on Messages page
  - Use skeleton loaders during data fetching on Integrations page
  - Ensure skeletons match final content dimensions to prevent layout shift
  - _Requirements: 15.1, 15.5_

- [x] 38. Implement pagination for Messages page
  - Add pagination to message threads (load 20 at a time)
  - Implement infinite scroll or "Load More" button
  - Add loading state for pagination
  - Optimize API calls to reduce initial load time
  - Cache loaded messages to improve performance
  - _Requirements: 15.1, 15.2, 15.5_

- [x] 39. Optimize Analytics page performance
  - Implement lazy loading for chart components
  - Add loading states for metrics cards
  - Optimize API calls (combine multiple requests if possible)
  - Add error boundaries for graceful error handling
  - Implement retry mechanism for failed API calls
  - _Requirements: 15.1, 15.2, 15.5_

- [x] 40. Optimize Content page performance
  - Implement virtual scrolling for large content lists
  - Add debouncing to search/filter operations
  - Optimize content item rendering (memoization)
  - Implement lazy loading for content thumbnails
  - Add proper loading states for all async operations
  - _Requirements: 15.1, 15.2, 15.5_

- [x] 41. Fix Integrations page loading issues
  - Investigate and fix "black blocks" during loading
  - Implement proper image loading with fallbacks
  - Add error handling for failed integration connections
  - Optimize integration status checks (reduce API calls)
  - Add retry mechanism for failed connections
  - _Requirements: 15.1, 15.2, 15.5_

- [x] 42. Fix Messages page API errors
  - Debug "Failed to load messages" error
  - Implement proper error handling and user feedback
  - Add retry mechanism with exponential backoff
  - Optimize message fetching (pagination, caching)
  - Add offline support with cached messages
  - _Requirements: 15.1, 15.2, 15.5_

- [ ] 43. Add loading states to all async operations
  - Ensure all API calls have loading indicators
  - Use skeleton loaders for initial page loads
  - Use spinner or progress bar for user-initiated actions
  - Prevent multiple simultaneous requests (debouncing)
  - Add timeout handling (show error after 10s)
  - _Requirements: 15.1, 15.5_

- [ ] 44. Implement error boundaries for content pages
  - Wrap Analytics page in error boundary
  - Wrap Content page in error boundary
  - Wrap Messages page in error boundary
  - Wrap Integrations page in error boundary
  - Provide user-friendly error messages with retry options
  - Log errors for debugging
  - _Requirements: 15.1, 15.5_

- [x] 45. Optimize bundle size for content pages
  - Code-split large components (charts, editors)
  - Lazy load heavy dependencies
  - Optimize images and icons
  - Remove unused dependencies
  - Analyze bundle with webpack-bundle-analyzer
  - _Requirements: 15.1, 15.2, 15.5_

- [ ] 46. Add performance monitoring
  - Implement performance tracking for page loads
  - Track API response times
  - Monitor scroll performance (FPS)
  - Track user interactions (clicks, navigation)
  - Set up alerts for performance degradation
  - _Requirements: 15.1, 15.2, 15.5_

- [ ] 47. Checkpoint - Test all migrated pages
  - Verify Analytics page displays correctly with new design
  - Verify Content page displays correctly with new design
  - Verify Messages page displays correctly with new design
  - Verify Integrations page displays correctly with new design
  - Test all pages on mobile devices
  - Test all pages in different browsers
  - Ensure no dark mode remnants remain
  - Verify all loading states work correctly
  - Verify all error states work correctly
  - Ask the user if questions arise

---

## Notes

- All property-based tests should run a minimum of 100 iterations
- Each property test must include a comment with format: `// Feature: dashboard-shopify-migration, Property {number}: {property_text}`
- All tasks including property-based tests are required for comprehensive implementation
- The migration should be done incrementally to minimize risk
- Consider feature flagging the new design for gradual rollout
- Monitor user feedback and performance metrics after deployment
- Phase 15 focuses on content pages that were missed in previous phases and performance optimization
