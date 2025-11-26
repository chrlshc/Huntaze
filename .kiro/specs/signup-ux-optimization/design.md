# Design Document: Signup UX Optimization

## Overview

This design addresses critical signup flow issues on the Huntaze platform, including a blocking CSRF token bug and suboptimal user experience that reduces conversion rates. The solution implements modern SaaS best practices from 2025, including email-first signup, social authentication, progressive disclosure, and comprehensive accessibility improvements.

The design follows a phased approach:
1. Fix critical CSRF bug to unblock signups
2. Implement simplified email-first flow
3. Add social authentication (Google/Apple)
4. Enhance onboarding and activation
5. Improve accessibility and mobile experience

**Technology Stack:**
- Next.js 16 with App Router
- NextAuth v5 (Auth.js) for authentication
- Existing CSRF middleware (lib/middleware/csrf.ts)
- Prisma for database operations
- Tailwind CSS for styling
- React Hook Form for form management
- Zod for validation

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Marketing Site                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Homepage    │  │   Features   │  │    Pricing   │     │
│  └──────┬───────┘  └──────────────┘  └──────────────┘     │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────────────────────────────────────────┐      │
│  │         Signup Entry Points (CTAs)               │      │
│  └──────────────────┬───────────────────────────────┘      │
└─────────────────────┼──────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  Signup Flow (New)                          │
│                                                              │
│  ┌──────────────────────────────────────────────────┐      │
│  │  Step 1: Choose Authentication Method            │      │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐ │      │
│  │  │   Google   │  │   Apple    │  │   Email    │ │      │
│  │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘ │      │
│  └────────┼───────────────┼───────────────┼────────┘      │
│           │               │               │                 │
│           ▼               ▼               ▼                 │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐ │
│  │  OAuth Flow    │  │  OAuth Flow    │  │  Magic Link  │ │
│  │  (Google)      │  │  (Apple)       │  │  Email       │ │
│  └────────┬───────┘  └────────┬───────┘  └──────┬───────┘ │
│           │                    │                  │          │
│           └────────────────────┴──────────────────┘          │
│                                │                              │
│                                ▼                              │
│  ┌──────────────────────────────────────────────────┐       │
│  │  Step 2: Create/Link Account + CSRF Protection  │       │
│  └──────────────────┬───────────────────────────────┘       │
└─────────────────────┼──────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  Onboarding Flow                            │
│                                                              │
│  ┌──────────────────────────────────────────────────┐      │
│  │  Welcome Screen                                  │      │
│  │  - Brief value proposition                       │      │
│  │  - Progress indicator (Step 1 of 3)              │      │
│  └──────────────────┬───────────────────────────────┘      │
│                     │                                        │
│                     ▼                                        │
│  ┌──────────────────────────────────────────────────┐      │
│  │  Step 1: Connect First Platform (Optional)       │      │
│  │  - YouTube, Instagram, TikTok, etc.              │      │
│  │  - "Skip for now" option                         │      │
│  └──────────────────┬───────────────────────────────┘      │
│                     │                                        │
│                     ▼                                        │
│  ┌──────────────────────────────────────────────────┐      │
│  │  Step 2: Dashboard Preview                       │      │
│  │  - Sample data visualization                     │      │
│  │  - Key features highlighted                      │      │
│  └──────────────────┬───────────────────────────────┘      │
│                     │                                        │
│                     ▼                                        │
│  ┌──────────────────────────────────────────────────┐      │
│  │  Step 3: Explore Features                        │      │
│  │  - Interactive tour                              │      │
│  │  - Onboarding checklist                          │      │
│  └──────────────────┬───────────────────────────────┘      │
└─────────────────────┼──────────────────────────────────────┘
                      │
                      ▼
              ┌───────────────┐
              │   Dashboard   │
              └───────────────┘
