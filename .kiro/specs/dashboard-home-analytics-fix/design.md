# Design Document: Dashboard Home & Analytics Fix

## Overview

This design document outlines the technical approach to redesign the Home page, fix Analytics section bugs, and establish clear section/sub-section navigation logic across the dashboard.

## Architecture

### Current State Analysis

**Home Page Issues:**
- Outdated design with poor visual hierarchy
- Limited stats display (only 4 basic metrics)
- No quick actions or recent activity
- Platform status component exists but underutilized
- CSS uses old patterns, not following design system

**Analytics Section Issues:**
- Main `/analytics` page unclear purpose
- Sub-navigation not properly implemented
- Layout bugs with overlapping elements
- Inconsistent styling across sub-pages
- No breadcrumbs or navigation context

**Navigation Logic Issues:**
- Section/sub-section hierarchy not clearly defined
- Active states confusing
- No breadcrumbs
- Sub-nav shows/hides inconsistently

### Proposed Architecture

```
Dashboard Structure (3-Level Hierarchy)
├── Level 1: Main Sections (Sidebar)
│   ├── Home (no sub-sections)
│   ├── OnlyFans (has sub-sections)
│   ├── Analytics (has sub-sections)
│   ├── Marketing (has sub-sections)
│   └── Content (no sub-sections)
│
├── Level 2: Sub-Sections (Sub-nav bar)
│   ├── Analytics/
│   │   ├── Overview (main page)
│   │   ├── Pricing
│   │   ├── Churn
│   │   ├── Upsells
│   │   ├── Forecast
│   │   └── Payouts
│   │
│   ├── OnlyFans/
│   │   ├── Overview
│   │   ├── Messages
│   │   ├── Fans
│   │   ├── PPV
│   │   └── Settings
│   │
│   └── Marketing/
│       ├── Campaigns
│       ├── Social
│       └── Calendar
│
└── Level 3: Detail Pages (Breadcrumbs)
    └── e.g., Analytics > Pricing > Fan Details
```

## Components and Interfaces

### 1. Home Page Redesign

**Location:** `app/(app)/home/page.tsx`

**New Structure:**
```typescript
interface HomePageData {
  stats: HomeStats;
  quickActions: QuickAction[];
  platformStatus: PlatformConnection[];
  recentActivity: Activity[];
}

interface HomeStats {
  // Revenue metrics
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
  revenueTrend: number;
  
  // Fan engagement
  totalFans: number;
  activeFans: number;
  newFansToday: number;
  fansTrend: number;
  
  // Messages
  messagesReceived: number;
  messagesSent: number;
  responseRate: number;
  avgResponseTime: number; // minutes
  
  // Content
  postsThisWeek: number;
  totalViews: number;
  engagementRate: number;
  
  // AI Usage
  aiMessagesUsed: number;
  aiQuotaRemaining: number;
  aiQuotaTotal: number;
}

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  href: string;
  badge?: number;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

interface PlatformConnection {
  platform: 'onlyfans' | 'instagram' | 'tiktok' | 'reddit';
  isConnected: boolean;
  lastSync?: Date;
  status: 'active' | 'error' | 'disconnected';
  errorMessage?: string;
}

interface Activity {
  id: string;
  type: 'subscriber' | 'message' | 'content' | 'revenue' | 'ai';
  title: string;
  description: string;
  timestamp: Date;
  icon: string;
  color: string;
}
```

**Component Structure:**
```tsx
<HomePage>
  <PageHeader />
  
  <StatsGrid>
    <RevenueCard />
    <FansCard />
    <MessagesCard />
    <ContentCard />
    <AIUsageCard />
  </StatsGrid>
  
  <TwoColumnLayout>
    <LeftColumn>
      <QuickActionsHub />
      <RecentActivity />
    </LeftColumn>
    
    <RightColumn>
      <PlatformStatus />
      <UpcomingTasks />
    </RightColumn>
  </TwoColumnLayout>
</HomePage>
```

### 2. Analytics Section Fix

**Main Page:** `app/(app)/analytics/page.tsx`

**New Structure:**
```typescript
interface AnalyticsOverview {
  timeRange: '7d' | '30d' | '90d' | 'all';
  metrics: {
    totalRevenue: number;
    revenueTrend: number;
    avgRevenuePerFan: number;
    ltv: number;
    churnRate: number;
    activeSubscribers: number;
  };
  charts: {
    revenueOverTime: ChartData;
    fanGrowth: ChartData;
    engagementRate: ChartData;
  };
  quickLinks: AnalyticsQuickLink[];
}

interface AnalyticsQuickLink {
  title: string;
  description: string;
  href: string;
  icon: string;
  color: string;
  badge?: string;
}
```

