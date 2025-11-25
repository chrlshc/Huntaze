# Design Document - Site Restructure Multi-Page

## Overview

This design restructures the Huntaze marketing site from a single-page layout to a proper multi-page architecture with clear navigation, dedicated content pages, and optimized performance. The solution leverages Next.js App Router capabilities for seamless client-side navigation while maintaining excellent SEO and performance characteristics.

## Architecture

### Page Structure

```
app/(marketing)/
├── layout.tsx          # Shared layout with Header + Footer
├── page.tsx            # Homepage (simplified)
├── features/
│   └── page.tsx        # Features page
├── pricing/
│   └── page.tsx        # Pricing page
├── about/
│   └── page.tsx        # About page (already exists)
├── case-studies/
│   └── page.tsx        # Case studies (already exists)
└── contact/
    └── page.tsx        # Contact page
```

### Component Architecture

```
components/
├── layout/
│   ├── MarketingHeader.tsx      # Main navigation header
│   ├── MarketingFooter.tsx      # Site footer
│   ├── MobileNav.tsx            # Mobile navigation drawer
│   └── NavLink.tsx              # Active link component
├── home/
│   ├── HeroSection.tsx          # Homepage hero
│   ├── ValueProposition.tsx     # 3 key benefits
│   └── HomeCTA.tsx              # Call to action
├── features/
│   ├── FeatureGrid.tsx          # Features display
│   ├── FeatureCard.tsx          # Individual feature
│   └── FeatureDetail.tsx        # Expanded feature view
└── pricing/
    ├── PricingTiers.tsx         # Pricing comparison
    ├── PricingCard.tsx          # Individual tier
    └── PricingFAQ.tsx           # Pricing FAQs
```

## Components and Interfaces

### MarketingHeader Component

**Purpose**: Provides consistent navigation across all marketing pages with active state indication.

**Props**:
```typescript
interface MarketingHeaderProps {
  className?: string;
}

interface NavItem {
  label: string;
  href: string;
  description?: string; // For dropdown menus
}
```

**Behavior**:
- Sticky positioning at top of viewport
- Highlights current page in navigation
- Responsive: full menu on desktop, hamburger on mobile
- Smooth transitions between pages using Next.js Link
- Accessible keyboard navigation

### MobileNav Component

**Purpose**: Provides mobile-friendly navigation drawer.

**Props**:
```typescript
interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
}
```

**Behavior**:
- Slides in from right side
- Overlay backdrop with blur effect
- Closes on navigation or backdrop click
- Trap focus within drawer when open
- Animated transitions

### MarketingFooter Component

**Purpose**: Consistent footer across all pages with links and legal information.

**Props**:
```typescript
interface MarketingFooterProps {
  className?: string;
}

interface FooterSection {
  title: string;
  links: Array<{
    label: string;
    href: string;
  }>;
}
```

**Structure**:
- Product links (Features, Pricing, etc.)
- Company links (About, Careers, Contact)
- Legal links (Privacy, Terms)
- Social media icons
- Copyright notice

### NavLink Component

**Purpose**: Link component that shows active state based on current route.

**Props**:
```typescript
interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  activeClassName?: string;
  className?: string;
}
```

**Behavior**:
- Uses `usePathname()` to detect active route
- Applies active styling when current
- Prefetches linked page on hover
- Accessible with proper ARIA attributes

## Data Models

### Navigation Configuration

```typescript
interface NavigationConfig {
  main: NavItem[];
  footer: FooterSection[];
  social: SocialLink[];
}

interface NavItem {
  label: string;
  href: string;
  description?: string;
  icon?: LucideIcon;
}

interface SocialLink {
  platform: 'twitter' | 'linkedin' | 'instagram' | 'youtube';
  url: string;
  icon: LucideIcon;
}

interface FooterSection {
  title: string;
  links: Array<{
    label: string;
    href: string;
    external?: boolean;
  }>;
}
```

