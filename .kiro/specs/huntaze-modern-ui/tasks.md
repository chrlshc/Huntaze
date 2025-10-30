# Implementation Plan

- [ ] 1. Setup project foundation and design system (Next.js 15)
- [x] 1.1 Upgrade to Next.js 15 and configure next.config.ts
  - Run upgrade codemod: `npx @next/codemod@canary upgrade latest`
  - Create next.config.ts with serverExternalPackages for Prisma
  - Add bundlePagesRouterDependencies: true
  - Verify Node.js 20+ in Amplify build settings
  - _Requirements: 10.1_

- [ ] 1.2 Setup Auth.js v5 (NextAuth v5)
  - Install next-auth@^5
  - Create auth.ts at root with auth() export
  - Create app/api/auth/[...nextauth]/route.ts
  - Configure providers and session strategy
  - _Requirements: 12.1, 12.2_

- [ ] 1.3 Add instrumentation.ts for observability
  - Create instrumentation.ts with onRequestError
  - Setup error logging to CloudWatch/Sentry
  - Add register() for tracer initialization
  - _Requirements: 11.5_

- [x] 1.4 Configure Tailwind CSS with custom theme and design tokens
  - Add custom colors, typography, and spacing to tailwind.config.ts
  - Configure dark mode support
  - _Requirements: 1.4, 9.4, 10.1_

- [ ] 1.5 Install and configure shadcn/ui components
  - Initialize shadcn/ui
  - Add base components (button, card, dialog, form, table, input, select, toast)
  - _Requirements: 1.1, 11.1_

- [ ] 1.6 Setup global state management with Zustand
  - Create stores for user, UI, and notifications
  - Implement persistence for theme and sidebar state
  - _Requirements: 9.4, 1.2_

- [ ] 1.7 Configure React Query for data fetching
  - Setup QueryClient with default options
  - Create API client with error handling
  - Handle async cookies/headers in API calls
  - _Requirements: 2.5, 11.1_

- [ ] 2. Implement authentication and layout structure
- [ ] 2.1 Create authentication pages and flow with Auth.js v5
  - Build login page with form validation
  - Use auth() wrapper for session management
  - Add middleware.ts for protected routes
  - Handle async params in auth routes
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [ ] 2.2 Build main application layout with sidebar
  - Create Sidebar component with navigation items
  - Implement collapsible sidebar with animations
  - Add mobile hamburger menu
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2.3 Create header bar with user menu
  - Build Header component with breadcrumbs
  - Add notification bell with dropdown
  - Implement theme toggle
  - Create user profile dropdown menu
  - _Requirements: 1.4, 9.4_

- [ ] 2.4 Implement responsive layout system
  - Configure breakpoints and responsive utilities
  - Test layout on mobile, tablet, and desktop
  - _Requirements: 1.5, 10.2_

- [ ] 3. Build dashboard page and components
- [ ] 3.1 Create metric cards component
  - Build MetricCard with icon, value, and trend
  - Add sparkline charts using Recharts
  - Implement loading skeleton states
  - _Requirements: 2.1, 10.5_

- [ ] 3.2 Implement revenue chart component
  - Create RevenueChart with Recharts area chart
  - Add date range selector
  - Implement interactive tooltips
  - _Requirements: 2.2_

- [ ] 3.3 Build recent activity feed
  - Create activity list component
  - Add status indicators and timestamps
  - Implement real-time updates
  - _Requirements: 2.3_

- [ ] 3.4 Add quick action buttons
  - Create action button grid
  - Link to common tasks (new message, new campaign)
  - _Requirements: 2.4_

- [ ] 3.5 Integrate dashboard API and implement auto-refresh
  - Connect to backend metrics API
  - Setup polling for real-time updates
  - _Requirements: 2.5_

- [ ] 4. Implement OnlyFans messaging interface
- [ ] 4.1 Create messages list page with async params
  - Build MessageList component with search and filters
  - Add pagination
  - Implement message status badges
  - Handle async searchParams
  - _Requirements: 3.1, 3.5_

- [ ] 4.2 Build message composer modal
  - Create MessageComposer form with Zod validation
  - Add rich text editor
  - Implement media attachment with preview
  - Add template selector
  - _Requirements: 3.2_

- [ ] 4.3 Integrate with rate limiter API (Next.js 15)
  - Connect to /api/onlyfans/messages/send (protected with auth())
  - Add export const runtime = 'nodejs' to API route
  - Handle queue status responses
  - Display estimated send time
  - Handle async cookies/headers if needed
  - _Requirements: 3.3, 3.4_

- [ ] 4.4 Implement message status tracking
  - Create MessageStatus component
  - Add real-time status updates via polling
  - Implement retry functionality for failed messages
  - _Requirements: 3.5_

- [ ] 5. Build marketing campaigns management
- [ ] 5.1 Create campaigns list page with table
  - Build CampaignTable with sortable columns
  - Add search and filter functionality
  - Implement bulk actions
  - Add pagination
  - _Requirements: 4.1_

- [ ] 5.2 Implement campaign creation wizard
  - Create multi-step CampaignForm (4 steps)
  - Add progress indicator
  - Implement form validation with Zod
  - Add preview mode
  - _Requirements: 4.2, 4.3_

- [ ] 5.3 Build campaign detail page with analytics
  - Create CampaignAnalytics component
  - Display metrics (open rate, click rate, conversions)
  - Add charts for performance visualization
  - _Requirements: 4.4_

- [ ] 5.4 Integrate with campaigns API
  - Connect to backend campaign service
  - Implement create, update, delete operations
  - Add pause/resume functionality
  - _Requirements: 4.5_

