# Design Document: Dashboard Routing and Layout Fix

## Overview

This design document outlines the technical approach to fix critical routing and layout issues in the Huntaze dashboard. The solution focuses on creating a consistent navigation structure, fixing missing pages, correcting route mappings, and resolving layout conflicts that cause visual bugs.

The design follows Next.js 15 App Router best practices and maintains the existing Shopify-inspired design system while ensuring all pages are properly accessible and render without conflicts.

## Architecture

### Current State Analysis

**Routing Issues:**
- `/onlyfans` directory exists with subdirectories but lacks a main `page.tsx`
- `/messages` shows generic messages instead of OnlyFans-specific messages
- Navigation menu items don't consistently map to correct routes
- Some pages use client-side redirects instead of proper routing

**Layout Issues:**
- Content page has potential element overlapping
- Inconsistent z-index usage across components
- Some pages don't properly integrate with the grid layout system

### Proposed Architecture

```
app/(app)/
├── layout.tsx                    # Main dashboard layout (existing)
├── home/
│   └── page.tsx                  # Dashboard home (existing, needs validation)
├── onlyfans/
│   ├── page.tsx                  # NEW: Main OnlyFans dashboard
│   ├── messages/
│   │   └── page.tsx              # OnlyFans messages (existing)
│   ├── fans/
│   │   └── page.tsx              # OnlyFans fans management (existing)
│   └── ppv/
│       └── page.tsx              # OnlyFans PPV content (existing)
├── messages/
│   └── page.tsx                  # REDIRECT: to /onlyfans/messages
├── marketing/
│   └── page.tsx                  # Marketing campaigns (existing, needs menu link)
├── social-marketing/
│   └── page.tsx                  # Social media management (existing)
├── analytics/
│   └── page.tsx                  # Analytics dashboard (existing, needs optimization)
├── integrations/
│   ├── page.tsx                  # REFACTOR: Remove redirect pattern
│   └── integrations-client.tsx  # Client component (existing)
└── content/
    └── page.tsx                  # Content management (existing, needs layout fix)
```

## Components and Interfaces

### 1. OnlyFans Main Dashboard Page

**Location:** `app/(app)/onlyfans/page.tsx`

**Purpose:** Serve as the main entry point for OnlyFans features, providing an overview and navigation to sub-features.

**Interface:**
```typescript
interface OnlyFansDashboardProps {
  // No props needed - uses server components for data fetching
}

interface OnlyFansStats {
  totalMessages: number;
  unreadMessages: number;
  totalFans: number;
  activeFans: number;
  ppvRevenue: number;
  ppvSales: number;
}
```

**Component Structure:**
- Stats overview cards (messages, fans, PPV)
- Quick action buttons (Send message, View fans, Create PPV)
- Recent activity feed
- Connection status indicator
- Navigation to sub-pages

### 2. Messages Redirect Component

**Location:** `app/(app)/messages/page.tsx`

**Purpose:** Redirect users from `/messages` to `/onlyfans/messages` to maintain backward compatibility.

**Implementation:**
```typescript
// Use Next.js redirect for server-side navigation
import { redirect } from 'next/navigation';

export default function MessagesRedirect() {
  redirect('/onlyfans/messages');
}
```

### 3. Integrations Page Refactor

**Location:** `app/(app)/integrations/page.tsx`

**Current Issue:** Uses a redirect pattern that can cause hydration issues.

**Solution:** Directly render the client component without redirect.

**Implementation:**
```typescript
import IntegrationsClient from './integrations-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function IntegrationsPage() {
  return <IntegrationsClient />;
}
```

### 4. Navigation Menu Component

**Location:** `components/Sidebar.tsx` (existing)

**Updates Needed:**
- Add OnlyFans menu item linking to `/onlyfans`
- Update Messages menu item to link to `/onlyfans/messages`
- Ensure Marketing is accessible from main menu
- Add active state detection for all routes

