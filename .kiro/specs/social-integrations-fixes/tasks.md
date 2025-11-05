# Implementation Plan - Social Integrations Fixes

## Phase 1: Core Infrastructure Fixes (Priority 1)

- [x] 1. Create User Authentication Utility
  - Create `lib/auth/getUserFromRequest.ts` utility
  - Implement JWT token extraction from request headers
  - Add user session validation
  - Create `requireAuth()` helper for protected endpoints
  - Add proper error handling for unauthenticated requests
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 1.1 Implement JWT token extraction
  - Extract Authorization header from request
  - Validate JWT token format and signature
  - Parse user information from token payload
  - Handle expired tokens gracefully
  - _Requirements: 4.1, 4.3_

- [x] 1.2 Create authentication middleware
  - Create reusable authentication wrapper
  - Add session validation logic
  - Implement proper error responses for auth failures
  - Add logging for authentication events
  - _Requirements: 4.2, 4.4, 4.5_

- [x] 2. Standardize OAuth Error Handling
  - Create `lib/oauth/errorHandler.ts` utility
  - Define standard error response format
  - Implement user-friendly error messages
  - Add error logging with context
  - Create error categorization system
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 2.1 Create error response utility
  - Define `OAuthError` interface
  - Implement `createErrorResponse()` function
  - Add error code mapping for different scenarios
  - Include actionable suggestions in error messages
  - _Requirements: 7.1, 7.2, 7.5_

- [x] 2.2 Implement callback error handling
  - Create `handleCallbackError()` function
  - Map OAuth provider errors to user-friendly messages
  - Add proper redirect handling for errors
  - Include recovery suggestions
  - _Requirements: 7.2, 7.3, 7.5_

- [x] 3. Database Schema Improvements
  - Add missing indexes to oauth_accounts table
  - Create oauth_states table for CSRF protection
  - Add proper foreign key constraints
  - Create cleanup functions for expired data
  - Add database migration scripts
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 3.1 Create database migration
  - Add indexes for performance optimization
  - Create oauth_states table for state management
  - Add foreign key constraints
  - Add check constraints for provider values
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 3.2 Implement state management
  - Create state storage and validation functions
  - Add cleanup job for expired states
  - Implement secure state generation
  - Add state validation in callbacks
  - _Requirements: 1.3, 12.1_

## Phase 2: TikTok OAuth Fixes (Priority 1)

- [x] 4. Fix TikTok OAuth Init Endpoint
  - Update `/api/auth/tiktok/route.ts` to use TikTokOAuthService
  - Add user authentication requirement
  - Implement proper state generation and storage
  - Add credential validation
  - Improve error handling
  - _Requirements: 2.1, 2.2, 2.5_

- [x] 4.1 Refactor OAuth init
  - Replace direct URL construction with TikTokOAuthService
  - Add user authentication check
  - Generate and store secure state parameter
  - Add proper error handling and logging
  - _Requirements: 2.1, 2.2_

- [x] 4.2 Add credential validation
  - Validate TikTok credentials at runtime
  - Provide clear error messages for missing config
  - Add graceful degradation for invalid credentials
  - _Requirements: 6.1, 6.2, 6.4_

- [x] 5. Fix TikTok OAuth Callback
  - Update `/api/auth/tiktok/callback/route.ts` to use tokenManager
  - Remove cookie-based token storage
  - Add proper state validation
  - Extract user ID from authenticated session
  - Implement consistent error handling
  - _Requirements: 2.3, 2.4, 2.5_

- [x] 5.1 Implement proper token storage
  - Replace cookie storage with tokenManager.storeTokens()
  - Add proper user ID extraction from session
  - Store tokens with proper metadata
  - Handle token storage errors
  - _Requirements: 2.3, 2.4_

- [x] 5.2 Add state validation
  - Validate state parameter against stored value
  - Clear state after successful validation
  - Handle state validation failures
  - Add CSRF protection logging
  - _Requirements: 1.3, 12.1_

- [x] 5.3 Improve error handling
  - Use standardized error handler
  - Add proper redirect URLs for errors
  - Include user-friendly error messages
  - Add error logging with context
  - _Requirements: 2.5, 7.1, 7.2_

## Phase 3: Instagram OAuth Improvements (Priority 2)

