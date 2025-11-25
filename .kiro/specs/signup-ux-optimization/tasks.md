# Implementation Plan: Signup UX Optimization

## Current State Summary

**What's Already Done:**
- ✅ CSRF middleware fully implemented with user-friendly error messages
- ✅ CSRF token API route exists and working
- ✅ NextAuth v5 installed and configured for credentials auth
- ✅ Existing auth pages (login, register) with password strength indicators
- ✅ Onboarding wizard with multi-step flow
- ✅ Onboarding checklist component
- ✅ Property-based testing framework (fast-check) installed
- ✅ Cookie consent and analytics components
- ✅ User model with onboarding tracking fields

**What Needs to Be Built:**
- Client-side CSRF token hook for forms
- Email provider configuration for NextAuth (magic links)
- Social OAuth providers (Google, Apple)
- New signup form components (email-first, social buttons)
- Validation schemas and utilities
- Simplified 3-step onboarding flow
- Interactive dashboard demo
- Accessibility improvements (contrast, focus indicators, etc.)
- Mobile optimizations
- CTA consistency across marketing pages
- Analytics tracking for signup funnel
- Property-based tests for all correctness properties

**Key Changes from Original Plan:**
- Auth infrastructure already exists, need to extend it
- Onboarding system exists but needs simplification (currently 7 steps, need 3)
- Focus on integration rather than building from scratch

---

## Phase 1: Critical CSRF Fix & Foundation

- [x] 1. Enhance CSRF middleware and create client-side hook
  - ✅ CSRF middleware already enhanced in `lib/middleware/csrf.ts` with user-friendly error messages
  - ✅ CSRF token API route exists at `app/api/csrf/token/route.ts`
  - Need to create `hooks/useCsrfToken.ts` hook for client-side token management
  - Need to add automatic token refresh logic to the hook
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [ ] 1.1 Create useCsrfToken client-side hook
  - Create `hooks/useCsrfToken.ts` with token fetching, caching, and auto-refresh
  - Implement retry mechanism for transient failures
  - Add loading and error states
  - _Requirements: 1.1, 1.2, 1.5_

- [ ]* 1.2 Write property test for CSRF token presence
  - **Property 1: CSRF Token Presence**
  - **Validates: Requirements 1.1**

- [ ]* 1.3 Write property test for CSRF token validation
  - **Property 2: CSRF Token Validation**
  - **Validates: Requirements 1.2**

- [ ]* 1.4 Write property test for CSRF token auto-refresh
  - **Property 3: CSRF Token Auto-Refresh**
  - **Validates: Requirements 1.5**

- [ ] 2. Create validation schemas and utilities
  - Create `lib/validation/signup.ts` with Zod schemas for email and password validation
  - Implement email format validation with comprehensive regex
  - Implement password strength calculation function (can reference existing implementation in register page)
  - Create validation error message generator
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 2.1 Write property test for email validation
  - **Property 8: Real-Time Email Validation**
  - **Validates: Requirements 4.1, 4.2, 4.3**

- [ ]* 2.2 Write property test for password strength
  - **Property 9: Password Strength Indication**
  - **Validates: Requirements 4.4**

## Phase 2: Email-First Signup Flow

- [x] 3. Set up NextAuth v5 configuration
  - ✅ NextAuth v5 already installed (`next-auth@5.0.0-beta.30`)
  - ✅ Prisma adapter already installed (`@auth/prisma-adapter@2.11.1`)
  - ✅ Auth routes exist at `app/auth/` and `app/api/auth/`
  - Note: Current implementation uses credentials-based auth, need to add email provider
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 3.1 Configure NextAuth email provider for magic links
  - Create or update `lib/auth/nextauth.config.ts` with email provider configuration
  - Configure AWS SES for email delivery (already have @aws-sdk/client-ses)
  - Set up email templates for magic links
  - Configure 24-hour expiry for magic links
  - _Requirements: 2.2, 2.3_

- [x] 4. Create database models for authentication
  - ✅ User model exists in `prisma/schema.prisma`
  - ✅ Onboarding tracking fields already exist (onboardingCompleted, onboardingStep)
  - Need to verify Account, Session, VerificationToken models for NextAuth
  - Need to add signup analytics fields if missing
  - _Requirements: 2.1, 2.2, 6.1, 12.1_

- [ ] 4.1 Update Prisma schema for NextAuth email provider
  - Verify/add Account, Session, VerificationToken models
  - Add signup method tracking field to User model
  - Add signup analytics fields (signupMethod, signupCompletedAt, firstLoginAt)
  - Create and run Prisma migration
  - _Requirements: 2.1, 2.2, 12.1_

