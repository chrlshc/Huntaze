# Design Document - UI Enhancements

## Overview

This design document details the technical architecture and implementation approach for five major UI enhancements to the Huntaze application. The enhancements leverage modern web technologies including Framer Motion for animations, Chart.js for data visualization, and CSS custom properties for theming.

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    Huntaze Application                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │   Dashboard    │  │ Theme System │  │  Animation  │ │
│  │    System      │  │   Provider   │  │   System    │ │
│  └────────────────┘  └──────────────┘  └─────────────┘ │
│          │                   │                 │        │
│          └───────────────────┴─────────────────┘        │
│                          │                              │
│                  ┌───────┴────────┐                     │
│                  │  Mobile Polish │                     │
│                  │   & Landing    │                     │
│                  └────────────────┘                     │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Framer Motion**: Animation library (v11+)
- **Chart.js**: Data visualization (v4+)
- **react-chartjs-2**: React wrapper for Chart.js
- **react-swipeable**: Touch gesture handling
- **CSS Custom Properties**: Theme variables
- **Tailwind CSS**: Utility-first styling with dark mode support

---

## Components and Interfaces

### 1. Dashboard System

#### Component Hierarchy

```
Dashboard (Page)
├── StatsOverview
│   └── AnimatedNumber (×4)
├── ActivityFeed
│   └── motion.li (staggered)
├── QuickActions
│   └── Link buttons (×3)
└── PerformanceCharts
    └── Line (Chart.js)
```

#### Key Components

**AnimatedNumber Component**
```typescript
interface AnimatedNumberProps {
  from?: number;
  to: number;
  duration?: number;
}
```

- Uses Framer Motion's `animate()` function
- Animates number from `from` to `to` over `duration`
- Updates DOM via ref for performance

**StatsOverview Component**
```typescript
interface StatItem {
  label: string;
  value: number;
  icon?: React.ReactNode;
}
```

- Renders 4 stat cards in responsive grid
- Each card animates on mount with spring physics
- Stiffness: 220, Damping: 26

**ActivityFeed Component**
```typescript
interface ActivityItem {
  id: number;
  text: string;
  time: string;
  type?: 'fan' | 'post' | 'payment';
}
```

- Stagger children animation (60ms delay)
- Variants: hidden (opacity: 0, y: 6) → show (opacity: 1, y: 0)

**PerformanceCharts Component**
- Uses react-chartjs-2 Line component
- Responsive: true, maintainAspectRatio: false
- 7-day data visualization

---

### 2. Theme System

#### Architecture

```
ThemeProvider (Context)
├── localStorage persistence
├── OS preference detection
└── Theme application

ThemeToggle (Component)
└── 3 buttons: Light | Dark | System
```

#### Theme Context Interface

```typescript
type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}
```

#### CSS Variables Structure

```css
:root {
  /* Light theme */
  --bg: #ffffff;
  --surface: #ffffff;
  --text: #111111;
  --muted: #666666;
  --border: #E5E7EB;
  --shadow: 0 1px 2px rgba(0,0,0,.08);
  --radius: 12px;
  color-scheme: light dark;
}

[data-theme="dark"] {
  /* Dark theme - Shopify Polaris inspired */
  --bg: #1A1A1A;
  --surface: #1F1F1F;
  --text: #EDEDED;
  --muted: #A1A1AA;
  --border: #2A2A2A;
  --shadow: none;
}
```

#### Theme Application Logic

1. Check localStorage for saved theme
2. If theme is 'system', detect OS preference via `matchMedia`
3. Apply `data-theme` attribute to `<html>`
4. Set `color-scheme` CSS property
5. Listen for OS preference changes if system theme

---

### 3. Mobile Polish

#### Responsive Breakpoints

- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 1024px (md, lg)
- **Desktop**: > 1024px (xl, 2xl)

#### Table to Cards Pattern

