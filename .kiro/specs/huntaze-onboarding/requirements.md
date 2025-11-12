# Requirements Document - Shopify-Style Onboarding

## Introduction

This document defines the requirements for a non-blocking, Shopify-inspired onboarding system for Huntaze. The system prioritizes immediate value delivery by landing users on a functional dashboard with demo data and default configurations, while providing a flexible checklist-based setup guide. Unlike traditional blocking onboarding flows, this system only gates critical legal/security steps and allows users to skip or snooze all other configuration steps, with contextual guard-rails that trigger only when prerequisites are truly needed.

## Glossary

- **Onboarding_System**: The non-blocking setup orchestration system that manages user configuration journey
- **Setup_Guide**: The checklist-based interface displaying configuration steps with skip/complete options
- **Onboarding_Step**: A discrete configuration task that can be required, skippable, or snoozable
- **Gating_Middleware**: Server-side logic that enforces prerequisite checks on critical actions
- **Guard_Rail_Modal**: Contextual UI that appears when users attempt actions without required prerequisites
- **Demo_Data**: Pre-populated sample content (products, themes, settings) provided at signup
- **Snooze_Period**: Temporary dismissal of onboarding nudges (typically 7 days)
- **Progress_Score**: Weighted completion percentage based on completed required and optional steps
- **Completion_Nudge**: Persistent banner encouraging users to finish remaining setup steps
- **Feature_Flag**: Configuration toggle to enable/disable skip functionality progressively

## Requirements

### Requirement 1: Non-Blocking Dashboard Access

**User Story:** As a new Huntaze user, I want to immediately access a functional dashboard with demo data, so that I can explore the platform and understand its value before completing setup

#### Acceptance Criteria

1. WHEN a user completes registration, THE Onboarding_System SHALL redirect them to a functional dashboard within 2 seconds
2. THE Onboarding_System SHALL pre-populate the user account with demo content including 3 sample products, a default theme, and generic shipping settings
3. THE Onboarding_System SHALL display the Setup_Guide as a prominent card on the dashboard
4. THE Onboarding_System SHALL allow full navigation and exploration of all features without blocking access
5. THE Onboarding_System SHALL mark demo content as editable and deletable by the user

### Requirement 2: Minimal Required Steps

**User Story:** As a user, I want to only be forced to complete truly essential steps, so that I can start using the platform quickly without unnecessary friction

#### Acceptance Criteria

1. THE Onboarding_System SHALL designate only email verification and payment configuration as required steps
2. THE Onboarding_System SHALL allow users to skip all non-required steps including product catalog, theme customization, domain connection, and detailed tax settings
3. WHEN a user attempts to process a real payment, THE Gating_Middleware SHALL verify payment configuration is complete
4. THE Onboarding_System SHALL display required steps with a clear "Obligatoire" badge in the Setup_Guide
5. THE Onboarding_System SHALL provide default values for all skippable configuration options

### Requirement 3: Flexible Step Management

**User Story:** As a user, I want to skip, snooze, or complete setup steps at my own pace, so that I can focus on what matters most to me right now

#### Acceptance Criteria

1. THE Setup_Guide SHALL display three action buttons for each step: "Faire" (complete), "Passer" (skip), and "En savoir plus" (learn more)
2. WHEN a user clicks "Passer" on a skippable step, THE Onboarding_System SHALL mark the step as skipped and update progress calculation
3. THE Onboarding_System SHALL allow users to mark skipped steps as "done" later from the dashboard or dedicated onboarding page
4. THE Onboarding_System SHALL persist step status (todo, done, skipped) across sessions in the database
5. THE Onboarding_System SHALL provide a "Masquer 7 jours" option on completion nudges to snooze reminders

### Requirement 4: Contextual Guard-Rails

**User Story:** As a user attempting an action that requires setup, I want to be guided to complete only the necessary prerequisite, so that I'm not blocked unnecessarily but can complete critical requirements when needed

#### Acceptance Criteria

1. WHEN a user attempts to publish their store without completing payment setup, THE Gating_Middleware SHALL return HTTP 409 with the missing step identifier
2. THE Onboarding_System SHALL display a Guard_Rail_Modal explaining the prerequisite and offering to complete it immediately
3. THE Guard_Rail_Modal SHALL provide a direct link to complete the specific required step
4. THE Onboarding_System SHALL allow preview and testing of all features even without completing prerequisites
5. THE Gating_Middleware SHALL only enforce prerequisites at the moment they become truly necessary (e.g., processing real payments, not viewing payment settings)

### Requirement 5: Progress Tracking and Visualization

**User Story:** As a user, I want to see my setup progress and understand what steps remain, so that I feel motivated to complete my configuration

