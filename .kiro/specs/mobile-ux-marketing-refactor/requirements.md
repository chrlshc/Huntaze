# Requirements Document

## Introduction

This specification defines the requirements for refactoring the Huntaze Next.js application (staging.huntaze.com) to achieve professional-grade mobile UX and implement a marketing-driven growth engine. The goal is to reach "Linear-like" quality standards in performance, stability, and visual identity through systematic improvements to mobile viewport handling, design system implementation, SEO infrastructure, and engagement components.

## Glossary

- **System**: The Huntaze Next.js web application using App Router (Next.js 14+)
- **Mobile Viewport**: The visible area of the web application on mobile devices
- **Safe Area**: The portion of the screen not obscured by device notches, rounded corners, or system UI
- **Horizontal Sway**: Unintended horizontal scrolling caused by content overflow
- **dvh**: Dynamic Viewport Height - CSS unit that adapts to mobile browser address bars expanding/collapsing
- **Critical Rendering Path**: The sequence of steps the browser takes to render the initial view
- **Time to Interactive (TTI)**: The time from navigation start until the page is fully interactive
- **Code Splitting**: The practice of dividing JavaScript bundles into smaller chunks loaded on demand
- **Server Component**: Next.js component that renders on the server by default in App Router
- **Server Action**: Next.js asynchronous function that executes on the server, callable from Client Components
- **generateStaticParams**: Next.js App Router function for generating static paths at build time
- **JSON-LD**: JavaScript Object Notation for Linked Data - structured data format for SEO
- **Open Graph**: Protocol for controlling how URLs are displayed when shared on social media
- **Design Token**: Named entities that store visual design attributes
- **CMS**: Content Management System
- **Ad-blocker**: Browser extension that blocks tracking and analytics scripts
- **WhiteAlpha**: Semi-transparent white color value used for borders on dark backgrounds

## Requirements

### Requirement 1

**User Story:** As a mobile user, I want the application to display correctly within my device's viewport, so that I can navigate without unintended horizontal scrolling or content being obscured by device notches.

#### Acceptance Criteria

1. WHEN the global CSS is applied THEN the System SHALL set overflow-x: hidden and width: 100% on both html and body elements to prevent horizontal scrolling
2. WHEN full-screen elements are rendered THEN the System SHALL use 100dvh (dynamic viewport height) instead of 100vh to prevent layout jumps when mobile address bars retract
3. WHEN the application renders on iOS devices THEN the System SHALL use viewport-fit=cover in the Next.js metadata configuration
4. WHEN defining the main layout structure THEN the System SHALL apply padding using CSS environment variables (env(safe-area-inset-top), env(safe-area-inset-right), env(safe-area-inset-bottom), env(safe-area-inset-left)) to fixed Header and Footer components specifically
5. WHEN the user scrolls through the application THEN the System SHALL maintain stable viewport boundaries without horizontal movement

### Requirement 2

**User Story:** As a mobile user, I want the application to load and become interactive quickly, so that I can start using features without waiting for unnecessary resources to download.

#### Acceptance Criteria

1. WHEN below-the-fold marketing sections are rendered THEN the System SHALL use next/dynamic with a tailored skeleton loader matching the section's dimensions
2. WHEN heavy components are not immediately visible THEN the System SHALL defer their loading with ssr: false option in next/dynamic
3. WHEN the user navigates between pages THEN the System SHALL use Next.js Link component with prefetch={true} for instant transitions
4. WHEN interactive elements change state THEN the System SHALL use optimistic UI patterns via the useOptimistic hook to update UI immediately before server confirmation
5. WHEN JavaScript bundles are generated THEN the System SHALL split them into chunks no larger than 200KB for initial load

### Requirement 3

**User Story:** As a user, I want to experience a premium, professional dark mode interface with perfect typography, so that the application feels modern and reduces eye strain in low-light conditions.

#### Acceptance Criteria

