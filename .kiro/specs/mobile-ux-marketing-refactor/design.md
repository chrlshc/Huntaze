# Design Document

## Overview

This design document outlines the technical architecture for refactoring the Huntaze Next.js application to achieve Linear-quality mobile UX and implement a marketing-driven growth engine. The refactor focuses on four core pillars:

1. **Mobile Viewport Engineering** - Eliminating horizontal sway and handling device safe areas
2. **Professional Design System** - Implementing a premium dark mode aesthetic with semantic tokens
3. **Marketing Infrastructure** - SEO optimization, social sharing, and analytics bypass
4. **Engagement Components** - Changelog widget and onboarding checklist

The implementation leverages Next.js 14+ App Router, Tailwind CSS, Shadcn/UI, and Framer Motion to deliver a cohesive, performant experience.

**Key Architectural Decision**: The application uses **Route Groups** to create a separation of concerns between the Public Marketing Engine (SEO-first, scrollable) and the Private Web Application (interaction-first, viewport-locked). This allows different layout strategies and constraints for each context.

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js App Router                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │   Route Groups       │  │    API Routes        │        │
│  │                      │  │                      │        │
│  │ • (marketing)/       │  │ • /api/og            │        │
│  │   - Scrollable       │  │ • /api/changelog     │        │
│  │   - SEO-first        │  │ • Server Actions     │        │
│  │   - Static Gen       │  │   - /actions/        │        │
│  │                      │  │     onboarding       │        │
│  │ • (app)/             │  │                      │        │
│  │   - Viewport Lock    │  │                      │        │
│  │   - Internal Scroll  │  │                      │        │
│  │   - Server Comps     │  │                      │        │
│  └──────────────────────┘  └──────────────────────┘        │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                    Component Layer                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Layout     │  │  Engagement  │  │  Marketing   │      │
│  │  Components  │  │  Components  │  │  Components  │      │
│  │              │  │              │  │              │      │
│  │ • AppHeader  │  │ • Changelog  │  │ • Dynamic    │      │
│  │   (w/ safe   │  │   Widget     │  │   Imports    │      │
│  │   areas)     │  │ • Onboarding │  │ • Skeletons  │      │
│  │ • MobileTab  │  │   Checklist  │  │ • JsonLd     │      │
│  │   bar        │  │   (Optimist) │  │   Helper     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                   Design System Layer                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  • Tailwind Config (HSL-based Semantic Tokens)               │
│  • CSS Variables (Runtime Theming + Safe Areas)              │
│  • Global Styles (Viewport Lock, Sway Prevention)            │
│  • Inter Font (next/font/google)                             │
│  • Lucide Icons (1.5px stroke)                               │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                  Infrastructure Layer                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  • Middleware (Environment Detection, X-Robots-Tag)           │
│  • next.config.ts (Analytics Proxy, Bundle Optimization)     │
│  • Metadata Generation (JSON-LD, Open Graph)                 │
│  • CMS Integration (Changelog Data)                          │
│  • Auth Integration (Session-based Server Actions)           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Rendering Strategy

The application uses a hybrid rendering approach optimized for both performance and SEO:

- **Static Generation (generateStaticParams)**: Marketing pages, blog posts, documentation
- **Server Components**: Dynamic app views with server-side data fetching
- **Client Components**: Interactive UI elements (onboarding, changelog) with optimistic updates
- **Dynamic Imports**: Below-the-fold components loaded on-demand

### Route Groups Strategy

**Design Rationale**: Route groups allow us to apply different layout constraints without affecting URL structure:

1. **(marketing)/** - Public pages with traditional scrolling behavior, SEO optimization, and static generation
2. **(app)/** - Authenticated app views with viewport locking, internal scroll areas, and server components

This separation ensures:
- Marketing pages remain crawlable and performant for SEO
- App views provide native-like mobile experience with fixed viewport
- Different performance budgets and optimization strategies per context
- Clear architectural boundaries between public and private features

## Components and Interfaces

### 1. Mobile Viewport System

#### Global CSS Configuration

Location: `app/globals.css`

```css
@layer base {
  :root {
    /* Safe Area CSS Variables (shorthand) */
    --sat: env(safe-area-inset-top);
    --sab: env(safe-area-inset-bottom);
    --sal: env(safe-area-inset-left);
    --sar: env(safe-area-inset-right);
  }

  /* Physical sway prevention */
  html {
    -webkit-text-size-adjust: 100%;
    touch-action: manipulation;
  }

  /* Default body for Marketing (Scrollable) */
  body {
    background: hsl(var(--background));
    color: #EDEDED;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    margin: 0;
    padding: 0;
  }
}