**Component Structure:**
```tsx
<AnalyticsPage>
  <PageHeader>
    <Title />
    <TimeRangeSelector />
  </PageHeader>
  
  <SubNavigation items={analyticsSubPages} />
  
  <MetricsOverview />
  
  <ChartsGrid>
    <RevenueChart />
    <FanGrowthChart />
    <EngagementChart />
  </ChartsGrid>
  
  <QuickLinksGrid>
    <PricingLink />
    <ChurnLink />
    <UpsellsLink />
    <ForecastLink />
    <PayoutsLink />
  </QuickLinksGrid>
</AnalyticsPage>
```

### 3. Sub-Navigation Component

**Location:** `components/dashboard/SubNavigation.tsx`

**Interface:**
```typescript
interface SubNavigationProps {
  items: SubNavItem[];
  currentPath: string;
  basePath: string;
}

interface SubNavItem {
  label: string;
  href: string;
  icon?: string;
  badge?: number;
}
```

**Implementation:**
```tsx
export function SubNavigation({ items, currentPath, basePath }: SubNavigationProps) {
  return (
    <nav className="sub-navigation">
      <div className="sub-nav-container">
        {items.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'sub-nav-item',
              currentPath === item.href && 'active'
            )}
          >
            {item.icon && <Icon name={item.icon} />}
            <span>{item.label}</span>
            {item.badge && <Badge count={item.badge} />}
          </Link>
        ))}
      </div>
    </nav>
  );
}
```

### 4. Breadcrumb Component

**Location:** `components/dashboard/Breadcrumbs.tsx`

**Interface:**
```typescript
interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

interface BreadcrumbItem {
  label: string;
  href?: string;
}
```

**Implementation:**
```tsx
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="breadcrumbs">
      {items.map((item, index) => (
        <Fragment key={index}>
          {index > 0 && <ChevronRight className="separator" />}
          {item.href ? (
            <Link href={item.href} className="breadcrumb-link">
              {item.label}
            </Link>
          ) : (
            <span className="breadcrumb-current">{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
```

### 5. Navigation Logic Hook

**Location:** `hooks/useNavigationContext.ts`

**Interface:**
```typescript
interface NavigationContext {
  currentSection: string;
  currentSubSection?: string;
  breadcrumbs: BreadcrumbItem[];
  subNavItems?: SubNavItem[];
  showSubNav: boolean;
}

export function useNavigationContext(): NavigationContext {
  const pathname = usePathname();
  
  // Parse pathname to determine section/sub-section
  const segments = pathname.split('/').filter(Boolean);
  const currentSection = segments[0] || 'home';
  const currentSubSection = segments[1];
  
  // Determine if section has sub-navigation
  const sectionsWithSubNav = ['analytics', 'onlyfans', 'marketing'];
  const showSubNav = sectionsWithSubNav.includes(currentSection);
  
  // Generate breadcrumbs
  const breadcrumbs = generateBreadcrumbs(segments);
  
  // Get sub-nav items for current section
  const subNavItems = showSubNav ? getSubNavItems(currentSection) : undefined;
  
  return {
    currentSection,
    currentSubSection,
    breadcrumbs,
    subNavItems,
    showSubNav,
  };
}
```

## Data Models

### Home Stats API Response

```typescript
interface HomeStatsResponse {
  success: boolean;
  data: {
    revenue: {
      today: number;
      week: number;
      month: number;
      trend: number;
    };
    fans: {
      total: number;
      active: number;
      newToday: number;
      trend: number;
    };
    messages: {
      received: number;
      sent: number;
      responseRate: number;
      avgResponseTime: number;
    };
    content: {
      postsThisWeek: number;
      totalViews: number;
      engagementRate: number;
    };
    ai: {
      messagesUsed: number;
      quotaRemaining: number;
      quotaTotal: number;
    };
  };
  timestamp: string;
}
```

### Analytics Overview API Response

```typescript
interface AnalyticsOverviewResponse {
  success: boolean;
  data: {
    timeRange: string;
    metrics: {
      totalRevenue: number;
      revenueTrend: number;
      avgRevenuePerFan: number;
      ltv: number;
      churnRate: number;
      activeSubscribers: number;
    };
    charts: {
      revenueOverTime: Array<{ date: string; value: number }>;
      fanGrowth: Array<{ date: string; value: number }>;
      engagementRate: Array<{ date: string; value: number }>;
    };
  };
  timestamp: string;
}
```