```css
/* Mobile: Cards */
@media (max-width: 767px) {
  .responsive-table thead { display: none; }
  .responsive-table tr { 
    display: block;
    border: 1px solid var(--border);
    margin-bottom: 0.8rem;
  }
  .responsive-table td {
    display: flex;
    justify-content: space-between;
  }
  .responsive-table td::before {
    content: attr(data-label);
    font-weight: 600;
  }
}

/* Desktop: Normal table */
@media (min-width: 768px) {
  .responsive-table thead { display: table-header-group; }
  .responsive-table tr { display: table-row; }
  .responsive-table td { display: table-cell; }
  .responsive-table td::before { content: none; }
}
```

#### Bottom Navigation Component

```typescript
interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
}
```

- Fixed position at bottom
- 4-5 items maximum (Material Design guideline)
- Hidden on desktop (> 992px)
- Touch targets: 44×44px minimum

#### Modal Responsive Behavior

```css
.modal {
  width: min(720px, 100%);
  max-height: 90vh;
}

@media (max-width: 768px) {
  .modal {
    width: 100%;
    height: 100%;
    max-height: none;
    border-radius: 0;
  }
}
```

#### Touch Gesture Handling

- Uses `react-swipeable` library
- Swipe left: Reveal delete action
- Delta threshold: 50px
- trackTouch: true

---

### 4. Animation System

#### Framer Motion Configuration

**Page Transitions**
```typescript
<AnimatePresence mode="wait">
  <motion.div
    key={pathname}
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -6 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
</AnimatePresence>
```

**List Stagger**
```typescript
const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 }
};
```

**Modal Animation**
```typescript
initial={{ opacity: 0, scale: 0.9, y: 20 }}
animate={{ opacity: 1, scale: 1, y: 0 }}
exit={{ opacity: 0, scale: 0.9, y: 20 }}
transition={{ type: "spring", damping: 25, stiffness: 300 }}
```

#### Skeleton Screen Component

```typescript
interface SkeletonProps {
  lines?: number;
  className?: string;
}
```

```css
.sk-line {
  height: 12px;
  border-radius: 6px;
  margin: 0.5rem 0;
  background: linear-gradient(
    90deg,
    #e5e7eb 25%,
    #f3f4f6 37%,
    #e5e7eb 63%
  );
  background-size: 400% 100%;
  animation: shimmer 1.2s infinite linear;
}

@keyframes shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
}
```

#### Scroll Reveal

```typescript
<motion.div
  initial={{ opacity: 0, y: 8 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.3 }}
  transition={{ duration: 0.6 }}
>
  {content}
</motion.div>
```

#### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
}
```

---

### 5. Landing Page System

#### Section Structure

1. **Enhanced Hero**
   - Badge (animated)
   - Headline with gradient text
   - Subheadline
   - 2 CTAs (primary + secondary)
   - Social proof (avatars + rating)
   - Hero image/video

2. **Features Section**
   - Alternating layout (image left/right)
   - Scroll-reveal animations
   - 3 benefit checkmarks per feature

3. **Social Proof**
   - Stats grid (2×4 or 1×4)
   - Animated counters
   - Testimonials (3 cards)

4. **Pricing Section**
   - 3 plans (Starter, Pro, Enterprise)
   - Popular badge on Pro plan
   - Feature comparison

5. **FAQ Section**
   - Accordion pattern
   - Smooth expand/collapse

6. **Final CTA**
   - Gradient background
   - 2 CTAs
   - Trust indicators

#### Hero Animation Sequence

```typescript
// Badge
initial={{ opacity: 0, scale: 0.9 }}
animate={{ opacity: 1, scale: 1 }}
transition={{ delay: 0.2 }}

// Headline
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ delay: 0.3 }}

// Subheadline
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ delay: 0.4 }}

// CTAs
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ delay: 0.5 }}
```

---

## Data Models

### Dashboard Data

```typescript
interface DashboardStats {
  fans: number;
  posts: number;
  revenue: number;
  growth: number;
}