1. WHEN the application initializes THEN the System SHALL load the Inter font via next/font/google with subsets: ['latin'] and variable weight
2. WHEN the design system is configured THEN the System SHALL define semantic tokens in tailwind.config.js mapping to: bg-background (#0F0F10), bg-surface (#1E1E20), text-primary (#EDEDED), text-muted (#8A8F98), and primary (#5E6AD2)
3. WHEN borders are rendered THEN the System SHALL use WhiteAlpha values (rgba(255,255,255,0.08)) instead of solid greys to maintain contrast on different dark backgrounds
4. WHEN UI icons are required THEN the System SHALL use Lucide React icons with a default stroke width of 1.5px
5. WHEN developers implement UI components THEN the System SHALL provide semantic token names (e.g., bg-background) instead of requiring hardcoded hex values
6. WHEN the design system uses CSS variables THEN the System SHALL enable runtime theming capability for future light mode support

### Requirement 4

**User Story:** As a content marketer, I want the application to be optimized for search engines in production only, so that our pages rank well and drive organic traffic without duplicate content penalties.

#### Acceptance Criteria

1. WHEN the application runs in staging or preview environments (detected via VERCEL_ENV or NODE_ENV) THEN the System SHALL inject X-Robots-Tag: noindex header in middleware.ts
2. WHEN static marketing pages are built THEN the System SHALL use generateStaticParams for pre-rendering at build time
3. WHEN dynamic app views are requested in production THEN the System SHALL render them as Server Components with server-side data fetching
4. WHEN any production page is rendered THEN the System SHALL inject structured JSON-LD data (Organization and Product schemas) in the document head
5. WHEN JSON-LD is generated THEN the System SHALL validate against schema.org specifications

### Requirement 5

**User Story:** As a content marketer, I want attractive social media previews when our links are shared, so that we achieve higher click-through rates on social platforms.

#### Acceptance Criteria

1. WHEN a page URL is shared on social media THEN the System SHALL generate a dynamic Open Graph image using @vercel/og (Satori) based on the page title and branding
2. WHEN Open Graph images are generated THEN the System SHALL serve them via an API route at /api/og with appropriate caching headers
3. WHEN social media platforms crawl shared links THEN the System SHALL provide valid Open Graph meta tags (og:title, og:description, og:image, og:url) in the Next.js metadata export
4. WHEN images are successfully generated THEN the System SHALL set Cache-Control headers to cache them for 7 days
5. WHEN image generation fails THEN the System SHALL fall back to a default branded image stored in the public directory

### Requirement 6

**User Story:** As a product analyst, I want to track user behavior and analytics events reliably, so that I can make data-driven decisions even when users have ad-blockers enabled.

#### Acceptance Criteria

1. WHEN analytics are initialized THEN the System SHALL use a rewrites rule in next.config.js to proxy analytics requests (e.g., /stats/js/script.js) to the external analytics service
2. WHEN analytics events are sent THEN the System SHALL route them through the first-party domain path (e.g., /stats/api/event) to bypass ad-blockers
3. WHEN the reverse-proxy is configured THEN the System SHALL preserve all query parameters and headers in the proxied request
4. WHEN user privacy settings are detected THEN the System SHALL respect Do Not Track headers and GDPR preferences
5. WHEN analytics data is collected THEN the System SHALL ensure IP anonymization is enabled in the analytics service configuration

### Requirement 7

**User Story:** As a user, I want to stay informed about new features and updates, so that I can take advantage of the latest capabilities.

#### Acceptance Criteria

1. WHEN the Sidebar renders THEN the System SHALL check a lastViewedChangelog cookie against the latest release date from the CMS
2. WHEN a new update is available THEN the System SHALL display a pulsing badge (CSS animation) on the "What's New" sidebar item
3. WHEN the user opens the changelog widget THEN the System SHALL mark the latest entry as viewed by updating the lastViewedChangelog cookie
4. WHEN the changelog widget is displayed THEN the System SHALL show it as a sidebar component accessible from the main navigation
5. WHEN changelog content is fetched THEN the System SHALL handle CMS unavailability gracefully with cached fallback content

### Requirement 8

**User Story:** As a new user, I want guided onboarding with clear progress tracking, so that I can quickly learn how to use the platform effectively.

#### Acceptance Criteria

1. WHEN a new user first accesses the application THEN the System SHALL display a collapsible onboarding checklist using Shadcn/UI components
2. WHEN the user completes an onboarding step THEN the System SHALL use a Server Action (updateOnboardingProgress) to persist progress to the user's database profile
3. WHEN progress is updated THEN the System SHALL provide visual feedback through animations using Framer Motion
4. WHEN all onboarding steps are completed THEN the System SHALL trigger a confetti animation using canvas-confetti library
5. WHEN the user collapses the checklist THEN the System SHALL maintain a compact indicator showing completion percentage
6. WHEN the onboarding checklist state changes THEN the System SHALL use optimistic updates to provide immediate UI feedback before server confirmation