```

### Component Architecture

```
app/
├── (auth)/
│   ├── signup/
│   │   ├── page.tsx                    # Main signup page
│   │   ├── layout.tsx                  # Auth layout
│   │   └── verify/
│   │       └── page.tsx                # Email verification
│   └── onboarding/
│       ├── page.tsx                    # Onboarding orchestrator
│       ├── welcome/page.tsx            # Welcome screen
│       ├── connect/page.tsx            # Platform connection
│       └── tour/page.tsx               # Feature tour
│
├── api/
│   ├── auth/
│   │   └── [...nextauth]/
│   │       └── route.ts                # NextAuth configuration
│   ├── signup/
│   │   ├── email/route.ts              # Email signup
│   │   └── verify/route.ts             # Email verification
│   └── csrf/
│       └── token/route.ts              # CSRF token (existing)
│
components/
├── auth/
│   ├── SignupForm.tsx                  # Main signup form
│   ├── SocialAuthButtons.tsx           # Google/Apple buttons
│   ├── EmailSignupForm.tsx             # Email-only form
│   ├── MagicLinkSent.tsx               # Confirmation screen
│   └── FormValidation.tsx              # Real-time validation
├── onboarding/
│   ├── OnboardingWizard.tsx            # Multi-step wizard
│   ├── WelcomeScreen.tsx               # Welcome step
│   ├── PlatformConnect.tsx             # Platform connection
│   ├── DashboardPreview.tsx            # Interactive demo
│   └── ProgressIndicator.tsx           # Step progress
└── forms/
    ├── FormInput.tsx                   # Accessible input (existing)
    └── FormError.tsx                   # Error display

lib/
├── auth/
│   ├── nextauth.config.ts              # NextAuth providers
│   ├── magic-link.ts                   # Magic link generation
│   └── session.ts                      # Session management (existing)
├── middleware/
│   └── csrf.ts                         # CSRF protection (existing)
└── validation/
    └── signup.ts                       # Signup validation schemas
```

## Components and Interfaces

### 1. CSRF Protection (Enhanced)

**File:** `lib/middleware/csrf.ts` (existing, enhanced)

The existing CSRF middleware is well-implemented with:
- Token generation with HMAC signatures
- Double-submit cookie pattern
- Expiry checking
- Automatic refresh capability

**Enhancement needed:**
- Add client-side token refresh mechanism
- Improve error messages for user-facing forms
- Add retry logic for transient failures

**Interface:**
```typescript
// Enhanced CSRF validation result
export interface CsrfValidationResult {
  valid: boolean;
  error?: string;
  errorCode?: string;
  shouldRefresh?: boolean;
  userMessage?: string;  // NEW: User-friendly message
}

// Client-side CSRF hook
export function useCsrfToken(): {
  token: string | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}
```

### 2. Signup Form Component

**File:** `components/auth/SignupForm.tsx`

Main signup form with three authentication methods.

**Props:**
```typescript
interface SignupFormProps {
  redirectTo?: string;
  onSuccess?: (user: User) => void;
  onError?: (error: Error) => void;
  showSocialAuth?: boolean;
  defaultMethod?: 'email' | 'social';
}
```

**State:**
```typescript
interface SignupFormState {
  method: 'email' | 'google' | 'apple' | null;
  email: string;
  isSubmitting: boolean;
  error: string | null;
  csrfToken: string | null;
}
```

### 3. Social Authentication Buttons

**File:** `components/auth/SocialAuthButtons.tsx`

OAuth buttons for Google and Apple Sign-In.

**Props:**
```typescript
interface SocialAuthButtonsProps {
  onSuccess?: (provider: string) => void;
  onError?: (error: Error, provider: string) => void;
  redirectTo?: string;
  disabled?: boolean;
}
```

### 4. Email Signup Form

**File:** `components/auth/EmailSignupForm.tsx`

Email-first signup with real-time validation.

**Props:**
```typescript
interface EmailSignupFormProps {
  onSubmit: (email: string) => Promise<void>;
  onValidationChange?: (isValid: boolean) => void;
  csrfToken: string;
  autoFocus?: boolean;
}
```

**Validation:**
```typescript
const emailSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email is too long')
});
```

### 5. Onboarding Wizard

**File:** `components/onboarding/OnboardingWizard.tsx`

Multi-step onboarding flow with progress tracking.

**Props:**
```typescript
interface OnboardingWizardProps {
  user: User;
  onComplete: () => void;
  onSkip?: () => void;
  initialStep?: number;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<OnboardingStepProps>;
  optional: boolean;
  completed: boolean;
}
```

**State:**
```typescript
interface OnboardingState {
  currentStep: number;
  steps: OnboardingStep[];
  completedSteps: Set<string>;
  skippedSteps: Set<string>;
}
```

### 6. NextAuth Configuration

**File:** `lib/auth/nextauth.config.ts`

NextAuth v5 configuration with providers.

**Configuration:**
```typescript
export const authConfig: NextAuthConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
          scope: 'openid email profile'
        }
      }
    }),
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
      maxAge: 24 * 60 * 60, // 24 hours
    }),
  ],
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/signup',
    verifyRequest: '/signup/verify',
    error: '/signup/error',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Track signup method
      await trackSignupMethod(user.id, account.provider);
      return true;
    },
    async session({ session, token }) {
      // Add user ID to session
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Initialize onboarding state
      await initializeOnboarding(user.id);
      // Send welcome email
      await sendWelcomeEmail(user.email);
    },
  },
};
```

## Data Models

### User Model (Enhanced)

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  name          String?
  image         String?
  
  // Authentication
  accounts      Account[]
  sessions      Session[]
  
  // Onboarding
  onboardingCompleted Boolean @default(false)
  onboardingStep      Int     @default(0)
  onboardingSkipped   Boolean @default(false)
  
  // Signup tracking
  signupMethod        String?  // 'email', 'google', 'apple'
  signupCompletedAt   DateTime?
  firstLoginAt        DateTime?
  
  // Timestamps
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([email])
  @@index([signupMethod])
}
```