interface ActivityItem {
  id: number;
  text: string;
  time: string;
  type: 'fan' | 'post' | 'payment';
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
  }[];
}
```

### Theme Data

```typescript
type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  current: Theme;
  resolved: 'light' | 'dark';
}
```

---

## Error Handling

### Theme System Errors

1. **localStorage unavailable**: Fallback to 'system' theme
2. **Invalid theme value**: Reset to 'system'
3. **matchMedia unsupported**: Fallback to 'light'

### Animation Errors

1. **Framer Motion load failure**: Graceful degradation to CSS transitions
2. **Performance issues**: Disable animations if FPS < 30
3. **Reduced motion**: Respect user preference

### Chart Errors

1. **Chart.js load failure**: Display static data table
2. **Invalid data**: Show error message
3. **Render failure**: Fallback to text summary

---

## Testing Strategy

### Unit Tests

1. **AnimatedNumber**: Test number animation from 0 to target
2. **ThemeProvider**: Test theme switching and persistence
3. **Skeleton**: Test rendering with different line counts
4. **Responsive utilities**: Test breakpoint detection

### Integration Tests

1. **Dashboard**: Test full page render with all components
2. **Theme switching**: Test theme application across components
3. **Mobile navigation**: Test bottom nav visibility
4. **Page transitions**: Test route changes with animations

### Visual Regression Tests

1. **Theme consistency**: Compare light/dark mode screenshots
2. **Responsive layouts**: Test all breakpoints
3. **Animation states**: Capture animation keyframes

### Performance Tests

1. **Dashboard load time**: < 1.8s First Contentful Paint
2. **Animation FPS**: Maintain 60fps
3. **Theme switch**: < 200ms transition
4. **Chart render**: < 500ms

### Accessibility Tests

1. **Color contrast**: WCAG AA compliance
2. **Touch targets**: Minimum 44×44px
3. **Keyboard navigation**: All interactive elements
4. **Screen reader**: ARIA labels and live regions

---

## Performance Considerations

### Optimization Strategies

1. **Code Splitting**: Lazy load Chart.js and Framer Motion
2. **Memoization**: Use React.memo for expensive components
3. **Virtual Scrolling**: For long lists (> 100 items)
4. **Image Optimization**: Next.js Image component with lazy loading
5. **CSS Containment**: Use `contain` property for isolated components

### Bundle Size

- Framer Motion: ~60KB gzipped
- Chart.js: ~50KB gzipped
- react-chartjs-2: ~5KB gzipped
- react-swipeable: ~3KB gzipped
- **Total**: ~118KB additional

### Caching Strategy

1. **Theme preference**: localStorage (persistent)
2. **Dashboard data**: SWR with 5-minute cache
3. **Static assets**: CDN with long cache headers

---

## Security Considerations

### Theme System

- Sanitize localStorage values
- Validate theme strings before application
- No XSS risk (no user-generated theme values)

### Dashboard Data

- Validate all numeric values
- Sanitize activity feed text
- Rate limit API calls

### Mobile Gestures

- Prevent accidental deletions (confirmation required)
- Validate swipe delta thresholds
- Disable gestures during loading states

---

## Deployment Strategy

### Phased Rollout

**Phase 1: Dashboard (Week 1)**
- Deploy dashboard components
- Set as default post-login route
- Monitor performance metrics

**Phase 2: Dark Mode (Week 1-2)**
- Deploy theme system
- Add toggle to header
- Monitor theme adoption

**Phase 3: Mobile Polish (Week 2)**
- Deploy responsive improvements
- Test on real devices
- Monitor mobile metrics

**Phase 4: Animations (Week 2-3)**
- Deploy animation system
- Monitor FPS and performance
- A/B test animation preferences

**Phase 5: Landing (Week 3)**
- Deploy landing enhancements
- A/B test conversion rates
- Monitor bounce rates

### Rollback Plan

- Feature flags for each enhancement
- Ability to disable animations
- Fallback to light theme only
- Revert to previous dashboard

### Monitoring

- Track FPS for animations
- Monitor theme adoption rates
- Track mobile vs desktop usage
- Measure dashboard load times
- Monitor conversion rates (landing)

---

## Future Enhancements

1. **Custom Themes**: User-defined color schemes
2. **Animation Presets**: Multiple animation styles
3. **Dashboard Customization**: Drag-and-drop widgets
4. **Advanced Charts**: More visualization types
5. **Gesture Library**: More touch interactions
6. **PWA Features**: Offline support, install prompt
