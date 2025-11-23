# Implementation Tasks

## Phase 1: Foundation & Design System

- [x] 1. Setup Design Tokens
  - Configure tailwind.config.js with HSL variables for the "Linear Midnight" palette (#0F0F10 background) and alpha-based borders

- [x] 2. Global CSS & Fonts
  - Implement app/globals.css with 100dvh viewport fixes and configure Inter font via next/font/google

- [x] 3. Route Architecture
  - Create (marketing) and (app) route groups and move existing pages to separate public vs private concerns

- [x] 4. App Layout Lock
  - Create app/(app)/layout.tsx with .app-viewport-lock class (overflow hidden) to prevent mobile sway

- [x] 5. Safe Area Components
  - Implement helper classes or components for env(safe-area-inset-*) to protect Headers and Footers on iOS

## Phase 2: Performance & Core Vitals

- [x] 6. Dynamic Marketing Imports
  - Refactor Landing Page to use next/dynamic with Skeleton loaders for heavy below-the-fold sections

- [x] 7. Navigation Optimization
  - Audit all <Link> components to ensure prefetch strategy is correctly applied for instant transitions

- [x] 8. Bundle Analysis
  - Configure next/bundle-analyzer and verify that initial JS bundles remain under 200KB

## Phase 3: SEO & Infrastructure

- [x] 9. Staging Protection
  - Implement middleware.ts to inject X-Robots-Tag: noindex when VERCEL_ENV is not production

- [x] 10. JSON-LD Generator
  - Create a lib/seo utility to generate structured data (Organization, Product) and inject it into the Marketing Layout

- [x] 11. SSG Configuration
  - Update marketing pages to use generateStaticParams where applicable for static generation

## Phase 4: Marketing Assets

- [x] 12. OG Image API
  - Create app/api/og/route.tsx using @vercel/og (Satori) to generate dynamic social cards with "Magic Blue" styling

- [x] 13. Analytics Proxy
  - Configure next.config.js rewrites to proxy /stats/* to your analytics provider (Plausible/PostHog) to bypass ad-blockers

- [x] 14. Analytics Component
  - Create a client-side Analytics component that respects Do-Not-Track (DNT) headers

## Phase 5: Engagement Features (Changelog)

- [x] 15. Changelog API
  - Create app/api/changelog/route.ts to serve updates (mocked or from CMS)

- [x] 16. Changelog Widget
  - Build the ChangelogWidget sidebar component with a "pulsing" notification badge for unseen updates

- [x] 17. Read State Logic
  - Implement cookie-based tracking to dismiss the badge once the user opens the widget

## Phase 6: Onboarding Flow

- [x] 18. Database Schema
  - Update Prisma schema to add UserOnboarding model for tracking step progress

- [x] 19. Server Actions
  - Create app/actions/onboarding.ts to handle step toggling securely

- [x] 20. Onboarding UI
  - Build the OnboardingChecklist component using Shadcn Collapsible and Progress bars with Framer Motion animations

- [x] 21. Confetti Trigger
  - Integrate canvas-confetti to trigger a celebration effect when completion reaches 100%

## Phase 7: Verification & Polish

- [x] 22. Property Tests
  - Write PBT (Property Based Tests) to verify Viewport CSS enforcement and JSON-LD validity

- [x] 23. Visual QA
  - Verify Dark Mode contrast ratios and ensure Lucide icons utilize 1.5px stroke width globally