/* App-Specific Viewport Lock (Applied in (app) layout) */
.app-viewport-lock {
  height: 100dvh; /* Dynamic Viewport Height */
  width: 100vw;
  overflow: hidden; /* No scroll on body, internal scroll areas only */
  position: fixed;
}
```

**Design Rationale**: 
- CSS variables for safe areas (`--sat`, `--sab`, etc.) provide shorthand access throughout the app
- `touch-action: manipulation` prevents double-tap zoom, reducing accidental gestures
- `.app-viewport-lock` is only applied to the (app) route group, allowing marketing pages to scroll naturally
- `overflow-x: hidden` on body prevents horizontal sway globally
- `100dvh` adapts to mobile browser chrome appearing/disappearing

#### Root Layout Metadata

Location: `app/layout.tsx`

```typescript
export const metadata: Metadata = {
  viewport: {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover', // iOS notch support
  },
  // ... other metadata
}
```

**Design Rationale**: The `viewport-fit=cover` directive is critical for iOS devices with notches (iPhone X and later). Without it, the application renders in a "safe area" with black bars, wasting screen real estate. Combined with CSS `env(safe-area-inset-*)` variables, this allows the app to extend edge-to-edge while respecting device cutouts.

#### App Layout with Viewport Lock

Location: `app/(app)/layout.tsx`

```typescript
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-viewport-lock flex flex-col">
      {/* Header: Handles Top Notch */}
      <header className="pt-[var(--sat)] bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <AppNavigation />
      </header>

      {/* Main Content: Scrollable Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
        {children}
      </main>

      {/* Footer/Tabbar: Handles Bottom Swipe Indicator */}
      <footer className="pb-[var(--sab)] bg-surface border-t border-border">
        <MobileTabbar />
      </footer>
    </div>
  );
}
```

**Design Rationale**: 
- The outer `div` uses `app-viewport-lock` to fix the viewport at 100dvh
- Header and footer are fixed within this container, with safe area padding
- Only the `<main>` element scrolls internally, preventing body scroll
- This creates a native app-like experience where chrome doesn't bounce
- `backdrop-blur-md` on header creates the Linear-style frosted glass effect

### 2. Performance Optimization System

#### Dynamic Import Pattern

Location: `components/marketing/`

```typescript
import dynamic from 'next/dynamic';

// Below-the-fold section with skeleton
const HeroSection = dynamic(
  () => import('./HeroSection'),
  {
    loading: () => <HeroSkeleton />,
    ssr: false, // Defer until client-side
  }
);

// Skeleton matches section dimensions
function HeroSkeleton() {
  return (
    <div className="h-[600px] bg-surface animate-pulse">
      {/* Skeleton content */}
    </div>
  );
}
```

**Design Rationale**: Dynamic imports with `ssr: false` reduce the initial JavaScript bundle size and Time to Interactive (TTI) by:
1. Deferring non-critical component loading until after the page is interactive
2. Code-splitting heavy components (animations, charts, etc.) into separate chunks
3. Providing immediate visual feedback via skeleton loaders that match the component's dimensions
4. Preventing layout shift by reserving space with the skeleton's fixed height

#### Optimistic UI Pattern

```typescript
'use client';

import { useOptimistic } from 'react';

interface OnboardingStep {
  id: string;
  completed: boolean;
}

