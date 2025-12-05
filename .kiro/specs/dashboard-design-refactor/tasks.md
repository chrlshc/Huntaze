# Implementation Plan

## Phase 1: Design System Foundation ✅

- [x] 1. Create Design Tokens Module
  - [x] 1.1 Create token types and interfaces in `lib/design-system/types.ts`
    - Define DesignTokens interface with spacing, colors, typography, shadows, radius
    - Define TokenSerializer interface
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 1.2 Write property test for spacing tokens (multiples of 4px)
    - **Property 1: Spacing tokens are multiples of 4px**
    - **Validates: Requirements 1.1**
  - [x] 1.3 Write property test for color tokens validity
    - **Property 2: Color tokens are valid CSS colors**
    - **Validates: Requirements 1.2**
  - [x] 1.4 Write property test for shadow tokens validity
    - **Property 3: Shadow tokens are valid CSS box-shadow**
    - **Validates: Requirements 1.3**
  - [x] 1.5 Write property test for radius tokens validity
    - **Property 4: Radius tokens are valid CSS lengths**
    - **Validates: Requirements 1.4**
  - [x] 1.6 Implement token values in `styles/design-tokens.css`
    - Define CSS custom properties for all token categories
    - Use 4px grid for spacing (--space-1 through --space-8)
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 1.7 Implement TokenSerializer in `lib/design-system/serializer.ts`
    - Implement toJSON, fromJSON, toCSSVariables methods
    - _Requirements: 14.1, 14.2, 14.3_
  - [x] 1.8 Write property test for token round-trip serialization
    - **Property 36: Design token round-trip serialization**
    - **Validates: Requirements 14.1, 14.2, 14.3**

- [x] 2. Create Typography System
  - [x] 2.1 Define typography tokens in CSS
    - Font sizes: 12px, 14px, 16px, 20px, 24px, 28px
    - Font weights: 400, 500, 600
    - _Requirements: 2.1, 2.2_
  - [x] 2.2 Write property test for typography scale constraints
    - **Property 5: Typography scale is constrained**
    - **Validates: Requirements 2.1**
  - [x] 2.3 Write property test for font weight constraints
    - **Property 6: Font weights are constrained**
    - **Validates: Requirements 2.2**

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 2: Base Components ✅

- [x] 4. Implement Card Component
  - [x] 4.1 Create Card component in `components/ui/Card.tsx`
    - Implement CardProps interface
    - Apply design tokens for padding, shadow, radius
    - Support footer slot for actions
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 4.2 Write property test for card styling consistency
    - **Property 7: Card styling consistency**
    - **Validates: Requirements 3.1, 3.2, 3.3**
  - [x] 4.3 Write property test for card footer presence
    - **Property 8: Card with actions has footer**
    - **Validates: Requirements 3.4**
  - [x] 4.4 Create StatCard component in `components/ui/StatCard.tsx`
    - Implement StatCardProps interface
    - Label above value structure
    - Support trend indicator
    - _Requirements: 3.5, 4.1, 4.2_
  - [x] 4.5 Write property test for StatCard structure
    - **Property 9: StatCard structure**
    - **Validates: Requirements 3.5**

- [x] 5. Implement Empty States and Skeletons
  - [x] 5.1 Create EmptyState component in `components/ui/EmptyState.tsx`
    - Icon, title, description, action button
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 5.2 Create Skeleton component in `components/ui/Skeleton.tsx`
    - Variants: text, circular, rectangular, card
    - Pulse animation
    - _Requirements: 4.4, 12.1_
  - [x] 5.3 Write property test for empty state completeness
    - **Property 10: Empty state completeness**
    - **Validates: Requirements 4.1, 4.2, 4.3**
  - [x] 5.4 Write property test for loading state skeletons
    - **Property 11: Loading state renders skeletons**
    - **Validates: Requirements 4.4, 12.1**

- [x] 6. Implement Banner Component
  - [x] 6.1 Create Banner component in `components/ui/Banner.tsx`
    - Implement BannerProps interface
    - Semantic colors based on status
    - Icon, title, description, action button
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [x] 6.2 Write property test for banner color semantics
    - **Property 12: Banner color semantics**
    - **Validates: Requirements 5.1**
  - [x] 6.3 Write property test for banner structure
    - **Property 13: Banner structure completeness**
    - **Validates: Requirements 5.2, 5.3**
  - [x] 6.4 Write property test for banner WCAG contrast
    - **Property 14: Banner WCAG contrast**
    - **Validates: Requirements 5.4**

