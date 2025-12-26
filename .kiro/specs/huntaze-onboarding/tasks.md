# Implementation Plan - Shopify-Style Onboarding

## Overview

This implementation plan breaks down the Shopify-style onboarding system into discrete, manageable coding tasks. Each task builds incrementally on previous work, ensuring a functional system at each stage. The plan follows an implementation-first approach, with optional testing tasks marked with `*`.

---

## Phase 1: Database Foundation and Core Data Layer

- [x] 1. Set up database schema and migrations
  - Create `onboarding_step_definitions` table with versioning support
  - Create `user_onboarding` table with status tracking
  - Create `onboarding_events` table for analytics
  - Add necessary indexes for performance optimization
  - Write migration scripts with rollback support
  - _Requirements: 8.1, 8.2, 13.1, 13.2_

- [x] 2. Implement core data access layer
  - [x] 2.1 Create step definition repository with CRUD operations
    - Write functions to query active steps by market and role
    - Implement step versioning logic
    - Add market-specific filtering based on JSONB rules
    - _Requirements: 8.1, 13.1, 17.2, 17.3_

  - [x] 2.2 Create user onboarding repository
    - Write functions to get/update user step status
    - Implement progress calculation logic with weighted scoring
    - Add snooze tracking and limits
    - _Requirements: 5.1, 5.4, 8.4, 15.1, 15.5_

  - [x] 2.3 Create analytics event repository
    - Write event logging functions with correlation IDs
    - Implement GDPR consent checking
    - Add batch event insertion for performance
    - _Requirements: 10.1, 10.2, 20.1, 20.4_

- [x] 3. Seed initial onboarding steps
  - Create seed data for core steps (email_verification, payments, theme, product, domain)
  - Configure step weights, required flags, and role visibility
  - Add market-specific rules for FR, DE, US markets
  - _Requirements: 2.1, 2.2, 14.1, 17.2, 17.3_

---

## Phase 2: API Layer and Business Logic

- [x] 4. Implement GET /api/onboarding endpoint
  - [x] 4.1 Create endpoint handler with market filtering
    - Parse query parameters (market, role)
    - Fetch active steps filtered by user's market and role
    - Fetch user's current progress for each step
    - Calculate overall progress percentage
    - _Requirements: 8.3, 14.2, 17.2_

  - [x] 4.2 Add response formatting and caching
    - Format response with step details and user status
    - Implement Redis caching with 5-minute TTL
    - Add cache invalidation on step updates
    - _Requirements: 8.3, Performance Optimization_

- [x] 5. Implement PATCH /api/onboarding/steps/:id endpoint
  - [x] 5.1 Create endpoint handler with validation
    - Validate step ID exists and is active
    - Check user has permission to update step (role-based)
    - Validate status transition is allowed
    - Prevent skipping required steps
    - _Requirements: 2.3, 8.4, 14.2, 14.3_

  - [x] 5.2 Implement status update logic
    - Update user_onboarding table with new status
    - Track completion timestamp and user who completed
    - Invalidate user progress cache
    - Recalculate and return new progress percentage
    - _Requirements: 3.2, 5.4, 8.4_

  - [x] 5.3 Add snooze functionality
    - Accept snoozeUntil parameter in request body
    - Validate snooze count doesn't exceed maximum (3)
    - Update snooze_until and snooze_count fields
    - _Requirements: 15.1, 15.2, 15.5_