- [ ] 5. Implement magic link email system
  - Create `lib/auth/magic-link.ts` for magic link generation and validation
  - Configure AWS SES email service (client already available)
  - Create email templates for verification
  - Implement single-use token validation
  - _Requirements: 2.2, 2.3_

- [ ]* 5.1 Write property test for email verification sending
  - **Property 4: Email Verification Sending**
  - **Validates: Requirements 2.2**

- [ ]* 5.2 Write property test for magic link authentication
  - **Property 5: Magic Link Authentication**
  - **Validates: Requirements 2.3**

- [ ] 6. Update NextAuth API routes for email flow
  - Update `app/api/auth/[...nextauth]/route.ts` to include email provider
  - Configure callbacks for signup tracking
  - Configure events for user creation
  - Set up custom pages (signIn, verifyRequest, error)
  - _Requirements: 2.2, 2.3, 3.2, 3.3_

- [ ] 7. Create email signup form component
  - Create `components/auth/EmailSignupForm.tsx` with email-only input
  - Implement real-time validation with 500ms debounce
  - Add visual feedback (checkmark for valid, error for invalid)
  - Integrate CSRF token from useCsrfToken hook
  - Add loading states and error handling
  - _Requirements: 2.1, 2.5, 4.1, 4.2, 4.3_

- [ ] 8. Create magic link sent confirmation screen
  - Create `components/auth/MagicLinkSent.tsx` component
  - Display success message with email address
  - Add "Didn't receive email?" help text
  - Add resend link with rate limiting
  - _Requirements: 2.2_

- [ ] 9. Create email verification page
  - Create `app/auth/signup/verify/page.tsx` (note: auth folder already exists)
  - Handle magic link token validation
  - Show loading state during verification
  - Redirect to onboarding on success
  - Show error message on failure with retry option
  - _Requirements: 2.3_

## Phase 3: Social Authentication (SSO)

- [ ] 10. Configure Google OAuth provider
  - Set up Google Cloud Console project (or verify existing)
  - Configure OAuth consent screen
  - Create OAuth 2.0 credentials
  - Add Google provider to NextAuth config
  - Configure minimal scopes (email, profile)
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 11. Configure Apple OAuth provider
  - Set up Apple Developer account (or verify existing)
  - Create App ID and Services ID
  - Configure Sign in with Apple
  - Generate client secret (JWT)
  - Add Apple provider to NextAuth config
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 12. Create social authentication buttons component
  - Create `components/auth/SocialAuthButtons.tsx`
  - Add Google sign-in button with branding guidelines
  - Add Apple sign-in button with branding guidelines
  - Implement OAuth flow initiation
  - Add loading states during OAuth
  - Add error handling for OAuth failures
  - _Requirements: 3.1, 3.2, 3.5_

- [ ]* 12.1 Write property test for OAuth flow initiation
  - **Property 6: OAuth Flow Initiation**
  - **Validates: Requirements 3.2**

- [ ]* 12.2 Write property test for OAuth success handling
  - **Property 7: OAuth Success Handling**
  - **Validates: Requirements 3.3**

- [ ] 13. Create main signup form component
  - Create `components/auth/SignupForm.tsx` as orchestrator
  - Integrate SocialAuthButtons component
  - Integrate EmailSignupForm component
  - Add visual separator ("or continue with email")
  - Implement method selection tracking
  - _Requirements: 2.1, 3.1_

- [ ] 14. Create or update signup page
  - Update `app/auth/register/page.tsx` to use new SignupForm component
  - Or create new `app/auth/signup/page.tsx` for cleaner separation
  - Add page metadata (title, description)
  - Implement redirect logic for authenticated users
  - Add analytics tracking for page views
  - _Requirements: 2.1, 3.1, 12.1_

## Phase 4: Accessible Error Handling

- [ ] 15. Create accessible error display component
  - Create `components/forms/FormError.tsx`
  - Implement WCAG AA compliant contrast (4.5:1 minimum)
  - Use both color and icons for error states
  - Add ARIA labels and roles
  - Implement error summary list for multiple errors
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 15.1 Write property test for error message contrast
  - **Property 10: Error Message Contrast**
  - **Validates: Requirements 5.1**

- [ ] 15.2 Write property test for multi-modal error display
  - **Property 11: Multi-Modal Error Display**
  - **Validates: Requirements 5.2**

- [ ] 15.3 Write property test for error summary display
  - **Property 12: Error Summary Display**
  - **Validates: Requirements 5.3**

- [ ] 16. Implement human-friendly error messages
  - Create error message dictionary in `lib/validation/error-messages.ts`
  - Map validation errors to user-friendly messages
  - Implement context-aware error messages
  - Add actionable guidance in error messages
  - _Requirements: 5.4_

