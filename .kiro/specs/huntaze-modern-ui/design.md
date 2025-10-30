# Design Document

## Overview

Huntaze Modern UI is a Next.js 14 application with App Router, featuring a Shopify-inspired design system built with Tailwind CSS and shadcn/ui components. The application provides a professional, responsive interface for content creators to manage their OnlyFans business through intuitive dashboards, forms, and data visualizations.

## Architecture

### Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Runtime**: Node.js 20+ (required for AWS SDK v3 + Prisma)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Context + Zustand for global state
- **Data Fetching**: React Query (TanStack Query) for server state
- **Authentication**: Auth.js v5 (NextAuth v5)
- **Charts**: Recharts for data visualization
- **Forms**: React Hook Form + Zod validation
- **Real-time**: WebSocket for chatbot streaming
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Dev Server**: Turbopack (next dev --turbo)

### Application Structure

```
app/
├── (auth)/
│   ├── login/
│   └── register/
├── (dashboard)/
│   ├── layout.tsx              # Main app layout with sidebar
│   ├── page.tsx                # Dashboard home
│   ├── messages/
│   │   ├── page.tsx            # Messages list
│   │   └── [id]/page.tsx       # Message detail
│   ├── campaigns/
│   │   ├── page.tsx            # Campaigns list
│   │   ├── new/page.tsx        # Create campaign
│   │   └── [id]/page.tsx       # Campaign detail
│   ├── content/
│   │   └── page.tsx            # Content library
│   ├── ai-content/
│   │   └── page.tsx            # AI content generation
│   ├── chatbot/
│   │   └── page.tsx            # Interactive chatbot
│   ├── analytics/
│   │   └── page.tsx            # Analytics dashboard
│   └── settings/
│       └── page.tsx            # User settings
components/
├── layout/
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   └── MobileNav.tsx
├── dashboard/
│   ├── MetricCard.tsx
│   ├── RevenueChart.tsx
│   └── RecentActivity.tsx
├── messages/
│   ├── MessageList.tsx
│   ├── MessageComposer.tsx
│   └── MessageStatus.tsx
├── campaigns/
│   ├── CampaignTable.tsx
│   ├── CampaignForm.tsx
│   └── CampaignAnalytics.tsx
├── content/
│   ├── MediaGrid.tsx
│   ├── UploadZone.tsx
│   └── MediaPreview.tsx
├── ai/
│   ├── ContentGenerator.tsx
│   └── ChatInterface.tsx
└── ui/                         # shadcn/ui components
    ├── button.tsx
    ├── card.tsx
    ├── dialog.tsx
    ├── form.tsx
    ├── table.tsx
    └── ...
```

## Components and Interfaces

### Layout Components

#### Sidebar Navigation

```typescript
interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  children?: NavItem[];
}

const navigationItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: Home },
  { label: 'Messages', href: '/messages', icon: MessageSquare, badge: 5 },
  { label: 'Campaigns', href: '/campaigns', icon: Megaphone },
  { label: 'Content', href: '/content', icon: Image },
  { label: 'AI Content', href: '/ai-content', icon: Sparkles },
  { label: 'Chatbot', href: '/chatbot', icon: Bot },
  { label: 'Analytics', href: '/analytics', icon: BarChart },
  { label: 'Settings', href: '/settings', icon: Settings },
];
```

**Design Features:**
- Collapsible sidebar (240px expanded, 64px collapsed)
- Active state highlighting with accent color
- Icon-only mode when collapsed
- Smooth transitions with Framer Motion
- Badge indicators for notifications

#### Header Bar

```typescript
interface HeaderProps {
  title: string;
  actions?: React.ReactNode;
}

interface UserMenuProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
}
```

**Design Features:**
- Breadcrumb navigation
- Search bar (global search)
- Notification bell with dropdown
- Theme toggle (light/dark)
- User profile dropdown

### Dashboard Components

#### Metric Cards

```typescript
interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: LucideIcon;
  trend?: number[];
}
```

**Design Features:**
- 4-column grid on desktop, 2 on tablet, 1 on mobile
- Sparkline charts showing trends
- Color-coded change indicators (green/red)
- Loading skeleton states
- Hover effects with subtle elevation

#### Revenue Chart

```typescript
interface RevenueChartProps {
  data: {
    date: string;
    revenue: number;
    messages: number;
  }[];
  dateRange: 'week' | 'month' | 'year';
  onDateRangeChange: (range: string) => void;
}
```

**Design Features:**
- Recharts area chart with gradient fill
- Interactive tooltips
- Date range selector
- Responsive sizing
- Export to CSV button

