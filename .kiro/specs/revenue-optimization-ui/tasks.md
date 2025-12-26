# Implementation Plan - Revenue Optimization UI

## Overview

This implementation plan breaks down the Revenue Optimization UI into discrete, actionable coding tasks. Each task builds incrementally on previous work, with the backend services already in place. The focus is on creating UI components, API routes, and integration logic.

## Task List

- [x] 1. Set up project structure and shared utilities
  - Create directory structure for revenue optimization features
  - Implement shared TypeScript interfaces and types for revenue data models
  - Create base API client utility with error handling and retry logic
  - Set up SWR configuration for data fetching
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 2. Implement API routes for backend integration
  - [x] 2.1 Create pricing recommendations API route
    - Implement GET `/api/revenue/pricing` endpoint
    - Implement POST `/api/revenue/pricing/apply` endpoint
    - Add request validation and error handling
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [x] 2.2 Create churn risk API route
    - Implement GET `/api/revenue/churn` endpoint
    - Implement POST `/api/revenue/churn/reengage` endpoint
    - Add filtering by risk level
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [x] 2.3 Create upsell opportunities API route
    - Implement GET `/api/revenue/upsells` endpoint
    - Implement POST `/api/revenue/upsells/send` endpoint
    - Add automation settings endpoint
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [x] 2.4 Create revenue forecast API route
    - Implement GET `/api/revenue/forecast` endpoint
    - Add goal setting endpoint
    - Include historical and prediction data
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [x] 2.5 Create payout management API route
    - Implement GET `/api/revenue/payouts` endpoint
    - Implement GET `/api/revenue/payouts/export` endpoint for CSV
    - Add tax calculation logic
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 3. Build custom hooks for data fetching
  - [x] 3.1 Create usePricingRecommendations hook
    - Implement data fetching with SWR
    - Add caching with 5-minute TTL
    - Include apply pricing mutation function
    - Handle loading and error states
    - _Requirements: 1.1, 1.2, 8.1, 8.2, 8.3_
  
  - [x] 3.2 Create useChurnRisks hook
    - Implement data fetching with filtering
    - Add re-engagement mutation function
    - Include real-time updates every 60 seconds
    - _Requirements: 2.1, 2.2, 2.5, 8.1, 8.2_
  
  - [x] 3.3 Create useUpsellOpportunities hook
    - Implement data fetching with SWR
    - Add send upsell mutation function
    - Include dismiss functionality
    - _Requirements: 3.1, 3.2, 3.3, 8.1, 8.2_
  
  - [x] 3.4 Create useRevenueForecast hook
    - Implement forecast data fetching
    - Add goal setting mutation
    - Cache data for 1 hour
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 8.1_
  
  - [x] 3.5 Create usePayoutSchedule hook
    - Implement payout data fetching
    - Add export functionality
    - Include tax rate updates
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 8.1_

- [x] 4. Implement shared UI components
  - [x] 4.1 Create LoadingState component
    - Implement skeleton UI for cards
    - Add spinner variants
    - Create shimmer animation
    - _Requirements: 8.4_
  
  - [x] 4.2 Create ErrorBoundary component
    - Implement error catching logic
    - Add fallback UI with retry button
    - Include error logging with correlation IDs
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [x] 4.3 Create EmptyState component
    - Implement empty state UI with icon
    - Add customizable message and action button
    - _Requirements: 7.1, 7.2_
  
  - [x] 4.4 Create Toast notification system
    - Implement success/error toast components
    - Add toast queue management
    - Include auto-dismiss functionality
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 5. Build Dynamic Pricing Interface
  - [x] 5.1 Create PricingCard component
    - Implement UI showing current vs recommended price
    - Add revenue impact display with color coding
    - Include confidence indicator
    - Add "Apply" button with loading state
    - Implement responsive layout (desktop/mobile)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 7.1, 7.2, 7.3_
  
  - [x] 5.2 Create PPVPricing component
    - Implement PPV pricing recommendation display
    - Add price range slider
    - Show expected revenue range
    - Include apply functionality
    - _Requirements: 1.5, 7.1, 7.2_
  
  - [x] 5.3 Create pricing dashboard page
    - Implement page layout at `/creator/revenue/pricing`
    - Integrate PricingCard and PPVPricing components
    - Add error boundary wrapper
    - Implement success/error notifications
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 9.1, 9.2_

- [x] 6. Build Churn Risk Dashboard
  - [x] 6.1 Create ChurnRiskList component
    - Implement list view with risk level color coding
    - Add fan cards with avatar, name, and metrics
    - Include "Re-engage" button for each fan
    - Add sorting and filtering functionality
    - Implement infinite scroll or pagination
    - _Requirements: 2.1, 2.2, 2.3, 7.1, 7.2, 7.3_
  
  - [x] 6.2 Create ChurnRiskDetail modal
    - Implement modal with engagement history chart
    - Add predicted churn date display
    - Show recommended actions list
    - Include close and action buttons
    - _Requirements: 2.4, 7.1, 7.2_
  
  - [x] 6.3 Create churn dashboard page
    - Implement page layout at `/creator/revenue/churn`
    - Integrate ChurnRiskList component
    - Add summary statistics cards
    - Implement real-time updates every 60 seconds
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 8.2_


