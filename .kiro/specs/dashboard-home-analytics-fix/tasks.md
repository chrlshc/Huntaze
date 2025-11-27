# Implementation Plan: Dashboard Home & Analytics Fix

## Overview
This plan fixes the Home page design, Analytics section bugs, and establishes clear section/sub-section navigation logic.

## 📋 Tasks

- [x] 1. Create Navigation Infrastructure ✅
  - Create navigation context hook
  - Implement breadcrumbs component
  - Create sub-navigation component
  - Define section/sub-section mapping
  - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - _Completed: 27 Nov 2024_

- [x]* 1.1 Write property test for navigation hierarchy ✅
  - **Property 1: Navigation hierarchy consistency**
  - **Validates: Requirements 3.1, 3.2**
  - **Tests: 7/7 passed**

- [x]* 1.2 Write property test for active states ✅
  - **Property 2: Active state uniqueness**
  - **Validates: Requirements 3.2**
  - **Tests: 8/8 passed**

- [x]* 1.3 Write property test for breadcrumbs ✅
  - **Property 3: Breadcrumb path accuracy**
  - **Validates: Requirements 3.4**
  - **Tests: 10/10 passed**

- [ ] 2. Redesign Home Page
  - Create new stats cards with modern design
  - Implement revenue metrics section
  - Add fan engagement metrics
  - Create messages & content stats
  - Add AI usage indicator
  - _Requirements: 1.1, 1.2_

- [ ] 2.1 Create enhanced stats API endpoint
  - Update `/api/home/stats` to return comprehensive data
  - Include revenue (today, week, month)
  - Include fan metrics (total, active, new)
  - Include message stats (sent, received, response rate)
  - Include content metrics (posts, views, engagement)
  - Include AI usage (used, remaining, total)
  - _Requirements: 1.2_
  - _Reference: Current endpoint at app/api/home/stats/route.ts_

- [ ] 2.2 Create StatsCard component with modern design
  - Professional card design with proper spacing
  - Support for different stat types (number, percentage, currency)
  - Trend indicators (up/down arrows with colors)
  - Hover effects and animations
  - Responsive sizing
  - _Requirements: 1.1_
  - _Reference: Current StatCard at app/(app)/home/StatCard.tsx_

- [ ] 2.3 Create QuickActionsHub component
  - Grid of quick action buttons
  - Icons for each action
  - Badge support for notifications
  - Color coding by action type
  - Links to relevant pages
  - _Requirements: 1.3_

- [ ] 2.4 Enhance PlatformStatus component
  - Show all 4 platforms (OnlyFans, Instagram, TikTok, Reddit)
  - Connection status indicators
  - Last sync time
  - Error messages if disconnected
  - Quick reconnect button
  - _Requirements: 1.4_
  - _Reference: Current PlatformStatus at app/(app)/home/PlatformStatus.tsx_

- [ ] 2.5 Create RecentActivity component
  - Feed of recent important activities
  - Activity types: subscribers, messages, content, revenue, AI
  - Timestamps and icons
  - Click to view details
  - Load more functionality
  - _Requirements: 1.5_

- [ ] 3. Fix Analytics Section
  - Fix main analytics page layout
  - Implement sub-navigation
  - Fix layout bugs in sub-pages
  - Add time range selector
  - Create charts and visualizations
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 3.1 Redesign analytics main page
  - Clear overview dashboard
  - Key metrics cards (revenue, ARPU, LTV, churn, subscribers)
  - Charts for revenue over time, fan growth, engagement
  - Quick links to sub-sections
  - Time range selector (7d, 30d, 90d, all)
  - _Requirements: 2.1_
  - _Reference: Current page at app/(app)/analytics/page.tsx_

- [ ] 3.2 Implement SubNavigation component
  - Horizontal tab-style navigation
  - Shows only when in section with sub-pages
  - Active state highlighting
  - Responsive (scrollable on mobile)
  - Smooth transitions
  - _Requirements: 2.2, 3.3_
  - _Component: components/dashboard/SubNavigation.tsx_

- [ ] 3.3 Fix analytics layout bugs
  - Remove overlapping elements
  - Fix spacing and alignment issues
  - Ensure consistent card styling
  - Fix responsive breakpoints
  - Test on all screen sizes
  - _Requirements: 2.3_