- [x] 7. Implement Badge Component
  - [x] 7.1 Create Badge component in `components/ui/Badge.tsx`
    - Implement BadgeProps interface
    - Status colors: success, warning, critical, info, neutral
    - Consistent sizing: 12px font, 4px radius
    - _Requirements: 6.3_
  - [x] 7.2 Write property test for badge consistency
    - **Property 17: Badge consistency**
    - **Validates: Requirements 6.3**

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: Form Components ✅

- [x] 9. Implement Input Component
  - [x] 9.1 Create Input component in `components/ui/Input.tsx`
    - Implement InputProps interface
    - Custom styling overriding browser defaults
    - Focus ring with action-primary color
    - _Requirements: 10.1, 10.2_
  - [x] 9.2 Write property test for input custom styling
    - **Property 26: Input custom styling**
    - **Validates: Requirements 10.1**
  - [x] 9.3 Write property test for focus ring visibility
    - **Property 27: Focus ring visibility**
    - **Validates: Requirements 10.2**

- [x] 10. Implement Toggle Component
  - [x] 10.1 Create Toggle component in `components/ui/Toggle.tsx`
    - Implement ToggleProps interface
    - Custom styling with design system colors
    - _Requirements: 10.4_
  - [x] 10.2 Write property test for toggle design system colors
    - **Property 28: Toggle design system colors**
    - **Validates: Requirements 10.4**

- [x] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 4: Data Display Components ✅

- [x] 12. Implement IndexTable Component
  - [x] 12.1 Create IndexTable component in `components/ui/IndexTable.tsx`
    - Implement IndexTableProps and Column interfaces
    - Uniform row heights with text truncation
    - Right-aligned numerical columns
    - Hover state highlighting
    - _Requirements: 6.1, 6.2, 6.4, 6.5_
  - [x] 12.2 Write property test for table row height uniformity
    - **Property 15: Table row height uniformity**
    - **Validates: Requirements 6.1**
  - [x] 12.3 Write property test for numerical column alignment
    - **Property 16: Numerical column alignment**
    - **Validates: Requirements 6.2**

- [x] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: Messages Components ✅

- [x] 14. Implement ConversationList Component
  - [x] 14.1 Create ConversationList component in `components/messages/ConversationList.tsx`
    - Implement ConversationListProps interface
    - Compact avatars (32-40px)
    - Clear hierarchy: name, excerpt, time
    - Unread indicator with left border
    - _Requirements: 7.1, 7.2, 7.3_
  - [x] 14.2 Write property test for conversation avatar sizing
    - **Property 18: Conversation avatar sizing**
    - **Validates: Requirements 7.1**
  - [x] 14.3 Write property test for conversation item structure
    - **Property 19: Conversation item structure**
    - **Validates: Requirements 7.2**
  - [x] 14.4 Write property test for unread indicator visibility
    - **Property 20: Unread indicator visibility**
    - **Validates: Requirements 7.3**

- [x] 15. Implement FanContextSidebar Component
  - [x] 15.1 Create FanContextSidebar component in `components/messages/FanContextSidebar.tsx`
    - Implement FanContextSidebarProps interface
    - Display LTV, notes, purchase history
    - _Requirements: 8.1_
  - [x] 15.2 Write property test for fan context sidebar completeness
    - **Property 21: Fan context sidebar completeness**
    - **Validates: Requirements 8.1**

- [x] 16. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 6: Content Components ✅

- [x] 17. Implement ContentGrid Component
  - [x] 17.1 Create ContentGrid component in `components/ppv/ContentGrid.tsx`
    - Implement ContentGridProps interface
    - CSS Grid with consistent gap (16px)
    - Fixed aspect ratio thumbnails
    - Primary/secondary action button hierarchy
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  - [x] 17.2 Write property test for content grid gap consistency
    - **Property 23: Content grid gap consistency**
    - **Validates: Requirements 9.1**
  - [x] 17.3 Write property test for media aspect ratio enforcement
    - **Property 24: Media aspect ratio enforcement**
    - **Validates: Requirements 9.2**
  - [x] 17.4 Write property test for action button hierarchy
    - **Property 25: Action button hierarchy**
    - **Validates: Requirements 9.3**

- [x] 18. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 7: Layout Components ✅