- [x] 7. Build Upsell Automation Interface
  - [x] 7.1 Create UpsellOpportunity component
    - Implement card showing trigger purchase and suggested upsell
    - Add buy rate and expected revenue display
    - Include message preview with edit capability
    - Add "Send Now" and "Dismiss" buttons
    - Implement success animation
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 7.1, 7.2_
  
  - [x] 7.2 Create UpsellAutomationSettings component
    - Implement settings form for automation rules
    - Add auto-send threshold slider
    - Include max daily upsells input
    - Add excluded fans multi-select
    - Implement save functionality
    - _Requirements: 3.5, 7.1, 7.2_
  
  - [x] 7.3 Create upsell dashboard page
    - Implement page layout at `/creator/revenue/upsells`
    - Integrate UpsellOpportunity components in queue view
    - Add automation settings section
    - Show statistics summary
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 9.1, 9.3_

- [x] 8. Build Revenue Forecast Dashboard
  - [x] 8.1 Create RevenueForecastChart component
    - Implement line chart with Recharts
    - Add historical data (solid line) and forecast (dashed line)
    - Show confidence interval as shaded area
    - Include responsive chart sizing
    - Add tooltip with detailed data
    - _Requirements: 4.1, 4.5, 7.1, 7.2_
  
  - [x] 8.2 Create MonthProgress component
    - Implement current month progress card
    - Add progress bar with percentage
    - Show on-track/behind indicator
    - Include projected vs actual comparison
    - _Requirements: 4.1, 4.2, 7.1_
  
  - [x] 8.3 Create GoalAchievement component
    - Implement goal setting interface
    - Add recommendations list with impact scores
    - Show effort level indicators
    - Include goal progress visualization
    - _Requirements: 4.4, 7.1, 7.2_
  
  - [x] 8.4 Create forecast dashboard page
    - Implement page layout at `/creator/revenue/forecast`
    - Integrate RevenueForecastChart component
    - Add MonthProgress and GoalAchievement components
    - Include next month prediction card
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 8.1, 8.2_

- [x] 9. Build Payout Management Dashboard
  - [x] 9.1 Create PayoutTimeline component
    - Implement timeline view with platform icons
    - Add payout cards with amount and date
    - Show countdown for upcoming payouts
    - Include platform filtering
    - Add status indicators
    - _Requirements: 5.1, 7.1, 7.2, 7.3_
  
  - [x] 9.2 Create PayoutSummary component
    - Implement summary card with total expected
    - Add tax calculation display
    - Show net income after tax
    - Include tax rate adjustment slider
    - Add next payout highlight
    - _Requirements: 5.2, 5.3, 5.4, 7.1_
  
  - [x] 9.3 Create payout dashboard page
    - Implement page layout at `/creator/revenue/payouts`
    - Integrate PayoutTimeline and PayoutSummary components
    - Add export button with CSV download
    - Show platform connection status
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 9.1_

- [x] 10. Build Metrics Overview Dashboard
  - [x] 10.1 Create MetricCard component
    - Implement card with large number display
    - Add trend arrow (up/down/stable)
    - Show percentage change from previous period
    - Include sparkline chart
    - Add click handler for drill-down
    - Apply color coding (green/red)
    - _Requirements: 6.1, 6.2, 6.5, 7.1, 7.2_
  
  - [x] 10.2 Create MetricsOverview component
    - Implement responsive grid layout
    - Add MetricCard for each key metric (ARPU, LTV, churn, subscribers, revenue, growth)
    - Include highlight for significant changes (>10%)
    - Add loading states for each card
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3_
  
  - [x] 10.3 Create revenue overview page
    - Implement main dashboard at `/creator/revenue`
    - Integrate MetricsOverview component
    - Add quick links to other revenue sections
    - Show recent activity feed
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 8.1, 8.2_

- [ ] 11. Implement responsive design and mobile optimization
  - [ ] 11.1 Add mobile layouts for all components
    - Implement mobile-specific layouts for PricingCard
    - Add stacked layouts for ChurnRiskList on mobile
    - Create mobile-optimized chart views
    - Ensure touch targets are 44x44px minimum
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [ ] 11.2 Test responsive breakpoints
    - Verify layouts at 320px, 768px, 1024px, 1440px widths
    - Test on actual mobile devices
    - Ensure no horizontal scroll
    - Validate touch interactions
    - _Requirements: 7.1, 7.2, 7.3_

- [ ] 12. Implement accessibility features
  - [ ] 12.1 Add keyboard navigation
    - Implement tab order for all interactive elements
    - Add keyboard shortcuts for common actions
    - Ensure no keyboard traps
    - Add skip links for navigation
    - _Requirements: 7.4_
  
  - [ ] 12.2 Add ARIA labels and roles
    - Add ARIA labels to all form inputs
    - Implement ARIA live regions for dynamic content
    - Add role attributes to custom components
    - Ensure screen reader compatibility
    - _Requirements: 7.4, 7.5_
  
  - [ ] 12.3 Verify color contrast
    - Check all text meets 4.5:1 contrast ratio
    - Verify UI components meet 3:1 contrast
    - Test with color blindness simulators
    - Add alternative indicators beyond color
    - _Requirements: 7.5_

