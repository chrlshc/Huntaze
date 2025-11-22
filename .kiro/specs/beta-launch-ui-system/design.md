# Design Document

## Overview

The Beta Launch UI System implements a production-ready, Shopify-inspired design language for Huntaze's creator management platform. The system features a pure black (#000000) background with rainbow purple branding (#8B5CF6 to #EC4899), comprehensive authentication and onboarding flows, a performant home page with real-time stats, and a full integrations management interface.

The architecture prioritizes performance through AWS CloudFront CDN, S3 asset storage, Lambda@Edge optimization, and multi-layer caching. The design system uses CSS custom properties for consistency, supports responsive layouts, and meets WCAG 2.1 AA accessibility standards.

**Key Design Principles:**
- **Professional Minimalism**: Pure black backgrounds with subtle rainbow accents only on interactive elements
- **Performance First**: Target Core Web Vitals (FCP < 1.5s, LCP < 2.5s, FID < 100ms)
- **Progressive Enhancement**: Core functionality works without JavaScript
- **Mobile-First**: Responsive design starting from 320px viewport
- **Accessibility**: WCAG 2.1 AA compliance with keyboard navigation and screen reader support
- **Security**: Defense in depth with encryption, CSRF protection, and secure headers

**Visual Design Philosophy:**
- Backgrounds: Pure black (#000000) - no gradients on surfaces
- Rainbow gradient: Used ONLY for primary CTAs, focus states, and small accents
- Borders and surfaces: Subtle grays (#0a0a0a, #0f0f0f, #1a1a1a)
- Text: High contrast white/gray for readability
- Professional aesthetic: Clean, minimal, Shopify-inspired

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Marketing   │  │     Auth     │  │  Home/App    │         │
│  │    Pages     │  │    Pages     │  │    Pages     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└────────────┬────────────────┬────────────────┬─────────────────┘
             │                │                │
             ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AWS CloudFront CDN                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Lambda@Edge Functions                        │  │
│  │  • Security Headers  • Image Optimization                 │  │
│  │  • Auth Validation   • Bot Detection                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────┬────────────────┬────────────────┬─────────────────┘
             │                │                │
    ┌────────▼────────┐      │       ┌────────▼────────┐
    │   AWS S3        │      │       │  Next.js App    │
    │  Static Assets  │      │       │    (Vercel)     │
    └─────────────────┘      │       └────────┬────────┘
                             │                │
                             │       ┌────────▼────────┐
                             │       │  API Routes     │
                             │       │  • /api/auth    │
                             │       │  • /api/home    │
                             │       │  • /api/integ   │
                             │       └────────┬────────┘
                             │                │
                             │       ┌────────▼────────┐
                             │       │  Cache Layer    │
                             │       │  (In-Memory)    │
                             │       └────────┬────────┘
                             │                │
                             │       ┌────────▼────────┐
                             │       │   PostgreSQL    │
                             │       │    Database     │
                             │       └─────────────────┘
                             │
                    ┌────────▼────────┐
                    │    AWS SES      │
                    │  Email Service  │
                    └─────────────────┘
```

### Technology Stack

**Frontend:**
- Next.js 15 (App Router)
- React 19
- TypeScript 5.3
- CSS Modules with CSS Custom Properties
- Tailwind CSS (utility classes only)

**Backend:**
- Next.js API Routes
- Prisma ORM
- PostgreSQL 15
- Redis (for caching)

**AWS Services:**
- CloudFront (CDN)
- S3 (Asset Storage)
- Lambda@Edge (Edge Functions)
- SES (Email)
- CloudWatch (Monitoring)
- SNS (Notifications)

**Authentication:**
- NextAuth.js v5
- bcrypt (password hashing)
- crypto (token generation)

**Deployment:**
- Vercel (Application)
- AWS (Infrastructure)

## Components and Interfaces

### 1. Design System Module

**File:** `styles/design-system.css`

```css
/* Core Design Tokens - Professional Black Theme */
:root {
  /* Backgrounds - Pure Black, No Gradients */
  --bg-app: #000000;           /* Main app background - pure black */
  --bg-surface: #0a0a0a;       /* Elevated surfaces - very subtle lift */
  --bg-card: #0f0f0f;          /* Card components - minimal contrast */
  --bg-hover: #1a1a1a;         /* Hover states - subtle feedback */
  --bg-input: #141414;         /* Form inputs - slightly elevated */
  
  /* Text - High Contrast for Readability */
  --text-primary: #FFFFFF;     /* Primary content - pure white */
  --text-secondary: #a3a3a3;   /* Secondary content - medium gray */
  --text-muted: #737373;       /* Disabled/subtle - darker gray */
  --text-inverse: #000000;     /* On colored backgrounds */
  
  /* Brand - Subtle Rainbow Accents (Use Sparingly) */
  --brand-primary: #8B5CF6;    /* Primary purple */
  --brand-secondary: #EC4899;  /* Secondary pink */
  
  /* Rainbow gradient - ONLY for primary CTAs and focus states */
  --brand-gradient: linear-gradient(135deg, #8B5CF6 0%, #A855F7 25%, #EC4899 50%, #A855F7 75%, #8B5CF6 100%);
  --brand-gradient-hover: linear-gradient(135deg, #7C3AED 0%, #9333EA 25%, #DB2777 50%, #9333EA 75%, #7C3AED 100%);
  
  /* Subtle rainbow glow - for focus states only */
  --brand-glow: 0 0 0 3px rgba(139, 92, 246, 0.15);
  --brand-glow-strong: 0 0 20px rgba(139, 92, 246, 0.3);
  
  /* Borders - Minimal Contrast */
  --border-default: #1a1a1a;   /* Default borders - barely visible */
  --border-emphasis: #2a2a2a;  /* Emphasized borders - subtle */
  --border-focus: var(--brand-primary); /* Focus state - rainbow accent */
  
  /* Shadows - Subtle Depth */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
  
  /* Spacing - 8px Grid System */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  
  /* Typography - System Fonts */
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
  --font-mono: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace;
  
  --text-xs: 11px;
  --text-sm: 13px;
  --text-base: 15px;
  --text-lg: 17px;
  --text-xl: 20px;
  --text-2xl: 24px;
  --text-3xl: 30px;
  --text-4xl: 36px;
  
  /* Border Radius - Shopify Style */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;
  
  /* Beta Accents - Very Subtle */
  --beta-bg: rgba(139, 92, 246, 0.08);      /* Reduced opacity */
  --beta-border: rgba(139, 92, 246, 0.2);   /* Reduced opacity */
  --beta-text: #9ca3af;                      /* More muted gray */
}

/* Professional Button Styles - Rainbow Only on Primary CTA */
.btn-primary {
  background: var(--brand-gradient);
  background-size: 200% 200%;
  color: white;
  border: none;
  /* Rainbow gradient ONLY here */
}

.btn-secondary {
  background: transparent;
  border: 1px solid var(--border-default);
  color: var(--text-secondary);
  /* NO rainbow - pure professional */
}

.btn-ghost {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  /* NO rainbow - minimal style */
}

/* Focus States - Subtle Rainbow Glow */
*:focus-visible {
  outline: none;
  box-shadow: var(--brand-glow);
  /* Subtle rainbow only on focus */
}

/* Cards and Surfaces - Pure Black, No Gradients */
.card {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  /* NO gradients on surfaces */
}

.card:hover {
  border-color: var(--border-emphasis);
  /* Subtle border change only */
}

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Design Rules:**
1. ✅ Rainbow gradient: ONLY on primary CTA buttons and focus states
2. ✅ Backgrounds: Pure black (#000000) - NO gradients
3. ✅ Cards/Surfaces: Solid colors (#0a0a0a, #0f0f0f) - NO gradients
4. ✅ Borders: Minimal gray (#1a1a1a, #2a2a2a) - very subtle
5. ✅ Text: High contrast white/gray for readability
6. ✅ Beta badges: Very subtle, muted colors
7. ✅ Professional aesthetic: Clean, minimal, Shopify-inspired

### 2. Authentication Components

**Registration Component**

**File:** `app/auth/register/page.tsx`

```typescript
interface RegisterFormData {
  email: string;
  password: string;
}

interface RegisterResponse {
  userId: string;
  verificationToken: string;
}

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Create user account
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const data: RegisterResponse = await response.json();

      // Send verification email
      await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: data.userId,
          email: formData.email,
          verificationToken: data.verificationToken
        })
      });

      // Redirect to verification pending page
      window.location.href = `/auth/verify-pending?email=${encodeURIComponent(formData.email)}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <img src="/logo.svg" alt="Huntaze" className="logo" />
          <h1>Join Huntaze Beta</h1>
          <p>Start automating your creator business</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="creator@example.com"
              required
              className="input"
              aria-required="true"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Min. 8 characters"
              required
              minLength={8}
              className="input"
              aria-required="true"
            />
          </div>

          <button
            type="submit"
            className="btn-primary btn-full"
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>

          <p className="form-footer">
            Already have an account?{' '}
            <a href="/auth/login" className="link">Sign in</a>
          </p>
        </form>
      </div>
    </div>
  );
}
```

**API Route:** `/api/auth/register/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcrypt';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Generate verification token
    const verificationToken = randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        emailVerified: false,
        verificationToken,
        verificationExpires
      }
    });

    return NextResponse.json({
      userId: user.id,
      verificationToken
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 3. Email Verification Service

**File:** `lib/services/email-verification.service.ts`

```typescript
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

interface VerificationEmailParams {
  email: string;
  verificationToken: string;
  userId: string;
}

export async function sendVerificationEmail({
  email,
  verificationToken,
  userId
}: VerificationEmailParams): Promise<void> {
  const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${verificationToken}&userId=${userId}`;

  const htmlBody = `
    <div style="background: #000; padding: 40px; font-family: sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 12px; padding: 40px;">
        <h1 style="color: #fff; margin: 0 0 16px 0;">Welcome to Huntaze</h1>
        <p style="color: #a3a3a3; font-size: 15px; line-height: 1.6;">
          Click the button below to verify your email and activate your account.
        </p>
        <a href="${verificationLink}" style="display: inline-block; margin: 32px 0; padding: 14px 32px; background: linear-gradient(135deg, #8B5CF6, #EC4899); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Verify Email
        </a>
        <p style="color: #737373; font-size: 13px;">
          This link expires in 24 hours. If you didn't create this account, you can safely ignore this email.
        </p>
      </div>
    </div>
  `;

  const command = new SendEmailCommand({
    Source: 'Huntaze <noreply@huntaze.com>',
    Destination: {
      ToAddresses: [email]
    },
    Message: {
      Subject: {
        Data: 'Verify your Huntaze account',
        Charset: 'UTF-8'
      },
      Body: {
        Html: {
          Data: htmlBody,
          Charset: 'UTF-8'
        }
      }
    }
  });

  await sesClient.send(command);
}
```

### 4. Onboarding Flow Component

**File:** `app/onboarding/page.tsx`

```typescript
interface OnboardingData {
  contentTypes: string[];
  platform?: {
    username: string;
    password: string;
  };
  goal?: string;
  revenueGoal?: number;
}

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    contentTypes: []
  });

  const progress = (currentStep / 3) * 100;

  const handleComplete = async () => {
    try {
      await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      window.location.href = '/home';
    } catch (error) {
      console.error('Onboarding error:', error);
    }
  };

  return (
    <div className="onboarding-container">
      {/* Progress Bar */}
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* Step 1: Content Types */}
      {currentStep === 1 && (
        <OnboardingStep1
          data={data}
          onNext={(contentTypes) => {
            setData({ ...data, contentTypes });
            setCurrentStep(2);
          }}
          onSkip={() => setCurrentStep(2)}
        />
      )}

      {/* Step 2: Platform Connection */}
      {currentStep === 2 && (
        <OnboardingStep2
          data={data}
          onNext={(platform) => {
            setData({ ...data, platform });
            setCurrentStep(3);
          }}
          onBack={() => setCurrentStep(1)}
          onSkip={() => setCurrentStep(3)}
        />
      )}

      {/* Step 3: Goals */}
      {currentStep === 3 && (
        <OnboardingStep3
          data={data}
          onComplete={(goal, revenueGoal) => {
            setData({ ...data, goal, revenueGoal });
            handleComplete();
          }}
          onBack={() => setCurrentStep(2)}
        />
      )}
    </div>
  );
}
```

### 5. Home Page Layout

**File:** `app/(app)/home/page.tsx`

```typescript
interface HomeStats {
  messagesSent: number;
  messagesTrend: number;
  responseRate: number;
  responseRateTrend: number;
  revenue: number;
  revenueTrend: number;
  activeChats: number;
  activeChatsTrend: number;
}

