# Design Document

## Overview

The unified app shell design establishes a consistent, professional layout system for the Huntaze platform. The design leverages existing components (MainSidebar, Header) while creating new components (AppShell, TopHeader, UserMenu) to provide a cohesive navigation and layout experience across all authenticated pages.

The architecture uses Next.js 13+ App Router with route groups to automatically apply the layout to all authenticated pages without affecting URLs. The design prioritizes mobile responsiveness, accessibility, and performance while maintaining the existing visual design language.

## Architecture

### High-Level Structure

```
app/
├── layout.tsx                    # Root layout (minimal, global providers)
├── page.tsx                      # Landing page
├── (landing)/                    # Landing pages group
│   ├── layout.tsx               # Landing-specific layout
│   ├── pricing/
│   └── about/
├── (auth)/                       # Authentication pages group
│   ├── layout.tsx               # Auth-specific layout
│   ├── login/
│   └── register/
├── (onboarding)/                 # Onboarding flow group
│   ├── layout.tsx               # Onboarding-specific layout
│   └── setup/
└── (app)/                        # ⭐ NEW: Main application group
    ├── layout.tsx               # AppShell layout
    ├── dashboard/
    ├── messages/
    ├── fans/
    ├── analytics/
    ├── schedule/
    ├── revenue/                 # NEW
    ├── marketing/               # NEW
    └── settings/
```

### Component Hierarchy

```
app/(app)/layout.tsx
└── AppShell
    ├── MobileSidebarProvider (context for mobile state)
    ├── MainSidebar
    │   ├── Logo
    │   ├── NavigationItems[]
    │   │   ├── NavItem (with icon, label, badge)
    │   │   └── Active state indicator
    │   └── UpgradeCard (conditional)
    └── MainContent
        ├── TopHeader
        │   ├── MobileMenuButton
        │   ├── Breadcrumb
        │   └── HeaderActions
        │       ├── NotificationBell
        │       ├── ThemeToggle
        │       └── UserMenu
        └── PageContent (children)
```

## Components and Interfaces

### 1. AppShell Component

**Purpose:** Main layout wrapper that orchestrates sidebar and header

**Location:** `components/layout/AppShell.tsx`

**Props:**
```typescript
interface AppShellProps {
  children: React.ReactNode;
}
```

**Responsibilities:**
- Provide flex container for sidebar and main content
- Manage mobile sidebar state via context
- Apply consistent background and spacing
- Handle responsive breakpoints

**Implementation Notes:**
- Use `'use client'` directive for interactivity
- Implement mobile sidebar state with React context
- Use Tailwind's `lg:` breakpoint (1024px) for desktop/mobile split
- Maintain minimum height of 100vh

### 2. MainSidebar Component (Enhanced)

**Purpose:** Left navigation sidebar with all major sections

**Location:** `components/layout/MainSidebar.tsx` (refactor existing)

**Navigation Structure:**
```typescript
interface NavItem {
  id: string;
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  requiresPremium?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', href: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { id: 'messages', href: '/messages', label: 'Messages', icon: InboxIcon, badge: 'dynamic' },
  { id: 'fans', href: '/fans', label: 'Fans', icon: UsersIcon, badge: 'dynamic' },
  { id: 'analytics', href: '/analytics', label: 'Analytics', icon: ChartIcon },
  { id: 'schedule', href: '/schedule', label: 'Schedule', icon: CalendarIcon },
  { id: 'revenue', href: '/revenue', label: 'Revenue', icon: DollarIcon, requiresPremium: true },
  { id: 'marketing', href: '/marketing', label: 'Marketing', icon: MegaphoneIcon },
  { id: 'settings', href: '/settings', label: 'Settings', icon: SettingsIcon },
];
```

**Features:**
- Active route detection using `usePathname()`
- Notification badges (fetched from API or context)
- Premium feature indicators
- Smooth hover and active states
- Mobile: slide-in overlay with backdrop
- Desktop: fixed 256px width