#### Acceptance Criteria

1. THE Onboarding_System SHALL calculate progress as: sum(completed_step_weights) / sum(required_or_not_skipped_step_weights) * 100
2. THE Setup_Guide SHALL display current progress percentage prominently
3. THE Onboarding_System SHALL show the count of remaining steps in the Completion_Nudge banner
4. THE Onboarding_System SHALL update progress in real-time as users complete or skip steps
5. THE Onboarding_System SHALL persist progress calculation across sessions

### Requirement 6: Dedicated Onboarding Management

**User Story:** As a user who wants to resume setup later, I want easy access to my onboarding checklist, so that I can complete remaining steps when convenient

#### Acceptance Criteria

1. THE Onboarding_System SHALL display a "Terminer la configuration (X)" module on the dashboard showing remaining step count
2. THE Onboarding_System SHALL provide a dedicated `/onboarding` page listing all steps with their current status
3. THE Onboarding_System SHALL allow users to access the onboarding page at any time from the main navigation
4. THE Onboarding_System SHALL highlight the next recommended step based on user goals and dependencies
5. THE Onboarding_System SHALL allow users to reorder or customize their onboarding checklist

### Requirement 7: Welcome Screen Personalization

**User Story:** As a new user, I want to answer 1-2 quick questions to personalize my experience, so that the platform can tailor recommendations without lengthy setup

#### Acceptance Criteria

1. THE Onboarding_System SHALL display an optional welcome screen with maximum 2 personalization questions
2. THE Onboarding_System SHALL provide a prominent "Commencer" button and a secondary "Passer pour l'instant" link
3. WHEN a user skips the welcome screen, THE Onboarding_System SHALL use default recommendations
4. THE Onboarding_System SHALL store personalization responses to customize the Setup_Guide priority order
5. THE Onboarding_System SHALL complete the welcome screen interaction within 30 seconds maximum

### Requirement 8: Step Data Model and API

**User Story:** As a developer, I want a robust data model for onboarding steps, so that the system can track progress reliably and support future enhancements

#### Acceptance Criteria

1. THE Onboarding_System SHALL maintain an `onboarding_steps` table with columns: id, title, required, weight
2. THE Onboarding_System SHALL maintain a `user_onboarding` table with columns: user_id, step_id, status, snooze_until, updated_at
3. THE Onboarding_System SHALL provide a GET /api/onboarding endpoint returning all steps with current user status
4. THE Onboarding_System SHALL provide a PATCH /api/onboarding/steps/:id endpoint accepting status updates (done, skipped) and snooze_until timestamps
5. THE Onboarding_System SHALL ensure idempotent step updates allowing users to change status multiple times

### Requirement 9: Accessibility and User Experience

**User Story:** As a user relying on assistive technology, I want the onboarding interface to be fully accessible, so that I can complete setup independently

#### Acceptance Criteria

1. THE Setup_Guide SHALL ensure all "Passer pour l'instant" links are keyboard-focusable and screen-reader accessible
2. THE Onboarding_System SHALL provide clear ARIA labels for all interactive elements
3. THE Onboarding_System SHALL display explanatory text: "Passer pour l'instant (vous pourrez y revenir depuis le tableau de bord)"
4. THE Onboarding_System SHALL support keyboard navigation through all onboarding steps
5. THE Onboarding_System SHALL maintain WCAG 2.1 AA compliance for all onboarding interfaces

### Requirement 10: Analytics and Optimization

**User Story:** As a product manager, I want to track how users interact with the onboarding system, so that I can optimize the experience and reduce friction

#### Acceptance Criteria

1. THE Onboarding_System SHALL log each step status change with timestamp and user_id
2. THE Onboarding_System SHALL calculate skip rate per step over rolling 7-day periods
3. THE Onboarding_System SHALL track Time-to-Value (TTV) metrics including time to first preview and first content creation
4. THE Onboarding_System SHALL measure resume rate (users returning to complete skipped steps)
5. THE Onboarding_System SHALL provide analytics queries for D1/D7 conversion rates and completion rates by step

### Requirement 11: Feature Flag and Progressive Rollout

**User Story:** As a platform administrator, I want to control the rollout of skip functionality, so that I can test and validate the approach before full deployment

#### Acceptance Criteria

1. THE Onboarding_System SHALL implement a Feature_Flag to enable/disable skip functionality per user cohort
2. WHEN the Feature_Flag is disabled, THE Onboarding_System SHALL hide "Passer" buttons and enforce traditional sequential flow
3. THE Onboarding_System SHALL allow A/B testing of different skip button placements and messaging
4. THE Onboarding_System SHALL log Feature_Flag state with all analytics events for cohort analysis
5. THE Onboarding_System SHALL support gradual rollout percentages (e.g., 10%, 25%, 50%, 100%)