- [ ] 3.4 Update analytics sub-pages
  - Ensure consistent layout across all sub-pages
  - Add breadcrumbs to each page
  - Include sub-navigation
  - Fix any existing bugs
  - Test data loading and error states
  - _Requirements: 2.4_
  - _Pages: pricing, churn, upsells, forecast, payouts_

- [ ] 4. Implement Navigation Logic
  - Create useNavigationContext hook
  - Update Sidebar with new logic
  - Add breadcrumbs to all pages
  - Test navigation flow
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 4.1 Create useNavigationContext hook
  - Parse current pathname
  - Determine section and sub-section
  - Generate breadcrumbs automatically
  - Provide sub-nav items if applicable
  - Return navigation state
  - _Requirements: 3.1, 3.2_
  - _Hook: hooks/useNavigationContext.ts_

- [ ] 4.2 Create Breadcrumbs component
  - Display navigation path
  - Clickable links to parent pages
  - Current page not clickable
  - Chevron separators
  - Responsive (collapse on mobile)
  - _Requirements: 3.4_
  - _Component: components/dashboard/Breadcrumbs.tsx_

- [ ] 4.3 Update Sidebar active state logic
  - Use navigation context for active states
  - Highlight main section when on sub-page
  - Expand sub-nav when section active
  - Smooth transitions
  - _Requirements: 3.2_
  - _Component: components/Sidebar.tsx_

- [ ] 4.4 Add breadcrumbs to all pages
  - Add to analytics pages
  - Add to OnlyFans pages
  - Add to marketing pages
  - Skip on Home page
  - Consistent positioning
  - _Requirements: 3.4_

- [ ] 5. Polish & Optimize
  - Add loading states
  - Implement error handling
  - Optimize performance
  - Test responsive design
  - Accessibility improvements
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 5.1 Add loading states
  - Skeleton screens for stats
  - Loading spinners for actions
  - Progressive loading for charts
  - Smooth transitions
  - _Requirements: 4.1_

- [ ] 5.2 Implement error handling
  - Error boundaries for each section
  - Fallback UI for failed data
  - Retry mechanisms
  - User-friendly error messages
  - _Requirements: 4.2_

- [ ] 5.3 Optimize performance
  - Lazy load heavy components
  - Use React.memo for expensive components
  - Optimize re-renders
  - Minimize bundle size
  - _Requirements: 4.4_

- [ ] 5.4 Test responsive design
  - Test on mobile (320px - 768px)
  - Test on tablet (768px - 1024px)
  - Test on desktop (1024px+)
  - Fix any layout issues
  - _Requirements: 4.3_

- [ ] 5.5 Accessibility improvements
  - Add ARIA labels
  - Ensure keyboard navigation
  - Test with screen readers
  - Fix contrast issues
  - _Requirements: 4.3_

- [ ] 6. Final Checkpoint
  - Verify all routes work
  - Test navigation flow
  - Confirm no layout bugs
  - Validate performance
  - Run all tests
  - _Requirements: All_

## ⏱️ Estimated Time

- **Task 1** (Navigation Infrastructure): 2 hours
- **Task 2** (Home Page Redesign): 3 hours
- **Task 3** (Analytics Fix): 2.5 hours
- **Task 4** (Navigation Logic): 1.5 hours
- **Task 5** (Polish & Optimize): 1.5 hours
- **Task 6** (Final Checkpoint): 0.5 hours

**Total: 11 hours**

## 📝 Notes

### Design System
- Use existing design tokens from CSS variables
- Follow Shopify-inspired design patterns
- Maintain consistency with existing components
- Use proper spacing, typography, colors

### Performance
- Lazy load chart components
- Use SWR for data fetching
- Implement stale-while-revalidate
- Optimize images with next/image

### Testing
- Write property-based tests for navigation
- Test responsive design on real devices
- Validate accessibility with tools
- Test error scenarios

### Dependencies
- Existing routing structure
- Design tokens and CSS variables
- Performance monitoring hooks
- Error boundary components
- Loading state components

## 🎯 Success Criteria

- ✅ Home page has modern, professional design
- ✅ All stats display correctly and load fast
- ✅ Quick actions work and link correctly
- ✅ Platform status shows accurate information
- ✅ Analytics section has no layout bugs
- ✅ Sub-navigation is clear and functional
- ✅ Breadcrumbs show on all appropriate pages
- ✅ Navigation logic is consistent
- ✅ Active states work correctly
- ✅ Responsive on all devices
- ✅ Performance is optimized
- ✅ All tests pass
- ✅ Build succeeds without errors