**Styling:**
- Active: `bg-gray-900 text-white` (dark mode: `bg-white text-gray-900`)
- Hover: `bg-gray-100` (dark mode: `bg-gray-800`)
- Transition: `transition-colors duration-150`

### 3. TopHeader Component

**Purpose:** Top navigation bar with breadcrumbs and actions

**Location:** `components/layout/TopHeader.tsx`

**Props:**
```typescript
interface TopHeaderProps {
  // Props are optional; component reads from route context
}
```

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ [☰] Dashboard > Analytics        [🔔3] [🌙] [Avatar ▼]     │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Hamburger menu button (mobile only)
- Dynamic breadcrumb generation from route
- Notification bell with badge
- Theme toggle
- User menu dropdown

**Styling:**
- Height: 64px (h-16)
- Border bottom: 1px
- Background: white with backdrop blur
- Sticky positioning: `sticky top-0 z-40`

### 4. Breadcrumb Component

**Purpose:** Show current location in app hierarchy

**Location:** `components/layout/Breadcrumb.tsx`

**Logic:**
```typescript
// Example: /fans/import → ["Fans", "Import"]
// Example: /dashboard → ["Dashboard"]
// Example: /analytics/revenue → ["Analytics", "Revenue"]

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  return segments.map((segment, index) => ({
    label: formatSegment(segment),
    href: '/' + segments.slice(0, index + 1).join('/'),
    isLast: index === segments.length - 1,
  }));
}
```

**Rendering:**
- Separator: `/` or `›`
- Last item: not clickable, bold
- Previous items: clickable links
- Truncate on mobile if too long

### 5. UserMenu Component

**Purpose:** User profile dropdown with actions

**Location:** `components/layout/UserMenu.tsx`

**Menu Items:**
```typescript
const MENU_ITEMS = [
  { label: 'Profile', href: '/settings/profile', icon: UserIcon },
  { label: 'Billing', href: '/settings/billing', icon: CreditCardIcon },
  { label: 'Preferences', href: '/settings/preferences', icon: CogIcon },
  { type: 'divider' },
  { label: 'Help & Support', href: '/help', icon: QuestionMarkIcon },
  { label: 'Sign Out', action: 'signOut', icon: LogoutIcon },
];
```

**Features:**
- Avatar with user initials or photo
- Dropdown on click (not hover)
- Close on outside click
- Keyboard navigation support
- Sign out action triggers auth flow

### 6. NotificationBell Component

**Purpose:** Display notifications with badge

**Location:** `components/layout/NotificationBell.tsx`

**Features:**
- Badge with unread count
- Dropdown panel with recent notifications
- Mark as read functionality
- Link to full notifications page
- Real-time updates via polling or WebSocket

### 7. MobileSidebarContext

**Purpose:** Manage mobile sidebar open/close state

**Location:** `components/layout/MobileSidebarContext.tsx`

**Interface:**
```typescript
interface MobileSidebarContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}
```

**Usage:**
- Hamburger button calls `toggle()`
- Backdrop click calls `close()`
- Navigation link click calls `close()`
- Escape key calls `close()`

## Data Models

### Navigation Badge Data

```typescript
interface NavigationBadges {
  messages: number;      // Unread message count
  fans: number;          // New fans count
  notifications: number; // Unread notifications
}
```

**Source:** API endpoint `/api/navigation/badges` or React context

**Refresh:** Poll every 30 seconds or use WebSocket

### User Profile Data

```typescript
interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isPremium: boolean;
  plan: 'free' | 'pro' | 'enterprise';
}
```

**Source:** Auth context or session

### Breadcrumb Data

```typescript
interface BreadcrumbItem {
  label: string;
  href: string;
  isLast: boolean;
}
```

**Generation:** Client-side from pathname

## Error Handling

### Navigation Errors

**Scenario:** User clicks navigation link but route doesn't exist