- [ ] 16.1 Write property test for human-friendly error messages
  - **Property 13: Human-Friendly Error Messages**
  - **Validates: Requirements 5.4**

- [ ] 17. Implement error clearing mechanism
  - Add real-time error clearing on input change
  - Remove error messages when validation passes
  - Clear visual indicators (borders, icons)
  - Update ARIA live regions for screen readers
  - _Requirements: 5.5_

- [ ] 17.1 Write property test for error clearing
  - **Property 14: Error Clearing**
  - **Validates: Requirements 5.5**

## Phase 5: Progressive Onboarding

- [x] 18. Create onboarding data models
  - ✅ OnboardingProgress tracking already exists in User model
  - ✅ Onboarding actions exist at `app/actions/onboarding.ts`
  - ✅ API routes exist at `app/api/onboarding/`
  - Note: May need to add additional fields for signup-specific tracking
  - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [x] 19. Create onboarding wizard component
  - ✅ `components/onboarding/OnboardingWizard.tsx` already exists
  - ✅ Multi-step state management implemented
  - ✅ Progress indicator component exists (ProgressTracker)
  - ✅ Step navigation implemented (next, back, skip)
  - Note: May need to adjust flow to match new signup requirements
  - _Requirements: 6.2, 6.3, 6.4_

- [ ]* 19.1 Write property test for onboarding progress tracking
  - **Property 15: Onboarding Progress Tracking**
  - **Validates: Requirements 6.3**

- [x] 20. Create welcome screen component
  - ✅ Welcome screen already implemented in OnboardingWizard
  - ✅ Value proposition and CTA present
  - ✅ Progress indicator shown
  - Note: May need to update copy to match new signup flow
  - _Requirements: 6.1, 6.2_

- [x] 21. Create platform connection component
  - ✅ `components/onboarding/PlatformConnection.tsx` already exists
  - ✅ Skip option implemented
  - ✅ Connection flow implemented
  - Note: Verify it matches the 3-step requirement (currently has more steps)
  - _Requirements: 6.2, 6.4_

- [ ] 22. Create dashboard preview component
  - Create `components/onboarding/DashboardPreview.tsx`
  - Display sample data visualization
  - Add tooltips explaining key features
  - Make preview interactive (clickable elements)
  - Track engagement with preview
  - _Requirements: 6.2, 7.1, 7.2, 7.4_

- [ ] 23. Simplify onboarding to 3 steps
  - Adjust OnboardingWizard to match requirements: (1) Connect platform, (2) Dashboard preview, (3) Feature tour
  - Remove or consolidate extra steps (creator assessment, goal selection, AI config)
  - Update progress tracking to reflect 3-step flow
  - _Requirements: 6.2_

- [x] 24. Create onboarding pages
  - ✅ Onboarding pages exist at `app/(app)/onboarding/`
  - ✅ Routing between steps implemented
  - ✅ Completion redirect to dashboard exists
  - Note: Located in (app) group, not (auth) group as designed
  - _Requirements: 6.1, 6.2, 6.5_

- [x] 25. Create onboarding checklist for dashboard
  - ✅ `components/engagement/OnboardingChecklist.tsx` already exists
  - ✅ Completion status tracking implemented
  - ✅ Dismissible functionality exists
  - Note: Verify it shows skipped steps with links to complete them
  - _Requirements: 6.5_

## Phase 6: Interactive Product Demo

- [ ] 26. Create interactive dashboard demo
  - Enhance existing `components/home/DashboardMockSection.tsx`
  - Replace static mockup with real interactive demo
  - Add realistic sample data (anonymized)
  - Implement interactive elements (hover, click)
  - Add tooltips and annotations
  - Optimize for <3 second load time
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 27. Add demo engagement tracking
  - Track demo interactions (clicks, hovers, time spent)
  - Display CTA after interaction
  - Track conversion from demo to signup
  - _Requirements: 7.5, 12.1_

## Phase 7: Accessibility Improvements

- [ ] 28. Audit and fix text contrast
  - Run automated contrast checker on all pages
  - Fix text on purple/dark backgrounds
  - Ensure 4.5:1 contrast for normal text
  - Ensure 3:1 contrast for large text
  - Test with color blindness simulators
  - _Requirements: 8.1, 8.2_

- [ ] 28.1 Write property test for text contrast compliance
  - **Property 16: Text Contrast Compliance**
  - **Validates: Requirements 8.1, 8.2**