export default async function HomePage() {
  // Fetch stats with caching
  const stats = await getHomeStats();

  return (
    <AppShell>
      <div className="page-header">
        <h1 className="page-title">Home</h1>
        <p className="page-subtitle">Welcome back! Here's your performance overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          label="Messages Sent"
          value={stats.messagesSent.toLocaleString()}
          trend={stats.messagesTrend}
          description="Last 7 days"
        />
        <StatCard
          label="Response Rate"
          value={`${stats.responseRate}%`}
          trend={stats.responseRateTrend}
          description="AI-powered replies"
        />
        <StatCard
          label="Revenue"
          value={`$${stats.revenue.toLocaleString()}`}
          trend={stats.revenueTrend}
          description="This month"
        />
        <StatCard
          label="Active Chats"
          value={stats.activeChats.toLocaleString()}
          trend={stats.activeChatsTrend}
          description="Ongoing conversations"
        />
      </div>

      {/* Platform Status */}
      <PlatformStatus />

      {/* Quick Actions */}
      <QuickActions />
    </AppShell>
  );
}
```

### 6. Integrations Page

**File:** `app/(app)/integrations/page.tsx`

```typescript
interface Integration {
  id: string;
  provider: 'onlyfans' | 'instagram' | 'tiktok' | 'reddit';
  connected: boolean;
  lastSync?: Date;
  accountId?: string;
}