## Correctness Properties

### Property 1: Home Stats Accuracy
*For any* authenticated user, the home stats should reflect their actual data from connected platforms within 5 minutes of the last sync.

**Validates: Requirements 1.2**

### Property 2: Sub-Navigation Visibility
*For any* section with sub-pages, the sub-navigation should be visible when on any page within that section.

**Validates: Requirements 3.3**

### Property 3: Active State Consistency
*For any* current route, exactly one main section and at most one sub-section should be marked as active.

**Validates: Requirements 3.2**

### Property 4: Breadcrumb Accuracy
*For any* page except Home, breadcrumbs should show the complete path from Home to the current page.

**Validates: Requirements 3.4**

### Property 5: Analytics Layout Integrity
*For any* analytics sub-page, the layout should not have overlapping elements or broken styling.

**Validates: Requirements 2.3**

### Property 6: Responsive Behavior
*For any* viewport width, the layout should adapt appropriately without horizontal scrolling or broken elements.

**Validates: Requirements 4.3**

### Property 7: Loading State Completeness
*For any* async data fetch, a loading state should be shown until data is available or an error occurs.

**Validates: Requirements 4.1**

### Property 8: Error Recovery
*For any* failed API request, the UI should show an error message with a retry option.

**Validates: Requirements 4.2**

## Design System

### Color Palette

```css
/* Primary Colors */
--color-primary: #6366f1; /* Indigo */
--color-primary-hover: #4f46e5;
--color-primary-light: #eef2ff;

/* Status Colors */
--color-success: #22c55e;
--color-warning: #f59e0b;
--color-error: #ef4444;
--color-info: #3b82f6;

/* Neutral Colors */
--color-bg-main: #ffffff;
--color-bg-surface: #f9fafb;
--color-bg-hover: #f3f4f6;
--color-border: #e5e7eb;
--color-text-main: #111827;
--color-text-sub: #6b7280;
--color-text-muted: #9ca3af;
```

### Typography

```css
/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Spacing

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
```

### Border Radius

```css
--radius-sm: 0.375rem;  /* 6px */
--radius-md: 0.5rem;    /* 8px */
--radius-lg: 0.75rem;   /* 12px */
--radius-xl: 1rem;      /* 16px */
```

### Shadows

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
```

## Performance Considerations

### 1. Code Splitting
- Lazy load chart components
- Lazy load heavy analytics visualizations
- Dynamic imports for non-critical features

### 2. Data Fetching
- Use SWR for client-side data fetching
- Implement stale-while-revalidate pattern
- Cache API responses appropriately
- Prefetch data for likely next pages

### 3. Rendering Optimization
- Use React.memo for expensive components
- Implement virtual scrolling for long lists
- Debounce search and filter inputs
- Optimize re-renders with useMemo/useCallback

### 4. Asset Optimization
- Optimize images with next/image
- Use SVG icons instead of icon fonts
- Minimize CSS bundle size
- Tree-shake unused code

## Testing Strategy

### Unit Tests
- Test navigation context hook
- Test breadcrumb generation
- Test sub-nav visibility logic
- Test active state calculation

### Integration Tests
- Test home page data loading
- Test analytics page navigation
- Test sub-nav interactions
- Test breadcrumb navigation

### Visual Regression Tests
- Test home page layout
- Test analytics page layout
- Test responsive breakpoints
- Test loading states

### Property-Based Tests
- Test navigation hierarchy consistency
- Test active state uniqueness
- Test breadcrumb path accuracy
- Test responsive layout integrity

## Migration Strategy

### Phase 1: Home Page Redesign
1. Create new home page components
2. Implement new stats API endpoint
3. Update home page styling
4. Test and validate

### Phase 2: Analytics Fix
1. Fix analytics main page
2. Implement sub-navigation
3. Fix layout bugs
4. Test all sub-pages

### Phase 3: Navigation Logic
1. Create navigation context hook
2. Implement breadcrumbs
3. Update sidebar active states
4. Test navigation flow

### Phase 4: Polish & Deploy
1. Performance optimization
2. Accessibility improvements
3. Final testing
4. Deploy to production

## Rollback Plan

If issues are detected:
1. Revert to previous version
2. Investigate root cause
3. Fix in development
4. Re-test thoroughly
5. Re-deploy with fixes

## Monitoring

Post-deployment monitoring:
- Track page load times
- Monitor error rates
- Check navigation patterns
- Verify API response times
- Monitor user feedback