- [ ] 29. Implement multi-modal information display
  - Audit all color-only information
  - Add icons to all error states
  - Add text labels to color-coded elements
  - Add patterns/textures where appropriate
  - _Requirements: 8.3_

- [ ] 29.1 Write property test for multi-modal information display
  - **Property 17: Multi-Modal Information Display**
  - **Validates: Requirements 8.3**

- [ ] 30. Add focus indicators
  - Add 2px visible outline to all interactive elements
  - Ensure focus indicators are visible on all backgrounds
  - Test keyboard navigation flow
  - Add skip links for keyboard users
  - _Requirements: 8.4_

- [ ] 30.1 Write property test for focus indicators
  - **Property 18: Focus Indicators**
  - **Validates: Requirements 8.4**

- [ ] 31. Implement high contrast mode support
  - Add CSS for high contrast mode
  - Test with Windows High Contrast Mode
  - Ensure readability in all contrast modes
  - Add forced-colors media query support
  - _Requirements: 8.5_

## Phase 8: CTA Consistency

- [ ] 32. Standardize CTA text and styling
  - Audit all CTAs across marketing pages
  - Choose single CTA text ("Join Beta" or "Request Early Access")
  - Update all CTA buttons to use consistent text
  - Create reusable CTA component
  - Update existing `components/home/HomeCTA.tsx`
  - _Requirements: 9.1, 9.2_

- [ ] 32.1 Write property test for CTA consistency
  - **Property 19: CTA Consistency**
  - **Validates: Requirements 9.1, 9.2**

- [ ] 33. Implement conditional CTA display
  - Check authentication status
  - Replace "Sign Up" with "Go to Dashboard" for authenticated users
  - Update all marketing pages
  - _Requirements: 9.3_

- [ ] 34. Enforce CTA count limits
  - Audit all sections for CTA count
  - Remove or consolidate excess CTAs
  - Ensure max 2 CTAs per section (1 primary, 1 secondary)
  - _Requirements: 9.4_

- [ ] 34.1 Write property test for CTA count limit
  - **Property 20: CTA Count Limit**
  - **Validates: Requirements 9.4**

- [ ] 35. Add CTA microcopy
  - Add descriptive microcopy to all CTAs
  - Use format: "Action → What happens next"
  - Examples: "Join Beta → Check your email", "Get Started → See your dashboard"
  - _Requirements: 9.5_

- [ ] 35.1 Write property test for CTA microcopy
  - **Property 21: CTA Microcopy**
  - **Validates: Requirements 9.5**

## Phase 9: Mobile Optimization

- [ ] 36. Optimize touch targets
  - Audit all buttons and inputs for size
  - Ensure minimum 44px × 44px touch targets
  - Add padding to small interactive elements
  - Test on real mobile devices
  - _Requirements: 10.1_

- [ ] 36.1 Write property test for touch target sizing
  - **Property 22: Touch Target Sizing**
  - **Validates: Requirements 10.1**

- [ ] 37. Implement mobile input field scrolling
  - Add scroll-into-view on input focus
  - Account for mobile keyboard height
  - Test on iOS and Android
  - _Requirements: 10.2_

- [ ] 38. Set correct input types
  - Audit all input fields
  - Set type="email" for email inputs
  - Set inputmode="email" for email inputs
  - Set type="tel" for phone inputs
  - Test mobile keyboard display
  - _Requirements: 10.3_

- [ ] 38.1 Write property test for input type correctness
  - **Property 23: Input Type Correctness**
  - **Validates: Requirements 10.3**

- [ ] 39. Ensure responsive layout
  - Test signup form at 320px width
  - Ensure no horizontal scrolling
  - Test at common mobile widths (375px, 414px)
  - Fix any layout issues
  - _Requirements: 10.4_

- [ ] 40. Implement double-submission prevention
  - Add loading state on form submission
  - Disable submit button during submission
  - Show loading spinner
  - Prevent multiple clicks
  - _Requirements: 10.5_

- [ ] 40.1 Write property test for double-submission prevention
  - **Property 24: Double-Submission Prevention**
  - **Validates: Requirements 10.5**

## Phase 10: Performance Optimization

- [ ] 41. Optimize signup page performance
  - Run Lighthouse audit on signup page
  - Inline critical CSS
  - Defer non-critical styles
  - Implement code splitting for signup flow
  - Optimize bundle size
  - Target Lighthouse score of 90+
  - _Requirements: 11.1, 11.2, 11.4_

- [ ] 42. Optimize images
  - Replace all img tags with Next.js Image component
  - Set appropriate sizes and srcset
  - Implement lazy loading for below-fold images
  - Compress images
  - Use modern formats (WebP, AVIF)
  - _Requirements: 11.3_