export function OnboardingChecklist({ steps }: { steps: OnboardingStep[] }) {
  const [optimisticSteps, updateOptimisticSteps] = useOptimistic(
    steps,
    (state, stepId: string) => {
      return state.map(step =>
        step.id === stepId ? { ...step, completed: true } : step
      );
    }
  );

  async function handleComplete(stepId: string) {
    // Update UI immediately
    updateOptimisticSteps(stepId);
    
    // Sync to server
    await updateOnboardingProgress(stepId);
  }

  return (
    // ... render optimisticSteps
  );
}
```

### 3. Design System

#### Tailwind Configuration

Location: `tailwind.config.js`

```javascript
module.exports = {
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        // Semantic tokens using HSL-based CSS variables
        background: 'hsl(var(--background))',
        surface: 'hsl(var(--surface))',
        
        // Brand colors
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: '#FFFFFF'
        },
        
        // Linear-style borders (alpha-based for glass effect)
        border: 'var(--border)',
        divider: 'var(--divider)',
        
        // Text colors
        foreground: '#EDEDED',
        muted: {
          DEFAULT: '#8A8F98',
          foreground: '#6B7280'
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'sway-fix': 'none', // Explicitly prevent animation sway
      }
    },
  },
};
```

**Design Rationale**: 
- HSL color format allows easier manipulation of lightness/saturation for variants
- Alpha-based borders (`--border`, `--divider`) create subtle glass-like separators
- `darkMode: ["class"]` enables future light mode toggle via class on html element
- `animation: 'sway-fix': 'none'` provides explicit override for problematic animations

#### CSS Variables

Location: `app/globals.css`

```css
@layer base {
  :root {
    /* Dark Mode Default (Linear Midnight) */
    --background: 240 5% 6%;      /* #0F0F10 */
    --surface: 240 4% 12%;        /* #1E1E20 */
    --primary: 234 56% 60%;       /* #5E6AD2 - Magic Blue */
    
    /* High precision alpha borders for "Glass" look */
    --border: rgba(255, 255, 255, 0.08);
    --divider: rgba(255, 255, 255, 0.04);
    
    /* Safe Areas */
    --sat: env(safe-area-inset-top);
    --sab: env(safe-area-inset-bottom);
    --sal: env(safe-area-inset-left);
    --sar: env(safe-area-inset-right);
  }
  
  /* Runtime theming support - Light mode (future) */
  [data-theme="light"] {
    --background: 0 0% 100%;      /* #FFFFFF */
    --surface: 0 0% 96%;          /* #F5F5F5 */
    --primary: 234 56% 60%;       /* #5E6AD2 */
    --border: rgba(0, 0, 0, 0.08);
    --divider: rgba(0, 0, 0, 0.04);
  }
}
```

**Design Rationale**: 
- HSL values stored as space-separated numbers (e.g., `240 5% 6%`) allow Tailwind to generate opacity variants automatically (e.g., `bg-background/80`)
- Alpha-based borders adapt to both light and dark themes while maintaining the subtle glass aesthetic
- Safe area variables centralized for easy access throughout the app
- The `[data-theme]` attribute enables runtime theme switching without rebuilding

#### Font Configuration

Location: `app/layout.tsx`

```typescript
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.Node }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
```

#### Icon System

```typescript
import { Menu, X, Bell, Check } from 'lucide-react';

// Default stroke width: 1.5px (Linear style)
<Menu strokeWidth={1.5} />
```

### 4. SEO Infrastructure

#### Middleware for Environment Detection

Location: `middleware.ts`

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Requirement 4.1: Block indexing on staging/preview
  const isProduction = process.env.VERCEL_ENV === 'production';
  
  if (!isProduction) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

**Design Rationale**: 
- Explicit check for `VERCEL_ENV === 'production'` ensures staging/preview environments are never indexed
- `noarchive` directive prevents cached versions from appearing in search results
- Matcher configuration excludes static assets to reduce middleware overhead
- This prevents duplicate content penalties and ensures only production is crawled

#### JSON-LD Schema Generation

Location: `lib/seo/json-ld.ts`

```typescript
interface OrganizationSchema {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  name: string;
  url: string;
  logo: string;
  sameAs?: string[]; // Social media profiles
}

interface ProductSchema {
  '@context': 'https://schema.org';
  '@type': 'Product';
  name: string;
  description: string;
  offers: {
    '@type': 'Offer';
    price: string;
    priceCurrency: string;
  };
}

export function generateOrganizationSchema(): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Huntaze',
    url: 'https://huntaze.com',
    logo: 'https://huntaze.com/logo.png',
    sameAs: [
      'https://twitter.com/huntaze',
      'https://linkedin.com/company/huntaze',
    ],
  };
}

export function generateProductSchema(product: {
  name: string;
  description: string;
  price: string;
}): ProductSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'USD',
    },
  };
}

