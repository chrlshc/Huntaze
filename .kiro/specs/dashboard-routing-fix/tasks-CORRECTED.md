# Implementation Plan: Dashboard Routing Fix (CORRECTED)

## Ce qui manque VRAIMENT

- [ ] Task 1. Set up testing infrastructure
  - Install fast-check for property-based testing
  - Configure test environment for routing tests
  - Set up Playwright for integration tests
  - _Requirements: All requirements (testing foundation)_

- [ ] 1.1 Install fast-check and configure
  - **Property-based testing setup**
  - **Validates: Testing Strategy**

- [ ] Task 2. Create ONLY missing OnlyFans pages
  - [ ] 2.1 Create `/app/(app)/onlyfans/page.tsx` (SEULE page principale manquante)
    - Implement server component for OnlyFans dashboard
    - Add stats overview cards (messages, fans, PPV)
    - Include quick action buttons and navigation to sub-pages
    - Add connection status indicator
    - _Requirements: 1.1, 1.2, 1.3_
    - **NOTE:** Les pages `/fans`, `/ppv`, `/messages/mass`, `/settings/welcome` existent déjà!

- [ ] 2.2 Create `/app/(app)/onlyfans/messages/page.tsx` (page messages principale)
    - Display OnlyFans-specific messages with threads and conversations
    - Navigation vers `/mass` pour messages groupés
    - Connection prompt si non connecté
    - _Requirements: 1.1, 1.2, 2.3_
    - **NOTE:** La page `/messages/mass/page.tsx` existe déjà!

- [ ] 2.3 Create `/app/(app)/onlyfans/settings/page.tsx` (page settings principale)
    - Display settings overview with navigation to sub-settings
    - Navigation vers `/welcome` et autres sous-paramètres
    - _Requirements: 1.1, 1.2_
    - **NOTE:** La page `/settings/welcome/page.tsx` existe déjà!

- [ ] 2.4 Write property test for OnlyFans page accessibility
  - **Property 2: OnlyFans Page Accessibility**
  - **Validates: Requirements 1.1, 1.2**

- [ ] 2.5 Create API route for OnlyFans stats
    - Implement `/app/api/onlyfans/stats/route.ts`
    - Fetch data from database/external APIs
    - Return formatted stats object
    - Add error handling and caching
    - _Requirements: 1.2_

- [ ] 2.6 Write unit tests for OnlyFans stats API
    - Test stats data transformation
    - Test error handling
    - Test caching behavior
    - _Requirements: 1.2_

- [ ] Task 3. Redirect existing messages page to OnlyFans
  - [ ] 3.1 Update `/app/(app)/messages/page.tsx` to redirect
    - **NOTE:** Cette page EXISTE déjà et est complète!
    - Remplacer le contenu actuel par une simple redirection
    - Use Next.js `redirect()` function
    - Add comment explaining redirect purpose for backward compatibility
    - _Requirements: 2.1, 2.2_

- [ ] 3.2 Write property test for messages redirect
  - **Property 3: Messages Redirect Correctness**
  - **Validates: Requirements 2.1, 2.3**

- [ ] Task 4. Update navigation menu
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

- [ ] 4.3 Verify Marketing is accessible
    - **NOTE:** La page `/marketing/page.tsx` EXISTE déjà et est complète!
    - Verify Marketing menu item exists in Sidebar
    - Test navigation flow
    - _Requirements: 3.3, 7.1_

- [ ] 4.4 Implement active state detection
    - Update Sidebar to detect current route
    - Highlight active menu item
    - Handle nested routes (e.g., `/onlyfans/messages`)
    - _Requirements: 7.3_

- [ ] 4.5 Write property test for navigation active state
  - **Property 6: Navigation Active State**
  - **Validates: Requirements 7.3**

- [ ] 4.6 Write unit tests for navigation menu
    - Test menu item generation
    - Test active state logic
    - Test badge display for unread counts
    - _Requirements: 7.1, 7.2, 7.3_

- [ ] Task 5. Verify existing pages (NO CHANGES NEEDED)
  - [ ] 5.1 Verify `/app/(app)/integrations/page.tsx` works correctly
    - **NOTE:** Cette page EXISTE déjà et est correcte!
    - Verify no hydration mismatches
    - Test connection status updates
    - Ensure proper error handling
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 5.2 Verify `/app/(app)/analytics/page.tsx` works correctly
    - **NOTE:** Cette page EXISTE déjà avec loading states, error handling, etc.!
    - Verify loading states work
    - Verify error handling with retry
    - Test empty states
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 5.3 Verify `/app/(app)/content/page.tsx` layout
    - **NOTE:** Cette page EXISTE déjà!
    - Check for any z-index conflicts
    - Verify modal positioning
    - Test responsive behavior
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 5.4 Verify `/app/(app)/home/page.tsx` works correctly
    - **NOTE:** Cette page EXISTE déjà avec Suspense, retry logic, etc.!
    - Verify stats loading
    - Test error handling
    - Verify performance
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] Task 6. Write property-based tests
  - [ ] 6.1 Write route resolution property test
    - **Property 1: Route Resolution Consistency**
    - **Validates: Requirements 1.3, 2.2, 3.3, 7.2**