### Page Content Models

```typescript
interface HomePageContent {
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    cta: CTAButton;
  };
  benefits: Benefit[];
  finalCTA: CTASection;
}

interface Benefit {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  description: string;
}

interface Feature {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  benefits: string[];
  category: 'automation' | 'analytics' | 'growth';
}

interface PricingTier {
  id: string;
  name: string;
  price: number | 'custom';
  period: 'month' | 'year';
  description: string;
  features: string[];
  cta: CTAButton;
  highlighted?: boolean;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Header presence on all marketing pages
*For any* marketing page route, rendering the page should include a header component with navigation links to Features, Pricing, About, and Case Studies.
**Validates: Requirements 1.1**

### Property 2: Navigation hover feedback
*For any* navigation link element, applying hover state should result in visual style changes indicating interactivity.
**Validates: Requirements 1.2**

### Property 3: Client-side navigation
*For any* navigation link click, the system should navigate to the target page without triggering a full page reload (using Next.js client-side routing).
**Validates: Requirements 1.3**

### Property 4: Active navigation indication
*For any* page route, the corresponding navigation item should have active styling applied to indicate current location.
**Validates: Requirements 1.4**

### Property 5: Sticky header positioning
*For any* scroll position on a marketing page, the header should remain visible at the top of the viewport.
**Validates: Requirements 1.5**

### Property 6: Features organized by category
*For any* set of features displayed on the features page, they should be grouped and organized by their category property.
**Validates: Requirements 3.2**

### Property 7: Feature icons presence
*For any* feature displayed on the features page, it should have an associated icon or illustration rendered.
**Validates: Requirements 3.3**

### Property 8: Feature expansion interaction
*For any* feature card clicked, the system should display expanded details or examples for that feature.
**Validates: Requirements 3.5**

### Property 9: Pricing tier CTA buttons
*For any* pricing tier displayed, it should include a call-to-action button with appropriate text based on product state (beta vs. production).
**Validates: Requirements 4.3, 4.4**

### Property 10: Footer presence on all pages
*For any* marketing page, the page should render a footer component at the bottom.
**Validates: Requirements 5.1**

### Property 11: Conditional social links
*For any* footer render, if social media links are configured in the data, they should be displayed in the footer.
**Validates: Requirements 5.3**

### Property 12: Footer styling consistency
*For any* two marketing pages, the footer component should have identical styling and structure.
**Validates: Requirements 5.5**

### Property 13: Link prefetching
*For any* navigation link visible in the viewport, Next.js should prefetch the linked page for instant transitions.
**Validates: Requirements 6.2**

### Property 14: Loading state display
*For any* page transition, a loading indicator or skeleton screen should be displayed while the new page loads.
**Validates: Requirements 6.3**

### Property 15: Code splitting per page
*For any* marketing page, the JavaScript bundle should only include code necessary for that specific page (verified through bundle analysis).
**Validates: Requirements 6.4**

### Property 16: Lighthouse performance threshold
*For any* marketing page, running Lighthouse audit should yield a performance score of at least 90.
**Validates: Requirements 6.5**

### Property 17: Mobile hamburger menu visibility
*For any* viewport width below 768px, the header should display a hamburger menu icon instead of full navigation links.
**Validates: Requirements 7.1**

### Property 18: Mobile nav link parity
*For any* navigation configuration, the mobile navigation drawer should contain the same links as the desktop navigation.
**Validates: Requirements 7.3**

### Property 19: Mobile nav drawer closure
*For any* link clicked within the mobile navigation drawer, the drawer should close and navigation should occur.
**Validates: Requirements 7.4**

### Property 20: Mobile nav accessibility
*For any* mobile navigation drawer, it should be navigable via keyboard and include proper ARIA attributes for screen readers.
**Validates: Requirements 7.5**

### Property 21: Layout component reuse
*For any* marketing page, it should use the shared layout component from `app/(marketing)/layout.tsx` to avoid duplication.
**Validates: Requirements 8.2**

### Property 22: Centralized content updates
*For any* content item (navigation links, footer links, etc.), it should be defined in a single configuration location that all components reference.
**Validates: Requirements 8.3**

### Property 23: Content-presentation separation
*For any* page component, content data should be separated from presentation logic (e.g., using separate data files or constants).
**Validates: Requirements 8.4**

### Property 24: TypeScript type coverage
*For any* component or page, all props and interfaces should have explicit TypeScript type definitions.
**Validates: Requirements 8.5**



## Error Handling

### Navigation Errors

**404 Not Found**:
- Display custom 404 page with navigation back to homepage
- Log missing route for monitoring
- Suggest similar pages based on URL

**Client-Side Navigation Failures**:
- Fallback to full page navigation if client-side fails
- Display error toast notification
- Retry navigation once before falling back

### Component Loading Errors

**Lazy Loading Failures**:
- Display error boundary with retry option
- Log error to monitoring service
- Show fallback content or skeleton

**Image Loading Failures**:
- Display placeholder image
- Retry loading after delay
- Gracefully degrade without breaking layout

### Mobile Navigation Errors

**Drawer State Issues**:
- Ensure drawer can always be closed (escape key, backdrop click)
- Reset drawer state on navigation
- Prevent body scroll when drawer is open

## Testing Strategy

### Unit Testing

**Component Tests**:
- Test MarketingHeader renders with correct navigation items
- Test NavLink applies active class based on current route
- Test MobileNav opens/closes correctly
- Test MarketingFooter renders all sections
- Test PricingCard displays correct CTA based on beta state

**Hook Tests**:
- Test usePathname integration for active states
- Test mobile menu state management
- Test navigation configuration loading

### Property-Based Testing

We will use **fast-check** for property-based testing in this TypeScript/React project. Each property-based test should run a minimum of 100 iterations.

**Property Test Requirements**:
- Each test must include a comment tag: `**Feature: site-restructure-multipage, Property {number}: {property_text}**`
- Each correctness property must be implemented by a single property-based test
- Tests should generate random but valid inputs to verify universal properties

**Key Property Tests**:

1. **Header Presence**: Generate random marketing routes, verify header always renders
2. **Active Navigation**: Generate random routes, verify correct nav item is active
3. **Footer Consistency**: Render multiple pages, verify footer structure is identical
4. **Mobile Nav Parity**: Verify mobile and desktop nav contain same links
5. **TypeScript Coverage**: Verify all components have proper type definitions

### Integration Testing

**Navigation Flow Tests**:
- Test complete user journey from homepage through all pages
- Verify client-side navigation works without page reloads
- Test mobile navigation drawer interaction flow
- Verify prefetching occurs for visible links

**Performance Tests**:
- Run Lighthouse audits on all marketing pages
- Verify bundle sizes are within acceptable limits
- Test loading times under various network conditions
- Verify code splitting produces separate chunks per page

**Accessibility Tests**:
- Test keyboard navigation through all pages
- Verify screen reader compatibility
- Test focus management in mobile drawer
- Verify ARIA attributes are correct

### Visual Regression Testing

**Snapshot Tests**:
- Capture screenshots of all pages in desktop and mobile viewports
- Compare against baseline to detect unintended visual changes
- Test hover states and active states
- Test mobile drawer open/closed states

## Implementation Notes

### Next.js App Router Considerations

**Layout Hierarchy**:
```
app/
├── layout.tsx                    # Root layout (minimal)
└── (marketing)/
    ├── layout.tsx                # Marketing layout (Header + Footer)
    ├── page.tsx                  # Homepage
    ├── features/page.tsx         # Features page
    └── pricing/page.tsx          # Pricing page
