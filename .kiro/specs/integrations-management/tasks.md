# Implementation Plan

- [x] 1. Set up core integrations infrastructure
  - Create IntegrationsService class with OAuth flow methods
  - Set up platform-specific adapters (Instagram, TikTok, Reddit, OnlyFans)
  - Implement token encryption/decryption utilities
  - _Requirements: 11.1, 11.2, 11.4_

- [ ] 1.1 Write property test for token encryption round-trip
  - **Property 8: Metadata persistence**
  - **Validates: Requirements 9.1, 9.2, 9.4**

- [x] 2. Implement API routes for integrations management
  - Create GET /api/integrations/status endpoint
  - Create POST /api/integrations/connect/:provider endpoint
  - Create GET /api/integrations/callback/:provider endpoint
  - Create DELETE /api/integrations/disconnect/:provider/:accountId endpoint
  - Create POST /api/integrations/refresh/:provider/:accountId endpoint
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 8.1_

- [x] 2.1 Write property test for OAuth state validation
  - **Property 4: OAuth state validation**
  - **Validates: Requirements 11.3**

- [ ] 2.2 Write property test for disconnection cleanup
  - **Property 3: Disconnection cleanup**
  - **Validates: Requirements 11.5**

- [x] 3. Create frontend components
  - Build IntegrationsPage component
  - Build IntegrationCard component with all states (disconnected, connected, expired, error, loading)
  - Build IntegrationIcon component for platform branding
  - Build IntegrationStatus component for connection status display
  - _Requirements: 1.1, 1.2, 3.2, 3.3_

- [x] 3.1 Write property test for integration uniqueness
  - **Property 1: Integration uniqueness**
  - **Validates: Requirements 1.2, 12.4**

- [x] 4. Implement useIntegrations hook
  - Create custom hook with connect, disconnect, reconnect, refresh methods
  - Implement loading and error state management
  - Add real-time status updates
  - _Requirements: 2.1, 3.1, 8.1_

- [x] 4.1 Write property test for expired token detection
  - **Property 5: Expired token detection**
  - **Validates: Requirements 8.1, 3.3**

- [x] 5. Implement token refresh mechanism
  - Automatic token refresh before expiry
  - Background refresh for active sessions
  - _Requirements: 8.1, 8.2_

- [x] 5.1 Write property test for token refresh preservation
  - **Property 6: Token refresh preserves connection**
  - **Validates: Requirements 8.1, 8.2**

- [x] 6. Implement multi-account support
  - Support multiple accounts per provider
  - Unique identification by providerAccountId
  - Independent metadata per account
  - _Requirements: 12.1, 12.2, 12.4_

- [x] 6.1 Write property test for multi-account support
  - **Property 7: Multi-account support**
  - **Validates: Requirements 12.1, 12.2, 12.4**
  - ✅ **COMPLETED**: `tests/unit/services/multi-account-support.property.test.ts`

- [ ] 7. **API Integration Optimization** 🔄 IN PROGRESS
  - [x] 7.1 Implement retry logic with exponential backoff
    - ✅ **COMPLETED**: `lib/utils/fetch-with-retry.ts`
    - ✅ **TESTS**: `tests/unit/utils/fetch-with-retry.test.ts` (20+ test cases)
    - ✅ **INTEGRATED**: `hooks/useIntegrations.ts`
    - 📄 **Documentation**: `.kiro/specs/integrations-management/TASK_7_1_COMPLETION.md`
  - [x] 7.2 Add comprehensive TypeScript types for API responses
    - ✅ **COMPLETED**: 8 new API response types in `lib/services/integrations/types.ts`
    - ✅ **TYPE GUARDS**: 5 new type guard functions + 2 utility functions
    - ✅ **TESTS**: `tests/unit/services/integration-types.test.ts` (29 test cases)
    - 📄 **Documentation**: `.kiro/specs/integrations-management/TASK_7_2_COMPLETION.md`
  - [ ] 7.3 Implement multi-account token management
  - [ ] 7.4 Add automatic token refresh mechanism
  - [ ] 7.5 Configure SWR caching for better performance
  - [ ] 7.6 Add structured logging with correlation IDs
  - [ ] 7.7 Implement performance monitoring
  - [ ] 7.8 Write integration tests for multi-account scenarios
  - _Requirements: 8.1, 8.2, 12.1, 12.2_
  - 📄 **Documentation**: `.kiro/specs/integrations-management/MULTI_ACCOUNT_API_OPTIMIZATION.md`
  - Create automatic token refresh logic
  - Implement retry with exponential backoff
  - Add token expiry detection
  - Handle refresh failures gracefully
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 5.1 Write property test for token refresh preserves connection
  - **Property 2: Token refresh preserves connection**
  - **Validates: Requirements 8.1, 8.2**

- [x] 6. Replace mock data with real integrations
  - Update useOnlyFansDashboard to use real OAuth tokens
  - Update useInstagramAccount to use real OAuth tokens
  - Remove hardcoded mock data from dashboard components
  - Update analytics pages to fetch real data
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 6.1 Write property test for real data display
  - **Property 6: Real data display**
  - **Validates: Requirements 6.1, 6.3**

- [x] 7. Implement multi-account support
  - Update UI to display multiple accounts per platform
  - Add account switcher component
  - Update API endpoints to handle multiple accounts
  - Add account selection to data fetching hooks
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [x] 7.1 Write property test for multi-account support
  - **Property 7: Multi-account support**
  - **Validates: Requirements 12.1, 12.2, 12.4**

- [x] 8. Add error handling and user feedback
  - Implement OAuth error handling with user-friendly messages
  - Add toast notifications for success/error states
  - Create error recovery flows (reconnect buttons)
  - Add loading states to all async operations
  - _Requirements: 2.4, 3.4, 8.3_

- [x] 8.1 Write unit tests for error handling
  - Test OAuth error scenarios (cancelled, invalid credentials, network errors)
  - Test API error handling (401, 403, 429, 500)
  - Test token refresh error handling
  - _Requirements: 2.4, 8.3_

- [x] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement security measures
  - Add CSRF protection with state parameter validation
  - Implement rate limiting on OAuth endpoints
  - Add request validation and sanitization
  - Implement audit logging for integration operations
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 10.1 Write integration tests for security
  - Test CSRF protection
  - Test rate limiting
  - Test authentication requirements
  - Test authorization checks
  - _Requirements: 11.1, 11.2, 11.3_

- [x] 11. Add caching and performance optimizations
  - Implement integration status caching (5 min TTL)
  - Add database query optimization with proper indexes
  - Implement request batching for token refresh
  - Add connection pooling configuration
  - _Requirements: 10.1, 10.2_

- [x] 11.1 Write unit tests for caching logic
  - Test cache hit/miss scenarios
  - Test cache invalidation
  - Test TTL expiration
  - _Requirements: 10.1_

- [x] 12. Update existing pages to use new integrations system
  - Update /platforms/connect pages to use new API
  - Update dashboard pages to fetch real data
  - Update analytics pages to use real integrations
  - Remove old mock data generation code
  - _Requirements: 6.1, 6.2, 6.3_<<>>

- [x] 12.1 Write E2E tests for user journeys
  - Test connect Instagram flow
  - Test disconnect integration flow
  - Test reconnect expired integration flow
  - Test multi-account switching
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 12.1_

- [x] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