### Messages Components

#### Message Composer

```typescript
interface MessageComposerProps {
  onSend: (message: MessagePayload) => Promise<void>;
  templates?: MessageTemplate[];
}

interface MessagePayload {
  recipientId: string;
  content: string;
  mediaUrls?: string[];
  scheduledAt?: Date;
  priority?: 'low' | 'medium' | 'high';
}
```

**Design Features:**
- Rich text editor with markdown support
- Media attachment with preview
- Template selector dropdown
- Schedule picker
- Character counter
- Send button with loading state

#### Message Status Tracker

```typescript
interface MessageStatusProps {
  messageId: string;
  status: 'queued' | 'sending' | 'sent' | 'failed';
  queuePosition?: number;
  estimatedSendTime?: Date;
}
```

**Design Features:**
- Status badge with color coding
- Progress indicator for queued messages
- Retry button for failed messages
- Real-time updates via polling

### Campaigns Components

#### Campaign Table

```typescript
interface CampaignTableProps {
  campaigns: Campaign[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  startDate: Date;
  endDate?: Date;
  metrics: {
    sent: number;
    opened: number;
    clicked: number;
    revenue: number;
  };
}
```

**Design Features:**
- Sortable columns
- Search and filter bar
- Bulk actions
- Status toggle switches
- Action menu (edit, duplicate, delete)
- Pagination

#### Campaign Form (Multi-step)

```typescript
interface CampaignFormProps {
  initialData?: Partial<Campaign>;
  onSubmit: (data: CampaignFormData) => Promise<void>;
}

interface CampaignFormData {
  name: string;
  templateId: string;
  segmentId: string;
  schedule: {
    type: 'immediate' | 'scheduled' | 'recurring';
    startDate?: Date;
    frequency?: 'daily' | 'weekly' | 'monthly';
  };
  content: {
    subject: string;
    body: string;
    mediaUrls: string[];
  };
}
```

**Design Features:**
- 4-step wizard (Details, Template, Audience, Schedule)
- Progress indicator
- Form validation with Zod
- Preview mode
- Save as draft option

### Content Library Components

#### Media Grid

```typescript
interface MediaGridProps {
  items: MediaItem[];
  view: 'grid' | 'list';
  onSelect: (ids: string[]) => void;
  selectedIds: string[];
}

interface MediaItem {
  id: string;
  url: string;
  thumbnail: string;
  type: 'image' | 'video';
  size: number;
  dimensions: { width: number; height: number };
  uploadedAt: Date;
  tags: string[];
}
```

**Design Features:**
- Masonry grid layout
- Lazy loading with intersection observer
- Multi-select with checkboxes
- Quick actions on hover
- Lightbox for full-size preview

#### Upload Zone

```typescript
interface UploadZoneProps {
  onUpload: (files: File[]) => Promise<void>;
  accept: string[];
  maxSize: number;
  maxFiles: number;
}
```

**Design Features:**
- Drag-and-drop area
- File type validation
- Upload progress bars
- Thumbnail generation
- Batch upload support

### AI Components

#### Content Generator

```typescript
interface ContentGeneratorProps {
  onGenerate: (params: GenerationParams) => Promise<string>;
  onSave: (content: string) => Promise<void>;
}

interface GenerationParams {
  type: 'caption' | 'message' | 'bio' | 'hashtags';
  tone: 'casual' | 'professional' | 'flirty' | 'funny';
  length: 'short' | 'medium' | 'long';
  keywords?: string[];
}
```

**Design Features:**
- Parameter selection form
- Generate button with loading animation
- Result display with copy button
- Regenerate option
- History sidebar

#### Chat Interface

```typescript
interface ChatInterfaceProps {
  onSendMessage: (message: string) => void;
  messages: ChatMessage[];
  isStreaming: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
```

**Design Features:**
- Message bubbles (user right, AI left)
- Typing indicator with animation
- Markdown rendering for AI responses
- Auto-scroll to latest message
- Message input with send button

### Analytics Components

#### Analytics Dashboard

```typescript
interface AnalyticsDashboardProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

interface DateRange {
  start: Date;
  end: Date;
  preset?: '7d' | '30d' | '90d' | 'custom';
}
```

**Design Features:**
- Date range picker
- Multiple chart types (line, bar, pie)
- Comparison mode (vs previous period)
- Export functionality
- Real-time data updates

## Data Models

### Frontend State Models

```typescript
// User State
interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}

// UI State
interface UIState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

// Notifications State
interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
}
```

### API Response Types

