# Implementation Plan: Dashboard Routing and Layout Fix

- [ ] 1. Set up testing infrastructure
  - Install fast-check for property-based testing
  - Configure test environment for routing tests
  - Set up Playwright for integration tests
  - _Requirements: All requirements (testing foundation)_

- [ ]* 1.1 Install fast-check and configure
  - **Property-based testing setup**
  - **Validates: Testing Strategy**

- [ ] 2. Create OnlyFans main dashboard page
  - [ ] 2.1 Create `/app/(app)/onlyfans/page.tsx` file
    - Implement server component for OnlyFans dashboard
    - Add stats overview cards (messages, fans, PPV)
    - Include quick action buttons
    - Add connection status indicator
    - _Requirements: 1.1, 1.2, 1.3_

- [ ]* 2.2 Write property test for OnlyFans page accessibility
  - **Property 2: OnlyFans Page Accessibility**
  - **Validates: Requirements 1.1, 1.2**

- [ ] 2.3 Create API route for OnlyFans stats
    - Implement `/app/api/onlyfans/stats/route.ts`
    - Fetch data from database/external APIs
    - Return formatted stats object
    - Add error handling and caching
    - _Requirements: 1.2_

- [ ]* 2.4 Write unit tests for OnlyFans stats API
    - Test stats data transformation
    - Test error handling
    - Test caching behavior
    - _Requirements: 1.2_

- [ ] 3. Fix messages routing
  - [ ] 3.1 Update `/app/(app)/messages/page.tsx` to redirect
    - Replace current implementation with redirect to `/onlyfans/messages`
    - Use Next.js `redirect()` function
    - Add comment explaining redirect purpose
    - _Requirements: 2.1, 2.2_

- [ ]* 3.2 Write property test for messages redirect
  - **Property 3: Messages Redirect Correctness**
  - **Validates: Requirements 2.1, 2.3**

- [ ] 3.3 Verify OnlyFans messages page exists and works
    - Check `/app/(app)/onlyfans/messages/page.tsx` renders correctly
    - Ensure it displays OnlyFans-specific messages
    - Test connection prompt for unconnected users
    - _Requirements: 2.3, 2.4_

- [ ] 4. Update navigation menu
  - [ ] 4.1 Add OnlyFans menu item to Sidebar
    - Update `components/Sidebar.tsx`
    - Add OnlyFans icon and link to `/onlyfans`
    - Position appropriately in menu hierarchy
    - _Requirements: 1.3, 7.1, 7.2_

- [ ] 4.2 Update Messages menu item
    - Change link from `/messages` to `/onlyfans/messages`
    - Update icon if needed
    - Ensure proper active state detection
    - _Requirements: 2.2, 7.2_

- [ ] 4.3 Ensure Marketing is accessible
    - Verify Marketing menu item exists
    - Link to `/marketing` route
    - Test navigation flow
    - _Requirements: 3.3, 7.1_

- [ ] 4.4 Implement active state detection
    - Update Sidebar to detect current route
    - Highlight active menu item
    - Handle nested routes (e.g., `/onlyfans/messages`)
    - _Requirements: 7.3_

- [ ]* 4.5 Write property test for navigation active state
  - **Property 6: Navigation Active State**
  - **Validates: Requirements 7.3**

- [ ]* 4.6 Write unit tests for navigation menu
    - Test menu item generation
    - Test active state logic
    - Test badge display for unread counts
    - _Requirements: 7.1, 7.2, 7.3_

- [ ] 5. Fix integrations page structure
  - [ ] 5.1 Refactor `/app/(app)/integrations/page.tsx`
    - Remove redirect pattern
    - Directly render IntegrationsClient component
    - Keep dynamic rendering configuration
    - _Requirements: 5.1, 5.2, 5.3_

- [ ] 5.2 Test integrations page rendering
    - Verify no hydration mismatches
    - Test connection status updates
    - Ensure proper error handling
    - _Requirements: 5.3, 5.4, 5.5_

- [ ] 6. Fix content page layout conflicts
  - [ ] 6.1 Audit content page for layout issues
    - Inspect z-index usage in `app/(app)/content/page.tsx`
    - Check integration with `.huntaze-main` grid area
    - Identify any absolute positioning conflicts
    - _Requirements: 9.1, 9.2, 9.4_

- [ ] 6.2 Apply design token z-index values
    - Replace hardcoded z-index with CSS custom properties
    - Use `--huntaze-z-index-modal` for modals
    - Use `--huntaze-z-index-overlay` for overlays
    - _Requirements: 9.2, 9.3_

- [ ]* 6.3 Write property test for z-index hierarchy
  - **Property 5: Z-Index Hierarchy Consistency**
  - **Validates: Requirements 9.2, 9.5**

- [ ] 6.4 Fix modal positioning
    - Ensure ContentModal uses proper z-index
    - Verify modal doesn't conflict with header/sidebar
    - Test modal on different screen sizes
    - _Requirements: 9.2, 9.5_

- [ ] 6.5 Test content page layout
    - Verify no element overlapping
    - Test with different content lengths
    - Check responsive behavior
    - _Requirements: 9.1, 9.3, 9.4_

- [ ] 7. Optimize analytics page performance
  - [ ] 7.1 Audit analytics page loading
    - Measure current load time
    - Identify slow components
    - Check for unnecessary re-renders
    - _Requirements: 4.1, 4.2_

- [ ] 7.2 Implement proper loading states
    - Add skeleton loaders for stats cards
    - Use Suspense for async components
    - Show loading indicators within 100ms
    - _Requirements: 4.3_