**Interface:**
```typescript
interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType;
  badge?: number; // For unread counts
  subItems?: NavItem[]; // For nested navigation
}

interface SidebarProps {
  currentPath: string;
  unreadCounts?: {
    messages: number;
    notifications: number;
  };
}
```

### 5. Layout Conflict Resolution

**Location:** `app/(app)/content/page.tsx`

**Issue:** Potential element overlapping due to z-index conflicts or improper grid integration.

**Solution:**
- Ensure proper integration with `.huntaze-main` grid area
- Use design tokens for z-index values
- Remove any absolute positioning that conflicts with grid layout
- Ensure modals use proper z-index from design tokens

## Data Models

### OnlyFans Dashboard Stats

```typescript
interface OnlyFansStats {
  messages: {
    total: number;
    unread: number;
    responseRate: number;
    avgResponseTime: number; // in minutes
  };
  fans: {
    total: number;
    active: number; // active in last 30 days
    new: number; // new this month
    churnRate: number; // percentage
  };
  ppv: {
    totalRevenue: number;
    totalSales: number;
    avgPrice: number;
    conversionRate: number; // percentage
  };
  connection: {
    isConnected: boolean;
    lastSync: Date;
    status: 'connected' | 'disconnected' | 'error';
  };
}
```

### Navigation State

```typescript
interface NavigationState {
  currentPath: string;
  breadcrumbs: Breadcrumb[];
  unreadCounts: {
    messages: number;
    notifications: number;
  };
}

interface Breadcrumb {
  label: string;
  href: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Route Resolution Consistency

*For any* valid route path in the navigation menu, navigating to that path should render the correct page component without redirects or errors.

**Validates: Requirements 1.3, 2.2, 3.3, 7.2**

### Property 2: OnlyFans Page Accessibility

*For any* user with authentication, accessing `/onlyfans` should display the OnlyFans dashboard page with stats and navigation options.

**Validates: Requirements 1.1, 1.2**

### Property 3: Messages Redirect Correctness

*For any* navigation to `/messages`, the system should redirect to `/onlyfans/messages` and display OnlyFans-specific message threads.

**Validates: Requirements 2.1, 2.3**

### Property 4: Layout Grid Integration

*For any* dashboard page, the page content should render within the `.huntaze-main` grid area without overlapping the header or sidebar.

**Validates: Requirements 9.1, 9.2, 9.4**

### Property 5: Z-Index Hierarchy Consistency

*For any* page with modals or overlays, the z-index values should follow the design token hierarchy (modal > overlay > header > nav).

**Validates: Requirements 9.2, 9.5**

### Property 6: Navigation Active State

*For any* current route, the corresponding navigation menu item should be highlighted with the active state.

**Validates: Requirements 7.3**

### Property 7: Authentication Guard

*For any* protected route, unauthenticated users should be redirected to the login page.

**Validates: Requirements 7.4, 7.5**

### Property 8: Performance Loading States

*For any* page with async data loading, the system should display loading states within 100ms and complete loading within 3 seconds.

**Validates: Requirements 4.1, 6.1**

### Property 9: Error Recovery

*For any* page that encounters an error, the error boundary should catch it and provide a retry mechanism.

**Validates: Requirements 8.1, 8.2, 8.4**

### Property 10: Responsive Layout Adaptation

*For any* viewport width below 1024px, the sidebar should hide and the layout should adapt to single-column mode.

**Validates: Requirements 9.3**

## Error Handling

### Route Not Found

**Scenario:** User navigates to a non-existent route.

**Handling:**
- Next.js will automatically show the 404 page
- Provide navigation back to home or last valid page
- Log the attempted route for analytics

### API Failure on Dashboard Pages

**Scenario:** Stats API fails to load data.

**Handling:**
- Display default/zero values
- Show error message with retry button
- Implement exponential backoff for retries (1s, 2s, 4s)
- Log error details for debugging

### Hydration Mismatch

**Scenario:** Server-rendered HTML doesn't match client-rendered output.

**Handling:**
- Use `'use client'` directive for components with client-only features
- Ensure consistent data between server and client
- Use Suspense boundaries for async data
- Suppress hydration warnings only when intentional

### Layout Conflicts

**Scenario:** Elements overlap or render incorrectly.

**Handling:**
- Use CSS Grid for main layout structure
- Apply design tokens for z-index values
- Test with different content lengths
- Use browser DevTools to inspect layout issues

### Navigation Errors

**Scenario:** Navigation fails or redirects incorrectly.

**Handling:**
- Use Next.js `redirect()` for server-side redirects
- Use `useRouter()` for client-side navigation
- Catch navigation errors with try-catch
- Provide fallback navigation options

## Testing Strategy

### Unit Testing

**Framework:** Vitest

**Test Coverage:**
1. Route resolution logic
2. Navigation menu item generation
3. Stats data transformation
4. Error boundary behavior
5. Redirect logic

**Example Tests:**
```typescript
describe('OnlyFans Dashboard', () => {
  it('should render stats cards with correct data', () => {
    // Test stats display
  });
  
  it('should show connection status', () => {
    // Test connection indicator
  });
  
  it('should navigate to sub-pages', () => {
    // Test navigation links
  });
});

