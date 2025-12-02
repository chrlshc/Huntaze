# Implementation Plan: Dashboard Routing Simplification

## Overview
This plan implements a simplified 5-section navigation structure for the dashboard. Most pages already exist - we only need to create 3 OnlyFans pages and reorganize navigation.

## 🎯 Structure Finale - 5 Sections

### 🏠 Home
- **Route**: `/home`
- **Status**: ✅ Existe déjà
- **Features**: Stats overview, platform status, quick actions
- **AI Systems**: Performance monitoring

### 💙 OnlyFans  
- **Route principale**: `/onlyfans`
- **Sub-routes**:
  - `/onlyfans` - Overview dashboard ⚠️ À créer
  - `/onlyfans/messages` - Messages avec AI ⚠️ À créer
  - `/onlyfans/settings` - Paramètres ⚠️ À créer
  - `/onlyfans/fans` - ✅ Existe
  - `/onlyfans/ppv` - ✅ Existe
- **AI Systems**: Gemini AI, rate limiting, billing tracking

### 📊 Analytics
- **Route**: `/analytics`
- **Status**: ✅ Existe déjà
- **Sub-routes**:
  - `/analytics/pricing` - AI pricing recommendations
  - `/analytics/churn` - Churn risk detection
  - `/analytics/upsells` - Upsell automation
  - `/analytics/forecast` - Revenue forecasting
  - `/analytics/payouts` - Payout scheduling
- **AI Systems**: AI billing, performance monitoring, data integration

### 📢 Marketing
- **Route**: `/marketing`
- **Status**: ✅ Existe, à enrichir avec intégrations
- **Sub-routes**:
  - `/marketing/campaigns` - ✅ Existe
  - `/marketing/social` - ⚠️ À créer (fusionner /integrations + /social-marketing)
  - `/marketing/calendar` - ✅ Existe
- **AI Systems**: Knowledge network, data integration, content generation

### 🎨 Content
- **Route**: `/content`
- **Status**: ✅ Existe déjà
- **Features**: Multi-platform content creation, scheduling
- **AI Systems**: Gemini AI for content generation

## 🤖 Existing AI Systems & Integrations

The following systems are already integrated and functional:

### AI Core Systems
- **AI Billing** (`lib/ai/billing.ts`) - Monthly quota management, usage tracking
- **Gemini AI Service** (`lib/ai/gemini-client.ts`, `lib/ai/gemini.service.ts`) - AI content generation
- **Knowledge Network** (`lib/ai/knowledge-network.ts`) - AI knowledge management
- **Data Integration** (`lib/ai/data-integration.ts`) - Cross-platform data sync
- **Rate Limiting** (`lib/ai/rate-limit.ts`) - API rate limit management
- **Quota Management** (`lib/ai/quota.ts`) - Usage quota tracking

### Performance & Monitoring
- **Performance Monitoring** (`lib/monitoring/performance.ts`) - Real-time tracking
- **Diagnostics** (`lib/diagnostics/`) - Performance diagnostics
- **Web Vitals** (`lib/monitoring/WEB-VITALS-README.md`) - Core web vitals tracking

### Infrastructure
- **AWS Integration** (`lib/aws/`) - S3, CloudWatch, metrics
- **Database Optimizations** (`lib/database/`) - Cursor pagination, aggregations, N+1 prevention
- **Caching Systems** (`lib/cache/`) - API cache, stale-while-revalidate
- **Error Handling** (`lib/error-handling/`) - Graceful degradation

## 📋 Tasks

- [x] 1. Set up routing infrastructure and navigation components
  - Create unified navigation component with 5 main sections
  - Implement route resolution and active state management
  - Set up proper z-index hierarchy for overlays
  - _Requirements: 1.1, 1.2, 1.3, 2.1_

- [x]* 1.1 Write property test for route resolution
  - **Property 1: Route resolution consistency**
  - **Validates: Requirements 1.1**

- [x]* 1.2 Write property test for navigation active state
  - **Property 2: Navigation active state correctness**
  - **Validates: Requirements 1.2**

- [x]* 1.3 Write property test for z-index hierarchy
  - **Property 3: Z-index hierarchy preservation**
  - **Validates: Requirements 1.3**

- [ ] 2. Create OnlyFans section pages (3 pages à créer)

- [ ] 2.1 Create /onlyfans/page.tsx (main dashboard)
  - Implement OnlyFans overview with stats cards (messages, fans, PPV, revenue)
  - Add quick action buttons (Send Message, View Fans, Create PPV)
  - Show AI billing usage and quota status from `lib/ai/billing.ts`
  - Display performance metrics from `lib/monitoring/performance.ts`
  - Add connection status indicator
  - Include navigation to sub-pages (Messages, Fans, PPV, Settings)
  - Use `usePerformanceMonitoring` hook for tracking
  - Integrate with existing OnlyFans API connections
  - _Requirements: 3.1, 3.2_
  - _AI Systems: lib/ai/billing.ts, lib/monitoring/performance.ts_
  - _Reference: app/(app)/home/page.tsx for stats card patterns_

- [ ] 2.2 Create /onlyfans/messages/page.tsx
  - Implement messages interface with thread list and conversation view
  - Integrate Gemini AI for message suggestions via `lib/ai/gemini.service.ts`
  - Use rate limiting for AI requests via `lib/ai/rate-limit.ts`
  - Add AI-powered reply suggestions
  - Show message stats (sent, received, response rate)
  - Connect to existing message handling system
  - Use `ContentPageErrorBoundary` for error handling
  - Add loading states with `AsyncOperationWrapper`
  - _Requirements: 3.3, 3.4_
  - _AI Systems: lib/ai/gemini.service.ts, lib/ai/rate-limit.ts_
  - _Reference: app/(app)/messages/page.tsx for existing patterns_

