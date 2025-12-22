# PageLayout Component

**Feature:** dashboard-global-polish  
**Validates:** Requirements 1.1, 1.2, 1.4, 2.4, 12.5

## Overview

The `PageLayout` component provides a unified, consistent layout structure for all dashboard pages. It implements the dashboard polish design system with proper typography scale, spacing grid, and semantic HTML structure.

## Design Specifications

- **Header margin:** 32px (`--polish-header-margin`)
- **Section gap:** 24px (`--polish-section-gap`)
- **Title typography:** H1 style (24px semi-bold)
- **Subtitle typography:** Label style (11px uppercase with letter-spacing)

## Props

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

## Usage Examples

### Basic Page

```tsx
import { PageLayout } from '@/components/ui/PageLayout';

export function DashboardPage() {
  return (
    <PageLayout title="Dashboard">
      <div>Your dashboard content here</div>
    </PageLayout>
  );
}
```

### Page with Subtitle (Section Label)

```tsx
<PageLayout
  title="Centralize your message automations"
  subtitle="AUTOMATIONS"
>
  <SmartMessagesContent />
</PageLayout>
```

### Page with Actions

```tsx
<PageLayout
  title="Fans"
  actions={
    <>
      <button className="secondary-button">Export</button>
      <button className="primary-button">Add Fan</button>
    </>
  }
>
  <FansTable />
</PageLayout>
```

### Page with Filters

```tsx
<PageLayout
  title="PPV Content"
  filters={
    <div className="filter-controls">
      <button>All Status</button>
      <button>Active</button>
      <button>Draft</button>
    </div>
  }
>
  <PPVCampaignsGrid />
</PageLayout>
```

### Complete Example (All Props)

```tsx
<PageLayout
  title="Fans"
  subtitle="AUDIENCE"
  actions={
    <>
      <button className="secondary-button">Export</button>
      <button className="primary-button">Add Fan</button>
    </>
  }
  filters={
    <FilterPill label="VIP" onRemove={() => clearFilter()} />
  }
>
  <div>
    <SegmentCards />
    <FansTable />
  </div>
</PageLayout>
```

## Structure

The component renders the following structure:

```html
<div class="page-layout">
  <header class="page-layout-header">
    <div class="page-layout-header-content">
      <span class="page-layout-subtitle">SECTION</span>
      <h1 class="page-layout-title">Page Title</h1>
    </div>
    <div class="page-layout-actions">
      <!-- Action buttons -->
    </div>
  </header>
  
  <div class="page-layout-filters">
    <!-- Filter controls -->
  </div>
  
  <main class="page-layout-content">
    <!-- Page content -->
  </main>
</div>
```

## CSS Classes

### Container
- `.page-layout` - Main container with max-width and padding

### Header Section
- `.page-layout-header` - Header container with flexbox layout
- `.page-layout-header-content` - Title and subtitle wrapper
- `.page-layout-subtitle` - Subtitle with label styling (11px uppercase)
- `.page-layout-title` - Title with H1 styling (24px semi-bold)
- `.page-layout-actions` - Actions container

### Filters Section
- `.page-layout-filters` - Filters container with flexbox layout

### Content Section
- `.page-layout-content` - Main content area with semantic `<main>` tag

## Typography Scale

The component uses the dashboard polish typography tokens:

| Element | Token | Size | Weight | Transform |
|---------|-------|------|--------|-----------|
| Title | `--polish-text-h1` | 24px | 600 | none |
| Subtitle | `--polish-text-label` | 11px | 500 | uppercase |

## Spacing Grid

The component uses the dashboard polish spacing tokens:

| Element | Token | Value |
|---------|-------|-------|
| Header margin | `--polish-header-margin` | 32px |
| Section gap | `--polish-section-gap` | 24px |
| Content padding | `--polish-content-padding` | 24px |

## Responsive Behavior

### Tablet (≤768px)
- Header becomes vertical stack
- Actions take full width
- Reduced padding (16px)
- Reduced header margin (24px)

### Mobile (≤480px)
- Further reduced padding (8px)
- Reduced header margin (16px)
- Reduced section gaps (16px)
- Slightly smaller title (20px)

## Accessibility

### Semantic HTML
- Uses `<header>` for page header
- Uses `<h1>` for page title
- Uses `<main>` for content area

### Keyboard Navigation
- All interactive elements in actions/filters are keyboard accessible
- Focus indicators visible on all interactive elements

### Screen Readers
- Proper heading hierarchy (H1 for page title)
- Semantic structure for easy navigation
- Test IDs for automated testing

### Reduced Motion
- Respects `prefers-reduced-motion` preference
- Disables animations when requested

### High Contrast
- Increases font weights in high contrast mode
- Maintains readability in all contrast modes

## Testing

The component includes comprehensive unit tests covering:

- Basic structure rendering
- Conditional rendering of optional props
- Typography requirements
- Spacing requirements
- Accessibility features
- Custom className support

Run tests:
```bash
npm run test -- tests/unit/dashboard-polish/page-layout.test.tsx --run
```

## Integration with Other Components

The PageLayout component is designed to work seamlessly with:

- **StatCard** - For KPI displays
- **SegmentCard** - For fan segment cards
- **FilterPill** - For active filter indicators
- **FilterIndicator** - For filter status dots
- **TagChip** - For status badges
- **EmptyState** - For empty state displays

## Requirements Validation

| Requirement | Description | Implementation |
|-------------|-------------|----------------|
| 1.1 | Typography scale consistency | Uses `--polish-text-h1` for title |
| 1.2 | H1 styling for page titles | Title uses 24px semi-bold |
| 1.4 | Label styling for status labels | Subtitle uses 11px uppercase |
| 2.4 | Major block spacing (32px) | Header margin: 32px |
| 12.5 | PageLayout component with consistent structure | Complete implementation |

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance

- Minimal re-renders (no internal state)
- CSS-based styling (no runtime calculations)
- Optimized for responsive layouts
- Lazy loading compatible

## Related Components

- [StatCard](./StatCard.md)
- [SegmentCard](./SegmentCard.md)
- [FilterPill](./FilterPill.md)
- [TagChip](./TagChip.md)

## Migration Guide

If migrating from the old `components/layout/PageLayout.tsx`:

1. Import from new location: `@/components/ui/PageLayout`
2. Remove `breadcrumbs` prop (not in polish spec)
3. Add `subtitle` prop for section labels
4. Update CSS imports to use polish tokens
5. Test responsive behavior

## Changelog

### v1.0.0 (2024-12-11)
- Initial implementation for dashboard-global-polish
- Typography scale with H1 and label styles
- Spacing grid with 32px header margin and 24px section gap
- Responsive behavior for tablet and mobile
- Accessibility features (semantic HTML, keyboard navigation)
- Comprehensive unit tests
