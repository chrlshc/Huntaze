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