- [ ] 2.3 Create /onlyfans/settings/page.tsx
  - Implement OnlyFans-specific settings and preferences
  - Show AI quota settings and usage via `lib/ai/quota.ts`
  - Add connection management (connect/disconnect OnlyFans)
  - Include notification preferences
  - Add automation settings (auto-reply, message templates)
  - Connect to user preferences system
  - Display billing information and plan details
  - _Requirements: 3.5_
  - _AI Systems: lib/ai/quota.ts, lib/ai/billing.ts_
  - _Reference: app/(app)/settings/page.tsx for settings patterns_

- [ ] 3. Integrate Marketing with Social Media

- [ ] 3.1 Enhance /marketing/page.tsx with integrations
  - Add "Social Media & Integrations" section to existing page
  - Display connected platforms (Instagram, TikTok, Reddit, OnlyFans)
  - Show integration cards from `/integrations` using `IntegrationCard` component
  - Display data integration status via `lib/ai/data-integration.ts`
  - Add "Manage Integrations" button linking to `/marketing/social`
  - Keep existing campaign management functionality
  - Update navigation to remove standalone integrations link
  - _Requirements: 4.1, 4.2_
  - _AI Systems: lib/ai/data-integration.ts_
  - _Reference: app/(app)/integrations/page.tsx for integration patterns_

- [ ] 3.2 Create /marketing/social/page.tsx
  - Implement social media management interface
  - Merge functionality from `/social-marketing` page
  - Show all connected social platforms with stats
  - Use `IntegrationCard` and `IntegrationIcon` components
  - Integrate with existing social platforms (Instagram, TikTok, Reddit)
  - Use knowledge network for content recommendations via `lib/ai/knowledge-network.ts`
  - Add post scheduling and analytics
  - Display engagement metrics per platform
  - _Requirements: 4.3_
  - _AI Systems: lib/ai/knowledge-network.ts, lib/integrations/_
  - _Reference: app/(app)/social-marketing/page.tsx, app/(app)/integrations/page.tsx_

- [ ] 4. Set up redirections

- [ ] 4.1 Create redirect from /messages to /onlyfans/messages
  - Update `/app/(app)/messages/page.tsx` to use Next.js `redirect()`
  - Add comment explaining redirect for backward compatibility
  - Update any internal links in components (search for `href="/messages"`)
  - Test redirect works correctly
  - _Requirements: 5.1_

- [ ] 4.2 Create redirect from /integrations to /marketing
  - Update `/app/(app)/integrations/page.tsx` to redirect to `/marketing`
  - Add comment explaining consolidation
  - Update any internal links in components (search for `href="/integrations"`)
  - Test redirect works correctly
  - _Requirements: 5.2_

- [ ] 4.3 Create redirect from /social-marketing to /marketing/social
  - Update `/app/(app)/social-marketing/page.tsx` to redirect
  - Add comment explaining new location
  - Update any internal links in components (search for `href="/social-marketing"`)
  - Test redirect works correctly
  - _Requirements: 5.3_

- [ ] 5. Update navigation component

- [ ] 5.1 Implement 5-section navigation structure
  - Update main navigation to show: Home, OnlyFans, Analytics, Marketing, Content
  - Remove standalone "Messages" and "Integrations" from main nav
  - Update active states and routing logic
  - Ensure proper highlighting for current section
  - Use consistent icons and styling
  - _Requirements: 2.1, 2.2, 2.3_
  - _Reference: components/Sidebar.tsx or main navigation component_

- [ ] 5.2 Add sub-navigation for sections with multiple pages
  - **OnlyFans sub-nav**: Overview, Messages, Fans, PPV, Settings
  - **Marketing sub-nav**: Campaigns, Social, Calendar
  - **Analytics sub-nav**: Overview, Pricing, Churn, Upsells, Forecast, Payouts
  - Show sub-nav only when in that section
  - Highlight active sub-page
  - Use collapsible/expandable pattern if needed
  - _Requirements: 2.4_

- [x] 6. Final checkpoint - Ensure all tests pass
  - Verify all routes work correctly
  - Test navigation active states
  - Confirm redirects function properly
  - Validate z-index hierarchy
  - Test AI system integrations on new pages
  - Verify performance monitoring is active
  - Check error boundaries work
  - Test on mobile and desktop
  - _Requirements: All_

## ⏱️ Estimated Time

- **Task 2.1** (OnlyFans overview): 1.5 hours
- **Task 2.2** (OnlyFans messages): 1.5 hours  
- **Task 2.3** (OnlyFans settings): 1 hour
- **Task 3.1** (Marketing integration): 1 hour
- **Task 3.2** (Marketing/Social page): 1 hour
- **Task 4** (Redirections): 30 minutes
- **Task 5** (Navigation): 1 hour
- **Task 6** (Testing): 30 minutes

**Total: 7-8 hours**

## 📝 Notes

- Most pages already exist and are functional
- AI systems are already integrated and working
- Focus is on creating 3 OnlyFans pages and reorganizing navigation
- All existing AI features (billing, monitoring, caching, etc.) should be leveraged in new pages
- Use existing component patterns from similar pages
- Maintain consistent styling with design tokens
- Ensure all pages use `ProtectedRoute` wrapper
- Add proper error boundaries with `ContentPageErrorBoundary`
- Use performance monitoring hooks on all new pages