**Handling:**
- Next.js will show 404 page
- Sidebar remains functional
- User can navigate to other routes

### Badge Loading Errors

**Scenario:** API call for badges fails

**Handling:**
- Show no badge (fail silently)
- Log error to monitoring
- Retry on next interval
- Don't block navigation

### Mobile Sidebar Errors

**Scenario:** Sidebar state gets stuck open

**Handling:**
- Provide close button in sidebar
- Allow backdrop click to close
- Reset state on route change
- Escape key always closes

### Theme Toggle Errors

**Scenario:** Theme preference fails to save

**Handling:**
- Apply theme immediately (optimistic)
- Show toast if save fails
- Retry save in background
- Fall back to system preference

## Testing Strategy

### Unit Tests

**Components to Test:**
- `AppShell`: renders children, manages mobile state
- `MainSidebar`: renders nav items, highlights active route
- `TopHeader`: renders breadcrumb and actions
- `Breadcrumb`: generates correct items from pathname
- `UserMenu`: renders menu items, handles sign out
- `NotificationBell`: displays badge, opens dropdown

**Test Cases:**
```typescript
describe('MainSidebar', () => {
  it('highlights active navigation item based on pathname');
  it('displays badge when count > 0');
  it('hides premium items for free users');
  it('closes mobile sidebar on navigation');
});

describe('Breadcrumb', () => {
  it('generates breadcrumbs from pathname');
  it('makes last item non-clickable');
  it('truncates long breadcrumbs on mobile');
});

describe('UserMenu', () => {
  it('opens dropdown on click');
  it('closes on outside click');
  it('calls sign out handler');
  it('navigates to menu item href');
});
```

### Integration Tests

**Scenarios:**
1. User navigates from Dashboard to Messages
   - Sidebar updates active state
   - Breadcrumb updates
   - URL changes
   - Page content loads

2. User opens mobile menu
   - Hamburger button opens sidebar
   - Backdrop appears
   - Clicking backdrop closes sidebar
   - Clicking nav item closes sidebar and navigates

3. User toggles theme
   - Theme changes immediately
   - Preference saves to localStorage
   - Theme persists on page reload

### Visual Regression Tests

**Screenshots:**
- Desktop: sidebar + header + content
- Mobile: closed sidebar
- Mobile: open sidebar
- Dark mode variations
- Active states
- Hover states

### Accessibility Tests

**Checks:**
- Keyboard navigation works
- Focus indicators visible
- ARIA labels present
- Screen reader announces navigation
- Color contrast meets WCAG AA
- Mobile menu accessible

### Performance Tests

**Metrics:**
- AppShell renders in < 100ms
- Navigation transition < 200ms
- Badge API call < 500ms
- No layout shift on load
- 60fps animations

## Mobile Responsive Behavior

### Breakpoints

- **Mobile:** < 1024px (Tailwind `lg:`)
- **Desktop:** ≥ 1024px

### Mobile Layout

```
┌─────────────────────────────────┐
│ [☰] Dashboard    [🔔] [🌙] [👤] │ ← TopHeader (always visible)
├─────────────────────────────────┤
│                                 │
│                                 │
│        Page Content             │
│                                 │
│                                 │
└─────────────────────────────────┘

When hamburger clicked:
┌─────────────────────────────────┐
│ [✕] Dashboard    [🔔] [🌙] [👤] │
├─────────────────────────────────┤
│ ┌─────────────┐                 │
│ │ Huntaze     │ [Backdrop]      │
│ │             │                 │
│ │ 🏠 Dashboard│                 │
│ │ 💬 Messages │                 │
│ │ 👥 Fans     │                 │
│ │ ...         │                 │
│ └─────────────┘                 │
└─────────────────────────────────┘
```

### Desktop Layout