### Requirement 12: Immediate Value Delivery

**User Story:** As a new user, I want to see what the platform can do immediately, so that I understand its value before investing time in configuration

#### Acceptance Criteria

1. THE Onboarding_System SHALL create demo products that are hidden from public view but visible in the admin dashboard
2. THE Onboarding_System SHALL install a default theme that is immediately previewable
3. THE Onboarding_System SHALL configure generic shipping rates that can be edited later
4. THE Onboarding_System SHALL enable preview mode for all features without requiring payment configuration
5. THE Onboarding_System SHALL clearly distinguish between demo/preview mode and live/production mode

### Requirement 13: Step Versioning and Migration

**User Story:** As a platform administrator, I want to version onboarding steps and migrate users safely, so that users never lose progress when step definitions change

#### Acceptance Criteria

1. THE Onboarding_System SHALL store step definitions with a version field in the onboarding_step_definitions table
2. WHEN a step definition changes (e.g., payments → payments_v2), THE Onboarding_System SHALL create a new version while preserving the old one
3. THE Onboarding_System SHALL migrate user progress by marking the new version as done if the old version was completed
4. THE Onboarding_System SHALL recalculate progress scores after migration to reflect new step weights
5. IF a step becomes required after migration and was previously skipped, THEN THE Onboarding_System SHALL reset it to todo status without removing done status from completed steps

### Requirement 14: Role-Based Step Visibility

**User Story:** As a staff member, I want to see only the onboarding steps relevant to my role, so that I'm not confused by owner-only configuration tasks

#### Acceptance Criteria

1. THE Onboarding_System SHALL filter steps based on user role (owner, staff, admin)
2. WHEN a staff user views the Setup_Guide, THE Onboarding_System SHALL hide owner-only steps like payment configuration
3. WHERE a staff user needs owner action, THE Onboarding_System SHALL display a message: "Demander à l'owner"
4. THE Onboarding_System SHALL allow owners to delegate specific steps to staff members
5. THE Onboarding_System SHALL track which role completed each step for audit purposes

### Requirement 15: Snooze Limits and Behavior

**User Story:** As a user, I want to snooze onboarding reminders temporarily, so that I can focus on other tasks without being constantly interrupted

#### Acceptance Criteria

1. THE Onboarding_System SHALL allow users to snooze the completion nudge for 7 days
2. THE Onboarding_System SHALL limit snooze actions to a maximum of 3 times per user
3. WHILE a snooze is active, THE Completion_Nudge SHALL not appear on any page
4. WHEN the snooze period expires, THE Completion_Nudge SHALL reappear without animation or jarring transitions
5. THE Onboarding_System SHALL persist snooze_until timestamps and snooze count in the database

### Requirement 16: Automatic Guide Dismissal

**User Story:** As an active user who has achieved key milestones, I want the onboarding guide to automatically hide, so that my dashboard remains focused on daily operations

#### Acceptance Criteria

1. WHEN a user completes their first real order, THE Onboarding_System SHALL automatically hide the Setup_Guide from the dashboard
2. WHEN progress reaches 80% or higher, THE Onboarding_System SHALL offer to hide the guide with a dismissible prompt
3. THE Onboarding_System SHALL provide a "Réouvrir le guide" link in Settings for users who want to resume
4. THE Onboarding_System SHALL track milestone events (first_order, first_product_created, first_checkout_attempt)
5. THE Onboarding_System SHALL allow administrators to configure custom dismissal rules per market

### Requirement 17: Market-Specific Legal Requirements

**User Story:** As a user in a specific country, I want to see only the legal and compliance steps required for my market, so that I meet local regulations without unnecessary steps

#### Acceptance Criteria

1. THE Onboarding_System SHALL store market-specific rules in a JSONB field (market_rule) in the onboarding_step_definitions table
2. WHEN a user from Germany accesses GET /api/onboarding, THE Onboarding_System SHALL include Impressum as a required step
3. WHEN a user from France accesses the API, THE Onboarding_System SHALL include mentions légales and politique de retours as required
4. THE Onboarding_System SHALL dynamically calculate required steps based on user's market/country setting
5. THE Onboarding_System SHALL update required steps if the user changes their market location

### Requirement 18: Email Verification Resilience

**User Story:** As a user whose email verification failed, I want alternative verification methods, so that I'm not permanently blocked from using the platform

#### Acceptance Criteria