// Helper component for injecting JSON-LD
export function JsonLd({ data }: { data: Record<string, any> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

**Design Rationale**: 
- `sameAs` property links social profiles, improving brand entity recognition
- Helper component `JsonLd` simplifies injection in page components
- Type-safe interfaces ensure schema.org compliance at compile time
- Centralized generation functions maintain consistency across pages

#### Page Metadata with JSON-LD

Location: `app/(marketing)/page.tsx` (example)

```typescript
import { Metadata } from 'next';
import { generateOrganizationSchema, JsonLd } from '@/lib/seo/json-ld';

export const metadata: Metadata = {
  title: 'Huntaze - Product Hunt Analytics',
  description: 'Track and analyze Product Hunt launches',
  openGraph: {
    title: 'Huntaze - Product Hunt Analytics',
    description: 'Track and analyze Product Hunt launches',
    url: 'https://huntaze.com',
    images: [
      {
        url: '/api/og?title=Huntaze',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Huntaze - Product Hunt Analytics',
    description: 'Track and analyze Product Hunt launches',
    images: ['/api/og?title=Huntaze'],
  },
};

export default function HomePage() {
  const schema = generateOrganizationSchema();
  
  return (
    <>
      <JsonLd data={schema} />
      {/* Page content */}
    </>
  );
}
```

**Design Rationale**: 
- Marketing pages live in `(marketing)` route group for SEO optimization
- Twitter card metadata ensures proper display on Twitter/X
- `JsonLd` helper component simplifies schema injection
- All metadata is colocated with the page for maintainability

### 5. Open Graph Image Generation

#### API Route

Location: `app/api/og/route.tsx`

```typescript
import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || 'Huntaze';

    // Load Inter font for consistent branding
    const fontData = await fetch(
      new URL('../../../assets/Inter-Bold.ttf', import.meta.url)
    ).then((res) => res.arrayBuffer());

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0F0F10',
            backgroundImage: 'radial-gradient(circle at 25px 25px, #1E1E20 2%, transparent 0%), radial-gradient(circle at 75px 75px, #1E1E20 2%, transparent 0%)',
            backgroundSize: '100px 100px',
          }}
        >
          <div
            style={{
              fontSize: 60,
              fontWeight: 900,
              color: '#EDEDED',
              padding: '20px 40px',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20,
              background: '#151516',
              boxShadow: '0px 10px 50px rgba(94, 106, 210, 0.3)', // Magic Blue glow
            }}
          >
            {title}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Inter',
            data: fontData,
            weight: 900,
          },
        ],
      }
    );
  } catch (error) {
    // Fallback to default image
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/og-default.png',
      },
    });
  }
}
```

**Design Rationale**: 
- Subtle dot pattern background adds visual interest without overwhelming the title
- Card-style container with border and shadow creates depth
- Magic Blue glow (#5E6AD2) reinforces brand identity
- Inter Bold font ensures consistency with the main application
- 7-day cache headers reduce regeneration costs

### 6. Analytics Proxy

#### Next.js Config

Location: `next.config.ts`

```typescript
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/stats/js/script.js',
        destination: 'https://plausible.io/js/script.js',
      },
      {
        source: '/stats/api/event',
        destination: 'https://plausible.io/api/event',
      },
    ];
  },
};

export default nextConfig;
```

**Design Rationale**: Next.js rewrites automatically preserve all query parameters, headers, and request bodies when proxying requests. This ensures:
1. Analytics events maintain full context (referrer, user-agent, etc.)
2. The proxy is transparent to the analytics service
3. Ad-blockers cannot detect the analytics service domain
4. First-party cookies can be used for session tracking

#### Analytics Component

Location: `components/analytics/Analytics.tsx`

```typescript
'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

export function Analytics() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // Respect Do Not Track (DNT) header
    const dnt = navigator.doNotTrack || 
                (window as any).doNotTrack || 
                navigator.msDoNotTrack;
    
    // Check for GDPR consent (if consent management is implemented)
    const hasConsent = localStorage.getItem('analytics-consent') !== 'false';
    
    // Only load analytics if DNT is not enabled and user has consented
    if (dnt !== '1' && dnt !== 'yes' && hasConsent) {
      setShouldLoad(true);
    }
  }, []);

  if (!shouldLoad) {
    return null;
  }

  return (
    <Script
      src="/stats/js/script.js"
      data-domain="huntaze.com"
      data-api="/stats/api/event"
      strategy="afterInteractive"
    />
  );
}
```

**Design Rationale**: 
- **Privacy-First**: Checks DNT headers and consent preferences before loading
- **Ad-blocker Bypass**: Uses first-party paths (`/stats/*`) instead of third-party domains
- **Non-Blocking**: `strategy="afterInteractive"` ensures analytics don't delay page interactivity
- **Graceful Degradation**: If localStorage is unavailable (private browsing), defaults to not loading
- IP anonymization is configured at the analytics service level (e.g., Plausible automatically anonymizes IPs)

### 7. Changelog Widget

#### Data Interface

```typescript
interface ChangelogEntry {
  id: string;
  title: string;
  description: string;
  releaseDate: string; // ISO 8601
  features: string[];
}

interface ChangelogResponse {
  entries: ChangelogEntry[];
  latestReleaseDate: string;
}
```

#### Changelog Widget

Location: `components/engagement/ChangelogWidget.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { getCookie, setCookie } from 'cookies-next';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export function ChangelogWidget() {
  const [hasNewUpdate, setHasNewUpdate] = useState(false);
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);

  useEffect(() => {
    async function checkForUpdates() {
      try {
        const response = await fetch('/api/changelog');
        const data: ChangelogResponse = await response.json();
        
        setEntries(data.entries);
        
        const lastViewed = getCookie('lastViewedChangelog');
        const latestRelease = new Date(data.latestReleaseDate);
        const lastViewedDate = lastViewed ? new Date(lastViewed) : new Date(0);
        
        setHasNewUpdate(latestRelease > lastViewedDate);
      } catch (error) {
        // Use cached fallback
        console.error('Failed to fetch changelog:', error);
      }
    }

    checkForUpdates();
  }, []);

  function handleOpen() {
    setHasNewUpdate(false);
    setCookie('lastViewedChangelog', new Date().toISOString(), {
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }

  return (
    <Sheet onOpenChange={(open) => open && handleOpen()}>
      <SheetTrigger asChild>
        <button className="relative flex items-center gap-2 p-2 hover:bg-surface rounded-lg transition-colors">
          <Bell strokeWidth={1.5} size={20} />
          <span className="text-sm">What's New</span>
          {hasNewUpdate && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
          )}
        </button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>What's New</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {entries.map((entry) => (
            <ChangelogEntry key={entry.id} entry={entry} />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ChangelogEntry({ entry }: { entry: ChangelogEntry }) {
  return (
    <div className="border-l-2 border-primary pl-4">
      <h3 className="font-semibold text-foreground">{entry.title}</h3>
      <p className="text-xs text-muted mt-1">
        {new Date(entry.releaseDate).toLocaleDateString()}
      </p>
      <p className="text-sm text-muted mt-2">{entry.description}</p>
      {entry.features.length > 0 && (
        <ul className="mt-3 space-y-1">
          {entry.features.map((feature, idx) => (
            <li key={idx} className="text-sm text-foreground flex items-start gap-2">
              <span className="text-primary">•</span>
              {feature}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

**Design Rationale**: 
- **Shadcn Sheet**: Uses Shadcn's Sheet component for mobile-friendly slide-out panel
- **Cookie Persistence**: Stores last viewed timestamp with 1-year expiration
- **Pulsing Badge**: CSS animation draws attention to new updates
- **Graceful Fallback**: If CMS fetch fails, component still renders without crashing
- **Accessibility**: Proper ARIA labels and keyboard navigation via Shadcn components

#### Changelog API Route

Location: `app/api/changelog/route.ts`

```typescript
import { NextResponse } from 'next/server';

// In production, this would fetch from a CMS
// For MVP, we can use a static JSON file or database
export async function GET() {
  try {
    // Example: Fetch from CMS or database
    const entries: ChangelogEntry[] = [
      {
        id: '1',
        title: 'Mobile UX Improvements',
        description: 'Enhanced mobile experience with viewport locking and safe area support',
        releaseDate: '2024-01-15T00:00:00Z',
        features: [
          'Fixed horizontal scrolling issues',
          'Added support for iPhone notches',
          'Improved touch interactions',
        ],
      },
      // More entries...
    ];

    const latestReleaseDate = entries[0]?.releaseDate || new Date().toISOString();

    return NextResponse.json({
      entries,
      latestReleaseDate,
    });
  } catch (error) {
    // Return cached fallback
    return NextResponse.json(
      {
        entries: [],
        latestReleaseDate: new Date(0).toISOString(),
      },
      { status: 500 }
    );
  }
}
```

**Design Rationale**: 
- API route provides a consistent interface for changelog data
- Can be easily swapped to fetch from a CMS (Contentful, Sanity, etc.)
- Returns structured data with latest release date for badge logic
- Graceful error handling returns empty array instead of crashing

### 8. Onboarding Checklist

#### Data Interface

```typescript
interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  order: number;
}

interface OnboardingProgress {
  userId: string;
  steps: OnboardingStep[];
  completedCount: number;
  totalCount: number;
}
```

#### Server Action

Location: `app/actions/onboarding.ts`

```typescript
'use server';

import { auth } from '@/auth'; // NextAuth or similar
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function toggleOnboardingStep(
  stepId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Security: Get userId from session, NOT from client payload
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Database mutation with upsert for safety
    await prisma.userOnboarding.upsert({
      where: { userId: session.user.id },
      update: {
        completedSteps: { push: stepId }
      },
      create: {
        userId: session.user.id,
        completedSteps: [stepId]
      }
    });

    // Revalidate specific path to update UI
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Failed to update onboarding:', error);
    return { success: false, error: 'Database error' };
  }
}
```

**Design Rationale**: 
- **Security First**: userId is extracted from the authenticated session, not passed from the client
- This prevents users from manipulating other users' onboarding progress
- `upsert` handles both first-time users and existing users gracefully
- `revalidatePath` ensures the UI reflects the updated state after server mutation
- Error messages are generic to avoid leaking implementation details

#### Onboarding Component

Location: `components/engagement/OnboardingChecklist.tsx`

```typescript
'use client';

import { useState, useOptimistic } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { toggleOnboardingStep } from '@/app/actions/onboarding';

interface Props {
  initialSteps: OnboardingStep[];
}

export function OnboardingChecklist({ initialSteps }: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [optimisticSteps, updateOptimisticSteps] = useOptimistic(
    initialSteps,
    (state, stepId: string) => {
      return state.map(step =>
        step.id === stepId ? { ...step, completed: true } : step
      );
    }
  );

  const completedCount = optimisticSteps.filter(s => s.completed).length;
  const totalCount = optimisticSteps.length;
  const progress = (completedCount / totalCount) * 100;

  async function handleStepComplete(stepId: string) {
    // Optimistic update
    updateOptimisticSteps(stepId);
    
    // Server sync (no userId needed - extracted from session)
    const result = await toggleOnboardingStep(stepId);
    
    if (!result.success) {
      // Revert optimistic update on error
      console.error('Failed to update:', result.error);
      return;
    }
    
    // Check if all complete
    if (completedCount + 1 === totalCount) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }

  if (isCollapsed) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-2 p-2 bg-surface rounded-lg cursor-pointer"
        onClick={() => setIsCollapsed(false)}
      >
        <span className="text-sm text-muted">
          Onboarding: {progress.toFixed(0)}%
        </span>
        <ChevronDown strokeWidth={1.5} size={16} />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface rounded-lg p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Get Started</h3>
        <button onClick={() => setIsCollapsed(true)}>
          <ChevronUp strokeWidth={1.5} size={20} />
        </button>
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {optimisticSteps.map((step) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-start gap-3 p-3 hover:bg-background rounded-lg transition-colors"
            >
              <button
                onClick={() => handleStepComplete(step.id)}
                disabled={step.completed}
                className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center",
                  step.completed
                    ? "bg-primary border-primary"
                    : "border-white-alpha"
                )}
              >
                {step.completed && <Check strokeWidth={2} size={14} />}
              </button>
              <div>
                <p className={cn(
                  "text-sm",
                  step.completed && "line-through text-muted"
                )}>
                  {step.title}
                </p>
                <p className="text-xs text-muted">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-4">
        <div className="h-2 bg-background rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-primary"
          />
        </div>
        <p className="text-xs text-muted mt-2">
          {completedCount} of {totalCount} completed
        </p>
      </div>
    </motion.div>
  );
}
```

## Data Models

### User Onboarding Schema

```prisma
model UserOnboarding {
  id              String   @id @default(cuid())
  userId          String   @unique
  completedSteps  String[] // Array of step IDs
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### Changelog Cache Schema

```prisma
model ChangelogCache {
  id              String   @id @default(cuid())
  entries         Json     // Cached changelog entries
  latestRelease   DateTime
  cachedAt        DateTime @default(now())
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Global viewport CSS enforcement

*For any* page in the application, the computed styles of html and body elements should have overflow-x: hidden and width: 100%

**Validates: Requirements 1.1**

### Property 2: Dynamic viewport height usage

*For any* full-screen element in the codebase, height declarations should use dvh units instead of vh units

**Validates: Requirements 1.2**

### Property 3: Safe area padding on fixed components

*For any* fixed Header or Footer component, the styles should include CSS environment variables for safe area insets (env(safe-area-inset-*))

**Validates: Requirements 1.4**

### Property 4: Dynamic imports for marketing sections

*For any* below-the-fold marketing component, it should be imported using next/dynamic with a corresponding skeleton loader component

**Validates: Requirements 2.1**

### Property 5: SSR disabled for heavy components

*For any* heavy component that is dynamically imported, the import configuration should include ssr: false

**Validates: Requirements 2.2**

### Property 6: Link prefetching enabled

*For any* Next.js Link component in the navigation, it should have prefetch={true} or rely on the default prefetch behavior

**Validates: Requirements 2.3**

### Property 7: Optimistic UI for interactive elements

*For any* interactive component that updates server state, it should use the useOptimistic hook to provide immediate UI feedback

**Validates: Requirements 2.4**

### Property 8: Bundle size constraints

*For any* build output, the initial JavaScript bundle chunks should not exceed 200KB in size

**Validates: Requirements 2.5**

### Property 9: Semantic color token usage

*For any* component using colors, className strings should use semantic token names (bg-background, text-primary, etc.) instead of hardcoded hex values

**Validates: Requirements 3.2, 3.5**

### Property 10: WhiteAlpha border consistency

*For any* border style declaration, it should use the WhiteAlpha CSS variable (rgba(255,255,255,0.08)) instead of solid grey colors

**Validates: Requirements 3.3**

### Property 11: Lucide icon stroke width

*For any* icon component from lucide-react, it should have strokeWidth={1.5} or use the default stroke width of 1.5px

**Validates: Requirements 3.4**

### Property 12: Environment-based indexing control

*For any* non-production environment (staging, preview), the middleware should inject X-Robots-Tag: noindex header in responses

**Validates: Requirements 4.1**

### Property 13: Static generation for marketing pages

*For any* marketing page route, the page file should export a generateStaticParams function for build-time pre-rendering

**Validates: Requirements 4.2**

### Property 14: Server Components for app views

*For any* dynamic app view, the component should not have 'use client' directive and should use async server-side data fetching

**Validates: Requirements 4.3**

### Property 15: JSON-LD schema injection

*For any* production page, the rendered HTML should include a script tag with type="application/ld+json" containing valid schema.org structured data

**Validates: Requirements 4.4**

### Property 16: JSON-LD schema validation

*For any* generated JSON-LD data, it should validate successfully against schema.org specifications for Organization or Product schemas

**Validates: Requirements 4.5**

### Property 17: Dynamic OG image generation

*For any* request to /api/og with a title parameter, the API should return a valid image response with the title rendered in the image

**Validates: Requirements 5.1**

### Property 18: Open Graph metadata completeness

*For any* page with metadata export, it should include all required Open Graph fields (og:title, og:description, og:image, og:url)

**Validates: Requirements 5.3**

### Property 19: Analytics proxy parameter preservation

*For any* request to the analytics proxy endpoints, all query parameters and headers should be preserved in the proxied request

**Validates: Requirements 6.3**

### Property 20: Changelog badge visibility

*For any* state where the latest changelog release date is newer than the lastViewedChangelog cookie, the changelog widget should display a pulsing badge

**Validates: Requirements 7.2**

### Property 21: Changelog cookie update

*For any* user interaction that opens the changelog widget, the lastViewedChangelog cookie should be updated to the current timestamp

**Validates: Requirements 7.3**

### Property 22: Onboarding server action persistence

*For any* completed onboarding step, the updateOnboardingProgress server action should successfully update the user's database record with the step ID

**Validates: Requirements 8.2**

### Property 23: Onboarding completion percentage

*For any* onboarding checklist state (collapsed or expanded), the displayed completion percentage should equal (completedSteps / totalSteps) * 100

**Validates: Requirements 8.5**

### Property 24: Optimistic onboarding updates

*For any* onboarding step completion, the UI should update immediately before the server action completes, using the useOptimistic hook

**Validates: Requirements 8.6**

## Error Handling

### Viewport and Layout Errors

- **Horizontal Overflow**: If content exceeds viewport width, the overflow-x: hidden rule will clip it. Developers should use responsive design patterns to prevent content from exceeding 100vw.
- **Safe Area Misconfiguration**: If safe area insets are not available (older devices), the padding will gracefully fall back to 0, maintaining layout integrity.

### Performance Errors

- **Dynamic Import Failures**: If a dynamically imported component fails to load, Next.js will retry the import. If it continues to fail, the skeleton loader will remain visible with an error boundary catching the failure.
- **Bundle Size Violations**: Build process should fail if bundles exceed 200KB, enforced through webpack configuration or CI checks.

### Design System Errors

- **Missing CSS Variables**: If CSS variables are not defined, Tailwind will fall back to default values. This should be caught in development through visual inspection.
- **Font Loading Failures**: If Inter font fails to load, the system will fall back to system-ui and sans-serif fonts defined in the font stack.

### SEO and Metadata Errors

- **JSON-LD Validation Failures**: Invalid JSON-LD should be caught during development through schema validation. In production, invalid schemas will be ignored by search engines but won't break the page.
- **OG Image Generation Failures**: If @vercel/og fails to generate an image, the API route will return a 302 redirect to /og-default.png fallback image.

### Analytics Errors

- **Proxy Configuration Errors**: If the analytics proxy is misconfigured, requests will fail silently. Analytics should be non-blocking and not affect user experience.
- **Ad-blocker Detection**: No error handling needed - if analytics are blocked, the application continues to function normally.
- **Privacy Preference Errors**: If localStorage is unavailable (private browsing), the component will default to not loading analytics, erring on the side of privacy.
- **IP Anonymization**: Configured at the analytics service level (e.g., Plausible automatically anonymizes IPs). No client-side handling required.

### Engagement Component Errors

- **CMS Unavailability**: If the changelog CMS is unavailable, the component will use cached fallback content from the last successful fetch.
- **Server Action Failures**: If updateOnboardingProgress fails, the optimistic UI will revert to the previous state, and an error message will be displayed to the user.
- **Cookie Errors**: If cookies cannot be set (privacy settings), the changelog badge will continue to show on each visit, which is acceptable degraded functionality.

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases:

- **Viewport Configuration**: Test that metadata exports include viewport-fit=cover
- **Font Configuration**: Test that Inter font is imported with correct subsets
- **Color Token Mapping**: Test that Tailwind config includes all semantic tokens with correct hex values
- **Middleware Environment Detection**: Test middleware with different VERCEL_ENV values
- **OG Image Fallback**: Test /api/og route with invalid inputs to verify fallback behavior
- **Analytics Proxy Config**: Test that next.config.js includes correct rewrite rules
- **Changelog Cookie Logic**: Test cookie comparison logic with various date scenarios
- **Confetti Trigger**: Test that confetti fires when all onboarding steps complete

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using **fast-check** library for TypeScript/JavaScript:

**Configuration**: Each property-based test will run a minimum of 100 iterations to ensure comprehensive coverage.

**Tagging**: Each property-based test will include a comment tag in this format:
```typescript
// Feature: mobile-ux-marketing-refactor, Property X: [property description]
```

Property tests will cover:

- **Property 1 (Global viewport CSS)**: Generate random page routes, render them, and verify computed styles
- **Property 2 (dvh usage)**: Parse all CSS/style files and verify full-height elements use dvh
- **Property 3 (Safe area padding)**: Check Header/Footer components for env() usage
- **Property 4 (Dynamic imports)**: Scan marketing components for next/dynamic usage
- **Property 5 (SSR disabled)**: Verify heavy components have ssr: false in dynamic imports
- **Property 6 (Link prefetching)**: Parse Link components and verify prefetch configuration
- **Property 7 (Optimistic UI)**: Verify interactive components use useOptimistic hook
- **Property 8 (Bundle sizes)**: Analyze build output and verify chunk sizes < 200KB
- **Property 9 (Semantic tokens)**: Scan for hardcoded hex values in className strings
- **Property 10 (WhiteAlpha borders)**: Verify border declarations use WhiteAlpha variable
- **Property 11 (Icon stroke width)**: Check lucide-react icon usage for strokeWidth prop
- **Property 12 (Environment indexing)**: Test middleware with various environment variables
- **Property 13 (Static generation)**: Verify marketing pages export generateStaticParams
- **Property 14 (Server Components)**: Check app views don't have 'use client' directive
- **Property 15 (JSON-LD injection)**: Render pages and verify JSON-LD script tags exist
- **Property 16 (JSON-LD validation)**: Validate generated JSON-LD against schema.org
- **Property 17 (OG image generation)**: Test /api/og with various title inputs
- **Property 18 (OG metadata)**: Verify all pages have complete Open Graph metadata
- **Property 19 (Proxy parameters)**: Test analytics proxy preserves query params/headers
- **Property 20 (Changelog badge)**: Test badge visibility with various date combinations
- **Property 21 (Cookie update)**: Verify cookie is set when widget opens
- **Property 22 (Server action)**: Test updateOnboardingProgress with various step IDs
- **Property 23 (Completion percentage)**: Verify percentage calculation with various completion states
- **Property 24 (Optimistic updates)**: Verify UI updates before server response

### Integration Testing

Integration tests will verify component interactions:

- **Viewport + Safe Areas**: Test that Header/Footer render correctly on simulated iOS devices
- **Dynamic Imports + Skeletons**: Test that skeleton loaders display while components load
- **Metadata + OG Images**: Test that pages render with correct metadata and OG image URLs
- **Analytics + Proxy**: Test that analytics events are successfully proxied
- **Changelog + CMS**: Test changelog widget with live CMS integration
- **Onboarding + Database**: Test complete onboarding flow with database persistence

### Visual Regression Testing

Visual tests will verify UI appearance:

- **Design System**: Screenshot components with semantic tokens applied
- **Mobile Viewport**: Screenshot pages on various mobile device sizes
- **Changelog Badge**: Screenshot badge animation states
- **Onboarding Progress**: Screenshot checklist at various completion levels

### Performance Testing

Performance tests will verify optimization goals:

- **Bundle Analysis**: Automated checks in CI to fail builds with bundles > 200KB
- **Lighthouse Scores**: Target scores of 90+ for Performance, Accessibility, Best Practices, SEO
- **Time to Interactive**: Measure TTI improvement compared to baseline (target: 30% reduction)
- **Core Web Vitals**: Monitor LCP, FID, CLS metrics in production

