# UI Components Documentation

Complete documentation for all UI Enhancement components in the Huntaze application.

---

## Table of Contents

1. [Dashboard Components](#dashboard-components)
2. [Theme System](#theme-system)
3. [Mobile Components](#mobile-components)
4. [Animation Components](#animation-components)
5. [Landing Page Components](#landing-page-components)
6. [Utility Components](#utility-components)

---

## Dashboard Components

### AnimatedNumber

Animates a number from a starting value to an ending value.

**Location**: `components/dashboard/AnimatedNumber.tsx`

**Props**:
```typescript
interface AnimatedNumberProps {
  from?: number;      // Starting value (default: 0)
  to: number;         // Ending value
  duration?: number;  // Animation duration in seconds (default: 1.2)
}
```

**Usage**:
```tsx
import { AnimatedNumber } from '@/components/dashboard/AnimatedNumber';

<AnimatedNumber from={0} to={1250} duration={1.5} />
```

**Features**:
- Smooth number animation using Framer Motion
- Configurable duration
- Automatic formatting with commas

---

### StatsOverview

Displays animated statistics cards in a responsive grid.

**Location**: `components/dashboard/StatsOverview.tsx`

**Props**:
```typescript
interface StatItem {
  label: string;
  value: number;
  icon?: React.ReactNode;
}

interface StatsOverviewProps {
  stats: StatItem[];
}
```

**Usage**:
```tsx
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { Users, TrendingUp } from 'lucide-react';

const stats = [
  { label: 'Total Fans', value: 1250, icon: <Users /> },
  { label: 'Revenue', value: 5420, icon: <TrendingUp /> }
];

<StatsOverview stats={stats} />
```

**Features**:
- Responsive grid (2x2 on mobile, 4x1 on desktop)
- Spring animations on mount
- Dark mode support
- Optional icons

---

### ActivityFeed

Displays a list of recent activities with stagger animations.

**Location**: `components/dashboard/ActivityFeed.tsx`

**Props**:
```typescript
interface ActivityItem {
  id: number;
  text: string;
  time: string;
  type?: 'fan' | 'post' | 'payment';
}

interface ActivityFeedProps {
  activities: ActivityItem[];
}
```

**Usage**:
```tsx
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';

const activities = [
  { id: 1, text: 'New fan subscribed', time: '2 min ago', type: 'fan' },
  { id: 2, text: 'Post published', time: '1 hour ago', type: 'post' }
];

<ActivityFeed activities={activities} />
```

**Features**:
- Stagger animations (60ms delay between items)
- Type-based icons
- Relative time formatting
- Dark mode support

---

### PerformanceCharts

Displays performance data using Chart.js.

**Location**: `components/dashboard/PerformanceCharts.tsx`

**Props**:
```typescript
interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
  }[];
}

interface PerformanceChartsProps {
  data: ChartData;
}
```

**Usage**:
```tsx
import { PerformanceCharts } from '@/components/dashboard/PerformanceCharts';

const data = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [{
    label: 'Views',
    data: [120, 190, 150, 220, 180, 240, 200]
  }]
};

<PerformanceCharts data={data} />
```

**Features**:
- Responsive charts
- Dark mode support
- Smooth animations
- Customizable colors

---

## Theme System

### ThemeProvider

Context provider for theme management.

**Location**: `contexts/ThemeContext.tsx`

**API**:
```typescript
type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}
```

**Usage**:
```tsx
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';

// In your app layout
<ThemeProvider>
  {children}
</ThemeProvider>

// In any component
function MyComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  return (
    <button onClick={() => setTheme('dark')}>
      Switch to Dark Mode
    </button>
  );
}
```

**Features**:
- Three modes: light, dark, system
- localStorage persistence
- OS preference detection
- Automatic theme application
- Smooth transitions (200ms)

---

### ThemeToggle

UI component for switching themes.

**Location**: `components/ThemeToggle.tsx`

**Usage**:
```tsx
import { ThemeToggle } from '@/components/ThemeToggle';

<ThemeToggle />
```

**Features**:
- Three-button toggle
- Active state indication
- Keyboard accessible
- Dark mode support

---

## Mobile Components

### BottomNav

Fixed bottom navigation for mobile devices.

**Location**: `components/mobile/BottomNav.tsx`

**Props**:
```typescript
interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
}

interface BottomNavProps {
  items: NavItem[];
}
```

**Usage**:
```tsx
import { BottomNav } from '@/components/mobile/BottomNav';
import { Home, User, Settings } from 'lucide-react';

const navItems = [
  { href: '/', icon: <Home />, label: 'Home' },
  { href: '/profile', icon: <User />, label: 'Profile' },
  { href: '/settings', icon: <Settings />, label: 'Settings' }
];

<BottomNav items={navItems} />
```

**Features**:
- Fixed at bottom on mobile (< 992px)
- Hidden on desktop
- Touch-friendly targets (44×44px)
- Active state indication
- Dark mode support

---

### ResponsiveTable

Table that converts to cards on mobile.

**Location**: `components/ui/ResponsiveTable.tsx`

**Usage**:
```tsx
import { ResponsiveTable } from '@/components/ui/ResponsiveTable';

<ResponsiveTable>
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td data-label="Name">John Doe</td>
      <td data-label="Email">john@example.com</td>
      <td data-label="Status">Active</td>
    </tr>
  </tbody>
</ResponsiveTable>
```

**Features**:
- Automatic conversion to cards on mobile (< 768px)
- Uses `data-label` attributes for mobile labels
- Dark mode support
- Responsive design

---

### SwipeableItem

List item with swipe-to-delete functionality.

**Location**: `components/ui/SwipeableItem.tsx`

**Props**:
```typescript
interface SwipeableItemProps {
  onDelete: () => void;
  children: React.ReactNode;
}
```

**Usage**:
```tsx
import { SwipeableItem } from '@/components/ui/SwipeableItem';

<SwipeableItem onDelete={() => handleDelete(item.id)}>
  <div>Item content</div>
</SwipeableItem>
```

**Features**:
- Swipe left to reveal delete button
- Configurable swipe threshold
- Touch-friendly
- Smooth animations

---

## Animation Components

### AppShell

Wrapper for page transitions.

**Location**: `components/layout/AppShell.tsx`

**Usage**:
```tsx
import { AppShell } from '@/components/layout/AppShell';

<AppShell>
  {children}
</AppShell>
```

**Features**:
- Fade and slide transitions (300ms)
- AnimatePresence with mode="wait"
- Automatic route detection
- Reduced motion support

---

### ScrollReveal

Reveals content when scrolling into view.

**Location**: `components/animations/ScrollReveal.tsx`

**Props**:
```typescript
interface ScrollRevealProps {
  children: React.ReactNode;
  delay?: number;
}
```

**Usage**:
```tsx
import { ScrollReveal } from '@/components/animations/ScrollReveal';

<ScrollReveal delay={0.2}>
  <div>Content to reveal</div>
</ScrollReveal>
```

**Features**:
- Triggers animation when 30% visible
- Once: true (animates only once)
- Configurable delay
- Reduced motion support

---

### Skeleton

Loading placeholder with shimmer effect.

**Location**: `components/ui/Skeleton.tsx`

**Props**:
```typescript
interface SkeletonProps {
  lines?: number;
  className?: string;
}
```

**Usage**:
```tsx
import { Skeleton } from '@/components/ui/Skeleton';

<Skeleton lines={3} />
```

**Features**:
- Shimmer animation
- Configurable number of lines
- Dark mode support
- aria-busy attribute

---

## Landing Page Components

### FeaturesShowcase

Features section with alternating layout.

**Location**: `components/landing/FeaturesShowcase.tsx`

**Props**:
```typescript
interface Feature {
  title: string;
  description: string;
  benefits: { text: string }[];
  image: string;
  imageAlt: string;
}

interface FeaturesShowcaseProps {
  features: Feature[];
}
```

**Usage**:
```tsx
import { FeaturesShowcase } from '@/components/landing/FeaturesShowcase';

const features = [
  {
    title: 'Feature Title',
    description: 'Feature description',
    benefits: [
      { text: 'Benefit 1' },
      { text: 'Benefit 2' },
      { text: 'Benefit 3' }
    ],
    image: '/images/feature.jpg',
    imageAlt: 'Feature screenshot'
  }
];

<FeaturesShowcase features={features} />
```

**Features**:
- Alternating left/right layout
- Scroll-reveal animations
- 3 checkmarks per feature
- Responsive (stacks on mobile)
- Dark mode support

---

### SocialProof

Stats and testimonials section.

**Location**: `components/landing/SocialProof.tsx`

**Props**:
```typescript
interface Stat {
  value: number;
  label: string;
  suffix?: string;
}

interface Testimonial {
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar?: string;
}

interface SocialProofProps {
  stats: Stat[];
  testimonials: Testimonial[];
}
```

**Usage**:
```tsx
import { SocialProof } from '@/components/landing/SocialProof';

const stats = [
  { value: 10000, label: 'Active Users', suffix: '+' }
];

const testimonials = [
  {
    name: 'John Doe',
    role: 'Creator',
    content: 'Amazing platform!',
    rating: 5
  }
];

<SocialProof stats={stats} testimonials={testimonials} />
```

**Features**:
- Animated counters (0 → value)
- 5-star ratings
- Avatar initials
- Responsive grid
- Dark mode support

---

### PricingSection

Pricing plans with highlighted popular plan.

**Location**: `components/landing/PricingSection.tsx`

**Props**:
```typescript
interface PricingPlan {
  name: string;
  price: number;
  period: string;
  description: string;
  features: { text: string; included: boolean }[];
  popular?: boolean;
  ctaText: string;
  ctaHref: string;
}

interface PricingSectionProps {
  plans: PricingPlan[];
}
```

**Usage**:
```tsx
import { PricingSection } from '@/components/landing/PricingSection';

const plans = [
  {
    name: 'Pro',
    price: 49,
    period: 'month',
    description: 'For professionals',
    features: [
      { text: 'Feature 1', included: true },
      { text: 'Feature 2', included: false }
    ],
    popular: true,
    ctaText: 'Get Started',
    ctaHref: '/signup'
  }
];

<PricingSection plans={plans} />
```

**Features**:
- Popular plan highlighted (gradient, scale, badge)
- Feature comparison
- Hover animations
- Responsive (3 cols → 1 col)
- Dark mode support

---

### FAQSection

FAQ with accordion pattern.

**Location**: `components/landing/FAQSection.tsx`

**Props**:
```typescript
interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  faqs: FAQItem[];
}
```

**Usage**:
```tsx
import { FAQSection } from '@/components/landing/FAQSection';

const faqs = [
  {
    question: 'How does it work?',
    answer: 'It works by...'
  }
];

<FAQSection faqs={faqs} />
```

**Features**:
- Smooth expand/collapse
- Chevron rotation animation
- One open at a time
- Dark mode support

---

### FinalCTA

Final call-to-action with gradient background.

**Location**: `components/landing/FinalCTA.tsx`

**Props**:
```typescript
interface FinalCTAProps {
  title: string;
  subtitle: string;
  primaryCTA: { text: string; href: string };
  secondaryCTA: { text: string; href: string };
  trustIndicators?: { icon: React.ReactNode; text: string }[];
}
```

**Usage**:
```tsx
import { FinalCTA } from '@/components/landing/FinalCTA';

<FinalCTA
  title="Ready to get started?"
  subtitle="Join thousands of users"
  primaryCTA={{ text: 'Sign Up', href: '/signup' }}
  secondaryCTA={{ text: 'Learn More', href: '/about' }}
/>
```

**Features**:
- Gradient background (animated)
- 2 CTA buttons
- Trust indicators
- Hover/tap animations
- Responsive

---

## Utility Components

### Modal

Animated modal dialog.

**Location**: `components/ui/Modal.tsx`

**Props**:
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}
```

**Usage**:
```tsx
import { Modal } from '@/components/ui/Modal';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
>
  <p>Modal content</p>
</Modal>
```

**Features**:
- Scale and fade animations
- Spring transition
- Full-screen on mobile (< 768px)
- Backdrop blur
- Keyboard accessible (ESC to close)
- Dark mode support

---

### TouchTarget

Ensures minimum touch target size.

**Location**: `components/ui/TouchTarget.tsx`

**Props**:
```typescript
interface TouchTargetProps {
  children: React.ReactNode;
  className?: string;
}
```

**Usage**:
```tsx
import { TouchTarget } from '@/components/ui/TouchTarget';

<TouchTarget>
  <button>Click me</button>
</TouchTarget>
```

**Features**:
- Minimum 44×44px size
- WCAG 2.2 compliant
- Transparent padding if needed

---

## Animation Utilities

### Stagger Variants

Reusable stagger animation variants.

**Location**: `lib/animations/staggerVariants.ts`

**Usage**:
```tsx
import { staggerContainer, staggerItem } from '@/lib/animations/staggerVariants';
import { motion } from 'framer-motion';

<motion.ul variants={staggerContainer} initial="hidden" animate="show">
  {items.map(item => (
    <motion.li key={item.id} variants={staggerItem}>
      {item.text}
    </motion.li>
  ))}
</motion.ul>
```

**Variants**:
- `staggerContainer`: Container with staggerChildren
- `staggerItem`: Item with fade and slide

---

## Hooks

### useReducedMotion

Detects user's motion preference.

**Location**: `hooks/useReducedMotion.ts`

**Usage**:
```tsx
import { useReducedMotion } from '@/hooks/useReducedMotion';

function MyComponent() {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <motion.div
      animate={prefersReducedMotion ? {} : { scale: 1.1 }}
    >
      Content
    </motion.div>
  );
}
```

**Features**:
- Detects `prefers-reduced-motion` media query
- Updates on preference change
- Returns boolean

---

## Best Practices

### Animations
- Always respect `prefers-reduced-motion`
- Keep animations under 500ms for micro-interactions
- Use GPU-accelerated properties (transform, opacity)
- Avoid animating layout properties (width, height)

### Responsive Design
- Mobile-first approach
- Test on real devices
- Ensure touch targets are 44×44px minimum
- Use responsive images with Next.js Image

### Dark Mode
- Test all components in both themes
- Maintain WCAG AA contrast ratio
- Use CSS custom properties for colors
- Provide smooth transitions

### Accessibility
- Include ARIA labels
- Ensure keyboard navigation
- Test with screen readers
- Provide focus states

---

## Support

For questions or issues, please refer to:
- [Developer Guide](./UI_DEVELOPER_GUIDE.md)
- [User Guide](./UI_USER_GUIDE.md)
- [GitHub Issues](https://github.com/your-repo/issues)

---

**Last Updated**: November 2, 2024  
**Version**: 1.0.0  
**Status**: Production Ready