```

**Metadata Configuration**:
- Each page should export metadata for SEO
- Use generateMetadata for dynamic titles
- Include Open Graph and Twitter Card metadata

**Performance Optimizations**:
- Use `next/link` with prefetch enabled (default)
- Implement dynamic imports for heavy components
- Use `loading.tsx` files for instant loading states
- Optimize images with `next/image`

### Styling Approach

**Design System**:
- Use existing design tokens from `styles/linear-design-tokens.css`
- Maintain consistent spacing, colors, and typography
- Use Tailwind CSS for utility-first styling
- Create reusable component variants

**Responsive Design**:
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Test on common device sizes
- Use CSS Grid and Flexbox for layouts

### Accessibility Requirements

**WCAG 2.1 Level AA Compliance**:
- Minimum contrast ratio of 4.5:1 for text
- All interactive elements keyboard accessible
- Proper heading hierarchy (h1 → h2 → h3)
- Alt text for all images
- ARIA labels for icon-only buttons
- Focus visible indicators
- Skip to main content link

### Content Management

**Navigation Configuration**:
```typescript
// config/navigation.ts
export const navigationConfig: NavigationConfig = {
  main: [
    { label: 'Features', href: '/features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'About', href: '/about' },
    { label: 'Case Studies', href: '/case-studies' },
  ],
  footer: [
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '/features' },
        { label: 'Pricing', href: '/pricing' },
        { label: 'Roadmap', href: '/roadmap' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' },
        { label: 'Careers', href: '/careers' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy', href: '/privacy' },
        { label: 'Terms', href: '/terms' },
      ],
    },
  ],
  social: [
    { platform: 'twitter', url: 'https://twitter.com/huntaze' },
    { platform: 'linkedin', url: 'https://linkedin.com/company/huntaze' },
  ],
};
```

### Migration Strategy

**Phase 1: Create Shared Components**
1. Build MarketingHeader component
2. Build MarketingFooter component
3. Build MobileNav component
4. Build NavLink component

**Phase 2: Simplify Homepage**
1. Extract current homepage sections to separate components
2. Remove excessive content from homepage
3. Keep only hero, 3 benefits, and CTA
4. Add clear links to other pages

**Phase 3: Update Existing Pages**
1. Ensure Features page uses new layout
2. Ensure Pricing page uses new layout
3. Update About page to use new layout
4. Update Case Studies page to use new layout

**Phase 4: Update Marketing Layout**
1. Integrate MarketingHeader and MarketingFooter
2. Remove old header/footer code
3. Test navigation across all pages

**Phase 5: Performance Optimization**
1. Implement code splitting
2. Add loading states
3. Optimize images
4. Run Lighthouse audits and fix issues

**Phase 6: Testing & Validation**
1. Run all unit tests
2. Run property-based tests
3. Run integration tests
4. Perform manual testing on various devices
5. Run accessibility audit

## Dependencies

**Required Packages**:
- `next` (already installed) - App Router and navigation
- `react` (already installed) - Component framework
- `lucide-react` (already installed) - Icons
- `tailwindcss` (already installed) - Styling
- `framer-motion` (already installed) - Animations

**Development Dependencies**:
- `@testing-library/react` - Component testing
- `@testing-library/user-event` - User interaction testing
- `fast-check` - Property-based testing
- `vitest` (already installed) - Test runner
- `@axe-core/react` - Accessibility testing

## Success Metrics

**User Experience**:
- Navigation clarity: Users can find any page within 2 clicks
- Page load time: < 2 seconds on 3G connection
- Bounce rate: < 40% on homepage
- Time on site: > 2 minutes average

**Technical Metrics**:
- Lighthouse Performance: ≥ 90
- Lighthouse Accessibility: 100
- Lighthouse Best Practices: ≥ 95
- Lighthouse SEO: 100
- Bundle size: < 200KB initial load
- Test coverage: > 80%

**Business Metrics**:
- Conversion rate: Track sign-ups from each page
- Page views per session: > 3 pages
- Mobile traffic: Ensure mobile experience drives engagement
