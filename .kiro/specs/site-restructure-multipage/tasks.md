# Implementation Plan - Site Restructure Multi-Page

- [x] 1. Create shared navigation components
  - Build reusable header, footer, and mobile navigation components
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 5.1, 5.2, 5.3, 5.4, 5.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 1.1 Create navigation configuration file
  - Create `config/navigation.ts` with centralized navigation data
  - Define TypeScript interfaces for navigation items, footer sections, and social links
  - _Requirements: 8.2, 8.3, 8.5_

- [x] 1.2 Build NavLink component with active state
  - Create `components/layout/NavLink.tsx` with active route detection
  - Use `usePathname()` hook to highlight current page
  - Implement prefetching on hover
  - _Requirements: 1.3, 1.4, 6.2_

- [x] 1.3 Write property test for NavLink active state
  - **Property 4: Active navigation indication**
  - **Validates: Requirements 1.4**

- [x] 1.4 Build MarketingHeader component
  - Create `components/layout/MarketingHeader.tsx` with sticky positioning
  - Implement desktop navigation with hover effects
  - Add responsive behavior (show hamburger on mobile)
  - _Requirements: 1.1, 1.2, 1.5, 7.1_

- [x] 1.5 Write property test for header presence
  - **Property 1: Header presence on all marketing pages**
  - **Validates: Requirements 1.1**

- [x] 1.6 Write property test for sticky header
  - **Property 5: Sticky header positioning**
  - **Validates: Requirements 1.5**

- [x] 1.7 Build MobileNav component
  - Create `components/layout/MobileNav.tsx` with drawer functionality
  - Implement open/close animations with framer-motion
  - Add backdrop with blur effect
  - Trap focus within drawer when open
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 1.8 Write property test for mobile nav parity
  - **Property 18: Mobile nav link parity**
  - **Validates: Requirements 7.3**

- [x] 1.9 Write property test for mobile nav accessibility
  - **Property 20: Mobile nav accessibility**
  - **Validates: Requirements 7.5**

- [x] 1.10 Build MarketingFooter component
  - Create `components/layout/MarketingFooter.tsx` with all sections
  - Include product, company, legal, and social links
  - Add copyright notice
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 1.11 Write property test for footer consistency
  - **Property 12: Footer styling consistency**
  - **Validates: Requirements 5.5**

- [x] 1.12 Write property test for conditional social links
  - **Property 11: Conditional social links**
  - **Validates: Requirements 5.3**

- [x] 2. Update marketing layout to use new components
  - Integrate header and footer into the shared marketing layout
  - _Requirements: 1.1, 5.1, 8.2_

- [x] 2.1 Update app/(marketing)/layout.tsx
  - Import and integrate MarketingHeader and MarketingFooter
  - Remove old header/footer code if present
  - Ensure proper spacing and structure
  - _Requirements: 1.1, 5.1, 8.2_

- [x] 2.2 Write property test for layout component reuse
  - **Property 21: Layout component reuse**
  - **Validates: Requirements 8.2**

- [x] 3. Simplify homepage to focused landing page
  - Reduce homepage content to hero, 3 benefits, and CTA only
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3.1 Create homepage content components
  - Create `components/home/HeroSection.tsx` with badge, title, subtitle, and CTA
  - Create `components/home/ValueProposition.tsx` for 3 key benefits
  - Create `components/home/HomeCTA.tsx` for final call-to-action
  - _Requirements: 2.1, 2.5_

- [x] 3.2 Refactor app/(marketing)/page.tsx
  - Replace current content with simplified structure
  - Use only HeroSection, ValueProposition (3 benefits max), and HomeCTA
  - Add clear navigation links to Features, Pricing, and About pages
  - Remove excessive content sections
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 3.3 Write unit tests for homepage components
  - Test HeroSection renders correctly
  - Test ValueProposition displays exactly 3 benefits
  - Test HomeCTA includes proper links
  - _Requirements: 2.1, 2.5_