- [ ] 6.2 Write layout grid integration property test
    - **Property 4: Layout Grid Integration**
    - **Validates: Requirements 9.1, 9.2, 9.4**

- [ ] 6.3 Write z-index hierarchy property test
  - **Property 5: Z-Index Hierarchy Consistency**
  - **Validates: Requirements 9.2, 9.5**

- [ ] 6.4 Write performance loading states property test
  - **Property 8: Performance Loading States**
  - **Validates: Requirements 4.1, 6.1**

- [ ] 6.5 Write authentication guard property test
  - **Property 7: Authentication Guard**
  - **Validates: Requirements 7.4, 7.5**

- [ ] 6.6 Write error recovery property test
  - **Property 9: Error Recovery**
  - **Validates: Requirements 8.1, 8.2, 8.4**

- [ ] 6.7 Write responsive layout property test
  - **Property 10: Responsive Layout Adaptation**
  - **Validates: Requirements 9.3**

- [ ] Task 7. Write integration tests
  - [ ] 7.1 Set up Playwright tests
    - Configure Playwright for dashboard testing
    - Create test fixtures and helpers
    - Set up test data
    - _Requirements: All requirements_

- [ ] 7.2 Write route navigation tests
    - Test navigation through all main routes
    - Verify correct page loads
    - Test breadcrumb navigation
    - _Requirements: 1.3, 2.2, 3.3, 7.2_

- [ ] 7.3 Write OnlyFans dashboard tests
    - Test stats display
    - Test quick actions
    - Test navigation to sub-pages
    - _Requirements: 1.1, 1.2, 1.3_

- [ ] 7.4 Write messages redirect tests
    - Test redirect from /messages
    - Verify OnlyFans messages display
    - Test connection prompt
    - _Requirements: 2.1, 2.2, 2.3_

- [ ] 7.5 Write layout tests
    - Test no element overlapping
    - Test responsive layouts
    - Test modal positioning
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 7.6 Write authentication tests
    - Test protected route access
    - Test login redirect
    - Test session persistence
    - _Requirements: 7.4, 7.5_

- [ ] Task 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] Task 9. Documentation and cleanup
  - [ ] 9.1 Update component documentation
    - Document new OnlyFans dashboard page
    - Update navigation menu docs
    - Document routing changes
    - _Requirements: All requirements_

- [ ] 9.2 Update user guides
    - Create guide for new OnlyFans dashboard
    - Update navigation documentation
    - Add troubleshooting section
    - _Requirements: All requirements_

- [ ] 9.3 Code cleanup
    - Remove unused code
    - Fix linting issues
    - Optimize imports
    - _Requirements: All requirements_

- [ ] Task 10. Final testing and validation
  - [ ] 10.1 Manual testing
    - Test all routes manually
    - Verify all features work
    - Check on different browsers
    - Test on different devices
    - _Requirements: All requirements_

- [ ] 10.2 Performance testing
    - Measure page load times
    - Check bundle sizes
    - Verify no performance regressions
    - _Requirements: 4.1, 6.1_

- [ ] 10.3 Accessibility testing
    - Run accessibility audits
    - Test keyboard navigation
    - Verify screen reader compatibility
    - _Requirements: All requirements_

- [ ] Task 11. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Résumé des Changements

### Pages à CRÉER (3 seulement):
1. `/onlyfans/page.tsx` - Dashboard principal
2. `/onlyfans/messages/page.tsx` - Page messages principale
3. `/onlyfans/settings/page.tsx` - Page settings principale

### Pages à MODIFIER (1 seulement):
1. `/messages/page.tsx` - Remplacer par redirection

### Pages EXISTANTES (aucun changement nécessaire):
- ✅ `/marketing/page.tsx`
- ✅ `/analytics/page.tsx`
- ✅ `/integrations/page.tsx`
- ✅ `/home/page.tsx`
- ✅ `/content/page.tsx`
- ✅ `/onlyfans/fans/page.tsx`
- ✅ `/onlyfans/ppv/page.tsx`
- ✅ `/onlyfans/messages/mass/page.tsx`
- ✅ `/onlyfans/settings/welcome/page.tsx`

### Navigation à METTRE À JOUR:
- Ajouter lien OnlyFans dans Sidebar
- Mettre à jour lien Messages vers `/onlyfans/messages`