- [ ] 6. Implement content library management
- [ ] 6.1 Create media grid with lazy loading
  - Build MediaGrid component with masonry layout
  - Implement lazy loading with intersection observer
  - Add multi-select functionality
  - _Requirements: 5.1, 10.4_

- [ ] 6.2 Build upload zone with drag-and-drop
  - Create UploadZone component
  - Implement drag-and-drop functionality
  - Add file validation and progress bars
  - Generate thumbnails
  - _Requirements: 5.2, 5.3_

- [ ] 6.3 Implement media organization features
  - Add folder structure
  - Create tagging system
  - Build search functionality
  - _Requirements: 5.5_

- [ ] 6.4 Integrate with S3 storage API
  - Connect to content library backend
  - Implement upload to S3
  - Handle CDN URLs
  - _Requirements: 5.3, 5.4_

- [ ] 7. Build AI content generation interface
- [ ] 7.1 Create content generator form
  - Build ContentGenerator component
  - Add parameter selection (type, tone, length)
  - Implement keyword input
  - _Requirements: 6.1_

- [ ] 7.2 Implement generation and result display
  - Connect to AI content generation API
  - Add loading states with animations
  - Display generated content with edit capability
  - Add copy and regenerate buttons
  - _Requirements: 6.2, 6.3_

- [ ] 7.3 Build generation history sidebar
  - Create history list component
  - Implement prompt reuse functionality
  - _Requirements: 6.5_

- [ ] 7.4 Add save to content library
  - Implement save functionality
  - Connect to content library API
  - _Requirements: 6.4_

- [ ] 8. Implement interactive AI chatbot
- [ ] 8.1 Create chat interface layout
  - Build ChatInterface component
  - Create message bubble components
  - Implement auto-scroll functionality
  - _Requirements: 7.1, 7.4_

- [ ] 8.2 Implement WebSocket connection for streaming
  - Setup WebSocket client
  - Handle connection lifecycle
  - Implement message streaming
  - _Requirements: 7.2_

- [ ] 8.3 Add typing indicator and markdown rendering
  - Create typing indicator animation
  - Implement markdown rendering for AI responses
  - _Requirements: 7.3_

- [ ] 8.4 Implement chat history and context management
  - Add session persistence
  - Create new conversation functionality
  - _Requirements: 7.5_

- [ ] 9. Build analytics and reporting dashboard
- [ ] 9.1 Create analytics page layout
  - Build AnalyticsDashboard component
  - Add date range picker
  - Implement metric cards
  - _Requirements: 8.1_

- [ ] 9.2 Implement interactive charts
  - Create revenue chart
  - Add engagement chart
  - Build growth metrics visualization
  - _Requirements: 8.1_

- [ ] 9.3 Add comparison mode
  - Implement period comparison
  - Display comparison metrics
  - _Requirements: 8.3_

- [ ] 9.4 Implement data export functionality
  - Add CSV export
  - Add PDF report generation
  - _Requirements: 8.4_

- [ ] 9.5 Setup real-time metrics updates
  - Implement auto-refresh
  - Add manual refresh button
  - _Requirements: 8.5_

- [ ] 10. Implement settings and preferences
- [ ] 10.1 Create settings page with tabs
  - Build Settings layout with tab navigation
  - Create Profile, Preferences, Integrations, Billing tabs
  - _Requirements: 9.1_

- [ ] 10.2 Build profile settings form
  - Create profile form with validation
  - Implement avatar upload
  - Add save functionality
  - _Requirements: 9.2_

- [ ] 10.3 Implement preferences panel
  - Add theme selector
  - Create notification preferences
  - Add language selector
  - _Requirements: 9.4_

- [ ] 10.4 Build integrations management
  - Create integration cards
  - Implement OAuth flow for connections
  - Display connection status
  - _Requirements: 9.3_

- [ ] 11. Implement error handling and user feedback
- [ ] 11.1 Create toast notification system
  - Setup toast provider
  - Implement success, error, warning, info toasts
  - Add auto-dismiss functionality
  - _Requirements: 11.1, 11.4_

- [ ] 11.2 Build error boundary component
  - Create ErrorBoundary wrapper
  - Add fallback UI
  - Implement error logging
  - _Requirements: 11.1_

- [ ] 11.3 Implement loading states
  - Add button loading states
  - Create skeleton loaders
  - Implement page loading indicators
  - _Requirements: 11.2, 10.5_

- [ ] 11.4 Add retry functionality for failed requests
  - Implement retry button in error states
  - Add automatic retry with exponential backoff
  - _Requirements: 11.3_

- [ ] 12. Performance optimization and polish
- [ ] 12.1 Implement code splitting and lazy loading
  - Add dynamic imports for heavy components
  - Implement route-based code splitting
  - Add lazy loading for images
  - _Requirements: 10.1, 10.4_

- [ ] 12.2 Optimize bundle size
  - Analyze bundle with webpack-bundle-analyzer
  - Remove unused dependencies
  - Implement tree shaking
  - _Requirements: 10.1_

- [ ] 12.3 Add animations and transitions
  - Implement Framer Motion animations
  - Add page transitions
  - Create micro-interactions
  - _Requirements: 1.1_

- [ ] 12.4 Implement accessibility features
  - Add ARIA labels
  - Ensure keyboard navigation
  - Test with screen readers
  - Verify color contrast
  - _Requirements: 10.2_

- [ ] 12.5 Final responsive testing and polish
  - Test on all breakpoints
  - Fix any layout issues
  - Optimize for mobile performance
  - _Requirements: 1.5, 10.2, 10.3_
