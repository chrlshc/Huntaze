# User Flow Diagram

## Flow Visuel Complet

```
┌─────────────────────────────────────────────────────────────────┐
│                         HOMEPAGE (/)                             │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  MarketingHeader                                        │    │
│  │  - Logo                                                 │    │
│  │  - Navigation (Features, Pricing, About)               │    │
│  │  - "Get Started" button                                │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Hero Section                                           │    │
│  │  - Headline                                             │    │
│  │  │  - Value Proposition                                 │    │
│  │  - CTA: "Get Started" → /signup                        │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  [Features, Benefits, Pricing, etc.]                            │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  MarketingFooter                                        │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Click "Get Started"
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      SIGNUP (/signup)                            │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Logo + "Create your account"                          │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Social Auth Buttons                                    │    │
│  │  - Continue with Google                                │    │
│  │  - Continue with GitHub                                │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Email Signup Form                                      │    │
│  │  - Email input                                          │    │
│  │  - "Send Magic Link" button                            │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Already have an account? Sign in                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ After successful signup
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   ONBOARDING (/onboarding)                       │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Progress Bar: Step 1/3                                │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Step 1: Connect Your Accounts                         │    │
│  │  - OnlyFans                                             │    │
│  │  - Instagram                                            │    │
│  │  - TikTok                                               │    │
│  │  - Reddit                                               │    │
│  │                                                          │    │
│  │  [Skip] [Continue]                                      │    │
│  └────────────────────────────────────────────────────────┘    │
│                              │
│                              ↓
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Step 2: Preview Your Dashboard                        │    │
│  │  - Dashboard preview                                    │    │
│  │  - Key features highlight                              │    │
│  │                                                          │    │
│  │  [Back] [Continue]                                      │    │
│  └────────────────────────────────────────────────────────┘    │
│                              │
│                              ↓
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Step 3: Explore Features                              │    │
│  │  - Feature tour                                         │    │
│  │  - Quick tips                                           │    │
│  │                                                          │    │
│  │  [Back] [Get Started]                                   │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Click "Get Started"
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    DASHBOARD (/dashboard)                        │
│                                                                  │
│  ┌──────────┬──────────────────────────────────────────────┐   │
│  │          │  Header                                       │   │
│  │          │  - Logo                                       │   │
│  │          │  - Notifications                              │   │
│  │          │  - User Menu (Avatar, Name, Logout)          │   │
│  │          │  - Mobile Menu (Hamburger)                   │   │
│  │          └──────────────────────────────────────────────┘   │
│  │ Sidebar  │                                                   │
│  │          │  Dashboard Content                                │
│  │ - Home   │  ┌────────────────────────────────────────┐      │
│  │ - Analyt │  │  Summary Cards                          │      │
│  │ - Content│  │  - Total Revenue                        │      │
│  │ - Message│  │  - Active Fans                          │      │
│  │ - Integr │  │  - Messages                             │      │
│  │ - Setting│  │  - Engagement                           │      │
│  │          │  └────────────────────────────────────────┘      │
│  │          │                                                   │
│  │ Back to  │  ┌────────────────────────────────────────┐      │
│  │ Home     │  │  Quick Actions                          │      │
│  │          │  │  - Create Content                       │      │
│  └──────────┤  │  - Send Campaign                        │      │
│             │  │  - View Analytics                       │      │
│             │  └────────────────────────────────────────┘      │
│             │                                                   │
│             │  ┌────────────────────────────────────────┐      │
│             │  │  Recent Activity                        │      │
│             │  │  - Activity feed                        │      │
│             │  └────────────────────────────────────────┘      │
│             │                                                   │
└─────────────┴───────────────────────────────────────────────────┘
```

## États et Redirections

### État: Non-Authentifié

```
Homepage
  ↓ [CTA: "Join Beta"]
Signup
  ↓ [Complete signup]
Onboarding
  ↓ [Complete onboarding]
Dashboard
```

### État: Authentifié (Onboarding Non Complété)

```
Homepage
  ↓ [CTA: "Go to Dashboard"]
Dashboard (accessible mais devrait compléter onboarding)

OU

Onboarding (si accès direct)
  ↓ [Complete onboarding]
Dashboard
```

### État: Authentifié (Onboarding Complété)

```
Homepage
  ↓ [CTA: "Go to Dashboard"]
Dashboard ✓

Onboarding (si accès direct)
  ↓ [Auto-redirect]
Dashboard ✓
```

## Protections de Routes

```
┌─────────────────────────────────────────────────────────┐
│  Route          │  Non-Auth    │  Auth (No OB)  │  Auth (OB) │
├─────────────────────────────────────────────────────────┤
│  /              │  ✓ View      │  ✓ View        │  ✓ View    │
│  /signup        │  ✓ View      │  → /dashboard  │  → /dashboard │
│  /onboarding    │  → /login    │  ✓ View        │  → /dashboard │
│  /dashboard     │  → /login    │  ✓ View        │  ✓ View    │
└─────────────────────────────────────────────────────────┘

OB = Onboarding Completed
```

## Composants Clés

### Homepage
- `app/(marketing)/page.tsx`
- `components/cta/StandardCTA.tsx`
- `components/layout/MarketingHeader.tsx`
- `components/layout/MarketingFooter.tsx`

### Signup
- `app/(auth)/signup/page.tsx`
- `components/auth/SignupForm.tsx`
- `components/auth/SocialAuthButtons.tsx`
- `components/auth/EmailSignupForm.tsx`

### Onboarding
- `app/(auth)/onboarding/page.tsx`
- `app/(auth)/onboarding/onboarding-client.tsx`
- `components/onboarding/SimplifiedOnboardingWizard.tsx`

### Dashboard
- `app/(app)/layout.tsx`
- `app/(app)/dashboard/page.tsx`
- `components/Header.tsx`
- `components/Sidebar.tsx`
- `components/MobileSidebar.tsx`

## Navigation Dashboard

```
Dashboard Layout
├── Sidebar (Desktop)
│   ├── Dashboard → /dashboard
│   ├── Analytics → /analytics
│   ├── Content → /content
│   ├── Messages → /messages
│   ├── Integrations → /integrations
│   ├── Settings → /settings
│   └── Back to Home → /
│
├── Header
│   ├── Mobile Menu (Hamburger)
│   ├── Notifications
│   └── User Menu
│       ├── Profile
│       └── Logout
│
└── Main Content
    └── Page-specific content
```

## Responsive Behavior

### Desktop (≥ md)
```
┌──────────┬────────────────────────┐
│          │  Header                │
│          ├────────────────────────┤
│ Sidebar  │                        │
│          │  Content               │
│          │                        │
└──────────┴────────────────────────┘
```

### Mobile (< md)
```
┌────────────────────────┐
│  Header [☰]            │
├────────────────────────┤
│                        │
│  Content               │
│                        │
└────────────────────────┘

[☰] → Opens mobile sidebar overlay
```

## Résumé

✅ **Flow complet** : Homepage → Signup → Onboarding → Dashboard
✅ **Protections** : Routes protégées par authentification
✅ **Redirections** : Automatiques selon l'état utilisateur
✅ **Layout** : Dashboard avec Header + Sidebar
✅ **Responsive** : Desktop et mobile supportés