- [x] 6. Implement gating middleware
  - [x] 6.1 Create requireStep middleware function
    - Check if user has completed required step
    - Return 409 with structured payload if missing
    - Log gating.blocked event with correlation ID
    - Implement error handling with fail-open for non-critical routes
    - _Requirements: 4.1, 4.2, 4.3, 19.1, 19.3_

  - [x] 6.2 Apply middleware to critical routes
    - Add gating to /api/store/publish (requires payments)
    - Add gating to /api/checkout/* (requires payments)
    - Configure route criticality for error handling
    - _Requirements: 4.1, 4.5_

- [x] 7. Implement analytics event tracking
  - [x] 7.1 Create event tracking service
    - Write trackOnboardingEvent function with consent checking
    - Implement event type validation
    - Add correlation ID generation and tracking
    - _Requirements: 20.1, 20.2, 20.4_

  - [x] 7.2 Integrate event tracking into endpoints
    - Track onboarding.step_completed on status updates
    - Track onboarding.step_skipped when steps are skipped
    - Track onboarding.nudge_snoozed on snooze actions
    - Track gating.blocked in middleware
    - _Requirements: 10.1, 20.1_

---

## Phase 3: UI Components

- [x] 8. Create SetupGuide component
  - [x] 8.1 Build base component structure
    - Create component with progress bar and step list
    - Implement responsive layout (mobile-first)
    - Add ARIA labels and accessibility attributes
    - _Requirements: 1.3, 22.1, 22.3, 23.1_

  - [x] 8.2 Implement StepItem sub-component
    - Display step title, description, and status
    - Show "Obligatoire" badge for required steps
    - Render action buttons (Faire, Passer, En savoir plus)
    - Handle role-restricted steps with "Demander à l'owner" message
    - _Requirements: 2.1, 3.1, 14.2, 14.3_

  - [x] 8.3 Add step update functionality
    - Connect to PATCH /api/onboarding/steps/:id endpoint
    - Implement loading states and error handling
    - Update UI optimistically with rollback on error
    - _Requirements: 3.2, 3.4, 19.2_

  - [x] 8.4 Implement progress visualization
    - Create animated progress bar with percentage
    - Update progress in real-time as steps complete
    - Add aria-live region for screen reader announcements
    - _Requirements: 5.1, 5.2, 5.4, 22.3_

- [x] 9. Create CompletionNudge component
  - [x] 9.1 Build nudge banner UI
    - Create dismissible banner with remaining step count
    - Add snooze and dismiss buttons
    - Implement smooth show/hide animations (no jank)
    - _Requirements: 1.4, 15.3, 15.4_

  - [x] 9.2 Implement snooze logic
    - Connect to snooze endpoint
    - Track snooze count and enforce maximum (3)
    - Hide banner during snooze period
    - _Requirements: 15.1, 15.2, 15.3_

  - [x] 9.3 Add auto-dismissal logic
    - Hide banner when progress reaches 80%
    - Hide banner after first order milestone
    - Provide "Réouvrir le guide" link in settings
    - _Requirements: 16.1, 16.2, 16.3_

- [x] 10. Create GuardRailModal component
  - [x] 10.1 Build modal UI with focus trap
    - Create accessible modal with proper ARIA attributes
    - Implement focus trap and keyboard navigation
    - Add mobile-responsive full-screen mode
    - _Requirements: 4.2, 22.1, 22.4, 23.2_

  - [x] 10.2 Implement prerequisite completion flow
    - Parse 409 response payload and display message
    - Provide action button to complete missing step
    - Handle different action types (open_modal, redirect)
    - _Requirements: 4.2, 4.3_

  - [x] 10.3 Add retry and error handling
    - Implement retry logic with exponential backoff
    - Display error messages with retry button
    - Ensure no "dead end" states
    - _Requirements: 19.2, 19.4_

- [ ] 11. Create WelcomeScreen component
  - Create optional welcome screen with 1-2 personalization questions
  - Add prominent "Commencer" button and "Passer pour l'instant" link
  - Store responses for checklist prioritization
  - Ensure completion within 30 seconds maximum
  - _Requirements: 7.1, 7.2, 7.3, 7.5_

---

## Phase 4: Dashboard Integration

- [x] 12. Integrate onboarding into dashboard
  - [x] 12.1 Add SetupGuide card to dashboard
    - Position guide prominently on dashboard
    - Fetch onboarding status on page load
    - Handle loading and error states
    - _Requirements: 1.3, 6.3_

  - [x] 12.2 Add CompletionNudge banner
    - Display banner when progress < 80% and not snoozed
    - Check snooze_until timestamp before showing
    - Implement smooth transitions without jarring animations
    - _Requirements: 1.4, 15.3, 15.4_

  - [x] 12.3 Create dedicated /onboarding page
    - Build full onboarding management page
    - Show all steps with history and status
    - Add "Réinitialiser le guide" soft reset option
    - Provide "Afficher les étapes passées" toggle
    - _Requirements: 6.2, 6.4, 16.3_

- [ ] 13. Implement demo data creation
  - Create 3 demo products on user signup (hidden from public)
  - Install default theme with preview capability
  - Configure generic shipping rates (editable)
  - Enable preview mode for all features
  - _Requirements: 1.2, 1.5, 12.1, 12.2, 12.3, 12.5_

- [ ] 14. Add gating to critical user actions
  - Integrate GuardRailModal into publish flow
  - Add gating checks to checkout initiation
  - Handle 409 responses and trigger modals
  - Implement correlation ID tracking for debugging
  - _Requirements: 4.1, 4.2, 4.4_

---

## Phase 5: Advanced Features

- [ ] 15. Implement step versioning and migration
  - [ ] 15.1 Create migration utilities
    - Write function to create new step versions
    - Implement user progress migration logic
    - Preserve "done" status across versions
    - _Requirements: 13.1, 13.2, 13.3_

  - [ ] 15.2 Add version management API
    - Create admin endpoint to publish new step versions
    - Implement automatic user migration on version change
    - Recalculate progress after migration
    - _Requirements: 13.3, 13.4, 13.5_

- [ ] 16. Implement email verification resilience
  - Add hard/soft bounce detection
  - Implement exponential backoff for resend (1min, 5min, 15min, 1hr)
  - Create fallback verification methods (domain-based auth)
  - Display clear error messages and alternatives
  - _Requirements: 18.1, 18.2, 18.3, 18.4_

- [ ] 17. Add plan-based feature eligibility
  - Filter steps based on user's subscription plan
  - Display upgrade suggestions for unavailable features
  - Recalculate progress excluding plan-restricted steps
  - Update visible steps on plan upgrade
  - _Requirements: 21.1, 21.2, 21.3, 21.5_

- [ ] 18. Implement rate limiting
  - Add rate limiting middleware for step updates (20/min)
  - Limit snooze actions (3/day)
  - Protect API endpoints from abuse
  - Return 429 with clear error messages
  - _Requirements: Security Considerations_

---

## Phase 6: Analytics and Monitoring

- [ ] 19. Create analytics dashboard queries
  - [ ] 19.1 Implement skip rate analysis
    - Write SQL query for skip rate per step (7-day rolling)
    - Create API endpoint to fetch skip rate data
    - _Requirements: 10.2, 10.5_

  - [ ] 19.2 Implement Time-to-Value (TTV) tracking
    - Track time to first preview event
    - Track time to first product creation
    - Calculate average TTV by cohort
    - _Requirements: 10.1_

  - [ ] 19.3 Implement conversion rate tracking
    - Calculate D1 and D7 conversion rates
    - Track by cohort and market
    - Create API endpoint for conversion data
    - _Requirements: 10.4_

  - [ ] 19.4 Implement modal abandonment tracking
    - Track gating.blocked events
    - Correlate with subsequent step completions
    - Calculate abandonment rate per step
    - _Requirements: 24.3_

- [ ] 20. Set up production observability
  - [ ] 20.1 Configure metrics collection
    - Set up Prometheus metrics (counters, histograms, gauges)
    - Track step completions, durations, gating blocks
    - Export metrics endpoint
    - _Requirements: 24.1, 24.5_

  - [ ] 20.2 Implement structured logging
    - Add correlation IDs to all log entries
    - Log step updates, gating blocks, errors
    - Configure log levels and retention
    - _Requirements: 19.3, 24.5_

  - [ ] 20.3 Set up alerting rules
    - Alert on 409 rate > 5%
    - Alert on D1/D7 conversion drops > 10%
    - Alert on API error rate > 1%
    - Alert on modal abandonment > 50%
    - _Requirements: 24.1, 24.2, 24.3_

  - [ ] 20.4 Create health metrics dashboard
    - Build real-time dashboard showing key metrics
    - Display conversion rates, skip rates, error rates
    - Add drill-down capabilities by market and cohort
    - _Requirements: 24.4_

---

## Phase 7: Feature Flags and Rollout

- [ ] 21. Implement feature flag system
  - [ ] 21.1 Create feature flag configuration
    - Define OnboardingFeatureFlags interface
    - Implement flag storage (database or config service)
    - Add flag evaluation logic with user/market whitelists
    - _Requirements: 11.1, 11.2_

  - [ ] 21.2 Add rollout percentage logic
    - Implement consistent user hashing for percentage rollout
    - Create admin API to update rollout percentage
    - Add flag checks to all onboarding entry points
    - _Requirements: 11.5_

  - [ ] 21.3 Implement kill switch
    - Create emergency rollback function
    - Add automatic rollback triggers (error rate, conversion drops)
    - Implement graceful fallback to legacy onboarding
    - Preserve user progress during rollback
    - _Requirements: Rollout Plan_

- [ ] 22. Set up A/B testing framework
  - [ ] 22.1 Create experiment configuration system
    - Define Experiment and Variant interfaces
    - Implement variant assignment with consistent hashing
    - Store experiment configurations
    - _Requirements: A/B Testing Framework_

  - [ ] 22.2 Implement experiment tracking
    - Track experiment exposure events
    - Include variant in all analytics events
    - Create experiment analysis queries
    - _Requirements: 20.3_

  - [ ] 22.3 Create initial experiments
    - Set up skip button text experiment (3 variants)
    - Set up skip button style experiment (2 variants)
    - Configure metrics tracking for each experiment
    - _Requirements: A/B Testing Framework_

---

## Phase 8: Migration and Launch Preparation

- [ ] 23. Migrate existing users
  - Write migration script for users with incomplete onboarding
  - Map old step IDs to new system
  - Preserve completed step status
  - Test migration on staging environment
  - _Requirements: Migration Strategy_

- [ ] 24. Performance optimization
  - Implement Redis caching for step definitions and user progress
  - Add database indexes for common queries
  - Optimize progress calculation queries
  - Implement lazy loading for UI components
  - _Requirements: Performance Optimization_

- [ ] 25. Security hardening
  - Implement role-based access control for step updates
  - Add CSRF protection to all endpoints
  - Validate all user inputs and sanitize outputs
  - Implement GDPR data export and deletion
  - _Requirements: Security Considerations_

- [ ] 26. Accessibility audit and fixes
  - Run axe DevTools audit on all components
  - Fix contrast and keyboard navigation issues
  - Test with screen readers (NVDA, JAWS, VoiceOver)
  - Ensure all interactive elements have proper ARIA labels
  - _Requirements: 22.1, 22.2, 22.3, 22.4_

- [ ] 27. Mobile responsiveness testing
  - Test all components at 360px, 768px, 1024px widths
  - Ensure no horizontal scrolling
  - Verify touch-friendly button sizes (44x44px minimum)
  - Test modals in full-screen mode on mobile
  - _Requirements: 23.1, 23.2, 23.3, 23.4, 23.5_

---

## Phase 9: Testing and Quality Assurance

- [ ] 28. Write unit tests for core logic
  - Test progress calculation with various step configurations
  - Test state transition validation
  - Test step versioning and migration logic
  - Test rate limiting logic
  - _Requirements: Testing Strategy_

- [ ] 29. Write integration tests for API endpoints
  - Test GET /api/onboarding with different markets and roles
  - Test PATCH /api/onboarding/steps/:id with various scenarios
  - Test gating middleware with missing prerequisites
  - Test analytics event tracking
  - _Requirements: Testing Strategy_

- [ ] 30. Write E2E tests with Playwright
  - Test skip flow (skip step, verify progress, check accessibility)
  - Test guard-rail flow (attempt gated action, complete prerequisite)
  - Test snooze behavior (snooze, verify hidden, verify reappears)
  - Test market-specific requirements
  - _Requirements: Testing Strategy_

---

## Notes

- Each task should be completed and verified before moving to the next
- All tasks are required for a complete, production-ready implementation
- All code should follow the repository guidelines (TypeScript, 2-space indentation, Next.js conventions)
- Ensure proper error handling and logging at each step
- Test on staging environment before production deployment