- [ ] 6. Fix Instagram OAuth Callback
  - Remove unused `oauthAccountsRepository` import
  - Replace hardcoded user ID with session extraction
  - Improve Instagram Business account validation
  - Add proper error handling
  - Implement token refresh scheduling
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 6.1 Clean up imports and fix user ID
  - Remove unused oauthAccountsRepository import
  - Extract user ID from authenticated session
  - Add proper session validation
  - Handle unauthenticated requests
  - _Requirements: 3.1, 3.2_

- [ ] 6.2 Improve Business account validation
  - Add better error messages for missing Business accounts
  - Provide clear instructions for account conversion
  - Add validation for required permissions
  - Handle edge cases in account detection
  - _Requirements: 3.3, 3.5_

- [ ] 6.3 Add token refresh scheduling
  - Implement refresh logic for Instagram long-lived tokens
  - Add scheduling for tokens expiring within 7 days
  - Handle refresh failures gracefully
  - Add monitoring for refresh operations
  - _Requirements: 3.4, 8.1, 8.2_

- [ ] 7. Enhance Instagram OAuth Service
  - Add better credential validation
  - Improve error handling in service methods
  - Add retry logic for API calls
  - Implement proper logging
  - Add rate limiting awareness
  - _Requirements: 3.3, 3.4, 3.5_

## Phase 4: Reddit OAuth Consistency (Priority 2)

- [ ] 8. Update Reddit OAuth Flow
  - Ensure Reddit OAuth follows same patterns as other platforms
  - Add user authentication requirement
  - Implement proper state validation
  - Use tokenManager for token storage
  - Add consistent error handling
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 8.1 Standardize Reddit OAuth init
  - Add user authentication check
  - Use RedditOAuthService consistently
  - Implement state generation and storage
  - Add proper error handling
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 8.2 Fix Reddit OAuth callback
  - Add state validation
  - Use tokenManager for token storage
  - Extract user ID from session
  - Implement consistent error handling
  - _Requirements: 1.3, 1.4, 1.5_

## Phase 5: Disconnect Functionality (Priority 2)

- [ ] 9. Implement Disconnect Endpoints
  - Create `/api/auth/[platform]/disconnect` endpoints
  - Add token revocation with platform APIs
  - Clean up associated data
  - Add confirmation UI
  - Handle disconnect errors gracefully
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 9.1 Create disconnect API endpoints
  - Add POST `/api/auth/tiktok/disconnect`
  - Add POST `/api/auth/instagram/disconnect`
  - Add POST `/api/auth/reddit/disconnect`
  - Require user authentication
  - _Requirements: 9.1_

- [ ] 9.2 Implement token revocation
  - Call platform APIs to revoke tokens
  - Handle revocation failures gracefully
  - Log revocation attempts
  - Clean up database records
  - _Requirements: 9.2, 9.3_

- [ ] 9.3 Add disconnect UI
  - Update connect pages with disconnect buttons
  - Add confirmation dialogs
  - Show disconnect status
  - Handle disconnect errors in UI
  - _Requirements: 9.4, 9.5_

## Phase 6: Token Management Enhancements (Priority 3)

- [ ] 10. Implement Token Refresh Scheduler
  - Create background job for token refresh
  - Add scheduling for tokens expiring within 1 hour
  - Handle refresh failures and retries
  - Add monitoring and alerting
  - Implement token cleanup
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 10.1 Create refresh scheduler
  - Create `lib/workers/tokenRefreshScheduler.ts`
  - Add cron job for periodic refresh checks
  - Implement refresh logic for each platform
  - Add retry mechanism for failed refreshes
  - _Requirements: 8.1, 8.2_

- [ ] 10.2 Add token validation
  - Create token validation utilities
  - Check token expiry with buffer time
  - Validate token format and structure
  - Add token health checks
  - _Requirements: 8.3, 8.4_

- [ ] 10.3 Implement token cleanup
  - Remove expired tokens from database
  - Clean up orphaned OAuth accounts
  - Add cleanup scheduling
  - Monitor cleanup operations
  - _Requirements: 8.5_

## Phase 7: Security Enhancements (Priority 3)

