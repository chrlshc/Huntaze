# Implementation Plan

- [x] 1. Create core layout infrastructure
  - Create `components/layout/` directory structure
  - Implement mobile sidebar state management with React context
  - Create base AppShell component with flex layout and responsive breakpoints
  - _Requirements: 1.1, 1.4, 1.5_

- [x] 1.1 Implement MobileSidebarContext
  - Create context provider with open/close/toggle methods
  - Add keyboard event listener for Escape key to close sidebar
  - Implement body scroll lock when mobile sidebar is open
  - _Requirements: 4.2, 4.3, 4.4_

- [x] 1.2 Create AppShell component
  - Build flex container with sidebar and main content areas
  - Integrate MobileSidebarContext provider
  - Add responsive classes for mobile/desktop layouts
  - Apply consistent background colors and minimum height
  - _Requirements: 1.1, 1.2, 1.4, 1.5_

- [x] 2. Build enhanced MainSidebar component
  - Refactor existing MainSidebar with expanded navigation items
  - Add navigation items for Messages, Fans, Schedule, Revenue, Marketing
  - Implement active route detection using usePathname hook
  - Add mobile overlay behavior with backdrop
  - _Requirements: 2.1, 2.2, 4.1, 4.3_

- [x] 2.1 Implement navigation item rendering
  - Create NavItem component with icon, label, and badge support
  - Add active state styling with background and text color changes
  - Implement hover states with smooth transitions
  - Add click handler to close mobile sidebar on navigation
  - _Requirements: 2.1, 2.2, 2.4, 8.1, 8.3_

- [x] 2.2 Add logo and branding section
  - Display Huntaze logo and tagline at top of sidebar
  - Make logo clickable to navigate to dashboard
  - Apply consistent spacing and typography
  - _Requirements: 2.3, 6.2, 6.5_

- [x] 2.3 Create upgrade call-to-action card
  - Build card component for bottom of sidebar
  - Show only for non-premium users based on user context
  - Add "Upgrade to Pro" button with link to pricing
  - Style with gradient background and compelling copy
  - _Requirements: 2.5_

- [x] 3. Implement TopHeader component
  - Create header bar with fixed height and sticky positioning
  - Add flex layout for left (breadcrumb) and right (actions) sections
  - Apply border bottom and backdrop blur styling
  - Ensure z-index allows header to stay above content
  - _Requirements: 3.1, 3.5, 6.1, 6.3_

- [x] 3.1 Build Breadcrumb component
  - Implement pathname parsing to generate breadcrumb items
  - Create formatSegment function to convert URL segments to labels
  - Render breadcrumb items with separator characters
  - Make non-last items clickable links, last item bold and non-clickable
  - Add truncation for mobile viewports
  - _Requirements: 3.1, 8.2, 8.4_

- [x] 3.2 Add mobile hamburger menu button
  - Create button component with hamburger icon (three lines)
  - Show only on mobile viewports using responsive classes
  - Connect to MobileSidebarContext toggle method
  - Add proper ARIA label for accessibility
  - Animate icon to X when sidebar is open
  - _Requirements: 4.2, 7.2, 7.3_

- [x] 4. Create header action components
  - Build container for right-side header actions
  - Implement consistent spacing between action items
  - Ensure proper alignment and sizing
  - _Requirements: 3.2, 3.3, 3.4_

- [x] 4.1 Implement NotificationBell component
  - Create bell icon button with badge for unread count
  - Add dropdown panel that opens on click
  - Fetch notifications from API or context
  - Display recent notifications in dropdown list
  - Add "Mark all as read" action and link to full notifications page
  - Close dropdown on outside click
  - _Requirements: 3.2, 7.2, 7.3_

- [x] 4.2 Integrate ThemeToggle component
  - Import existing ThemeToggle component
  - Position in header actions area
  - Ensure theme changes apply to AppShell components
  - Test light and dark mode styling
  - _Requirements: 3.3, 6.2_

- [x] 4.3 Create UserMenu component
  - Build avatar button with user initials or photo
  - Implement dropdown menu with profile, billing, preferences, help, sign out
  - Add icons to each menu item
  - Connect sign out action to auth flow
  - Add keyboard navigation support (arrow keys, Enter, Escape)
  - Close menu on outside click or Escape key
  - _Requirements: 3.4, 7.2, 7.3_

- [x] 5. Set up route group structure
  - Create `app/(app)/` directory for authenticated pages
  - Create `app/(app)/layout.tsx` that renders AppShell
  - Ensure layout wraps children prop correctly
  - Test that layout applies to all routes in group
  - _Requirements: 5.1, 5.3, 1.2_

