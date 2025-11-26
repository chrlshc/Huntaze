# Design Document

## Overview

This design document specifies the technical architecture for migrating the Huntaze dashboard from a legacy dark-mode interface to a modern, light-mode "App Shell" inspired by Shopify's Online Store 2.0 paradigm. The design follows the "Copier, S'inspirer, Sublimer" philosophy—adopting proven structural patterns while elevating visual execution for the creator economy.

The architecture centers on a CSS Grid-based layout system with three semantic regions: a sticky global header, a fixed sidebar navigation, and a scrollable main content area. The visual system introduces the Electric Indigo brand identity (#6366f1), soft shadow physics, duotone iconography, and a gamified onboarding experience.

## Architecture

### High-Level Structure

The application follows a "Holy Grail" layout pattern implemented via CSS Grid Level 3:

```
┌─────────────────────────────────────────┐
│           Header (Sticky)               │
│  [Logo]  [Search]  [User Menu]         │
├──────────┬──────────────────────────────┤
│          │                              │
│ Sidebar  │     Main Content             │
│ (Fixed)  │     (Scrollable)             │
│          │                              │
│  Nav     │  [Gamified Onboarding]       │
│  Items   │  [Analytics Cards]           │
│          │  [Content Sections]          │
│          │                              │
└──────────┴──────────────────────────────┘
```

### Technology Stack

- **Layout Engine**: CSS Grid with named grid areas
- **Styling System**: CSS Custom Properties (CSS Variables)
- **Typography**: Poppins/Inter for headings, Inter/System fonts for body
- **Icons**: SVG with duotone layering technique
- **Animations**: CSS transforms and transitions (GPU-accelerated)
- **Responsive**: CSS Media Queries with mobile drawer pattern

### Key Architectural Decisions

1. **CSS Grid over Flexbox**: Two-dimensional layout requirements necessitate Grid for the macro structure
2. **Scroll Isolation**: Viewport-level overflow:hidden with internal scrolling prevents double-scrollbar issues
3. **Named Grid Areas**: Semantic clarity and maintainability over numeric positioning
4. **CSS Custom Properties**: Centralized theming and easy maintenance
5. **Mobile-First Responsive**: Sidebar collapses to drawer on screens < 1024px

## Components and Interfaces

### 1. Root Layout Container

**Component**: `.huntaze-layout`

**Responsibility**: Establishes the viewport-level grid structure

**Interface**:
```typescript
interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}
```

**CSS Structure**:
```css
.huntaze-layout {
  display: grid;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  grid-template-columns: var(--huntaze-sidebar-width) 1fr;
  grid-template-rows: var(--huntaze-header-height) 1fr;
  grid-template-areas:
    "header header"
    "sidebar main";
}
```

### 2. Global Header Component

**Component**: `.huntaze-header`

**Responsibility**: Provides persistent navigation controls, global search, and user context

**Interface**:
```typescript
interface HeaderProps {
  user: {
    name: string;
    avatar: string;
  };
  onSearchChange: (query: string) => void;
  onMenuToggle: () => void; // For mobile
}
```

**Sub-components**:
- `<Logo />`: Brand identity, links to dashboard home
- `<GlobalSearch />`: Autocomplete search with real-time results
- `<UserMenu />`: Avatar, notifications, settings dropdown

**CSS Structure**:
```css
.huntaze-header {
  grid-area: header;
  background: var(--bg-surface);
  border-bottom: 1px solid #E5E7EB;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: var(--huntaze-z-index-header);
}
```

### 3. Sidebar Navigation Component

**Component**: `.huntaze-sidebar`

**Responsibility**: Provides primary navigation with visual hierarchy and active state management

**Interface**:
```typescript
interface SidebarProps {
  navigationItems: NavigationItem[];
  activeRoute: string;
  isOpen: boolean; // For mobile
  onClose: () => void; // For mobile
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
  children?: NavigationItem[];
}
```

**CSS Structure**:
```css
.huntaze-sidebar {
  grid-area: sidebar;
  background-color: var(--bg-surface);
  border-right: 1px solid rgba(229, 231, 235, 0.5);
  display: flex;
  flex-direction: column;
  z-index: var(--huntaze-z-index-nav);
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: #E5E7EB transparent;
}
```

### 4. Navigation Item Component

**Component**: `.nav-item`

**Responsibility**: Individual navigation link with active state and duotone icon

**Interface**:
```typescript
interface NavItemProps {
  item: NavigationItem;
  isActive: boolean;
  onClick: () => void;
}
```

**CSS Structure**:
```css
.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  padding: 12px 16px;
  color: #4B5563;
  text-decoration: none;
  transition: background 0.15s ease;
  border-radius: 0 8px 8px 0;
  margin-right: 12px;
}

.nav-item.active {
  background: rgba(99, 102, 241, 0.08);
  color: var(--color-indigo);
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 10%;
  height: 80%;
  width: 3px;
  background: var(--color-indigo);
  border-radius: 0 4px 4px 0;
}
```

### 5. Main Content Area Component

**Component**: `.huntaze-main`

**Responsibility**: Scrollable content container with pale gray background

**Interface**:
```typescript
interface MainContentProps {
  children: React.ReactNode;
  className?: string;
}
```

**CSS Structure**:
```css
.huntaze-main {
  grid-area: main;
  background-color: var(--bg-app);
  padding: 32px;
  overflow-y: auto;
  scroll-behavior: smooth;
}
```

### 6. Gamified Onboarding Component

**Component**: `<GamifiedOnboarding />`

**Responsibility**: Displays personalized greeting and three action cards

**Interface**:
```typescript
interface OnboardingProps {
  userName: string;
  hasConnectedAccounts: boolean;
  onConnectAccount: () => void;
  onCreateContent: () => void;
}
```

**Sub-components**:
- `<WelcomeTitle />`: Personalized greeting
- `<ActionCard />`: Connect account card with blurred logos
- `<StatsCard />`: Potential growth visualization
- `<CreateCard />`: Content creation CTA with pulse effect

**CSS Structure**:
```css
.onboarding-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.action-card {
  background: var(--bg-surface);
  border-radius: var(--radius-card);
  padding: 24px;
  box-shadow: var(--shadow-soft);
  transition: all 0.2s ease;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}
```

### 7. Global Search Component

**Component**: `<GlobalSearch />`

**Responsibility**: Autocomplete search with focus states and real-time results

**Interface**:
```typescript
interface GlobalSearchProps {
  onSearch: (query: string) => void;
  results: SearchResult[];
  isLoading: boolean;
}

interface SearchResult {
  id: string;
  type: 'navigation' | 'stat' | 'content';
  title: string;
  subtitle?: string;
  href: string;
}
```

**CSS Structure**:
```css
.global-search {
  background: #F3F4F6;
  border-radius: 8px;
  padding: 10px 16px;
  width: 400px;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.global-search:focus-within {
  background: #FFFFFF;
  border-color: var(--color-indigo);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
```

### 8. Duotone Icon Component

**Component**: `<DuotoneIcon />`

**Responsibility**: Renders two-layer SVG icons with dynamic color control

**Interface**:
```typescript
interface DuotoneIconProps {
  name: string;
  size?: number;
  primaryColor?: string;
  secondaryColor?: string;
  className?: string;
}
```

**Implementation**:
```tsx
<svg className="huntaze-icon" viewBox="0 0 24 24">
  <path 
    className="primary" 
    d="..." 
    style={{ fill: 'var(--icon-primary)' }} 
  />
  <path 
    className="secondary" 
    d="..." 
    style={{ fill: 'var(--icon-secondary)', opacity: 0.4 }} 
  />
</svg>
```

**CSS Control**:
```css
.huntaze-nav-item {
  --icon-primary: #9CA3AF;
  --icon-secondary: #9CA3AF;
}

.huntaze-nav-item.active {
  --icon-primary: #6366f1;
  --icon-secondary: #6366f1;
}
```

## Data Models

### Navigation Structure

```typescript
interface NavigationStructure {
  sections: NavigationSection[];
}

interface NavigationSection {
  id: string;
  title: string;
  items: NavigationItem[];
}

interface NavigationItem {
  id: string;
  label: string;
  icon: string; // Icon name for duotone system
  href: string;
  badge?: number;
  isNew?: boolean;
  children?: NavigationItem[];
}
```

### User Context

```typescript
interface UserContext {
  id: string;
  name: string;
  email: string;
  avatar: string;
  hasCompletedOnboarding: boolean;
  connectedPlatforms: Platform[];
}

interface Platform {
  id: string;
  name: 'instagram' | 'tiktok' | 'youtube';
  isConnected: boolean;
  lastSync?: Date;
}
```

### Search Index

```typescript
interface SearchIndex {
  navigation: SearchableNavItem[];
  stats: SearchableStat[];
  content: SearchableContent[];
}

interface SearchableNavItem {
  id: string;
  title: string;
  keywords: string[];
  href: string;
  category: string;
}
```

### Design Tokens

```typescript
interface DesignTokens {
  colors: ColorTokens;
  spacing: SpacingTokens;
  typography: TypographyTokens;
  shadows: ShadowTokens;
  layout: LayoutTokens;
}

interface ColorTokens {
  bgApp: string;          // #F8F9FB
  bgSurface: string;      // #FFFFFF
  colorIndigo: string;    // #6366f1
  colorTextMain: string;  // #1F2937
  colorTextSub: string;   // #6B7280
}

interface LayoutTokens {
  sidebarWidth: string;   // 256px
  headerHeight: string;   // 64px
  zIndexHeader: number;   // 500
  zIndexNav: number;      // 400
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Grid Layout Viewport Dimensions
*For any* viewport size, the root layout container should consume exactly 100vh height and 100vw width with overflow hidden to prevent window scrolling.
**Validates: Requirements 1.1, 4.3**

### Property 2: Desktop Grid Column Structure
*For any* desktop viewport (≥1024px), the grid should define columns as fixed sidebar width (256px) followed by flexible content (1fr).
**Validates: Requirements 1.4**

### Property 3: Desktop Grid Row Structure
*For any* desktop viewport (≥1024px), the grid should define rows as fixed header height (64px) followed by flexible content (1fr).
**Validates: Requirements 1.5**

### Property 4: Sidebar Full Height Display
*For any* dashboard page, the sidebar should span the full viewport height and remain fixed in position.
**Validates: Requirements 2.1**

### Property 5: Sidebar Internal Scrolling
*For any* sidebar with content exceeding viewport height, the sidebar should enable internal vertical scrolling (overflow-y: auto).
**Validates: Requirements 2.2**

### Property 6: Active Navigation Item Styling
*For any* active navigation item, the system should display a 3px Electric Indigo (#6366f1) left border and fade indigo background (rgba(99, 102, 241, 0.08)).
**Validates: Requirements 2.3**

### Property 7: Inactive Navigation Item Styling
*For any* inactive navigation item, the system should display gray text (#4B5563) with transparent background.
**Validates: Requirements 2.4**

### Property 8: Navigation Item Hover Feedback
*For any* navigation item on hover, the system should provide visual feedback with smooth transitions (0.15s ease).
**Validates: Requirements 2.5**

### Property 9: Header Full Width Display
*For any* dashboard page, the header should span the full viewport width and remain sticky at the top.
**Validates: Requirements 3.1**

### Property 10: Search Input Focus State
*For any* global search input on focus, the system should apply Electric Indigo border and glow effect (box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2)).
**Validates: Requirements 3.3**

### Property 11: Header Fixed During Scroll
*For any* scroll position in main content, the header should remain fixed at the top of the viewport.
**Validates: Requirements 3.5**

### Property 12: Main Content Scroll Isolation
*For any* scroll action in main content, the sidebar and header should remain fixed in position without scrolling.
**Validates: Requirements 4.2**

### Property 13: Surface Element Color Consistency
*For any* surface element (card, container), the system should use pure white (#FFFFFF) background.
**Validates: Requirements 5.2**

### Property 14: Primary Action Color Consistency
*For any* primary action element (button, link), the system should use Electric Indigo (#6366f1) as the primary color.
**Validates: Requirements 5.3**

### Property 15: Text Color Hierarchy
*For any* text element, the system should use deep gray (#1F2937) for main text and medium gray (#6B7280) for secondary text.
**Validates: Requirements 5.4**

### Property 16: Shadow Consistency
*For any* element with shadow, the system should use the soft diffused shadow (0 4px 20px rgba(0, 0, 0, 0.05)).
**Validates: Requirements 5.5**

### Property 17: Duotone Icon Structure
*For any* navigation icon, the system should render two-layer SVG paths with primary and secondary colors.
**Validates: Requirements 6.1**

### Property 18: Inactive Icon Color
*For any* inactive navigation icon, both layers should display in gray (#9CA3AF).
**Validates: Requirements 6.2**

### Property 19: Active Icon Color
*For any* active navigation icon, both layers should display in Electric Indigo (#6366f1).
**Validates: Requirements 6.3**

### Property 20: Icon Hover Transition
*For any* navigation icon on hover, the system should transition colors smoothly.
**Validates: Requirements 6.4**

### Property 21: Empty State Visualization
*For any* new user viewing the "Latest Stats" card, the system should display a potential growth visualization instead of an empty state.
**Validates: Requirements 7.4**

### Property 22: Card Border Radius Consistency
*For any* content card, the system should apply 16px border radius.
**Validates: Requirements 8.1**

### Property 23: Card Grid Spacing
*For any* card grid layout, the system should use 24px gap between cards.
**Validates: Requirements 8.2**

### Property 24: Card Internal Padding
*For any* content card, the system should apply at least 24px internal padding.
**Validates: Requirements 8.3**

### Property 25: Interactive Card Hover Effect
*For any* interactive card on hover, the system should lift the card (translateY(-4px)) and deepen the shadow.
**Validates: Requirements 8.4**

### Property 26: Card Background Contrast
*For any* content card, the system should use white background (#FFFFFF) on the pale gray canvas (#F8F9FB).
**Validates: Requirements 8.5**

### Property 27: Mobile Sidebar Collapse
*For any* viewport width below 1024px, the sidebar should collapse off-screen (translateX(-100%)).
**Validates: Requirements 9.1**

### Property 28: Mobile Hamburger Menu Display
*For any* viewport width below 1024px, the system should display a hamburger menu icon in the header.
**Validates: Requirements 9.2**

### Property 29: Mobile Sidebar Toggle
*For any* hamburger menu click, the system should slide the sidebar into view with smooth animation (0.3s cubic-bezier).
**Validates: Requirements 9.3**

### Property 30: Mobile Sidebar Dimensions
*For any* open mobile sidebar, the system should display it at 80% viewport width with maximum 300px.
**Validates: Requirements 9.4**

### Property 31: Mobile Sidebar Shadow
*For any* open mobile sidebar, the system should apply a shadow (10px 0 25px rgba(0,0,0,0.1)).
**Validates: Requirements 9.5**

### Property 32: Heading Typography Consistency
*For any* heading element, the system should use Poppins or Inter font with font-weight 600 and color #111827.
**Validates: Requirements 10.1**

### Property 33: Body Text Typography Consistency
*For any* body text element, the system should use Inter or system font with color #1F2937.
**Validates: Requirements 10.2**

### Property 34: Pure Black Avoidance
*For any* text element, the system should avoid pure black (#000000) in favor of deep gray.
**Validates: Requirements 10.4**

### Property 35: Font Size Hierarchy
*For any* page, headings should be larger than body text, and labels should be smaller than body text.
**Validates: Requirements 10.5**

### Property 36: Search Input Unfocused State
*For any* unfocused global search input, the system should display light gray background (#F3F4F6) with no border.
**Validates: Requirements 12.2**

### Property 37: Search Input Focus Background
*For any* focused global search input, the system should change background to white and add Electric Indigo border.
**Validates: Requirements 12.3**

### Property 38: Search Input Focus Shadow
*For any* focused global search input, the system should apply a subtle shadow (0 4px 12px rgba(0,0,0,0.05)).
**Validates: Requirements 12.4**

### Property 39: Real-time Search Results
*For any* text input in global search, the system should provide real-time results for navigation items, stats, and content.
**Validates: Requirements 12.5**

### Property 40: Primary Button Gradient
*For any* primary button, the system should apply an Electric Indigo gradient (linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)).
**Validates: Requirements 13.1**

### Property 41: Button Hover Feedback
*For any* button on hover, the system should provide visual feedback with smooth transitions.
**Validates: Requirements 13.2**

### Property 42: Active Button Visual Indication
*For any* button in active state, the system should provide clear visual indication.
**Validates: Requirements 13.3**

### Property 43: Disabled Button State
*For any* disabled button, the system should reduce opacity and prevent interaction.
**Validates: Requirements 13.4**

### Property 44: Secondary Button Styling
*For any* secondary button, the system should use outline style with Electric Indigo border.
**Validates: Requirements 13.5**

### Property 45: Content Block Spacing
*For any* adjacent content blocks, the system should enforce minimum 24px gaps.
**Validates: Requirements 14.4**

### Property 46: WCAG Color Contrast
*For any* interactive element, the system should ensure sufficient color contrast ratios to meet WCAG compliance standards.
**Validates: Requirements 15.4**



## Error Handling

### Layout Rendering Errors

**Scenario**: CSS Grid not supported in legacy browsers
- **Detection**: Feature detection via `@supports (display: grid)`
- **Fallback**: Graceful degradation to Flexbox-based layout
- **User Impact**: Reduced visual polish but maintained functionality

**Scenario**: CSS Custom Properties not supported
- **Detection**: Feature detection via `CSS.supports('--test', 0)`
- **Fallback**: Inline fallback values in CSS
- **User Impact**: Fixed theme, no dynamic theming capability

### Navigation State Errors

**Scenario**: Active route not found in navigation structure
- **Detection**: Route matching fails to find corresponding nav item
- **Handling**: Default to first navigation item or dashboard home
- **User Feedback**: No visual error, graceful fallback

**Scenario**: Navigation data fails to load
- **Detection**: API error or network failure
- **Handling**: Display skeleton navigation with retry mechanism
- **User Feedback**: Loading state with retry button

### Search Functionality Errors

**Scenario**: Search API fails or times out
- **Detection**: Network error or timeout (>5s)
- **Handling**: Display cached results or error message
- **User Feedback**: "Search temporarily unavailable" with retry option

**Scenario**: Search returns no results
- **Detection**: Empty results array
- **Handling**: Display helpful message with suggestions
- **User Feedback**: "No results found. Try searching for [suggestions]"

### Mobile Drawer Errors

**Scenario**: Touch events not supported
- **Detection**: `'ontouchstart' in window` check
- **Handling**: Fall back to click events
- **User Impact**: Slightly less responsive but functional

**Scenario**: Animation performance issues
- **Detection**: Frame rate monitoring
- **Handling**: Disable animations via `prefers-reduced-motion`
- **User Impact**: Instant transitions instead of animated

### Icon Loading Errors

**Scenario**: SVG icon fails to load
- **Detection**: Missing icon in icon library
- **Handling**: Display fallback icon or text label
- **User Feedback**: Functional navigation with reduced visual polish

### Responsive Layout Errors

**Scenario**: Viewport dimensions cannot be determined
- **Detection**: `window.innerWidth` returns undefined
- **Handling**: Assume desktop layout as default
- **User Impact**: May not be optimized for actual device

## Testing Strategy

### Unit Testing Approach

The dashboard migration will use **Vitest** as the testing framework with **React Testing Library** for component testing. Unit tests will focus on:

1. **Component Rendering**: Verify each component renders with correct props
2. **CSS Property Application**: Test that design tokens are correctly applied
3. **State Management**: Verify active states, hover states, and focus states
4. **Conditional Rendering**: Test responsive behavior and empty states
5. **Event Handlers**: Verify click, hover, and focus interactions

**Example Unit Tests**:
- Sidebar renders with correct navigation items
- Active navigation item displays correct styling
- Header search input changes style on focus
- Mobile hamburger menu toggles sidebar visibility
- Cards render with correct padding and border radius

### Property-Based Testing Approach

The migration will use **fast-check** for property-based testing in JavaScript/TypeScript. Property tests will verify universal behaviors across all valid inputs.

**Property Testing Library**: fast-check (JavaScript/TypeScript)
**Test Configuration**: Minimum 100 iterations per property test
**Tagging Convention**: Each property test must include a comment with format:
`// Feature: dashboard-shopify-migration, Property {number}: {property_text}`

**Property Test Categories**:

1. **Layout Properties**: Grid dimensions, positioning, scroll behavior
2. **Color Properties**: Consistent color application across components
3. **Typography Properties**: Font hierarchy and color consistency
4. **Spacing Properties**: Consistent gaps and padding
5. **Responsive Properties**: Behavior at different viewport sizes
6. **Interaction Properties**: Hover, focus, and active states

**Example Property Tests**:
- For any viewport ≥1024px, grid columns should be "256px 1fr"
- For any navigation item, active state should have Electric Indigo color
- For any card, border radius should be 16px
- For any text element, color should never be pure black (#000000)
- For any button hover, visual feedback should be provided

### Integration Testing

Integration tests will verify that components work together correctly:

1. **Navigation Flow**: Clicking nav items updates active state and routes
2. **Search Integration**: Typing in search displays results and navigates
3. **Mobile Drawer**: Hamburger menu opens/closes sidebar correctly
4. **Scroll Isolation**: Scrolling main content doesn't affect header/sidebar
5. **Theme Application**: CSS variables propagate to all components

### Visual Regression Testing

Visual regression tests will use **Playwright** to capture screenshots and detect unintended visual changes:

1. **Desktop Layout**: Full dashboard at 1920x1080
2. **Tablet Layout**: Dashboard at 768x1024
3. **Mobile Layout**: Dashboard at 375x667
4. **Component States**: Active, hover, focus states for key components
5. **Theme Consistency**: Color and shadow application across pages

### Accessibility Testing

Accessibility tests will verify WCAG 2.1 Level AA compliance:

1. **Color Contrast**: All text meets minimum contrast ratios (4.5:1 for normal text, 3:1 for large text)
2. **Keyboard Navigation**: All interactive elements accessible via keyboard
3. **Focus Indicators**: Clear focus states for all interactive elements
4. **Screen Reader**: Semantic HTML and ARIA labels where needed
5. **Reduced Motion**: Respect `prefers-reduced-motion` preference

### Performance Testing

Performance tests will verify smooth rendering and interaction:

1. **Initial Load**: Time to interactive < 3s
2. **Scroll Performance**: Maintain 60fps during scrolling
3. **Animation Performance**: Transitions complete within specified duration
4. **Bundle Size**: CSS bundle < 50KB, JS bundle < 200KB
5. **Layout Shift**: Cumulative Layout Shift (CLS) < 0.1

### Testing Workflow

1. **Development**: Run unit tests on file save
2. **Pre-commit**: Run unit tests and linting
3. **Pull Request**: Run full test suite including property tests
4. **Pre-deployment**: Run visual regression and accessibility tests
5. **Post-deployment**: Run smoke tests on production

## Implementation Notes

### Migration Phases

The migration should be executed in phases to minimize risk:

**Phase 1: Foundation**
- Set up CSS Custom Properties system
- Implement root grid layout structure
- Create base components (Header, Sidebar, Main)

**Phase 2: Visual System**
- Apply Electric Indigo color system
- Implement soft shadow physics
- Update typography system

**Phase 3: Components**
- Build navigation with duotone icons
- Implement global search
- Create gamified onboarding cards

**Phase 4: Responsive**
- Implement mobile drawer
- Test responsive breakpoints
- Optimize touch interactions

**Phase 5: Polish**
- Add animations and transitions
- Implement hover states
- Optimize performance

**Phase 6: Migration**
- Gradually replace legacy components
- Run parallel testing (old vs new)
- Feature flag rollout

### Browser Support

**Target Browsers**:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Safari 14+
- Chrome Android 90+

**Fallbacks Required**:
- CSS Grid: Flexbox fallback for IE11 (if required)
- CSS Custom Properties: Inline fallback values
- CSS `gap`: Margin-based spacing fallback

### Performance Considerations

1. **CSS Grid Performance**: Grid is GPU-accelerated and more performant than float/position layouts
2. **CSS Variables**: Minimal performance impact, enables dynamic theming
3. **SVG Icons**: Inline SVG for duotone control, consider sprite sheet for large icon sets
4. **Animations**: Use `transform` and `opacity` for GPU acceleration
5. **Scroll Performance**: `will-change: transform` on animated elements

### Accessibility Considerations

1. **Semantic HTML**: Use `<nav>`, `<header>`, `<main>` for structure
2. **ARIA Labels**: Add labels for icon-only buttons
3. **Focus Management**: Trap focus in mobile drawer when open
4. **Keyboard Shortcuts**: Consider adding keyboard shortcuts for power users
5. **Screen Reader**: Test with VoiceOver (Safari) and NVDA (Firefox)

### Maintenance Considerations

1. **CSS Variables**: All design tokens centralized for easy updates
2. **Component Library**: Build reusable components for consistency
3. **Documentation**: Document all design tokens and component APIs
4. **Version Control**: Tag releases for easy rollback
5. **Monitoring**: Track performance metrics and user feedback

## Conclusion

This design provides a comprehensive blueprint for migrating the Huntaze dashboard to a modern, Shopify 2.0-inspired architecture. The CSS Grid-based layout system ensures robustness and maintainability, while the Electric Indigo visual system and gamified onboarding create a distinctive creator-focused experience.

The property-based testing strategy ensures that universal behaviors hold across all valid inputs, while unit tests verify specific implementations. The phased migration approach minimizes risk and allows for iterative refinement based on user feedback.

By following this design, the Huntaze dashboard will achieve the goal of "Copier, S'inspirer, Sublimer"—leveraging proven patterns while elevating the execution to create a professional, trustworthy, yet distinctly creative workspace for content creators.
