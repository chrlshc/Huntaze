# Implementation Plan

## Phase 1: Design Tokens Shopify-Style

- [x] 1. Create Shopify Design Tokens
  - [x] 1.1 Create `styles/shopify-tokens.css` with light theme tokens
    - Define background colors (#f6f6f7, #ffffff)
    - Define text colors (#1a1a1a, #6b7177)
    - Define border colors (#e1e3e5)
    - Define shadows and radius values
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3_
  - [x] 1.2 Write property test for light background consistency
    - **Property 1: Light Background Consistency**
    - **Validates: Requirements 1.1**
  - [x] 1.3 Write property test for card white background
    - **Property 2: Card White Background**
    - **Validates: Requirements 2.1**

- [x] 2. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 2: Base Shopify Components

- [x] 3. Create ShopifyCard Component
  - [x] 3.1 Create `components/ui/shopify/ShopifyCard.tsx`
    - White background (#ffffff)
    - 1px border (#e1e3e5)
    - Subtle shadow (0 1px 3px rgba(0,0,0,0.08))
    - 8px border-radius
    - 20px padding (configurable)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [x] 3.2 Write property test for card shadow presence
    - **Property 3: Card Shadow Presence**
    - **Validates: Requirements 2.2**
  - [x] 3.3 Write property test for card border radius
    - **Property 4: Card Border Radius**
    - **Validates: Requirements 2.3**

- [x] 4. Create ShopifyMetricCard Component
  - [x] 4.1 Create `components/ui/shopify/ShopifyMetricCard.tsx`
    - Label: 12-13px, #6b7177
    - Value: 24-28px, bold, #1a1a1a
    - Optional trend indicator (green/red)
    - Optional icon with color
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 4.2 Write property test for metric label styling
    - **Property 5: Metric Label Styling**
    - **Validates: Requirements 3.1**
  - [x] 4.3 Write property test for metric value styling
    - **Property 6: Metric Value Styling**
    - **Validates: Requirements 3.2**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: Layout Components

- [x] 6. Create ShopifyPageLayout Component
  - [x] 6.1 Create `components/layout/ShopifyPageLayout.tsx`
    - Light gray background (#f6f6f7)
    - Max-width 1200px centered
    - Page header with title, subtitle, actions
    - Proper spacing (24px between sections)
    - _Requirements: 1.1, 1.3, 1.4, 9.1, 9.2_
  - [x] 6.2 Write property test for metric grid layout
    - **Property 7: Metric Grid Layout**
    - **Validates: Requirements 3.4**

- [x] 7. Create ShopifySectionHeader Component
  - [x] 7.1 Create `components/ui/shopify/ShopifySectionHeader.tsx`
    - Title: 16-18px, semibold
    - 24px margin-top, 16px margin-bottom
    - Optional actions aligned right
    - _Requirements: 9.1, 9.2, 9.3_
  - [x] 7.2 Write property test for section header spacing
    - **Property 14: Section Header Spacing**
    - **Validates: Requirements 9.2**

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 4: Interactive Components

- [x] 9. Create ShopifyBanner Component
  - [x] 9.1 Create `components/ui/shopify/ShopifyBanner.tsx`
    - Status variants: info, warning, success, critical
    - Light background colors based on status
    - Icon, title, description, action button
    - 8px border-radius, 16px padding
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  - [x] 9.2 Write property test for banner status colors
    - **Property 11: Banner Status Colors**
    - **Validates: Requirements 7.1**

- [x] 10. Create ShopifyQuickAction Component
  - [x] 10.1 Create `components/ui/shopify/ShopifyQuickAction.tsx`
    - Clickable card with hover effect
    - Icon (24px), title, description
    - Link wrapper for navigation
    - _Requirements: 8.1, 8.3, 8.4_
  - [x] 10.2 Write property test for quick action structure
    - **Property 12: Quick Action Structure**
    - **Validates: Requirements 8.1**
  - [x] 10.3 Write property test for quick action grid
    - **Property 13: Quick Action Grid**
    - **Validates: Requirements 8.2**

- [x] 11. Create ShopifyFeatureCard Component
  - [x] 11.1 Create `components/ui/shopify/ShopifyFeatureCard.tsx`
    - Icon, title, description
    - Chevron/arrow for navigation indicator
    - Hover effect
    - _Requirements: 10.1, 10.3, 10.4_
  - [x] 11.2 Write property test for feature card navigation indicator
    - **Property 15: Feature Card Navigation Indicator**
    - **Validates: Requirements 10.4**

- [x] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: Typography and Buttons

- [x] 13. Create Shopify Button Variants
  - [x] 13.1 Create `components/ui/shopify/ShopifyButton.tsx` with Shopify variants
    - Primary: solid dark (#1a1a1a) with white text
    - Secondary: outlined with dark border
    - 8px border-radius
    - 12px 16px padding
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [x] 13.2 Write property test for primary button styling
    - **Property 10: Primary Button Styling**
    - **Validates: Requirements 6.1**

- [x] 14. Verify Typography Tokens
  - [x] 14.1 Ensure typography follows Shopify guidelines
    - Primary text: #1a1a1a
    - Secondary text: #6b7177
    - Headings: 600 weight
    - Body: 14px, 1.5 line-height
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [x] 14.2 Write property test for primary text contrast
    - **Property 9: Primary Text Contrast**
    - **Validates: Requirements 5.1**
  - [x] 14.3 Write property test for sidebar dark background
    - **Property 8: Sidebar Dark Background**
    - **Validates: Requirements 4.1**

- [x] 15. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 6: Page Integration

- [x] 16. Refactor OnlyFans Main Page
  - [x] 16.1 Update `app/(app)/onlyfans/page.tsx` with Shopify components
    - Replace PageLayout with ShopifyPageLayout
    - Replace stat cards with ShopifyMetricCard (4-column grid)
    - Replace connection banner with ShopifyBanner
    - Replace quick actions with ShopifyQuickAction (3-column grid)
    - Replace feature cards with ShopifyFeatureCard (2-column grid)
    - Apply Shopify design tokens throughout
    - _Requirements: 1.1-10.4_

- [x] 17. Create Shopify Styles Index
  - [x] 17.1 Create `components/ui/shopify/index.ts` barrel export
    - Export all Shopify components
    - _Requirements: All_

- [x] 18. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 7: Polish and Verification

- [x] 19. Visual Verification
  - [x] 19.1 Verify OnlyFans page matches Shopify aesthetic
    - Light background visible (#f6f6f7)
    - Cards are white (#ffffff) with subtle shadows (0 1px 3px rgba(0,0,0,0.08))
    - Proper spacing between elements (24px section gap)
    - Typography is clear and readable (14px base, #1a1a1a primary, #6b7177 secondary)
    - _Requirements: All_

- [x] 20. Responsive Testing
  - [x] 20.1 Verify responsive behavior
    - Grids collapse properly on mobile (4→2→1 columns for metrics, 3→2→1 for quick actions)
    - Spacing adjusts appropriately (24px padding)
    - Touch targets are adequate (min 44px)
    - _Requirements: 3.4, 8.2, 10.2_