- [x] 19. Implement Navigation Sidebar
  - [x] 19.1 Update sidebar in `src/components/app-sidebar-unified.tsx`
    - Icons with text labels
    - Active state indicator
    - Limit first-level items
    - _Requirements: 13.1, 13.2, 13.3_
  - [x] 19.2 Write property test for navigation item structure
    - **Property 33: Navigation item structure**
    - **Validates: Requirements 13.1**
  - [x] 19.3 Write property test for active navigation indicator
    - **Property 34: Active navigation indicator**
    - **Validates: Requirements 13.2**
  - [x] 19.4 Write property test for navigation item count limit
    - **Property 35: Navigation item count limit**
    - **Validates: Requirements 13.3**

- [x] 20. Implement Settings Layout
  - [x] 20.1 Update settings components for toggle proximity
    - Toggle adjacent to label in same container
    - Visual separators between items
    - _Requirements: 11.1, 11.2_
  - [x] 20.2 Write property test for settings toggle proximity
    - **Property 29: Settings toggle proximity**
    - **Validates: Requirements 11.1**
  - [x] 20.3 Write property test for settings list separators
    - **Property 30: Settings list separators**
    - **Validates: Requirements 11.2**

- [x] 21. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 8: Accessibility and Polish ✅

- [x] 22. Implement Touch Target Sizing
  - [x] 22.1 Ensure all interactive elements have 44px minimum touch targets
    - Update button styles
    - Update clickable areas
    - _Requirements: 8.4_
  - [x] 22.2 Write property test for touch target minimum size
    - **Property 22: Touch target minimum size**
    - **Validates: Requirements 8.4**

- [x] 23. Implement Layout Stability
  - [x] 23.1 Add aspect-ratio to image containers
    - Reserve space during loading
    - Prevent layout shift
    - _Requirements: 12.2, 12.3_
  - [x] 23.2 Write property test for image space reservation
    - **Property 31: Image space reservation**
    - **Validates: Requirements 12.2**
  - [x] 23.3 Write property test for layout stability
    - **Property 32: Layout stability**
    - **Validates: Requirements 12.3**

- [x] 24. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 9: Page Integration

- [x] 25. Refactor Dashboard Page
  - [x] 25.1 Update `app/(app)/home/page.tsx` and `app/(app)/dashboard/page.tsx` with new components
    - Replace stat cards with StatCard component
    - Replace banners with Banner component
    - Apply design tokens throughout
    - _Requirements: 1.1-5.4_

- [x] 26. Refactor Messages Page
  - [x] 26.1 Update `app/(app)/onlyfans/messages/page.tsx` with new components
    - Replaced conversation list with ConversationList component
    - Added FanContextSidebar for fan context display
    - Replaced stat cards with StatCard component
    - Applied design tokens throughout (spacing, colors, radius)
    - Added EmptyState for no conversation selected
    - _Requirements: 7.1-8.4_

- [x] 27. Refactor Fans Page
  - [x] 27.1 Update `app/(app)/onlyfans/fans/page.tsx` with new components
    - Replaced inline table with IndexTable component (uniform row heights, hover states)
    - Used Badge component for tier and churn risk status indicators
    - Applied design tokens throughout (spacing, colors, radius)
    - Added EmptyState for no fans found scenario
    - Numerical columns (LTV) properly right-aligned
    - _Requirements: 6.1-6.5_

- [x] 28. Refactor PPV Page
  - [x] 28.1 Update `app/(app)/onlyfans/ppv/page.tsx` with new components
    - Replaced inline grid with ContentGrid component (consistent 16px gap, 16:9 aspect ratio)
    - Used StatCard component for metrics display (Revenue, Sent, Purchases, Conversion Rate)
    - Used Banner component for AI pricing suggestions
    - Used Badge component for tab counts
    - Added EmptyState for no campaigns scenario
    - Applied design tokens throughout (spacing, colors, radius)
    - _Requirements: 9.1-9.4_

- [x] 29. Refactor Settings Page
  - [x] 29.1 Update settings pages with new components
    - Refactored `app/(app)/onlyfans/settings/page.tsx` with SettingsLayout components
    - Refactored `app/(app)/settings/page.tsx` with SettingsLayout components
    - Used Toggle component via SettingsToggleItem (Requirement 11.1)
    - Applied proximity rules - toggle adjacent to label in same container
    - Used SettingsList with visual separators between items (Requirement 11.2)
    - Used SettingsCalloutCard for account connection prompts (Requirement 11.3)
    - Used StatCard for AI quota display
    - Used Badge for quota status indicators
    - Used Banner for connection status
    - Applied design tokens throughout (spacing, colors, radius)
    - _Requirements: 11.1-11.3_

- [x] 30. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