- [ ] 42.1 Write property test for image optimization
  - **Property 25: Image Optimization**
  - **Validates: Requirements 11.3**

- [ ] 43. Optimize First Contentful Paint
  - Measure FCP on 3G connection
  - Optimize critical rendering path
  - Reduce render-blocking resources
  - Target FCP < 1.5 seconds
  - _Requirements: 11.5_

## Phase 11: Analytics & Monitoring

- [ ] 44. Implement signup funnel tracking
  - Create `lib/analytics/signup-tracking.ts`
  - Track page view event
  - Track form start event (first input focus)
  - Track method selection (email, Google, Apple)
  - Track form submit event
  - Track signup success event
  - Track signup error event
  - _Requirements: 12.1_

- [ ]* 44.1 Write property test for analytics event tracking
  - **Property 26: Analytics Event Tracking**
  - **Validates: Requirements 12.1**

- [ ] 45. Implement abandonment tracking
  - Track field focus events
  - Track time spent on each field
  - Log abandonment with field context
  - Track exit intent
  - _Requirements: 12.2_

- [ ]* 45.1 Write property test for abandonment tracking
  - **Property 27: Abandonment Tracking**
  - **Validates: Requirements 12.2**

- [ ] 46. Implement conversion tracking
  - Calculate conversion rate from landing to signup
  - Track conversion by traffic source
  - Track conversion by device type
  - Create analytics dashboard or integrate with existing
  - _Requirements: 12.3_

- [x] 47. Implement CSRF error logging
  - ✅ CSRF middleware already logs errors with context
  - ✅ Includes browser, timestamp, user agent
  - ✅ Includes token state (missing, invalid, expired)
  - Note: Verify integration with error monitoring service (CloudWatch)
  - _Requirements: 12.4_

- [ ]* 47.1 Write property test for CSRF error logging
  - **Property 28: CSRF Error Logging**
  - **Validates: Requirements 12.4**

- [x] 48. Implement GDPR-compliant analytics
  - ✅ Cookie consent component exists (`components/CookieConsent.tsx`)
  - ✅ Analytics component exists (`components/analytics/Analytics.tsx`)
  - Note: Verify opt-out mechanism and data collection documentation
  - _Requirements: 12.5_

## Phase 12: Testing & Quality Assurance

- [x] 49. Set up property-based testing framework
  - ✅ fast-check library already installed (`fast-check@4.3.0`)
  - ✅ Test runner configured (vitest)
  - ✅ Property test examples exist in codebase
  - Note: Create signup-specific test utilities and generators as needed
  - _Requirements: All_

- [ ] 50. Checkpoint - Ensure all tests pass
  - Run all unit tests
  - Run all property-based tests
  - Run all integration tests
  - Fix any failing tests
  - Ask user if questions arise

## Phase 13: Environment Configuration

- [ ] 51. Configure environment variables
  - Update `.env.production.template` with NextAuth email provider config
  - Add OAuth credentials placeholders (Google, Apple)
  - Add AWS SES configuration for email service
  - Verify CSRF secret configuration (already exists)
  - Document all required environment variables in `docs/ENVIRONMENT_VARIABLES.md`
  - _Requirements: 2.2, 3.2, 3.3_

- [ ] 52. Update Amplify deployment configuration
  - Update `amplify.yml` with new environment variables
  - Configure build settings for NextAuth email provider
  - Test deployment to staging
  - _Requirements: All_

## Phase 14: Documentation

- [ ] 53. Create user documentation
  - Document new signup process for users
  - Create FAQ for common signup issues
  - Document magic link troubleshooting
  - Document OAuth troubleshooting
  - Add to existing docs or create new guide
  - _Requirements: All_

- [ ] 54. Create developer documentation
  - Document CSRF implementation (reference existing `lib/middleware/csrf.ts` docs)
  - Document NextAuth email provider configuration
  - Document analytics tracking implementation
  - Document testing strategy for signup flow
  - Update or create docs in `docs/` directory
  - _Requirements: All_

## Phase 15: Final Checkpoint & Deployment

- [ ] 55. Final checkpoint - Ensure all tests pass
  - Run full test suite
  - Run accessibility audit
  - Run performance audit
  - Run security audit
  - Ask user if questions arise

- [ ] 56. Deploy to staging
  - Deploy all changes to staging environment
  - Run smoke tests
  - Test complete signup flow
  - Test OAuth flows
  - Test magic link flow
  - Verify analytics tracking

- [ ] 57. Monitor and iterate
  - Monitor CSRF error rates
  - Monitor signup completion rates
  - Monitor performance metrics
  - Gather user feedback
  - Iterate based on data