- [x] 4. Create or update Features page
  - Build dedicated features page with categorized feature display
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4.1 Create feature content components
  - Create `components/features/FeatureGrid.tsx` for feature display
  - Create `components/features/FeatureCard.tsx` for individual features
  - Create `components/features/FeatureDetail.tsx` for expanded view
  - _Requirements: 3.2, 3.3, 3.5_

- [x] 4.2 Create or update app/(marketing)/features/page.tsx
  - Display all features organized by category
  - Include icons/illustrations for each feature
  - Add expandable details on click
  - Include CTA to sign up or request access
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4.3 Write property test for features organization
  - **Property 6: Features organized by category**
  - **Validates: Requirements 3.2**

- [x] 4.4 Write property test for feature icons
  - **Property 7: Feature icons presence**
  - **Validates: Requirements 3.3**

- [x] 5. Create or update Pricing page
  - Build dedicated pricing page with clear tier comparisons
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 5.1 Create pricing content components
  - Create `components/pricing/PricingTiers.tsx` for tier comparison
  - Create `components/pricing/PricingCard.tsx` for individual tiers
  - Create `components/pricing/PricingFAQ.tsx` for common questions
  - _Requirements: 4.2, 4.5_

- [x] 5.2 Create or update app/(marketing)/pricing/page.tsx
  - Display pricing tiers with feature comparisons
  - Include CTA button for each tier
  - Show "Request Access" or "Join Waitlist" for beta state
  - Add FAQ section
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 5.3 Write property test for pricing tier CTAs
  - **Property 9: Pricing tier CTA buttons**
  - **Validates: Requirements 4.3, 4.4**

- [x] 6. Implement performance optimizations
  - Add code splitting, prefetching, and loading states
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 6.1 Add loading states for page transitions
  - Create `app/(marketing)/loading.tsx` with skeleton screens
  - Ensure smooth transitions between pages
  - _Requirements: 6.3_

- [x] 6.2 Write property test for link prefetching
  - **Property 13: Link prefetching**
  - **Validates: Requirements 6.2**

- [x] 6.3 Implement dynamic imports for heavy components
  - Use `next/dynamic` for components that aren't immediately needed
  - Implement code splitting to reduce initial bundle size
  - _Requirements: 6.4_

- [x] 6.4 Write property test for code splitting
  - **Property 15: Code splitting per page**
  - **Validates: Requirements 6.4**

- [x] 6.5 Optimize images with next/image
  - Replace all img tags with next/image components
  - Configure proper sizes and loading strategies
  - _Requirements: 6.1_

- [x] 7. Add SEO metadata to all pages
  - Ensure each page has proper metadata for search engines
  - _Requirements: 8.1_

- [x] 7.1 Add metadata exports to all marketing pages
  - Add metadata to homepage
  - Add metadata to features page
  - Add metadata to pricing page
  - Include Open Graph and Twitter Card data
  - _Requirements: 8.1_

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Run Lighthouse audits and optimize
  - Run Lighthouse on all marketing pages
  - Fix any issues to achieve performance score ≥ 90
  - _Requirements: 6.5_

- [x] 9.1 Write property test for Lighthouse performance
  - **Property 16: Lighthouse performance threshold**
  - **Validates: Requirements 6.5**

- [x] 10. Accessibility audit and fixes
  - Run accessibility tests on all pages
  - Ensure WCAG 2.1 Level AA compliance
  - Test keyboard navigation
  - Test screen reader compatibility
  - _Requirements: 7.5_

- [x] 11. Visual regression testing
  - Capture screenshots of all pages
  - Test desktop and mobile viewports
  - Test hover and active states
  - _Requirements: 1.2, 1.4_

- [x] 12. Final checkpoint - Verify all functionality
  - Test complete user journey from homepage through all pages
  - Verify client-side navigation works without page reloads
  - Test mobile navigation on actual devices
  - Ensure all tests pass, ask the user if questions arise.