- [ ] 13. Add error handling and resilience
  - [ ] 13.1 Implement retry logic in API clients
    - Add exponential backoff for failed requests
    - Implement maximum retry attempts (3)
    - Add timeout handling (2-10 seconds)
    - Log errors with correlation IDs
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 9.4, 9.5_
  
  - [ ] 13.2 Add error boundaries to all pages
    - Wrap each revenue page in ErrorBoundary
    - Implement fallback UI with retry option
    - Add error reporting to monitoring service
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ] 13.3 Implement optimistic UI updates
    - Add optimistic updates for pricing changes
    - Implement rollback on error
    - Show loading states during mutations
    - Add success confirmations
    - _Requirements: 8.4, 9.1, 9.2, 9.3_

- [ ] 14. Add caching and performance optimization
  - [ ] 14.1 Configure SWR caching strategy
    - Set cache TTLs for each data type
    - Implement stale-while-revalidate pattern
    - Add cache invalidation on mutations
    - Configure deduplication intervals
    - _Requirements: 8.1, 8.2, 8.5_
  
  - [ ] 14.2 Implement code splitting
    - Add lazy loading for chart components
    - Implement dynamic imports for modals
    - Split routes into separate chunks
    - _Requirements: 8.1, 8.2_
  
  - [ ] 14.3 Optimize bundle size
    - Tree-shake unused Recharts components
    - Minimize third-party dependencies
    - Analyze bundle with next/bundle-analyzer
    - _Requirements: 8.1, 8.2_

- [x] 15. Create revenue section layout and navigation
  - [x] 15.1 Create revenue layout component
    - Implement shared layout for all revenue pages
    - Add navigation sidebar with section links
    - Include breadcrumb navigation
    - Add mobile navigation menu
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [x] 15.2 Add navigation guards
    - Verify creator authentication
    - Check feature access permissions
    - Redirect unauthorized users
    - _Requirements: 10.1, 10.2, 10.3_

- [ ] 16. Write integration tests
  - [ ] 16.1 Test pricing update flow
    - Test viewing pricing recommendations
    - Test applying pricing changes
    - Test error handling for failed updates
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 9.1, 9.2_
  
  - [ ] 16.2 Test churn risk workflow
    - Test viewing at-risk fans
    - Test re-engagement message sending
    - Test filtering and sorting
    - _Requirements: 2.1, 2.2, 2.3, 9.3_
  
  - [ ] 16.3 Test upsell automation
    - Test viewing upsell opportunities
    - Test sending upsell messages
    - Test automation settings
    - _Requirements: 3.1, 3.2, 3.3, 3.5_
  
  - [ ] 16.4 Test forecast and payout features
    - Test forecast chart rendering
    - Test goal setting
    - Test payout export
    - _Requirements: 4.1, 4.4, 5.5_

- [ ] 17. Write unit tests for components
  - [ ] 17.1 Test PricingCard component
    - Test rendering with various props
    - Test apply button click handler
    - Test loading and error states
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [ ] 17.2 Test ChurnRiskList component
    - Test rendering fan list
    - Test sorting and filtering
    - Test re-engage button
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [ ] 17.3 Test custom hooks
    - Test usePricingRecommendations hook
    - Test useChurnRisks hook
    - Test error handling in hooks
    - _Requirements: 8.1, 8.2, 8.3, 9.4_

- [ ] 18. Final integration and polish
  - [ ] 18.1 Connect all pages to navigation
    - Add links from main creator dashboard
    - Implement breadcrumb trails
    - Add quick action buttons
    - _Requirements: 7.1, 7.2_
  
  - [ ] 18.2 Add loading states and transitions
    - Implement page transition animations
    - Add skeleton loaders for all data
    - Create smooth state transitions
    - _Requirements: 8.4, 7.1_
  
  - [ ] 18.3 Verify backend integration
    - Test all API endpoints with real backend
    - Verify data transformations
    - Check error responses
    - Validate authentication flow
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ] 18.4 Performance audit
    - Run Lighthouse audit on all pages
    - Verify Core Web Vitals metrics
    - Optimize any performance bottlenecks
    - _Requirements: 8.1, 8.2_
  
  - [ ] 18.5 Accessibility audit
    - Run axe DevTools on all pages
    - Test with screen readers
    - Verify keyboard navigation
    - Check color contrast
    - _Requirements: 7.4, 7.5_

## Notes

- All tasks assume the backend services (CIN AI, churn prediction, revenue analytics) are already implemented and accessible via API
- Focus is on UI implementation and integration, not business logic
- Each task should be completed and tested before moving to the next
- All tasks including tests are required for comprehensive implementation
- Estimated total time: 8-10 weeks for full implementation