- [x] 6. Migrate existing pages to (app) route group
  - Move dashboard pages from `app/(dashboard)/*` to `app/(app)/dashboard/*`
  - Move schedule page from `app/schedule` to `app/(app)/schedule`
  - Move analytics page from `app/analytics` to `app/(app)/analytics`
  - Move messages page from `app/creator/messages` to `app/(app)/messages`
  - Move fans pages from `app/fans` to `app/(app)/fans`
  - Move settings pages to `app/(app)/settings`
  - _Requirements: 5.2, 5.4, 5.5_

- [x] 6.1 Create placeholder pages for new sections
  - Create `app/(app)/revenue/page.tsx` with placeholder content
  - Create `app/(app)/marketing/page.tsx` with placeholder content
  - Add "Coming soon" messaging with brief description
  - Ensure pages render correctly with AppShell
  - _Requirements: 2.1, 5.2_

- [x] 6.2 Update internal navigation links
  - Search codebase for hardcoded links to migrated routes
  - Update Link href props to new paths (e.g., `/creator/messages` → `/messages`)
  - Test all navigation links work correctly
  - Verify no broken links remain
  - _Requirements: 5.4, 5.5_

- [ ] 7. Implement navigation badge system
  - Create API endpoint `/api/navigation/badges` to return badge counts
  - Implement React context or SWR hook to fetch and cache badge data
  - Connect badge data to MainSidebar navigation items
  - Add polling mechanism to refresh badges every 30 seconds
  - Handle loading and error states gracefully
  - _Requirements: 2.4_

- [ ] 8. Add responsive mobile behavior
  - Test sidebar overlay on mobile viewports
  - Verify backdrop appears and closes sidebar on click
  - Test hamburger menu button toggles sidebar
  - Ensure navigation closes sidebar after clicking link
  - Test touch interactions work smoothly
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 9. Apply consistent styling and theming
  - Audit all components for color consistency with design system
  - Implement dark mode styles for all AppShell components
  - Add smooth transitions to interactive elements (200ms duration)
  - Apply consistent spacing using Tailwind spacing scale
  - Ensure typography uses defined font sizes and weights
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 10. Optimize performance
  - Implement code splitting for dropdown components
  - Memoize expensive computations (breadcrumb generation, active route detection)
  - Ensure AppShell renders without blocking main content
  - Test that animations maintain 60fps
  - Measure and optimize initial render time to under 100ms
  - _Requirements: 7.1, 7.4_

- [ ] 11. Implement accessibility features
  - Add ARIA labels to all interactive elements
  - Ensure keyboard navigation works for all menus and dropdowns
  - Add visible focus indicators with proper contrast
  - Test with screen reader to verify announcements
  - Verify color contrast meets WCAG AA standards
  - Add skip navigation link for keyboard users
  - _Requirements: 7.2, 7.3_

- [ ] 12. Write component unit tests
  - Test AppShell renders children and manages mobile state
  - Test MainSidebar highlights active route correctly
  - Test Breadcrumb generates correct items from pathname
  - Test UserMenu opens/closes and handles sign out
  - Test NotificationBell displays badge and dropdown
  - Test MobileSidebarContext state management
  - _Requirements: All_

- [ ] 13. Create integration tests
  - Test navigation flow from Dashboard to Messages updates sidebar and breadcrumb
  - Test mobile menu opens, closes on backdrop click, and closes on navigation
  - Test theme toggle changes theme and persists preference
  - Test badge updates reflect in sidebar
  - _Requirements: All_

- [ ] 14. Perform visual regression testing
  - Capture screenshots of desktop layout with sidebar and header
  - Capture mobile layout with closed and open sidebar
  - Test dark mode variations
  - Test active and hover states
  - Compare against baseline to detect unintended changes
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 15. Conduct accessibility audit
  - Run automated accessibility tests with axe or Lighthouse
  - Manually test keyboard navigation through all interactive elements
  - Test with screen reader (VoiceOver or NVDA)
  - Verify focus management in dropdowns and mobile menu
  - Check color contrast ratios
  - _Requirements: 7.2, 7.3_

- [ ] 16. Final polish and deployment preparation
  - Review all components for visual consistency
  - Fix any remaining styling issues
  - Test on multiple browsers (Chrome, Firefox, Safari)
  - Test on multiple devices (desktop, tablet, mobile)
  - Update documentation with new route structure
  - Create migration guide for developers
  - _Requirements: All_