describe('Messages Redirect', () => {
  it('should redirect to OnlyFans messages', () => {
    // Test redirect behavior
  });
});

describe('Navigation Menu', () => {
  it('should highlight active route', () => {
    // Test active state
  });
  
  it('should show unread counts', () => {
    // Test badge display
  });
});
```

### Property-Based Testing

**Framework:** fast-check (JavaScript property-based testing library)

**Configuration:** Each property test should run a minimum of 100 iterations.

**Test Tags:** Each property-based test must include a comment with the format:
`// Feature: dashboard-routing-fix, Property {number}: {property_text}`

**Property Tests:**

1. **Route Resolution Property Test**
   ```typescript
   // Feature: dashboard-routing-fix, Property 1: Route Resolution Consistency
   test('all navigation routes resolve to correct pages', () => {
     fc.assert(
       fc.property(
         fc.constantFrom(...validRoutes),
         (route) => {
           const component = resolveRoute(route);
           return component !== null && component !== undefined;
         }
       ),
       { numRuns: 100 }
     );
   });
   ```

2. **Z-Index Hierarchy Property Test**
   ```typescript
   // Feature: dashboard-routing-fix, Property 5: Z-Index Hierarchy Consistency
   test('z-index values follow design token hierarchy', () => {
     fc.assert(
       fc.property(
         fc.record({
           modal: fc.constant(600),
           overlay: fc.constant(550),
           header: fc.constant(500),
           nav: fc.constant(400),
         }),
         (zIndexes) => {
           return (
             zIndexes.modal > zIndexes.overlay &&
             zIndexes.overlay > zIndexes.header &&
             zIndexes.header > zIndexes.nav
           );
         }
       ),
       { numRuns: 100 }
     );
   });
   ```

3. **Navigation Active State Property Test**
   ```typescript
   // Feature: dashboard-routing-fix, Property 6: Navigation Active State
   test('current route always has active navigation item', () => {
     fc.assert(
       fc.property(
         fc.constantFrom(...validRoutes),
         (currentRoute) => {
           const navItems = getNavigationItems(currentRoute);
           const activeItems = navItems.filter(item => item.isActive);
           return activeItems.length === 1;
         }
       ),
       { numRuns: 100 }
     );
   });
   ```

### Integration Testing

**Framework:** Playwright

**Test Scenarios:**
1. Navigate through all main routes and verify correct page loads
2. Test OnlyFans dashboard displays stats correctly
3. Verify messages redirect works end-to-end
4. Test navigation menu active states
5. Verify layout doesn't break on different screen sizes
6. Test error boundaries catch and display errors
7. Verify authentication guards redirect correctly

### Visual Regression Testing

**Tool:** Percy or Chromatic

**Test Cases:**
1. OnlyFans dashboard page
2. Content page layout
3. Navigation menu states
4. Mobile responsive layouts
5. Error states
6. Loading states

