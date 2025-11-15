# Requirements Document

## Introduction

The Huntaze platform currently lacks a consistent layout and navigation system across all application pages. While modern layout components exist (MainSidebar, Header), they are only applied to some routes (e.g., `/dashboard/*`), leaving many pages without navigation, headers, or a cohesive user experience. This creates confusion for users and makes the platform feel fragmented and unprofessional.

This feature will establish a unified AppShell that provides consistent navigation, header, and layout structure across all authenticated application pages, creating a professional, cohesive user experience.

## Glossary

- **AppShell**: The unified layout wrapper that provides consistent sidebar navigation and header across all application pages
- **MainSidebar**: The left navigation sidebar component containing primary navigation links
- **TopHeader**: The header bar at the top of the application containing breadcrumbs, notifications, and user menu
- **App Router**: Next.js 13+ routing system using the `app/` directory
- **Route Group**: Next.js feature using parentheses `(group)` to organize routes without affecting URL structure
- **Authenticated Pages**: Pages that require user login and are part of the main application (not landing, auth, or onboarding pages)
- **Navigation Item**: A clickable link in the sidebar that navigates to a major section of the application
- **Breadcrumb**: Navigation element showing the user's current location in the application hierarchy
- **Mobile Responsive**: Layout that adapts to mobile devices with hamburger menu and collapsible sidebar

## Requirements

### Requirement 1: Unified Layout Structure

**User Story:** As a creator using Huntaze, I want consistent navigation and layout across all pages, so that I can easily navigate the platform without confusion.

#### Acceptance Criteria

1. WHEN a user navigates to any authenticated application page, THE AppShell SHALL render with MainSidebar and TopHeader
2. THE AppShell SHALL apply to all routes within the `(app)` route group
3. THE AppShell SHALL NOT apply to landing pages, authentication pages, or onboarding flows
4. THE AppShell SHALL maintain consistent spacing, colors, and visual design across all pages
5. WHERE a page is within the authenticated application, THE AppShell SHALL provide a flex layout with sidebar and main content area

### Requirement 2: Comprehensive Sidebar Navigation

**User Story:** As a creator, I want a sidebar with all major sections of the platform, so that I can quickly access any feature without searching.

#### Acceptance Criteria

1. THE MainSidebar SHALL display navigation items for Dashboard, Messages, Fans, Analytics, Schedule, Revenue, Marketing, and Settings
2. WHEN a user clicks a navigation item, THE AppShell SHALL navigate to the corresponding route and highlight the active item
3. THE MainSidebar SHALL display the Huntaze logo and tagline at the top
4. THE MainSidebar SHALL include notification badges on navigation items where applicable (e.g., unread message count)
5. THE MainSidebar SHALL include an upgrade call-to-action card at the bottom for non-premium users

### Requirement 3: Functional Top Header

**User Story:** As a creator, I want a header that shows where I am in the application and provides quick access to notifications and settings, so that I can stay oriented and access important features quickly.

#### Acceptance Criteria

1. THE TopHeader SHALL display a breadcrumb navigation showing the current page hierarchy
2. THE TopHeader SHALL include a notifications bell icon with unread count badge
3. THE TopHeader SHALL include a theme toggle for dark/light mode
4. THE TopHeader SHALL include a user menu with avatar, name, and dropdown options
5. THE TopHeader SHALL remain fixed at the top when scrolling the main content area

### Requirement 4: Mobile Responsive Design

**User Story:** As a creator using Huntaze on mobile, I want the navigation to adapt to my screen size, so that I can access all features on any device.

#### Acceptance Criteria

1. WHEN the viewport width is less than 1024 pixels, THE AppShell SHALL hide the MainSidebar by default
2. WHEN the sidebar is hidden, THE TopHeader SHALL display a hamburger menu button
3. WHEN a user clicks the hamburger menu, THE AppShell SHALL display the MainSidebar as an overlay
4. WHEN a user clicks outside the sidebar overlay, THE AppShell SHALL close the sidebar
5. THE AppShell SHALL use responsive spacing and font sizes appropriate for mobile devices

### Requirement 5: Route Organization and Migration

**User Story:** As a developer, I want all authenticated pages organized under a single route group, so that the layout is automatically applied and the codebase is maintainable.

#### Acceptance Criteria

1. THE application SHALL create a new `app/(app)/` route group for all authenticated pages
2. THE application SHALL migrate existing pages from root routes to the `(app)` route group
3. THE `(app)/layout.tsx` file SHALL render the AppShell component
4. THE application SHALL maintain existing URL paths without breaking changes
5. THE application SHALL preserve all existing page functionality during migration

### Requirement 6: Consistent Visual Design

**User Story:** As a creator, I want the platform to look professional and polished, so that I feel confident using it for my business.

#### Acceptance Criteria

1. THE AppShell SHALL use consistent color scheme matching the existing design system
2. THE AppShell SHALL support both light and dark themes
3. THE AppShell SHALL use smooth transitions for navigation and interactive elements
4. THE AppShell SHALL maintain consistent spacing using Tailwind CSS spacing scale
5. THE AppShell SHALL use consistent typography with defined font sizes and weights

### Requirement 7: Performance and Accessibility

**User Story:** As a creator, I want the navigation to be fast and accessible, so that I can efficiently use the platform regardless of my abilities.

#### Acceptance Criteria

1. THE AppShell SHALL render without blocking the main content loading
2. THE navigation items SHALL be keyboard accessible with proper focus indicators
3. THE navigation items SHALL include proper ARIA labels for screen readers
4. THE AppShell SHALL maintain 60fps animations and transitions
5. THE AppShell SHALL load in under 100ms on initial page render

### Requirement 8: State Management and Active Routes

**User Story:** As a creator, I want to see which page I'm currently on, so that I don't get lost while navigating.

#### Acceptance Criteria

1. WHEN a user is on a specific route, THE MainSidebar SHALL highlight the corresponding navigation item
2. THE AppShell SHALL detect the current route using Next.js pathname
3. THE active navigation item SHALL have distinct visual styling (background color, text color)
4. THE breadcrumb SHALL update automatically based on the current route
5. THE AppShell SHALL maintain active state when navigating between sub-pages of a section