### Account Model (NextAuth)

```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([provider, providerAccountId])
  @@index([userId])
}
```

### Verification Token Model (NextAuth)

```prisma
model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  
  @@unique([identifier, token])
  @@index([token])
}
```

### Onboarding Progress Model

```prisma
model OnboardingProgress {
  id        String   @id @default(cuid())
  userId    String   @unique
  
  // Step completion
  welcomeCompleted    Boolean @default(false)
  platformConnected   Boolean @default(false)
  dashboardViewed     Boolean @default(false)
  tourCompleted       Boolean @default(false)
  
  // Timestamps
  startedAt     DateTime  @default(now())
  completedAt   DateTime?
  lastStepAt    DateTime  @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
}
```

### Signup Analytics Model

```prisma
model SignupAnalytics {
  id        String   @id @default(cuid())
  
  // User info (nullable for anonymous tracking)
  userId    String?
  email     String?
  
  // Funnel tracking
  landingPage       String?
  referrer          String?
  utmSource         String?
  utmMedium         String?
  utmCampaign       String?
  
  // Events
  pageViewed        DateTime?
  formStarted       DateTime?
  methodSelected    String?   // 'email', 'google', 'apple'
  formSubmitted     DateTime?
  signupCompleted   DateTime?
  signupFailed      DateTime?
  errorCode         String?
  errorMessage      String?
  
  // Device info
  userAgent         String?
  deviceType        String?   // 'mobile', 'tablet', 'desktop'
  browser           String?
  os                String?
  
  // Performance
  timeToSubmit      Int?      // milliseconds
  timeToComplete    Int?      // milliseconds
  
  createdAt DateTime @default(now())
  
  @@index([userId])
  @@index([email])
  @@index([createdAt])
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: CSRF Token Presence
*For any* signup form load, the form should contain a valid, non-expired CSRF token
**Validates: Requirements 1.1**

### Property 2: CSRF Token Validation
*For any* form submission with a valid CSRF token, the system should process the request; for any submission with an invalid or missing token, the system should reject it
**Validates: Requirements 1.2**

### Property 3: CSRF Token Auto-Refresh
*For any* expired CSRF token, the system should automatically refresh it without requiring a page reload
**Validates: Requirements 1.5**

### Property 4: Email Verification Sending
*For any* valid email submission, the system should send a verification email with a magic link
**Validates: Requirements 2.2**

### Property 5: Magic Link Authentication
*For any* valid magic link click, the system should authenticate the user and redirect to onboarding
**Validates: Requirements 2.3**

### Property 6: OAuth Flow Initiation
*For any* social login button click (Google or Apple), the system should initiate the OAuth flow with the correct provider
**Validates: Requirements 3.2**

### Property 7: OAuth Success Handling
*For any* successful OAuth authentication, the system should create or link the user account and redirect to onboarding
**Validates: Requirements 3.3**

### Property 8: Real-Time Email Validation
*For any* email input, the system should validate the format in real-time after debounce and display appropriate feedback
**Validates: Requirements 4.1, 4.2, 4.3**

### Property 9: Password Strength Indication
*For any* password input, the system should calculate and display the strength indicator (weak/medium/strong)
**Validates: Requirements 4.4**

### Property 10: Error Message Contrast
*For any* form validation error, the error message should meet WCAG AA contrast requirements (4.5:1 minimum)
**Validates: Requirements 5.1**

### Property 11: Multi-Modal Error Display
*For any* error state, the system should use both color and icons to convey the error (not color alone)
**Validates: Requirements 5.2**

### Property 12: Error Summary Display
*For any* form state with multiple errors, the system should display a summary list at the top with links to each error
**Validates: Requirements 5.3**

### Property 13: Human-Friendly Error Messages
*For any* validation error, the error message should use clear, human-friendly language
**Validates: Requirements 5.4**

### Property 14: Error Clearing
*For any* corrected error, the system should immediately remove the error message and visual indicator
**Validates: Requirements 5.5**

### Property 15: Onboarding Progress Tracking
*For any* completed onboarding step, the system should update and display the progress indicator correctly
**Validates: Requirements 6.3**

### Property 16: Text Contrast Compliance
*For any* text element in the signup flow, the text should meet WCAG 2.0 AA contrast requirements
**Validates: Requirements 8.1, 8.2**

### Property 17: Multi-Modal Information Display
*For any* information conveyed through color, the system should also use icons or text to convey the same information
**Validates: Requirements 8.3**

### Property 18: Focus Indicators
*For any* interactive element, the system should provide a visible 2px focus indicator when focused
**Validates: Requirements 8.4**

### Property 19: CTA Consistency
*For any* marketing page, all primary CTAs should use the same text and styling
**Validates: Requirements 9.1, 9.2**

### Property 20: CTA Count Limit
*For any* section on the signup or marketing pages, there should be a maximum of 2 CTAs (1 primary, 1 secondary)
**Validates: Requirements 9.4**

### Property 21: CTA Microcopy
*For any* CTA button, the button should include clear microcopy indicating what happens next
**Validates: Requirements 9.5**

### Property 22: Touch Target Sizing
*For any* button or input in the signup form, the touch target should be at least 44px × 44px
**Validates: Requirements 10.1**

### Property 23: Input Type Correctness
*For any* input field, the system should use the appropriate input type and inputmode for mobile keyboards
**Validates: Requirements 10.3**

### Property 24: Double-Submission Prevention
*For any* form submission attempt, the system should prevent double-submission by showing a loading state
**Validates: Requirements 10.5**

### Property 25: Image Optimization
*For any* image used in the signup flow, the system should use Next.js Image component with appropriate optimization
**Validates: Requirements 11.3**

### Property 26: Analytics Event Tracking
*For any* funnel event (page view, form start, form submit, signup success, signup error), the system should track it
**Validates: Requirements 12.1**

### Property 27: Abandonment Tracking
*For any* form abandonment, the system should log the field the user was on and time spent
**Validates: Requirements 12.2**

### Property 28: CSRF Error Logging
*For any* CSRF error, the system should log it with context (browser, timestamp, user agent)
**Validates: Requirements 12.4**

## Error Handling

### CSRF Token Errors
- Missing token: Display user-friendly message "Please refresh the page and try again"
- Invalid token: Display message "Your session has expired. Please refresh the page"
- Expired token: Automatically refresh token in background
- Network error during token fetch: Retry up to 3 times with exponential backoff

### Email Validation Errors
- Invalid format: "Please enter a valid email address"
- Email already exists: "This email is already registered. Try signing in instead"
- Email service unavailable: "We're having trouble sending your verification email. Please try again"

### OAuth Errors
- User cancels OAuth: Return to signup page with message "Sign in cancelled"
- OAuth provider error: "We couldn't connect to [Provider]. Please try again or use email signup"
- Account linking conflict: "This email is already associated with another account"

### Form Submission Errors
- Network timeout: "Request timed out. Please check your connection and try again"
- Server error: "Something went wrong. Please try again"
- Rate limit exceeded: "Too many attempts. Please wait a few minutes and try again"

### Onboarding Errors
- Platform connection failure: Allow skip with message "You can connect your platforms later from settings"
- Data loading error: Show skeleton with retry button

## Testing Strategy

### Unit Testing
- Test individual form validation functions with various inputs
- Test CSRF token generation and validation logic
- Test email format validation with edge cases (special characters, internationalized domains)
- Test password strength calculation
- Test error message generation
- Test OAuth callback handling
- Test analytics event tracking functions

### Property-Based Testing
- Use **fast-check** library for JavaScript/TypeScript property-based testing
- Configure each property test to run a minimum of 100 iterations
- Each property-based test must be tagged with a comment referencing the correctness property from this design document
- Tag format: `// Feature: signup-ux-optimization, Property X: [property text]`