```
┌──────────┬──────────────────────────────────────┐
│ Huntaze  │ Dashboard > Analytics  [🔔] [🌙] [👤]│
│          ├──────────────────────────────────────┤
│ 🏠 Dash  │                                      │
│ 💬 Msg   │                                      │
│ 👥 Fans  │        Page Content                  │
│ 📊 Ana   │                                      │
│ 📅 Sch   │                                      │
│ 💰 Rev   │                                      │
│ 📢 Mark  │                                      │
│ ⚙️  Set   │                                      │
│          │                                      │
│ [Upgrade]│                                      │
└──────────┴──────────────────────────────────────┘
```

## Design Decisions and Rationales

### Decision 1: Use Route Groups Instead of Wrapper Components

**Rationale:**
- Automatic layout application to all routes in group
- No need to manually wrap each page
- Cleaner code organization
- Easier to maintain and extend
- Follows Next.js best practices

**Alternative Considered:** Wrapping each page component
- Rejected: Too much boilerplate, easy to forget

### Decision 2: Client-Side Breadcrumb Generation

**Rationale:**
- No server round-trip needed
- Instant updates on navigation
- Simple implementation
- Works with dynamic routes

**Alternative Considered:** Server-side generation with metadata
- Rejected: More complex, slower, unnecessary

### Decision 3: Context for Mobile Sidebar State

**Rationale:**
- Shared state between hamburger button and sidebar
- Clean prop drilling avoidance
- Easy to extend with additional state
- Standard React pattern

**Alternative Considered:** URL query parameter
- Rejected: Pollutes URL, unnecessary complexity

### Decision 4: Fixed Sidebar Width (256px)

**Rationale:**
- Matches existing MainSidebar
- Comfortable for reading labels
- Standard sidebar width in modern apps
- Leaves plenty of space for content

**Alternative Considered:** Collapsible sidebar with icons only
- Rejected: More complex, less discoverable

### Decision 5: Sticky Header Instead of Fixed

**Rationale:**
- Scrolls with content initially
- Stays visible when scrolling down
- Better mobile experience
- Less z-index complexity

**Alternative Considered:** Fixed header
- Rejected: Takes up space on mobile, can overlap content

## Implementation Phases

### Phase 1: Core Components (Days 1-2)

1. Create `components/layout/` directory
2. Implement `AppShell.tsx`
3. Implement `MobileSidebarContext.tsx`
4. Refactor `MainSidebar.tsx` with new nav items
5. Create `TopHeader.tsx`
6. Create `Breadcrumb.tsx`

### Phase 2: Header Components (Day 3)

1. Create `UserMenu.tsx`
2. Create `NotificationBell.tsx`
3. Integrate `ThemeToggle` (existing)
4. Add mobile hamburger button
5. Style and polish

### Phase 3: Route Migration (Day 4)

1. Create `app/(app)/layout.tsx`
2. Move `/dashboard/*` to `/(app)/dashboard/*`
3. Move `/schedule` to `/(app)/schedule`
4. Move `/analytics` to `/(app)/analytics`
5. Move `/creator/messages` to `/(app)/messages`
6. Move `/fans` to `/(app)/fans`
7. Create new `/revenue` and `/marketing` placeholders
8. Update all internal links

### Phase 4: Polish and Testing (Day 5)

1. Add animations and transitions
2. Test mobile responsive behavior
3. Test keyboard navigation
4. Test dark mode
5. Fix any visual inconsistencies
6. Performance optimization
7. Accessibility audit

## Dependencies

### Existing Components to Reuse

- `components/navigation/MainSidebar.tsx` (refactor)
- `components/Header.tsx` (reference for styling)
- `components/ThemeToggle.tsx` (integrate)
- `contexts/AppStateContext.tsx` (for user data)

### New Dependencies

None required - all functionality can be implemented with existing Next.js and React features.

### Breaking Changes

**URL Changes:** None - route groups don't affect URLs

**Component Changes:**
- `MainSidebar`: Add new nav items, mobile support
- Pages: Move to new route group (internal only)

**Migration Path:**
- All changes are internal
- No user-facing breaking changes
- Existing bookmarks and links continue to work