```typescript
// API Response wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  metadata?: {
    page: number;
    pageSize: number;
    total: number;
  };
}

// Dashboard metrics
interface DashboardMetrics {
  revenue: {
    total: number;
    change: number;
  };
  messages: {
    sent: number;
    queued: number;
  };
  campaigns: {
    active: number;
    total: number;
  };
  engagement: {
    rate: number;
    change: number;
  };
}
```

## Error Handling

### Error Boundary

```typescript
class ErrorBoundary extends React.Component<Props, State> {
  // Catches React errors
  // Displays fallback UI
  // Logs to monitoring service
}
```

### API Error Handling

```typescript
// Centralized error handler
function handleApiError(error: unknown): void {
  if (error instanceof ApiError) {
    toast.error(error.message);
  } else if (error instanceof NetworkError) {
    toast.error('Network error. Please check your connection.');
  } else {
    toast.error('An unexpected error occurred.');
  }
  
  // Log to monitoring
  logError(error);
}
```

### Form Validation

```typescript
// Zod schemas for validation
const messageSchema = z.object({
  recipientId: z.string().min(1, 'Recipient is required'),
  content: z.string().min(1, 'Message content is required').max(1000),
  mediaUrls: z.array(z.string().url()).optional(),
  scheduledAt: z.date().optional(),
});

type MessageFormData = z.infer<typeof messageSchema>;
```

## Testing Strategy

### Unit Tests
- Component rendering
- User interactions
- State management
- Utility functions

### Integration Tests
- API integration
- Form submissions
- Navigation flows
- Authentication

### E2E Tests
- Critical user journeys
- Message sending flow
- Campaign creation
- Content upload

### Visual Regression Tests
- Component snapshots
- Layout consistency
- Theme switching

## Performance Optimization

### Code Splitting
- Route-based splitting with Next.js
- Dynamic imports for heavy components
- Lazy loading for modals and dialogs

### Image Optimization
- Next.js Image component
- WebP format with fallbacks
- Responsive images
- Lazy loading

### Data Fetching
- React Query for caching
- Prefetching on hover
- Optimistic updates
- Stale-while-revalidate

### Bundle Size
- Tree shaking
- Remove unused dependencies
- Analyze bundle with webpack-bundle-analyzer
- Target < 200KB initial JS

## Accessibility

- Semantic HTML
- ARIA labels and roles
- Keyboard navigation
- Focus management
- Screen reader support
- Color contrast (WCAG AA)
- Skip links

## Design System

### Colors

```typescript
const colors = {
  primary: {
    50: '#f0f9ff',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    500: '#6b7280',
    900: '#111827',
  },
};
```

### Typography

```typescript
const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['Fira Code', 'monospace'],
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
  },
};
```

### Spacing

- 4px base unit
- Consistent padding/margin scale
- Component spacing guidelines

### Shadows

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
```

## Responsive Breakpoints

```typescript
const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px', // Extra large
};
```

## Animation Guidelines

- Use Framer Motion for complex animations
- CSS transitions for simple hover effects
- Duration: 150-300ms for UI feedback
- Easing: ease-in-out for natural feel
- Respect prefers-reduced-motion

## Next.js 15 Specific Considerations

### Breaking Changes
- **Async Request APIs**: `cookies()`, `headers()`, `draftMode()` are now async - must use `await`
- **Async params**: Route `params` and `searchParams` are now Promises - must use `await`
- **GET caching**: Route Handlers GET are no longer cached by default
- **Auth.js v5**: Use `auth()` wrapper instead of `getServerSession()`

### Configuration (next.config.ts)

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  bundlePagesRouterDependencies: true,
  serverExternalPackages: ['@prisma/client'], // Don't bundle Prisma binary
  // experimental: { after: true }, // Optional: post-response tasks
};

export default nextConfig;
```

### Runtime Requirements
- All API routes using AWS SDK or Prisma MUST use `export const runtime = 'nodejs'`
- Edge runtime is NOT compatible with AWS SDK v3 or Prisma

### Instrumentation (instrumentation.ts)

```typescript
export async function onRequestError(err: unknown, request: Request, context: any) {
  // Send to CloudWatch/Sentry
  await fetch(process.env.OBS_ENDPOINT!, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ 
      message: String((err as Error).message), 
      context 
    }),
  });
}

export async function register() {
  // Initialize tracer/metrics
}
```

## Security Considerations

- XSS prevention (sanitize user input)
- CSRF tokens for mutations
- Secure session storage with Auth.js v5
- Content Security Policy
- Rate limiting on client
- Input validation with Zod