1. THE Onboarding_System SHALL detect hard and soft email bounces from the verification service
2. WHEN email delivery fails, THE Onboarding_System SHALL display a fallback message with alternative verification options
3. THE Onboarding_System SHALL implement exponential backoff for resend attempts (1min, 5min, 15min, 1hr)
4. THE Onboarding_System SHALL offer domain-based authentication as an alternative verification channel
5. THE Onboarding_System SHALL log all verification attempts and failures for support troubleshooting

### Requirement 19: Error Resilience and Offline Handling

**User Story:** As a user experiencing network issues, I want the onboarding system to degrade gracefully, so that I can continue exploring non-critical features

#### Acceptance Criteria

1. WHEN the gating middleware API call fails, THE Onboarding_System SHALL allow navigation to non-critical routes
2. THE Guard_Rail_Modal SHALL display a retry button if the prerequisite check fails due to network error
3. THE Onboarding_System SHALL log all gating failures with correlation IDs for debugging
4. THE Onboarding_System SHALL never create a "dead end" where users cannot proceed or go back
5. THE Onboarding_System SHALL cache step status locally and sync when connection is restored

### Requirement 20: Analytics Events and A/B Testing

**User Story:** As a product analyst, I want normalized analytics events for all onboarding interactions, so that I can measure effectiveness and run experiments

#### Acceptance Criteria

1. THE Onboarding_System SHALL emit standardized events: onboarding.viewed, onboarding.step_started, onboarding.step_completed, onboarding.step_skipped, onboarding.nudge_snoozed, gating.blocked
2. THE Onboarding_System SHALL include metadata in events: step_id, version, duration_ms, user_role, variant, entrypoint, correlationId
3. THE Onboarding_System SHALL track A/B test variant exposure in all analytics events
4. THE Onboarding_System SHALL respect GDPR consent and not send non-essential analytics without user permission
5. THE Onboarding_System SHALL emit milestone events: merchant.previewed_store, merchant.first_product_created, merchant.first_checkout_attempt

### Requirement 21: Plan-Based Feature Eligibility

**User Story:** As a user on a specific pricing plan, I want to see only the onboarding steps relevant to my plan features, so that I'm not confused by unavailable functionality

#### Acceptance Criteria

1. THE Onboarding_System SHALL filter steps based on the user's current subscription plan
2. WHEN a step requires a higher plan, THE Onboarding_System SHALL display an upgrade suggestion instead of the action button
3. THE Onboarding_System SHALL never display a "dead" call-to-action that leads nowhere
4. THE Onboarding_System SHALL recalculate progress excluding steps not available in the current plan
5. THE Onboarding_System SHALL update visible steps immediately when a user upgrades their plan

### Requirement 22: Enhanced Accessibility Testing

**User Story:** As a user relying on assistive technology, I want the onboarding interface to meet strict accessibility standards, so that I can complete setup independently

#### Acceptance Criteria

1. THE Setup_Guide SHALL implement focus trap within modals and maintain logical tab order
2. THE Onboarding_System SHALL provide explicit ARIA labels for all "Passer" buttons describing what will be skipped
3. THE Onboarding_System SHALL use aria-live regions to announce progress updates to screen readers
4. THE Onboarding_System SHALL pass axe DevTools audit with zero violations for contrast, keyboard navigation, and screen reader compatibility
5. THE Onboarding_System SHALL ensure all interactive elements have visible focus indicators

### Requirement 23: Mobile-First Responsive Design

**User Story:** As a mobile user, I want a fully functional onboarding experience on small screens, so that I can set up my account from any device

#### Acceptance Criteria

1. THE Setup_Guide SHALL display in a compact, vertically-stacked layout on screens below 768px width
2. THE Guard_Rail_Modal SHALL render in full-screen mode on mobile devices
3. THE Onboarding_System SHALL ensure all critical UI elements are visible and functional at 360px width
4. THE Onboarding_System SHALL prevent horizontal scrolling on all onboarding screens
5. THE Onboarding_System SHALL use touch-friendly button sizes (minimum 44x44px) for all interactive elements

### Requirement 24: Production Observability

**User Story:** As a platform engineer, I want comprehensive monitoring of the onboarding system, so that I can detect and resolve issues before they impact users

#### Acceptance Criteria

1. THE Onboarding_System SHALL emit alerts when 409 PRECONDITION_REQUIRED responses exceed 5% of requests
2. THE Onboarding_System SHALL monitor D1 and D7 conversion rates and alert on drops exceeding 10%
3. THE Onboarding_System SHALL track modal abandonment rates (users who close guard-rail modals without completing)
4. THE Onboarding_System SHALL provide a real-time dashboard showing onboarding health metrics
5. THE Onboarding_System SHALL log all gating decisions with correlation IDs for request tracing