- [ ] 7.3 Add error handling with retry
    - Wrap API calls in try-catch
    - Display user-friendly error messages
    - Implement retry button with exponential backoff
    - _Requirements: 4.4, 8.1, 8.2, 8.4_

- [ ]* 7.4 Write property test for performance loading states
  - **Property 8: Performance Loading States**
  - **Validates: Requirements 4.1, 6.1**

- [ ] 7.5 Optimize data fetching
    - Implement caching for analytics data
    - Use SWR for client-side data
    - Reduce API payload size
    - _Requirements: 4.1_

- [ ] 8. Implement authentication guards
  - [ ] 8.1 Verify ProtectedRoute component usage
    - Check all dashboard pages use ProtectedRoute
    - Ensure proper redirect to login
    - Test with authenticated and unauthenticated users
    - _Requirements: 7.4, 7.5_

- [ ]* 8.2 Write property test for authentication guard
  - **Property 7: Authentication Guard**
  - **Validates: Requirements 7.4, 7.5**

- [ ] 8.3 Test authentication flow
    - Test redirect to login for unauthenticated users
    - Test successful access for authenticated users
    - Verify session persistence
    - _Requirements: 7.4, 7.5_

- [ ] 9. Add error boundaries
  - [ ] 9.1 Verify error boundary coverage
    - Check ContentPageErrorBoundary usage
    - Ensure all pages have error boundaries
    - Test error boundary behavior
    - _Requirements: 8.1, 8.2, 8.3_

- [ ]* 9.2 Write property test for error recovery
  - **Property 9: Error Recovery**
  - **Validates: Requirements 8.1, 8.2, 8.4**

- [ ] 9.3 Test error scenarios
    - Simulate API failures
    - Test component errors
    - Verify error messages display
    - Test retry functionality
    - _Requirements: 8.1, 8.2, 8.4, 8.5_

- [ ] 10. Implement responsive layout fixes
  - [ ] 10.1 Test mobile layout
    - Verify sidebar hides on mobile
    - Test single-column layout
    - Check touch interactions
    - _Requirements: 9.3_

- [ ]* 10.2 Write property test for responsive layout
  - **Property 10: Responsive Layout Adaptation**
  - **Validates: Requirements 9.3**

- [ ] 10.3 Fix any mobile-specific issues
    - Adjust font sizes for mobile
    - Fix any overflow issues
    - Ensure proper spacing
    - _Requirements: 9.3_

- [ ] 11. Write integration tests
  - [ ] 11.1 Set up Playwright tests
    - Configure Playwright for dashboard testing
    - Create test fixtures and helpers
    - Set up test data
    - _Requirements: All requirements_

- [ ]* 11.2 Write route navigation tests
    - Test navigation through all main routes
    - Verify correct page loads
    - Test breadcrumb navigation
    - _Requirements: 1.3, 2.2, 3.3, 7.2_

- [ ]* 11.3 Write OnlyFans dashboard tests
    - Test stats display
    - Test quick actions
    - Test navigation to sub-pages
    - _Requirements: 1.1, 1.2, 1.3_

- [ ]* 11.4 Write messages redirect tests
    - Test redirect from /messages
    - Verify OnlyFans messages display
    - Test connection prompt
    - _Requirements: 2.1, 2.2, 2.3_

- [ ]* 11.5 Write layout tests
    - Test no element overlapping
    - Test responsive layouts
    - Test modal positioning
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]* 11.6 Write authentication tests
    - Test protected route access
    - Test login redirect
    - Test session persistence
    - _Requirements: 7.4, 7.5_

- [ ] 12. Property-based testing implementation
  - [ ]* 12.1 Write route resolution property test
    - **Property 1: Route Resolution Consistency**
    - **Validates: Requirements 1.3, 2.2, 3.3, 7.2**

- [ ]* 12.2 Write layout grid integration property test
    - **Property 4: Layout Grid Integration**
    - **Validates: Requirements 9.1, 9.2, 9.4**

- [ ] 13. Performance optimization
  - [ ] 13.1 Implement code splitting
    - Lazy load heavy components
    - Use dynamic imports for modals
    - Split by route
    - _Requirements: 4.1, 6.1_

- [ ] 13.2 Optimize CSS
    - Remove unused styles
    - Minimize reflows
    - Use GPU acceleration where appropriate
    - _Requirements: 9.3_

- [ ] 13.3 Implement caching strategy
    - Cache API responses
    - Use SWR for client-side data
    - Implement stale-while-revalidate
    - _Requirements: 4.1, 6.1_

- [ ] 14. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Documentation and cleanup
  - [ ] 15.1 Update component documentation
    - Document new OnlyFans dashboard page
    - Update navigation menu docs
    - Document routing changes
    - _Requirements: All requirements_

- [ ] 15.2 Update user guides
    - Create guide for new OnlyFans dashboard
    - Update navigation documentation
    - Add troubleshooting section
    - _Requirements: All requirements_

- [ ] 15.3 Code cleanup
    - Remove unused code
    - Fix linting issues
    - Optimize imports
    - _Requirements: All requirements_

- [ ] 16. Final testing and validation
  - [ ] 16.1 Manual testing
    - Test all routes manually
    - Verify all features work
    - Check on different browsers
    - Test on different devices
    - _Requirements: All requirements_

- [ ] 16.2 Performance testing
    - Measure page load times
    - Check bundle sizes
    - Verify no performance regressions
    - _Requirements: 4.1, 6.1_

- [ ] 16.3 Accessibility testing
    - Run accessibility audits
    - Test keyboard navigation
    - Verify screen reader compatibility
    - _Requirements: All requirements_

- [ ] 17. Final Checkpoint - Make sure all tests are passing
  - Ensure all tests pass, ask the user if questions arise.