export default async function IntegrationsPage() {
  // Fetch integrations with caching
  const integrations = await getIntegrations();

  return (
    <AppShell>
      <div className="page-header">
        <h1 className="page-title">Integrations</h1>
        <p className="page-subtitle">Manage your connected platforms</p>
      </div>

      <div className="integrations-grid">
        {integrations.map((integration) => (
          <IntegrationCard
            key={integration.id}
            integration={integration}
            onConnect={() => handleConnect(integration.provider)}
            onDisconnect={() => handleDisconnect(integration.provider, integration.accountId!)}
            onRefresh={() => handleRefresh(integration.provider, integration.accountId!)}
          />
        ))}
      </div>
    </AppShell>
  );
}
```

### 7. Cache Service

**File:** `lib/services/cache.service.ts`

```typescript
interface CacheEntry<T> {
  data: T;
  expires: number;
}

class CacheService {
  private cache: Map<string, CacheEntry<any>>;
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  set<T>(key: string, data: T, ttlSeconds: number): void {
    // Evict LRU if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      expires: Date.now() + (ttlSeconds * 1000)
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check expiration
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

export const cacheService = new CacheService();
```

## Data Models

### User Model

```prisma
model User {
  id                    String    @id @default(cuid())
  email                 String    @unique
  password              String
  emailVerified         Boolean   @default(false)
  verificationToken     String?
  verificationExpires   DateTime?
  onboardingCompleted   Boolean   @default(false)
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  // Onboarding data
  contentTypes          String[]
  goal                  String?
  revenueGoal           Int?
  
  // Relations
  integrations          Integration[]
  stats                 UserStats?
}
```

### Integration Model

```prisma
model Integration {
  id            String    @id @default(cuid())
  userId        String
  provider      String    // 'onlyfans', 'instagram', 'tiktok', 'reddit'
  accountId     String?
  accessToken   String?   // Encrypted
  refreshToken  String?   // Encrypted
  expiresAt     DateTime?
  lastSync      DateTime?
  connected     Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, provider, accountId])
  @@index([userId])
}
```

### UserStats Model

```prisma
model UserStats {
  id                String    @id @default(cuid())
  userId            String    @unique
  messagesSent      Int       @default(0)
  messagesTrend     Float     @default(0)
  responseRate      Float     @default(0)
  responseRateTrend Float     @default(0)
  revenue           Float     @default(0)
  revenueTrend      Float     @default(0)
  activeChats       Int       @default(0)
  activeChatsTrend  Float     @default(0)
  updatedAt         DateTime  @updatedAt
  
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Design System Token Completeness
*For any* page that loads the design system, all required CSS custom properties (colors, spacing, typography, borders, shadows, brand gradients) should be defined and accessible via computed styles.
**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7**

### Property 2: Gradient Usage Restriction
*For any* element with brand gradient, it should ONLY be applied to primary CTA buttons and focus states, never to backgrounds or surfaces.
**Validates: Requirements 2.3**

### Property 3: Hover State Transformations
*For any* interactive element with hover effects, hovering should apply consistent transform and shadow changes within 200-300ms transition duration.
**Validates: Requirements 2.4, 2.7, 9.3**

### Property 4: User Registration Round Trip
*For any* valid email and password (8+ characters), submitting the registration form should create an unverified user in the database, and that user should be retrievable by email.
**Validates: Requirements 3.2**

### Property 5: Verification Email Delivery
*For any* newly created user account, a verification email should be sent via AWS SES containing a verification link with 24-hour expiration.
**Validates: Requirements 3.3, 3.4**

### Property 6: Email Verification State Transition
*For any* user with a valid verification token, clicking the verification link should transition the user's emailVerified status from false to true.
**Validates: Requirements 3.5**

### Property 7: Password Security
*For any* submitted password, the stored password in the database should be a bcrypt hash, not the plaintext password.
**Validates: Requirements 16.1**

### Property 8: Onboarding Progress Calculation
*For any* onboarding step (1, 2, or 3), the progress bar width should equal (currentStep / 3) * 100%.
**Validates: Requirements 5.2**

### Property 9: Onboarding Data Persistence
*For any* completed onboarding flow, all collected data (contentTypes, platform credentials, goal, revenueGoal) should be persisted to the database and retrievable.
**Validates: Requirements 5.4, 5.6, 5.9**

### Property 10: Onboarding Navigation Consistency
*For any* onboarding step, clicking "back" should preserve previously entered data when returning to that step.
**Validates: Requirements 5.11**

### Property 11: Stats Display Completeness
*For any* authenticated user on the home page, the stats grid should display exactly four metric cards with labels, values, trends, and descriptions.
**Validates: Requirements 7.1, 7.2, 7.3**

### Property 12: Trend Indicator Correctness
*For any* stat with a positive trend value, the trend badge should have green styling; for negative trends, red styling.
**Validates: Requirements 7.4, 7.5**

### Property 13: Integration Status Accuracy
*For any* platform integration, the displayed connection status (connected/disconnected) should match the database state.
**Validates: Requirements 8.2, 8.3**

### Property 14: OAuth Flow Initiation
*For any* disconnected platform, clicking the connect button should initiate the OAuth flow for that specific provider.
**Validates: Requirements 8.5**

### Property 15: Integration Disconnection Confirmation
*For any* connected platform, clicking disconnect should prompt for confirmation before removing the connection.
**Validates: Requirements 8.6**

### Property 16: Cache Hit Behavior
*For any* cached API response that has not expired, subsequent requests for the same data should return the cached value without making a new API call.
**Validates: Requirements 11.2**

### Property 17: Cache Expiration Behavior
*For any* cached API response, after the TTL expires, the next request should fetch fresh data and update the cache.
**Validates: Requirements 11.3**

### Property 18: Cache Invalidation Completeness
*For any* cache invalidation request, all matching cache entries should be removed from the cache.
**Validates: Requirements 11.4**

### Property 19: LRU Cache Eviction
*For any* cache at maximum capacity, adding a new entry should evict the least recently used entry.
**Validates: Requirements 11.5**

### Property 20: Integration Cache Invalidation
*For any* integration connection or disconnection action, the integration status cache should be invalidated.
**Validates: Requirements 12.3**

### Property 21: Responsive Layout Adaptation
*For any* viewport width below 768px, the layout should switch to single-column mode and hide the sidebar.
**Validates: Requirements 13.1, 13.2**

### Property 22: Skeleton Loading Structure
*For any* loading state, skeleton placeholders should match the structure of the final content (same number of elements, similar dimensions).
**Validates: Requirements 10.1**

### Property 23: Animation Performance
*For any* CSS animation, the animation should use transform and opacity properties for GPU acceleration.
**Validates: Requirements 14.1**

### Property 24: Reduced Motion Support
*For any* user with prefers-reduced-motion enabled, non-essential animations should be disabled or reduced to minimal duration.
**Validates: Requirements 14.4**

### Property 25: Keyboard Navigation Completeness
*For any* interactive element (buttons, links, inputs), keyboard focus should provide a visible focus indicator.
**Validates: Requirements 15.1**

### Property 26: Form Label Association
*For any* form input, there should be an associated label element connected via htmlFor/id or aria-label.
**Validates: Requirements 15.2**

### Property 27: Credential Encryption
*For any* OnlyFans credentials stored in the database, the accessToken and refreshToken should be encrypted using AES-256.
**Validates: Requirements 16.2**

### Property 28: Secure Cookie Configuration
*For any* authentication cookie set by the system, it should have httpOnly and secure flags enabled.
**Validates: Requirements 16.4**

### Property 29: CSRF Protection
*For any* state-changing API request, the request should include a valid CSRF token.
**Validates: Requirements 16.5**

### Property 30: CloudFront Asset Delivery
*For any* static asset request, the response should come from CloudFront CDN with appropriate cache headers.
**Validates: Requirements 17.1, 17.2**

### Property 31: S3 Asset Versioning
*For any* asset uploaded to S3, versioning should be enabled to allow rollback.
**Validates: Requirements 18.3**

### Property 32: Lambda@Edge Security Headers
*For any* request processed by Lambda@Edge, security headers (CSP, HSTS, X-Frame-Options) should be added to the response.
**Validates: Requirements 19.1**

### Property 33: CloudWatch Error Logging
*For any* application error, error details should be logged to CloudWatch Logs with timestamp and context.
**Validates: Requirements 20.2**

### Property 34: Performance Metric Targets
*For any* home page load, the First Contentful Paint (FCP) should be under 1.5 seconds and Largest Contentful Paint (LCP) should be under 2.5 seconds.
**Validates: Requirements 21.1, 21.2**

### Property 35: API Response Time
*For any* API request with cached data, the response time should be under 200ms; for database queries, under 500ms.
**Validates: Requirements 21.5**

## Error Handling

### Error Categories

**1. Validation Errors (400)**
- Invalid email format
- Password too short
- Missing required fields
- Invalid onboarding data

**2. Authentication Errors (401)**
- Invalid credentials
- Expired verification token
- Unverified email attempting login
- Missing or invalid session

**3. Authorization Errors (403)**
- Accessing resources without permission
- CSRF token mismatch
- Rate limit exceeded

**4. Not Found Errors (404)**
- User not found
- Integration not found
- Invalid verification token

**5. Conflict Errors (409)**
- Email already registered
- Integration already connected

**6. Server Errors (500)**
- Database connection failures
- AWS service errors (SES, S3, CloudFront)
- Encryption/decryption failures
- Cache service errors

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
  };
}
```

### Error Handling Strategy

**Client-Side:**
- Display user-friendly error messages
- Provide actionable recovery steps
- Log errors to CloudWatch via API
- Implement retry logic for transient failures

**Server-Side:**
- Catch and log all errors
- Return appropriate HTTP status codes
- Sanitize error messages (no sensitive data)
- Implement circuit breakers for external services

**AWS Services:**
- Implement exponential backoff for retries
- Use dead letter queues for failed operations
- Set up CloudWatch alarms for error rates
- Configure SNS notifications for critical errors

## Testing Strategy

### Unit Testing

**Framework:** Vitest

**Coverage Targets:**
- Utility functions: 100%
- Services: 90%
- Components: 80%
- API routes: 90%

**Key Unit Tests:**
- Design system token validation
- Cache service operations (set, get, invalidate, evict)
- Email template generation
- Password hashing and verification
- Token generation and validation
- Encryption/decryption functions
- Form validation logic

### Property-Based Testing

**Framework:** fast-check (JavaScript/TypeScript property testing library)

**Configuration:** Minimum 100 iterations per property test

**Property Tests to Implement:**

1. **Property 1: Design System Token Completeness**
   - Generate random page renders
   - Verify all CSS custom properties are defined

2. **Property 4: User Registration Round Trip**
   - Generate random valid emails and passwords
   - Create user, verify user exists in database

3. **Property 5: Verification Email Delivery**
   - Generate random user data
   - Verify email sent with correct format and expiration

4. **Property 6: Email Verification State Transition**
   - Generate random users with tokens
   - Verify state changes from unverified to verified

5. **Property 7: Password Security**
   - Generate random passwords
   - Verify stored passwords are bcrypt hashes

6. **Property 9: Onboarding Data Persistence**
   - Generate random onboarding data
   - Verify all data persists correctly

7. **Property 11: Stats Display Completeness**
   - Generate random user stats
   - Verify all four cards display correctly

8. **Property 16: Cache Hit Behavior**
   - Generate random cache keys and data
   - Verify cache returns data without API calls

9. **Property 17: Cache Expiration Behavior**
   - Generate random cache entries with TTL
   - Verify expiration triggers fresh fetch

10. **Property 19: LRU Cache Eviction**
    - Generate random cache operations
    - Verify LRU eviction when at capacity

11. **Property 21: Responsive Layout Adaptation**
    - Generate random viewport widths
    - Verify layout changes at breakpoints

12. **Property 27: Credential Encryption**
    - Generate random credentials
    - Verify stored credentials are encrypted

13. **Property 34: Performance Metric Targets**
    - Generate random page loads
    - Verify FCP and LCP meet targets

### Integration Testing

**Framework:** Playwright

**Test Scenarios:**
- Complete registration flow (register → verify email → onboarding → home)
- Authentication flow (login → session management → logout)
- Onboarding flow (all 3 steps with skip and back navigation)
- Integration management (connect → disconnect → refresh)
- Cache behavior (API calls → cache hits → invalidation)
- Responsive design (test at 320px, 768px, 1024px, 1920px)

### End-to-End Testing

**Framework:** Playwright

**Critical User Journeys:**
1. New user registration to first login
2. Complete onboarding and view home page
3. Connect OnlyFans integration
4. View stats and navigate to integrations
5. Disconnect integration and reconnect

### Performance Testing

**Tools:**
- Lighthouse CI
- WebPageTest
- AWS CloudWatch RUM

**Metrics to Monitor:**
- First Contentful Paint (FCP) < 1.5s
- Largest Contentful Paint (LCP) < 2.5s
- First Input Delay (FID) < 100ms
- Cumulative Layout Shift (CLS) < 0.1
- Time to Interactive (TTI) < 3.5s
- Total Blocking Time (TBT) < 300ms

### Security Testing

**Tools:**
- OWASP ZAP
- npm audit
- Snyk

**Test Areas:**
- SQL injection prevention
- XSS prevention
- CSRF protection
- Authentication bypass attempts
- Authorization checks
- Encryption validation
- Secure header verification

## AWS Infrastructure Design

### CloudFront Distribution

```yaml
Distribution:
  Origins:
    - Id: S3-Static-Assets
      DomainName: huntaze-assets.s3.amazonaws.com
      S3OriginConfig:
        OriginAccessIdentity: origin-access-identity/cloudfront/XXXXX
    
    - Id: Next-App
      DomainName: huntaze.vercel.app
      CustomOriginConfig:
        HTTPSPort: 443
        OriginProtocolPolicy: https-only
  
  DefaultCacheBehavior:
    TargetOriginId: Next-App
    ViewerProtocolPolicy: redirect-to-https
    AllowedMethods: [GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE]
    CachedMethods: [GET, HEAD, OPTIONS]
    ForwardedValues:
      QueryString: true
      Cookies:
        Forward: all
      Headers:
        - Authorization
        - CloudFront-Viewer-Country
    MinTTL: 0
    DefaultTTL: 0
    MaxTTL: 31536000
    LambdaFunctionAssociations:
      - EventType: viewer-request
        LambdaFunctionARN: arn:aws:lambda:us-east-1:xxx:function:security-headers
      - EventType: origin-response
        LambdaFunctionARN: arn:aws:lambda:us-east-1:xxx:function:image-optimization
  
  CacheBehaviors:
    - PathPattern: /_next/static/*
      TargetOriginId: S3-Static-Assets
      ViewerProtocolPolicy: redirect-to-https
      MinTTL: 31536000
      DefaultTTL: 31536000
      MaxTTL: 31536000
      Compress: true
    
    - PathPattern: /images/*
      TargetOriginId: S3-Static-Assets
      ViewerProtocolPolicy: redirect-to-https
      MinTTL: 86400
      DefaultTTL: 86400
      MaxTTL: 31536000
      Compress: true
```

### S3 Bucket Configuration

```yaml
Bucket:
  BucketName: huntaze-assets
  VersioningConfiguration:
    Status: Enabled
  
  LifecycleConfiguration:
    Rules:
      - Id: archive-old-versions
        Status: Enabled
        NoncurrentVersionTransitions:
          - TransitionInDays: 30
            StorageClass: STANDARD_IA
          - TransitionInDays: 90
            StorageClass: GLACIER
        NoncurrentVersionExpiration:
          NoncurrentDays: 365
  
  PublicAccessBlockConfiguration:
    BlockPublicAcls: true
    BlockPublicPolicy: true
    IgnorePublicAcls: true
    RestrictPublicBuckets: true
  
  CorsConfiguration:
    CorsRules:
      - AllowedOrigins: ['https://huntaze.com']
        AllowedMethods: [GET, HEAD]
        AllowedHeaders: ['*']
        MaxAgeSeconds: 3600
```

### Lambda@Edge Functions

**Security Headers Function:**

```javascript
exports.handler = async (event) => {
  const response = event.Records[0].cf.response;
  const headers = response.headers;

  headers['strict-transport-security'] = [{
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload'
  }];

  headers['content-security-policy'] = [{
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.huntaze.com;"
  }];

  headers['x-frame-options'] = [{
    key: 'X-Frame-Options',
    value: 'DENY'
  }];

  headers['x-content-type-options'] = [{
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  }];

  headers['referrer-policy'] = [{
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  }];

  headers['permissions-policy'] = [{
    key: 'Permissions-Policy',
    value: 'geolocation=(), microphone=(), camera=()'
  }];

  return response;
};
```

**Image Optimization Function:**

```javascript
exports.handler = async (event) => {
  const request = event.Records[0].cf.request;
  const headers = request.headers;

  // Detect WebP support
  const acceptHeader = headers['accept'] ? headers['accept'][0].value : '';
  const supportsWebP = acceptHeader.includes('image/webp');
  const supportsAVIF = acceptHeader.includes('image/avif');

  // Modify request to get optimized format
  if (supportsAVIF && request.uri.match(/\.(jpg|jpeg|png)$/)) {
    request.uri = request.uri.replace(/\.(jpg|jpeg|png)$/, '.avif');
  } else if (supportsWebP && request.uri.match(/\.(jpg|jpeg|png)$/)) {
    request.uri = request.uri.replace(/\.(jpg|jpeg|png)$/, '.webp');
  }

  return request;
};
```

### CloudWatch Alarms

```yaml
Alarms:
  - AlarmName: high-error-rate
    MetricName: 5XXError
    Namespace: AWS/CloudFront
    Statistic: Sum
    Period: 300
    EvaluationPeriods: 2
    Threshold: 10
    ComparisonOperator: GreaterThanThreshold
    AlarmActions:
      - arn:aws:sns:us-east-1:xxx:critical-alerts
  
  - AlarmName: slow-response-time
    MetricName: OriginLatency
    Namespace: AWS/CloudFront
    Statistic: Average
    Period: 300
    EvaluationPeriods: 2
    Threshold: 1000
    ComparisonOperator: GreaterThanThreshold
    AlarmActions:
      - arn:aws:sns:us-east-1:xxx:performance-alerts
  
  - AlarmName: low-cache-hit-ratio
    MetricName: CacheHitRate
    Namespace: AWS/CloudFront
    Statistic: Average
    Period: 300
    EvaluationPeriods: 2
    Threshold: 80
    ComparisonOperator: LessThanThreshold
    AlarmActions:
      - arn:aws:sns:us-east-1:xxx:performance-alerts
```

## Deployment Strategy

### Build Process

1. **Static Asset Generation**
   - Run `next build` to generate optimized production build
   - Extract static assets from `.next/static`
   - Optimize images (convert to WebP/AVIF, compress)
   - Minify CSS and JavaScript

2. **Asset Upload to S3**
   - Upload static assets to S3 with versioning
   - Set appropriate content-type headers
   - Enable gzip/brotli compression
   - Set cache-control headers (1 year for immutable assets)

3. **CloudFront Cache Invalidation**
   - Invalidate changed assets only
   - Use wildcard patterns for efficiency
   - Monitor invalidation progress

4. **Application Deployment**
   - Deploy Next.js app to Vercel
   - Update environment variables
   - Run database migrations
   - Verify health checks

### Rollback Procedure

1. **Identify Issue**
   - Monitor CloudWatch alarms
   - Check error rates and performance metrics

2. **Rollback Assets**
   - Restore previous S3 version
   - Invalidate CloudFront cache
   - Verify asset delivery

3. **Rollback Application**
   - Revert to previous Vercel deployment
   - Rollback database migrations if needed
   - Verify functionality

### Monitoring and Alerting

**Key Metrics:**
- Error rate (5XX responses)
- Response time (p50, p95, p99)
- Cache hit ratio
- Core Web Vitals (FCP, LCP, FID, CLS)
- Database query performance
- API endpoint latency

**Alert Thresholds:**
- Error rate > 1% → Warning
- Error rate > 5% → Critical
- Response time p95 > 1s → Warning
- Response time p95 > 2s → Critical
- Cache hit ratio < 80% → Warning
- FCP > 2s → Warning
- LCP > 3s → Warning

## Performance Optimization Techniques

### 1. Code Splitting
- Route-based code splitting (automatic with Next.js App Router)
- Component-level lazy loading for heavy components
- Dynamic imports for non-critical features

### 2. Image Optimization
- Next.js Image component with automatic optimization
- Serve WebP/AVIF formats based on browser support
- Lazy loading with intersection observer
- Responsive images with srcset

### 3. CSS Optimization
- CSS Modules for scoped styles
- Critical CSS inlining
- Unused CSS removal
- CSS minification and compression

### 4. JavaScript Optimization
- Tree shaking to remove unused code
- Minification and compression
- Defer non-critical scripts
- Use Web Workers for heavy computations

### 5. Caching Strategy
- Static assets: 1 year cache (immutable)
- API responses: 5 minutes cache (with revalidation)
- Integration status: 5 minutes cache
- User stats: 1 minute cache

### 6. Database Optimization
- Connection pooling
- Query optimization with indexes
- Prepared statements
- Read replicas for analytics queries

### 7. CDN Optimization
- Edge caching with CloudFront
- Geographic distribution
- HTTP/2 and HTTP/3 support
- Brotli compression

## Security Considerations

### Authentication Security
- Passwords hashed with bcrypt (cost factor 12)
- Verification tokens: 32-byte cryptographically secure random
- Session tokens: httpOnly, secure, sameSite=strict
- Token expiration: 24 hours for verification, 7 days for sessions

### Data Encryption
- At rest: AES-256 encryption for sensitive data (OAuth tokens, credentials)
- In transit: TLS 1.3 for all connections
- Key management: AWS KMS for encryption keys

### API Security
- CSRF protection on all state-changing endpoints
- Rate limiting: 100 requests/minute per IP
- Input validation and sanitization
- SQL injection prevention (Prisma ORM)
- XSS prevention (React automatic escaping)

### Infrastructure Security
- S3 bucket policies: deny public access
- CloudFront: HTTPS only, security headers
- Lambda@Edge: input validation, error handling
- Database: VPC isolation, encrypted connections

### Compliance
- GDPR: Data export and deletion capabilities
- CCPA: Privacy policy and opt-out mechanisms
- SOC 2: Audit logging and access controls

## Accessibility Implementation

### WCAG 2.1 AA Compliance

**Perceivable:**
- Color contrast ratio ≥ 4.5:1 for normal text
- Color contrast ratio ≥ 3:1 for large text
- Text alternatives for images (alt attributes)
- Captions for video content

**Operable:**
- Keyboard navigation for all interactive elements
- Visible focus indicators (3px brand-colored ring)
- Skip navigation links
- No keyboard traps

**Understandable:**
- Clear error messages with recovery instructions
- Consistent navigation across pages
- Form labels associated with inputs
- Predictable behavior

**Robust:**
- Valid HTML5 markup
- ARIA attributes where needed
- Compatible with assistive technologies
- Progressive enhancement

### Keyboard Navigation

**Tab Order:**
1. Skip to main content link
2. Header navigation
3. Sidebar navigation
4. Main content (forms, buttons, links)
5. Footer

**Keyboard Shortcuts:**
- Tab: Move forward
- Shift+Tab: Move backward
- Enter/Space: Activate buttons
- Escape: Close modals/dropdowns
- Arrow keys: Navigate within components

### Screen Reader Support

**ARIA Labels:**
- `aria-label` for icon-only buttons
- `aria-describedby` for form field hints
- `aria-live` for dynamic content updates
- `role` attributes for custom components

**Semantic HTML:**
- `<nav>` for navigation
- `<main>` for main content
- `<article>` for independent content
- `<aside>` for complementary content
- `<button>` for actions
- `<a>` for navigation

## Conclusion

This design document provides a comprehensive blueprint for implementing the Beta Launch UI System. The architecture prioritizes performance, security, and accessibility while maintaining a consistent Shopify-inspired design language. The multi-layer caching strategy, AWS infrastructure optimization, and comprehensive testing approach ensure the system can scale to support 20-50 beta creators with room for growth.

Key success factors:
- Achieve Core Web Vitals targets (FCP < 1.5s, LCP < 2.5s)
- Maintain 99.9% uptime with CloudWatch monitoring
- Ensure WCAG 2.1 AA accessibility compliance
- Implement comprehensive security measures
- Provide smooth onboarding experience with <5% drop-off rate