**Property Test Examples:**
- Generate random email addresses and verify validation works correctly
- Generate random CSRF tokens and verify validation logic
- Generate random form states and verify error display is consistent
- Generate random user flows and verify analytics tracking is complete
- Generate random OAuth responses and verify handling is correct

### Integration Testing
- Test complete signup flow from landing page to dashboard
- Test magic link email delivery and verification
- Test OAuth flow with test providers
- Test CSRF token refresh during long form sessions
- Test form submission with various network conditions
- Test onboarding flow with skip and complete paths
- Test analytics data collection end-to-end

### Accessibility Testing
- Automated testing with axe-core or similar tool
- Manual keyboard navigation testing
- Screen reader testing (NVDA, JAWS, VoiceOver)
- Color contrast verification with automated tools
- Focus indicator visibility testing
- High contrast mode testing

### Performance Testing
- Lighthouse audits for signup page (target score: 90+)
- Core Web Vitals measurement (LCP, FID, CLS)
- Network throttling tests (3G, slow 3G)
- Bundle size analysis
- Time to Interactive (TTI) measurement

### Visual Regression Testing
- Screenshot comparison for signup form
- Screenshot comparison for error states
- Screenshot comparison for onboarding screens
- Mobile viewport testing (320px, 375px, 414px)
- Tablet viewport testing (768px, 1024px)

