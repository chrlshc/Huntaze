# Dashboard Polish Component Library

> **Feature:** dashboard-global-polish  
> **Validates:** Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.7

A comprehensive component library for building professional, cohesive dashboard interfaces with consistent typography, spacing, micro-interactions, and accessibility standards.

## Table of Contents

- [Overview](#overview)
- [Design Principles](#design-principles)
- [Components](#components)
  - [StatCard](#statcard)
  - [InfoCard](#infocard)
  - [TagChip](#tagchip)
  - [Button](#button)
  - [PageLayout](#pagelayout)
  - [SegmentCard](#segmentcard)
  - [FilterPill](#filterpill)
  - [FilterIndicator](#filterindicator)
- [Design Tokens](#design-tokens)
- [Accessibility](#accessibility)
- [Best Practices](#best-practices)

---

## Overview

The Dashboard Polish Component Library provides a set of reusable, accessible components designed for building professional SaaS dashboard interfaces. Inspired by best-in-class products like Stripe, Linear, and Shopify, these components implement:

- **Consistent Typography Scale**: H1 (24px), H2 (18px), Labels (11px uppercase), Body (14px), Secondary (12-13px)
- **4px/8px Spacing Grid**: Systematic spacing for visual rhythm
- **Micro-interactions**: Subtle hover, focus, and click states for tactile feedback
- **WCAG AA Compliance**: Minimum 4.5:1 contrast ratios and visible focus indicators
- **Responsive Design**: Mobile-first approach with tablet and desktop optimizations

---

## Design Principles

### 1. Typography Hierarchy
All components use a consistent typography scale defined in `dashboard-polish-tokens.css`:
- **H1**: 24px, 600 weight - Page titles
- **H2**: 18px, 600 weight - Section headers
- **Labels**: 11px, 500 weight, uppercase, 0.05em letter-spacing - Status labels
- **Body**: 14px, 400 weight - Normal text
- **Secondary**: 12-13px, 400 weight - Metadata, timestamps

### 2. Spacing Grid
All spacing values are multiples of 4px:
- **xs**: 4px - Small gaps
- **sm**: 8px - Small gaps
- **md**: 16px - Section spacing
- **lg**: 24px - Section spacing
- **xl**: 32px - Major block spacing

### 3. Micro-interactions
Every interactive element provides tactile feedback:
- **Hover**: `translateY(-1px)` + subtle shadow
- **Focus**: Visible focus ring (2px solid rgba(139, 92, 246, 0.5))
- **Click**: `scale(0.99)` for tactile feedback

### 4. Accessibility
- Minimum 4.5:1 contrast ratio for all text
- Visible focus indicators for keyboard navigation
- ARIA labels and semantic HTML
- Reduced motion support
- High contrast mode support

---

## Components

### StatCard

Displays a key metric with label, value, and optional delta/trend indicator.

#### Props

```typescript
interface StatCardProps {
  /** Label displayed above the value */
  label: string;
  /** Main value to display */
  value: string | number;
  /** Optional icon element */
  icon?: React.ReactNode;
  /** Optional delta/trend indicator */
  delta?: {
    value: string | number;
    trend: 'up' | 'down' | 'neutral';
  };
  /** Visual variant for the card */
  variant?: 'default' | 'success' | 'warning' | 'error';
  /** Additional class names */
  className?: string;
}
```

#### Design Specifications

- **Background**: `#FFFFFF`
- **Border**: `1px solid #E3E3E3`
- **Border radius**: `12px`
- **Padding**: `10-12px`
- **Label**: `11px uppercase, #9CA3AF, 0.05em letter-spacing`
- **Value**: `20px, 600 weight, #111111`
- **Delta**: `12px, color-coded (#16A34A positive, #DC2626 negative)`
- **Hover**: `border #D0D0D0, shadow 0 2px 8px rgba(0, 0, 0, 0.06)`

#### Usage Examples

```tsx
// Basic stat card
<StatCard
  label="Total Revenue"
  value="$12,450"
/>

// With icon
<StatCard
  label="Active Fans"
  value={245}
  icon={<UsersIcon />}
/>

// With positive trend
<StatCard
  label="Conversion Rate"
  value="3.2%"
  delta={{ value: "+12%", trend: "up" }}
/>

// With negative trend
<StatCard
  label="Churn Rate"
  value="1.8%"
  delta={{ value: "-5%", trend: "down" }}
  variant="warning"
/>
```

#### Accessibility

- **Role**: `region` with descriptive `aria-label`
- **Keyboard**: Focusable with `tabIndex={0}`
- **Screen readers**: Delta trends announced as "increased by" or "decreased by"
- **Focus indicator**: Visible 2px violet ring

---

### InfoCard

Displays informational content with icon, title, and description in a compact format.

#### Props

```typescript
interface InfoCardProps {
  /** Icon element to display */
  icon: React.ReactNode;
  /** Card title */
  title: string;
  /** Card description (max 2 lines) */
  description: string;
  /** Optional click handler */
  onClick?: () => void;
  /** Additional class names */
  className?: string;
}
```

#### Design Specifications

- **Background**: `#FFFFFF`
- **Border**: `1px solid #E3E3E3`
- **Border radius**: `12px`
- **Padding**: `12-14px`
- **Icon**: `32px circular, #EEF2FF background, #5B6BFF color`
- **Title**: `14px, 600 weight, #111111`
- **Description**: `13px, #6B7280, 2-line clamp`
- **Gap**: `12px between icon and content`
- **Hover**: `background #F9FAFF, border #D0D0D0`

#### Usage Examples

```tsx
// Basic info card
<InfoCard
  icon={<LightbulbIcon />}
  title="Quick Tip"
  description="Use smart rules to automate responses to new subscribers"
/>

// Interactive info card
<InfoCard
  icon={<RocketIcon />}
  title="Get Started"
  description="Create your first automation in under 2 minutes"
  onClick={() => navigate('/automations/new')}
/>

// Highlight card
<InfoCard
  icon={<TrendingUpIcon />}
  title="Revenue Up 23%"
  description="Your PPV campaigns are performing exceptionally well this month"
/>
```

#### Accessibility

- **Role**: `button` when `onClick` is provided
- **Keyboard**: Enter and Space key support
- **Screen readers**: Combined `aria-label` with title and description
- **Focus indicator**: Visible 2px violet ring

---

### TagChip

Displays status, category, or tier information as a compact, colored pill.

#### Props

```typescript
type TagVariant =
  | 'vip'
  | 'active'
  | 'at-risk'
  | 'churned'
  | 'low'
  | 'medium'
  | 'high'
  | 'nouveau';

type TagSize = 'sm' | 'md';

interface TagChipProps {
  /** Label text to display */
  label: string;
  /** Visual variant determining colors */
  variant: TagVariant;
  /** Size variant */
  size?: TagSize;
  /** Additional class names */
  className?: string;
}
```

#### Design Specifications

**Tier Variants** (Requirements 8.1, 8.2, 8.3):
- **VIP**: Violet-tinted (`rgba(139, 92, 246, 0.1)` background, `#8b5cf6` text)
- **Active**: Blue-tinted (`rgba(59, 130, 246, 0.1)` background, `#3b82f6` text)
- **At-Risk**: Orange-tinted (`rgba(245, 158, 11, 0.1)` background, `#f59e0b` text)
- **Churned**: Gray-tinted (`rgba(107, 114, 128, 0.1)` background, `#6b7280` text)

**Churn Risk Variants** (Requirements 8.4, 8.5, 8.6):
- **Low**: Green (`rgba(16, 185, 129, 0.1)` background, `#10b981` text)
- **Medium**: Orange (`rgba(245, 158, 11, 0.1)` background, `#f59e0b` text)
- **High**: Red (`rgba(239, 68, 68, 0.1)` background, `#ef4444` text)

**Sizing**:
- **sm**: `10px font, 2-6px vertical padding, 6-8px horizontal padding`
- **md**: `11px font, 4-8px vertical padding, 6-8px horizontal padding`

#### Usage Examples

```tsx
// Tier status
<TagChip label="VIP" variant="vip" />
<TagChip label="Active" variant="active" />
<TagChip label="At-Risk" variant="at-risk" />
<TagChip label="Churned" variant="churned" />

// Churn risk indicators
<TagChip label="Low" variant="low" size="sm" />
<TagChip label="Medium" variant="medium" size="sm" />
<TagChip label="High" variant="high" size="sm" />

// In a table cell
<td>
  <TagChip label={fan.tier} variant={fan.tier.toLowerCase()} />
</td>
```

#### Accessibility

- **Role**: `status` for screen reader announcements
- **ARIA label**: Includes both label and status type (e.g., "VIP - VIP status")
- **Visual indicators**: Icons in addition to color for non-color identification
- **Contrast**: All variants meet WCAG AA 4.5:1 minimum

---

### Button

Enhanced button component with micro-interactions for professional, tactile feedback.

#### Props

```typescript
type ButtonVariant = 
  | "primary" 
  | "secondary" 
  | "outline" 
  | "ghost" 
  | "tonal" 
  | "danger" 
  | "gradient" 
  | "link";

type ButtonSize = "sm" | "md" | "lg" | "xl" | "pill";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}
```

#### Design Specifications

**Micro-interactions** (Requirements 3.2, 3.4, 3.5, 4.3, 4.5):
- **Hover**: Box-shadow for depth perception
- **Focus**: Visible focus ring for keyboard navigation (2px solid rgba(139, 92, 246, 0.8))
- **Click**: `scale(0.99)` for tactile feedback
- **Typography**: White text with font-weight 500-600 on colored backgrounds

**Variants**:
- **Primary**: Solid background + white text + hover shadow
- **Secondary**: Visible border + subtle background + hover shadow
- **Outline**: Clear border + transparent background + hover shadow
- **Ghost**: Minimal with clear hover state + subtle shadow
- **Tonal**: Subtle background + border + hover shadow
- **Danger**: High contrast error color + white text + hover shadow
- **Gradient**: Eye-catching + white text + hover shadow
- **Link**: Color + underline for clear affordance

**Sizes**:
- **sm**: `h-8, min-h-44px (touch target), px-3, text-xs`
- **md**: `h-44px, px-4, text-sm`
- **lg**: `h-12, px-6, text-base`
- **xl**: `h-14, px-7, text-base`
- **pill**: `h-11, rounded-full, px-6, text-sm`

#### Usage Examples

```tsx
// Primary action
<Button variant="primary">
  Create New Rule
</Button>

// Secondary action
<Button variant="secondary">
  Cancel
</Button>

// Outline button
<Button variant="outline">
  Learn More
</Button>

// Danger action
<Button variant="danger">
  Delete Campaign
</Button>

// Loading state
<Button variant="primary" loading>
  Saving...
</Button>

// Different sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
<Button size="pill">Pill Shape</Button>
```

#### Accessibility

- **Focus indicator**: Visible 2px violet ring with 2px offset
- **Loading state**: `aria-busy` attribute
- **Disabled state**: `aria-disabled` attribute
- **Touch target**: Minimum 44px height (WCAG compliance)
- **Keyboard**: Full keyboard support (Enter, Space)

---

### PageLayout

Unified page layout component with consistent header structure, filters section, and content area.

#### Props

```typescript
interface PageLayoutProps {
  /** Page title displayed in H1 style (24px semi-bold) */
  title: string;
  /** Optional subtitle displayed in label style (11px uppercase) */
  subtitle?: string;
  /** Action buttons or controls to display in header */
  actions?: React.ReactNode;
  /** Filters section content */
  filters?: React.ReactNode;
  /** Page content */
  children: React.ReactNode;
  /** Additional CSS classes for the container */
  className?: string;
}
```

#### Design Specifications

- **Header margin**: `32px` (`--polish-header-margin`)
- **Section gap**: `24px` (`--polish-section-gap`)
- **Title**: H1 styling (24px semi-bold)
- **Subtitle**: Label styling (11px uppercase with letter-spacing)
- **Max width**: `1400px`
- **Padding**: `24px`

#### Usage Examples

```tsx
// Basic page layout
<PageLayout title="Smart Messages">
  <ContentArea />
</PageLayout>

// With subtitle
<PageLayout
  title="Centralize your message automations"
  subtitle="AUTOMATIONS"
>
  <ContentArea />
</PageLayout>

// With actions
<PageLayout
  title="Fans"
  actions={
    <>
      <Button variant="secondary">Export</Button>
      <Button variant="primary">Add Fan</Button>
    </>
  }
>
  <ContentArea />
</PageLayout>

// With filters
<PageLayout
  title="PPV Content"
  filters={
    <>
      <FilterPill label="Active" onRemove={() => {}} />
      <Button variant="outline">
        Filters
        <FilterIndicator />
      </Button>
    </>
  }
>
  <ContentArea />
</PageLayout>

// Complete example
<PageLayout
  title="Smart Messages"
  subtitle="AUTOMATIONS"
  actions={<Button variant="primary">New Rule</Button>}
  filters={<FilterPill label="Active" onRemove={() => {}} />}
>
  <RulesList />
</PageLayout>
```

#### Accessibility

- **Semantic HTML**: Uses `<header>` and `<main>` elements
- **Responsive**: Mobile-first with tablet and desktop optimizations
- **Focus management**: Proper focus order through header, filters, content
- **Reduced motion**: Respects `prefers-reduced-motion`

---

### SegmentCard

Displays a fan segment with count and optional percentage for filtering.

#### Props

```typescript
interface SegmentCardProps {
  /** Segment label (e.g., "ALL FANS", "VIP", "AT-RISK") */
  label: string;
  /** Total count for this segment */
  count: number;
  /** Optional percentage (shown for non-ALL segments) */
  percentage?: number;
  /** Whether this segment is currently active/selected */
  isActive?: boolean;
  /** Click handler for segment selection */
  onClick: () => void;
  /** Additional class names */
  className?: string;
}
```

#### Design Specifications

- **Label**: `11px uppercase, letter-spacing 0.05em`
- **Count**: `24px, 600 weight`
- **Percentage**: `12px, secondary color`
- **Active state**: Violet border (2px), subtle background (`rgba(139, 92, 246, 0.05)`)
- **Hover**: `translateY(-1px)`, shadow
- **Focus**: Visible focus indicator

#### Usage Examples

```tsx
// All fans segment (no percentage)
<SegmentCard
  label="ALL FANS"
  count={245}
  isActive={selectedSegment === 'all'}
  onClick={() => setSelectedSegment('all')}
/>

// VIP segment with percentage
<SegmentCard
  label="VIP"
  count={98}
  percentage={40}
  isActive={selectedSegment === 'vip'}
  onClick={() => setSelectedSegment('vip')}
/>

// At-risk segment
<SegmentCard
  label="AT-RISK"
  count={24}
  percentage={10}
  isActive={selectedSegment === 'at-risk'}
  onClick={() => setSelectedSegment('at-risk')}
/>

// In a grid layout
<div className="segment-cards-grid">
  {segments.map(segment => (
    <SegmentCard
      key={segment.id}
      label={segment.label}
      count={segment.count}
      percentage={segment.percentage}
      isActive={selectedSegment === segment.id}
      onClick={() => setSelectedSegment(segment.id)}
    />
  ))}
</div>
```

#### Accessibility

- **Role**: `button` with `aria-pressed` state
- **Keyboard**: Full keyboard support
- **Focus indicator**: Visible 2px violet ring
- **Screen readers**: Announces label, count, percentage, and active state

---

### FilterPill

Displays an active filter with a label and remove button.

#### Props

```typescript
interface FilterPillProps {
  /** Filter label (e.g., "VIP", "At-Risk") */
  label: string;
  /** Callback when remove button is clicked */
  onRemove: () => void;
  /** Additional CSS classes */
  className?: string;
}
```

#### Design Specifications

- **Background**: `rgba(139, 92, 246, 0.1)` - subtle violet tint
- **Border**: `rgba(139, 92, 246, 0.3)` - violet border
- **Padding**: `6px 12px`
- **Border radius**: `8px`
- **Label**: `12px, 500 weight`
- **Remove button**: `14px icon, hover state`
- **Focus**: Visible focus indicator on remove button

#### Usage Examples

```tsx
// Basic filter pill
<FilterPill
  label="VIP"
  onRemove={() => clearFilter()}
/>

// Multiple active filters
<div className="active-filters">
  {activeFilters.map(filter => (
    <FilterPill
      key={filter.id}
      label={filter.label}
      onRemove={() => removeFilter(filter.id)}
    />
  ))}
</div>

// In page layout filters section
<PageLayout
  title="Fans"
  filters={
    <>
      {selectedSegment && (
        <FilterPill
          label={selectedSegment}
          onRemove={() => setSelectedSegment(null)}
        />
      )}
      <Button variant="outline">More Filters</Button>
    </>
  }
>
  <FansTable />
</PageLayout>
```

#### Accessibility

- **Remove button**: Descriptive `aria-label` (e.g., "Remove VIP filter")
- **Keyboard**: Full keyboard support for remove button
- **Focus indicator**: Visible focus ring on remove button
- **Screen readers**: Announces filter name and removal action

---

### FilterIndicator

Displays a violet dot indicator on filter buttons when filters are active.

#### Props

```typescript
interface FilterIndicatorProps {
  /** Additional CSS classes */
  className?: string;
}
```

#### Design Specifications

- **Size**: `6px circle`
- **Color**: `var(--accent-primary)` - violet
- **Border**: `1px solid var(--bg-primary)` - creates separation from button
- **Position**: Absolute positioning (top-right of parent button)
- **Visibility**: Only shown when filters are active

#### Usage Examples

```tsx
// On filter button
<button className="filter-button">
  Filters
  {hasActiveFilters && <FilterIndicator />}
</button>

// With button component
<Button variant="outline" className="relative">
  All Status
  {statusFilter !== 'all' && <FilterIndicator />}
</Button>

// Multiple filter buttons
<div className="filter-buttons">
  <Button variant="outline" className="relative">
    Status
    {hasStatusFilter && <FilterIndicator />}
  </Button>
  <Button variant="outline" className="relative">
    Date Range
    {hasDateFilter && <FilterIndicator />}
  </Button>
  <Button variant="outline" className="relative">
    Category
    {hasCategoryFilter && <FilterIndicator />}
  </Button>
</div>
```

#### Accessibility

- **Role**: `status` for screen reader announcements
- **ARIA label**: "Active filters applied"
- **Visual only**: Supplementary indicator, not sole means of conveying information
- **Parent button**: Should have descriptive text indicating filter state

---

## Design Tokens

All components use design tokens from `dashboard-polish-tokens.css` for consistency:

### Typography Tokens

```css
--polish-text-h1: 24px;
--polish-text-h1-weight: 600;
--polish-text-h2: 18px;
--polish-text-h2-weight: 600;
--polish-text-label: 11px;
--polish-text-label-weight: 500;
--polish-text-label-spacing: 0.05em;
--polish-text-body: 14px;
--polish-text-secondary: 12px;
```

### Spacing Tokens

```css
--polish-space-xs: 4px;
--polish-space-sm: 8px;
--polish-space-md: 16px;
--polish-space-lg: 24px;
--polish-space-xl: 32px;
--polish-card-padding: 16px;
--polish-section-gap: 24px;
--polish-header-margin: 32px;
```

### Interaction Tokens

```css
--polish-hover-translate: -1px;
--polish-hover-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
--polish-hover-transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
--polish-focus-ring: 2px solid rgba(139, 92, 246, 0.5);
--polish-focus-offset: 2px;
--polish-click-scale: 0.99;
--polish-click-transition: transform 100ms ease;
```

### Color Tokens

```css
/* Trend indicators */
--polish-trend-positive-color: #10b981;
--polish-trend-negative-color: #ef4444;

/* Tag chip variants */
--polish-chip-vip-color: #8b5cf6;
--polish-chip-active-color: #3b82f6;
--polish-chip-at-risk-color: #f59e0b;
--polish-chip-churned-color: #6b7280;
--polish-chip-low-color: #10b981;
--polish-chip-medium-color: #f59e0b;
--polish-chip-high-color: #ef4444;
```

---

## Accessibility

All components in this library meet WCAG AA accessibility standards:

### Contrast Requirements

- **Normal text**: Minimum 4.5:1 contrast ratio
- **Large text** (18px+ or 14px+ bold): Minimum 3:1 contrast ratio
- **UI components**: Minimum 3:1 contrast ratio for borders and states

### Keyboard Navigation

- All interactive elements are keyboard accessible
- Visible focus indicators on all focusable elements
- Logical tab order through components
- Enter and Space key support for buttons and interactive cards

### Screen Reader Support

- Semantic HTML elements (`<button>`, `<header>`, `<main>`)
- Descriptive ARIA labels for all interactive elements
- ARIA roles for status indicators (`role="status"`)
- ARIA states for toggleable elements (`aria-pressed`, `aria-expanded`)

### Motion and Animation

- Respects `prefers-reduced-motion` user preference
- All animations can be disabled
- No essential information conveyed through motion alone

### High Contrast Mode

- Increased border widths in high contrast mode
- Stronger focus indicators
- Bolder typography weights

---

## Best Practices

### Component Composition

```tsx
// ✅ Good: Compose components for consistent layouts
<PageLayout
  title="Dashboard"
  subtitle="OVERVIEW"
  actions={<Button variant="primary">New Campaign</Button>}
>
  <div className="stats-grid">
    <StatCard label="Revenue" value="$12,450" delta={{ value: "+12%", trend: "up" }} />
    <StatCard label="Fans" value={245} delta={{ value: "+8", trend: "up" }} />
    <StatCard label="Conversion" value="3.2%" delta={{ value: "-0.3%", trend: "down" }} />
  </div>
</PageLayout>

// ❌ Bad: Inconsistent spacing and typography
<div style={{ padding: '20px' }}>
  <h1 style={{ fontSize: '26px' }}>Dashboard</h1>
  <div style={{ marginTop: '15px' }}>
    <StatCard label="Revenue" value="$12,450" />
  </div>
</div>
```

### Spacing Consistency

```tsx
// ✅ Good: Use spacing tokens
<div style={{ gap: 'var(--polish-space-lg)' }}>
  <StatCard />
  <StatCard />
</div>

// ❌ Bad: Arbitrary spacing values
<div style={{ gap: '23px' }}>
  <StatCard />
  <StatCard />
</div>
```

### Typography Consistency

```tsx
// ✅ Good: Use typography tokens
<h1 className="polish-h1">Page Title</h1>
<span className="polish-label">STATUS</span>

// ❌ Bad: Inline styles with arbitrary values
<h1 style={{ fontSize: '25px', fontWeight: 550 }}>Page Title</h1>
<span style={{ fontSize: '10.5px' }}>STATUS</span>
```

### Accessibility

```tsx
// ✅ Good: Descriptive labels and keyboard support
<Button
  variant="primary"
  onClick={handleSave}
  aria-label="Save changes to campaign"
>
  Save
</Button>

// ❌ Bad: Missing accessibility attributes
<div onClick={handleSave} style={{ cursor: 'pointer' }}>
  Save
</div>
```

### Performance

```tsx
// ✅ Good: Memoized components prevent unnecessary re-renders
const MemoizedStatCard = React.memo(StatCard);

// ✅ Good: Use loading states
<Button variant="primary" loading={isSaving}>
  Save
</Button>

// ❌ Bad: No loading feedback
<Button variant="primary" onClick={handleSave}>
  Save
</Button>
```

---

## Related Documentation

- [Design Tokens Reference](../../styles/dashboard-polish-tokens.css)
- [Accessibility Guidelines](../accessibility/README.md)
- [Component Testing Guide](../../tests/unit/dashboard-polish/README.md)
- [Visual Regression Tests](../../tests/visual/dashboard-polish/README.md)

---

## Support

For questions or issues with these components:

1. Check the [component examples](./examples/)
2. Review the [design tokens](../../styles/dashboard-polish-tokens.css)
3. See the [test files](../../tests/unit/dashboard-polish/) for usage patterns
4. Open an issue in the project repository

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Maintainer**: Dashboard Team