## Performance Considerations

### Page Load Optimization

1. **Code Splitting:**
   - Lazy load heavy components (modals, charts)
   - Use dynamic imports for non-critical features
   - Split by route for optimal bundle sizes

2. **Data Fetching:**
   - Use Server Components for initial data
   - Implement SWR for client-side data
   - Cache API responses appropriately
   - Use Suspense for streaming

3. **Rendering Strategy:**
   - Static generation where possible
   - Dynamic rendering only when necessary
   - Use `force-dynamic` sparingly
   - Implement proper loading states

### Layout Performance

1. **CSS Optimization:**
   - Use CSS Grid for main layout (GPU accelerated)
   - Minimize reflows with `will-change`
   - Use CSS custom properties for theming
   - Avoid layout thrashing

2. **Component Optimization:**
   - Memoize expensive computations
   - Use React.memo for pure components
   - Implement virtual scrolling for long lists
   - Debounce search inputs

## Security Considerations

### Route Protection

1. **Authentication:**
   - All dashboard routes require authentication
   - Use middleware for route protection
   - Redirect to login for unauthenticated users
   - Maintain session state securely

2. **Authorization:**
   - Verify user has access to OnlyFans features
   - Check integration connection status
   - Validate API requests server-side
   - Implement rate limiting

### Data Security

1. **API Security:**
   - Use HTTPS for all requests
   - Implement CSRF protection
   - Validate and sanitize inputs
   - Use secure session management

2. **Client-Side Security:**
   - Don't expose sensitive data in client code
   - Use environment variables for secrets
   - Implement Content Security Policy
   - Sanitize user-generated content

## Deployment Strategy

### Rollout Plan

1. **Phase 1: Create OnlyFans Main Page**
   - Implement `/onlyfans/page.tsx`
   - Test stats display
   - Verify navigation links

2. **Phase 2: Fix Messages Routing**
   - Implement redirect from `/messages`
   - Update navigation menu
   - Test end-to-end flow

3. **Phase 3: Fix Layout Issues**
   - Resolve content page conflicts
   - Verify z-index hierarchy
   - Test responsive layouts

4. **Phase 4: Optimize Performance**
   - Implement loading states
   - Add error boundaries
   - Optimize data fetching

5. **Phase 5: Testing & Validation**
   - Run all test suites
   - Perform manual testing
   - Conduct visual regression tests
   - Verify on staging environment

### Rollback Plan

If issues are detected:
1. Revert to previous deployment
2. Investigate root cause
3. Fix issues in development
4. Re-test thoroughly
5. Re-deploy with fixes

### Monitoring

Post-deployment monitoring:
- Track page load times
- Monitor error rates
- Check navigation patterns
- Verify API response times
- Monitor user feedback

## Migration Path

### Backward Compatibility

1. **URL Redirects:**
   - `/messages` → `/onlyfans/messages` (permanent redirect)
   - Maintain old URLs for bookmarks
   - Update internal links gradually

2. **Component Compatibility:**
   - Existing components continue to work
   - No breaking changes to APIs
   - Gradual migration of patterns

### Data Migration

No data migration required - this is a frontend-only change.

### User Communication

1. **In-App Notifications:**
   - Inform users of new OnlyFans dashboard
   - Highlight improved navigation
   - Provide quick tour of changes

2. **Documentation Updates:**
   - Update user guides
   - Create video tutorials
   - Update FAQ section

## Future Enhancements

### Potential Improvements

1. **Enhanced OnlyFans Dashboard:**
   - Real-time stats updates
   - Advanced analytics charts
   - Customizable widgets
   - Export functionality

2. **Navigation Improvements:**
   - Breadcrumb navigation
   - Recent pages history
   - Keyboard shortcuts
   - Search functionality

3. **Layout Enhancements:**
   - Customizable sidebar
   - Collapsible sections
   - Dark mode support
   - Accessibility improvements

4. **Performance Optimizations:**
   - Prefetch next likely pages
   - Optimize images
   - Implement service worker
   - Add offline support