## Security Considerations

### CSRF Protection
- Use double-submit cookie pattern
- Tokens expire after 1 hour
- Tokens are cryptographically signed with HMAC
- Tokens are regenerated after successful authentication

### OAuth Security
- Use state parameter to prevent CSRF attacks
- Validate OAuth redirect URIs
- Request minimal scopes (email and profile only)
- Store OAuth tokens securely (encrypted at rest)

### Email Security
- Magic links expire after 24 hours
- Magic links are single-use only
- Rate limit magic link requests (max 3 per hour per email)
- Validate email format server-side

### Session Security
- Use HTTP-only cookies for session tokens
- Set secure flag on cookies in production
- Implement session timeout (30 days)
- Regenerate session ID after authentication

### Input Validation
- Sanitize all user inputs
- Validate email format server-side
- Prevent SQL injection with parameterized queries
- Prevent XSS with proper output encoding

## Deployment Strategy

### Phase 1: CSRF Fix (Critical - Week 1)
- Deploy enhanced CSRF middleware
- Add client-side CSRF token hook
- Update signup form to use CSRF token
- Monitor CSRF error rates

### Phase 2: Email-First Signup (Week 2)
- Implement magic link email system
- Create email signup form
- Deploy email verification flow
- A/B test against current flow

### Phase 3: Social Authentication (Week 3)
- Configure Google OAuth
- Configure Apple OAuth
- Implement social auth buttons
- Test OAuth flows

### Phase 4: Onboarding (Week 4)
- Create onboarding wizard component
- Implement progress tracking
- Add skip functionality
- Create onboarding checklist

### Phase 5: Accessibility & Polish (Week 5)
- Audit and fix contrast issues
- Add focus indicators
- Implement error improvements
- Mobile optimization

### Phase 6: Analytics & Monitoring (Week 6)
- Implement analytics tracking
- Set up conversion funnels
- Create monitoring dashboards
- Performance optimization

## Success Metrics

### Primary Metrics
- Signup completion rate: Target 60% (from current ~30%)
- CSRF error rate: Target <0.1%
- Time to signup: Target <2 minutes
- Mobile signup rate: Target 40% of total signups

### Secondary Metrics
- Email verification rate: Target 80%
- Social auth adoption: Target 50% of signups
- Onboarding completion rate: Target 70%
- Lighthouse performance score: Target 90+

### User Experience Metrics
- Form abandonment rate: Target <20%
- Error recovery rate: Target 90%
- Support tickets related to signup: Target 50% reduction
- User satisfaction (NPS): Target 8+/10

## Monitoring and Observability

### Error Monitoring
- Track CSRF errors with full context
- Track OAuth failures by provider
- Track email delivery failures
- Track form validation errors

### Performance Monitoring
- Track page load times
- Track Time to Interactive
- Track Core Web Vitals
- Track API response times

### Analytics Monitoring
- Track signup funnel drop-off points
- Track conversion rates by traffic source
- Track device and browser distribution
- Track geographic distribution

### Alerting
- Alert on CSRF error rate >1%
- Alert on signup completion rate <40%
- Alert on email delivery failure rate >5%
- Alert on page load time >3 seconds
- Alert on OAuth failure rate >10%