- [ ] 11. Enhance CSRF Protection
  - Implement secure state generation
  - Add state storage with expiry
  - Validate state in all OAuth callbacks
  - Add security event logging
  - Implement rate limiting
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 11.1 Implement secure state management
  - Use cryptographically secure random generation
  - Store state with user association
  - Add automatic cleanup of expired states
  - Validate state uniqueness
  - _Requirements: 12.1_

- [ ] 11.2 Add redirect URI validation
  - Validate redirect URIs against whitelist
  - Prevent open redirect attacks
  - Add environment-specific validation
  - Log suspicious redirect attempts
  - _Requirements: 12.2_

- [ ] 11.3 Implement rate limiting
  - Add rate limiting to OAuth endpoints
  - Implement per-user and per-IP limits
  - Add rate limit headers
  - Handle rate limit exceeded gracefully
  - _Requirements: 12.3_

- [ ] 11.4 Enhance cookie security
  - Use secure cookie settings
  - Implement proper SameSite attributes
  - Add HttpOnly flags
  - Set appropriate expiry times
  - _Requirements: 12.4, 12.5_

## Phase 8: Environment Configuration (Priority 3)

- [ ] 12. Implement Configuration Validation
  - Add startup validation for OAuth credentials
  - Create environment-specific configurations
  - Add graceful degradation for missing credentials
  - Implement configuration health checks
  - Add configuration documentation
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 12.1 Create configuration validator
  - Validate all OAuth credentials at startup
  - Check redirect URI configurations
  - Validate environment consistency
  - Add configuration error reporting
  - _Requirements: 6.1, 6.2, 6.4_

- [ ] 12.2 Add environment-specific configs
  - Create development configuration
  - Add staging configuration
  - Set up production configuration
  - Add configuration switching logic
  - _Requirements: 6.3_

- [ ] 12.3 Implement graceful degradation
  - Handle missing optional credentials
  - Disable features when credentials unavailable
  - Add clear error messages for users
  - Log configuration issues
  - _Requirements: 6.5_

## Phase 9: Testing and Validation (Priority 3)

- [ ] 13. Create Comprehensive Tests
  - Add unit tests for all OAuth services
  - Create integration tests for OAuth flows
  - Add security tests for CSRF protection
  - Create end-to-end tests
  - Add performance tests
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 13.1 Unit tests
  - Test OAuth service methods
  - Test token management functions
  - Test error handling utilities
  - Test validation functions
  - _Requirements: 10.1_

- [ ] 13.2 Integration tests
  - Test complete OAuth flows
  - Test token refresh scenarios
  - Test error handling paths
  - Test database operations
  - _Requirements: 10.2_

- [ ] 13.3 Security tests
  - Test CSRF protection
  - Test state validation
  - Test token encryption
  - Test rate limiting
  - _Requirements: 10.3_

- [ ] 13.4 End-to-end tests
  - Test user authentication flow
  - Test platform connection flow
  - Test disconnect functionality
  - Test error recovery
  - _Requirements: 10.4, 10.5_

## Phase 10: Monitoring and Observability (Priority 3)

- [ ] 14. Implement Monitoring
  - Add OAuth success rate tracking
  - Create error monitoring
  - Add token refresh monitoring
  - Implement health checks
  - Create alerting system
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 14.1 Add metrics collection
  - Track OAuth success rates by platform
  - Monitor token refresh operations
  - Track error rates and types
  - Monitor API response times
  - _Requirements: 11.1, 11.2_

- [ ] 14.2 Implement logging
  - Add structured logging for OAuth events
  - Log security events
  - Add correlation IDs
  - Implement log aggregation
  - _Requirements: 11.3_

- [ ] 14.3 Create health checks
  - Add OAuth service health checks
  - Validate credential configurations
  - Check database connectivity
  - Monitor external API availability
  - _Requirements: 11.4_

- [ ] 14.4 Set up alerting
  - Alert on high OAuth failure rates
  - Alert on token refresh failures
  - Alert on security events
  - Alert on configuration issues
  - _Requirements: 11.5_

## Notes

- All tasks should maintain backward compatibility where possible
- Database migrations should be tested thoroughly before production
- Security enhancements should be implemented carefully to avoid breaking existing functionality
- All changes should be thoroughly tested in staging before production deployment
- Monitor OAuth success rates closely after deployment