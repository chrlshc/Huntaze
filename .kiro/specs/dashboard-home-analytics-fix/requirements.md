# Requirements: Dashboard Home & Analytics Fix

## Overview

Fix critical issues with the Home page (outdated design, poor UX) and Analytics section (bugs, unclear sub-navigation). Establish clear section/sub-section navigation logic across the entire dashboard.

## Problem Statement

### Current Issues

1. **Home Page Problems**
   - Ancien design pas moderne
   - Stats cards design "dégueulasse" 
   - Pas assez d'informations utiles
   - Layout pas optimal
   - Manque de quick actions pertinentes

2. **Analytics Section Bugs**
   - Bugs dans la section analytics
   - Sub-navigation pas claire
   - Layout issues
   - Confusion entre page principale et sous-pages

3. **Navigation Logic**
   - Logique section/sous-section mal définie
   - Pas de cohérence entre les sections
   - Active states confus
   - Breadcrumbs manquants

## Requirements

### 1. Home Page Redesign

#### 1.1 Modern Design System
**Priority**: Critical
**Description**: Implement modern, clean design following Shopify-inspired system
- Use proper spacing, typography, colors
- Professional stat cards with better visual hierarchy
- Smooth animations and transitions
- Responsive grid layout

#### 1.2 Relevant Stats Display
**Priority**: Critical
**Description**: Show meaningful, actionable stats
- Revenue metrics (today, week, month)
- Fan engagement (messages, likes, comments)
- Content performance (posts, views, engagement rate)
- AI usage (messages sent, quota remaining)
- Platform-specific stats (OnlyFans, Instagram, TikTok)

#### 1.3 Quick Actions Hub
**Priority**: High
**Description**: Provide quick access to common actions
- Send message to fans
- Create new content
- View analytics
- Check notifications
- Manage subscriptions

#### 1.4 Platform Status Overview
**Priority**: High
**Description**: Show connection status for all platforms
- OnlyFans connection status
- Instagram connection status
- TikTok connection status
- Reddit connection status
- Last sync time for each

#### 1.5 Recent Activity Feed
**Priority**: Medium
**Description**: Display recent important activities
- New subscribers
- Messages received
- Content published
- Revenue milestones
- AI suggestions

### 2. Analytics Section Fix

#### 2.1 Clear Main Analytics Page
**Priority**: Critical
**Description**: Define clear purpose for `/analytics` main page
- Overview dashboard with key metrics
- Quick links to sub-sections
- Visual charts and graphs
- Time range selector (7d, 30d, 90d, all)

#### 2.2 Fix Sub-Navigation
**Priority**: Critical
**Description**: Implement clear sub-navigation for analytics
- Show sub-nav only when in analytics section
- Highlight active sub-page
- Consistent layout across all sub-pages
- Breadcrumbs for navigation context

#### 2.3 Fix Layout Bugs
**Priority**: Critical
**Description**: Resolve layout issues in analytics pages
- Fix overlapping elements
- Proper spacing and alignment
- Responsive design for all screen sizes
- Consistent card styling

#### 2.4 Define Sub-Pages Clearly
**Priority**: High
**Description**: Each sub-page has clear, distinct purpose
- `/analytics` - Overview dashboard
- `/analytics/pricing` - AI pricing recommendations
- `/analytics/churn` - Churn risk detection
- `/analytics/upsells` - Upsell automation
- `/analytics/forecast` - Revenue forecasting
- `/analytics/payouts` - Payout scheduling

### 3. Section/Sub-Section Navigation Logic

#### 3.1 Define Navigation Hierarchy
**Priority**: Critical
**Description**: Establish clear 3-level hierarchy
- **Level 1**: Main sections (Home, OnlyFans, Analytics, Marketing, Content)
- **Level 2**: Sub-sections (e.g., Analytics > Pricing)
- **Level 3**: Detail pages (e.g., Analytics > Pricing > Specific Fan)

#### 3.2 Active State Rules
**Priority**: Critical
**Description**: Clear rules for active states
- Main section active when any sub-page is active
- Sub-section highlighted when on that page
- Breadcrumbs show full path
- URL structure reflects hierarchy

#### 3.3 Sub-Navigation Display Logic
**Priority**: High
**Description**: When to show/hide sub-navigation
- Show sub-nav when in section with sub-pages
- Hide sub-nav when in section without sub-pages
- Collapsible on mobile
- Persistent on desktop

#### 3.4 Breadcrumb Navigation
**Priority**: High
**Description**: Implement breadcrumbs for context
- Show on all pages except Home
- Clickable path back to parent pages
- Auto-generated from route structure
- Consistent styling

### 4. Performance & UX

#### 4.1 Loading States
**Priority**: High
**Description**: Proper loading states for all data
- Skeleton screens for stats
- Loading spinners for actions
- Progressive loading for charts
- Error states with retry

#### 4.2 Error Handling
**Priority**: High
**Description**: Graceful error handling
- Error boundaries for each section
- Fallback UI for failed data
- Retry mechanisms
- User-friendly error messages

#### 4.3 Responsive Design
**Priority**: High
**Description**: Works on all screen sizes
- Mobile-first approach
- Tablet optimization
- Desktop full experience
- Touch-friendly interactions

#### 4.4 Performance Optimization
**Priority**: Medium
**Description**: Fast, smooth experience
- Lazy load heavy components
- Optimize images and assets
- Minimize re-renders
- Use React.memo where appropriate

## Success Criteria

### Home Page
- ✅ Modern, professional design
- ✅ All stats load within 2 seconds
- ✅ Quick actions work correctly
- ✅ Platform status accurate
- ✅ Responsive on all devices

### Analytics Section
- ✅ No layout bugs
- ✅ Sub-navigation clear and functional
- ✅ All sub-pages load correctly
- ✅ Charts and graphs display properly
- ✅ Time range selector works

### Navigation Logic
- ✅ Clear hierarchy established
- ✅ Active states work correctly
- ✅ Breadcrumbs show on all pages
- ✅ Sub-nav displays appropriately
- ✅ Consistent across all sections

## Non-Goals

- Redesigning other sections (OnlyFans, Marketing, Content)
- Adding new analytics features
- Changing routing structure
- Modifying API endpoints
- Adding new integrations

## Dependencies

- Existing routing structure from dashboard-routing-fix spec
- Design tokens and CSS variables
- Performance monitoring hooks
- Error boundary components
- Loading state components

## Timeline

- **Phase 1**: Home page redesign (2-3 hours)
- **Phase 2**: Analytics section fix (2-3 hours)
- **Phase 3**: Navigation logic implementation (1-2 hours)
- **Phase 4**: Testing and polish (1 hour)

**Total Estimated Time**: 6-9 hours

## Risks & Mitigation

### Risk 1: Breaking Existing Functionality
**Mitigation**: Incremental changes, thorough testing, keep old code as backup

### Risk 2: Performance Degradation
**Mitigation**: Use React.memo, lazy loading, performance monitoring

### Risk 3: Design Inconsistency
**Mitigation**: Follow existing design system, reuse components

### Risk 4: Mobile Experience Issues
**Mitigation**: Mobile-first development, test on real devices

## Acceptance Criteria

1. Home page has modern design with relevant stats
2. Analytics section has no bugs and clear sub-navigation
3. Section/sub-section logic is well-defined and consistent
4. All pages are responsive and performant
5. Error handling works correctly
6. Loading states are smooth
7. Navigation is intuitive and clear
8. Build succeeds without errors
9. All tests pass
10. Code is documented and maintainable
