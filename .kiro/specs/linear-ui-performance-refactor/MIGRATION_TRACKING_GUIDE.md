# Migration Tracking System Guide

## Overview

The migration tracking system provides a structured way to manage the progressive migration from legacy styles to the new Linear UI design system. It tracks the status of each component, monitors progress, and helps prioritize migration work.

**Part of:** linear-ui-performance-refactor  
**Requirements:** 11.1, 11.2

## Architecture

The migration tracking system consists of:

1. **Type Definitions** (`types/migration.ts`) - TypeScript interfaces for type safety
2. **Tracker Data** (`.kiro/specs/linear-ui-performance-refactor/migration-tracker.json`) - JSON database of migration status
3. **Utility Functions** (`lib/utils/migration-tracker.ts`) - Functions to read/write tracker data
4. **CLI Tool** (`scripts/migration-tracker.ts`) - Command-line interface for developers

## Quick Start

### View Migration Status

```bash
npm run migration:status
```

Shows overall progress, breakdown by category and priority, and a visual progress bar.

### See Next Components to Migrate

```bash
npm run migration:next
```

Lists the top 5 components that should be migrated next, sorted by priority.

### Generate Full Report

```bash
npm run migration:report
```

Generates a comprehensive markdown report of migration progress.

### List All Components

```bash
npm run migration:list
```

Lists all components being tracked. Optionally filter by status:

```bash
npm run migration:list legacy
npm run migration:list in-progress
npm run migration:list migrated
```

### Update Component Status

```bash
npm run migration:update <component-id> <status> [notes]
```

Example:
```bash
npm run migration:update landing-page in-progress "Started migration"
npm run migration:update landing-page migrated "Completed migration with all design tokens"
```

Valid statuses: `legacy`, `in-progress`, `migrated`

## Migration Workflow

### 1. Identify Component to Migrate

Use `npm run migration:next` to see which components should be migrated next based on priority.

### 2. Mark as In Progress

```bash
npm run migration:update <component-id> in-progress "Starting migration"
```

This automatically sets the `startedDate` timestamp.

### 3. Perform Migration

Apply the design system features:

- ✅ Use design tokens from `styles/linear-design-tokens.css`
- ✅ Wrap content in `CenteredContainer` component
- ✅ Add skeleton loading states with `SkeletonScreen`
- ✅ Apply lazy loading for heavy components (>50KB)
- ✅ Follow 4px spacing grid
- ✅ Use Midnight Violet color palette
- ✅ Use Inter typography

### 4. Mark as Migrated

```bash
npm run migration:update <component-id> migrated "Migration complete"
```

This automatically sets the `completedDate` timestamp.

### 5. Verify Migration

Run the property-based tests to verify the component follows the design system:

```bash
npm run test:unit tests/unit/design-tokens/
npm run test:unit tests/unit/components/layout-constraints.property.test.tsx
```

## Migration Entry Structure

Each component being tracked has the following information:

```typescript
{
  "id": "dashboard-page",                    // Unique identifier
  "name": "Dashboard Page",                  // Display name
  "path": "app/(app)/dashboard/page.tsx",    // File path
  "status": "migrated",                      // Current status
  "category": "dashboard",                   // Component category
  "priority": "high",                        // Migration priority
  "features": {                              // Design system features applied
    "usesDesignTokens": true,
    "usesCenteredContainer": true,
    "usesSkeletonScreens": true,
    "usesLazyLoading": false,
    "uses4pxGrid": true,
    "usesMidnightViolet": true,
    "usesInterFont": true
  },
  "startedDate": "2024-11-23T00:00:00.000Z", // When migration started
  "completedDate": "2024-11-23T00:00:00.000Z", // When migration completed
  "notes": "Main dashboard migrated",        // Migration notes
  "requirements": ["1.1", "1.2", ...],       // Related requirements
  "tasks": ["6"]                             // Related tasks
}
```

## Categories

Components are organized into categories:

- **page** - Full page components
- **layout** - Layout components (containers, wrappers)
- **form** - Form components (inputs, buttons)
- **ui** - UI components (cards, modals, etc.)
- **marketing** - Marketing pages (landing, about, pricing)
- **dashboard** - Dashboard-specific components

## Priority Levels

Migration priority determines the order of migration:

- **high** - Critical components (dashboard, landing page, high-traffic pages)
- **medium** - Important but not critical (settings, profile)
- **low** - Nice-to-have (admin pages, rarely-used features)

## Design System Features

Each component tracks which design system features have been applied:

### usesDesignTokens
Component uses CSS custom properties from `styles/linear-design-tokens.css` instead of hardcoded values.

```css
/* ❌ Before */
.component {
  background-color: #0F0F10;
  padding: 24px;
}

/* ✅ After */
.component {
  background-color: var(--color-bg-app);
  padding: var(--spacing-6);
}
```

### usesCenteredContainer
Component is wrapped in `CenteredContainer` for proper layout constraints.

```tsx
/* ❌ Before */
<div className="w-full">
  <Content />
</div>

/* ✅ After */
<CenteredContainer maxWidth="lg">
  <Content />
</CenteredContainer>
```

### usesSkeletonScreens
Component implements skeleton loading states.

```tsx
/* ✅ After */
{isLoading ? (
  <SkeletonScreen variant="dashboard" />
) : (
  <DashboardContent />
)}
```

### usesLazyLoading
Heavy components (>50KB) are lazy loaded.

```tsx
/* ✅ After */
const HeavyChart = lazy(() => import('./HeavyChart'));

<Suspense fallback={<SkeletonScreen variant="card" />}>
  <HeavyChart />
</Suspense>
```

### uses4pxGrid
All spacing values are multiples of 4px.

```css
/* ❌ Before */
.component {
  margin: 15px;
  padding: 22px;
}

/* ✅ After */
.component {
  margin: var(--spacing-4);  /* 16px */
  padding: var(--spacing-6); /* 24px */
}
```

### usesMidnightViolet
Component uses the Midnight Violet color palette.

```css
/* ✅ After */
.component {
  background: var(--color-bg-app);      /* #0F0F10 */
  color: var(--color-text-primary);     /* #EDEDEF */
  border-color: var(--color-border-subtle); /* #2E2E33 */
}

.button-primary {
  background: var(--color-accent-primary); /* #7D57C1 */
}
```

### usesInterFont
Component uses Inter font family.

```css
/* ✅ After */
.component {
  font-family: var(--font-family-base); /* 'Inter', sans-serif */
  font-weight: var(--font-weight-regular); /* 400 */
}

h1, h2, h3 {
  font-weight: var(--font-weight-medium); /* 500 */
}
```

## Programmatic Usage

You can also use the migration tracker programmatically in your code:

```typescript
import {
  loadMigrationTracker,
  getMigrationEntry,
  updateMigrationStatus,
  filterMigrationEntries,
  getNextToMigrate,
  isUsingDesignSystem,
} from '@/lib/utils/migration-tracker';

// Load all tracker data
const tracker = loadMigrationTracker();

// Get a specific entry
const entry = getMigrationEntry('dashboard-page');

// Update status
updateMigrationStatus('landing-page', 'in-progress', 'Starting migration');

// Filter entries
const highPriority = filterMigrationEntries({ priority: 'high' });
const legacyPages = filterMigrationEntries({ status: 'legacy', category: 'page' });

// Get next to migrate
const next = getNextToMigrate(5);

// Check if component uses design system
if (isUsingDesignSystem('dashboard-page')) {
  console.log('Dashboard uses the new design system!');
}
```

## Adding New Components

To add a new component to the tracker:

1. Edit `.kiro/specs/linear-ui-performance-refactor/migration-tracker.json`
2. Add a new entry to the `entries` array:

```json
{
  "id": "new-component",
  "name": "New Component",
  "path": "components/new/Component.tsx",
  "status": "legacy",
  "category": "ui",
  "priority": "medium",
  "features": {
    "usesDesignTokens": false,
    "usesCenteredContainer": false,
    "usesSkeletonScreens": false,
    "usesLazyLoading": false,
    "uses4pxGrid": false,
    "usesMidnightViolet": false,
    "usesInterFont": false
  },
  "notes": "Component description"
}
```

The tracker will automatically recalculate statistics when you save.

## Marking Components in Code

To make it easy to identify migrated components in the codebase, add a comment at the top of the file:

```typescript
/**
 * Component Name
 * 
 * Brief description of the component.
 * 
 * Migration Status: ✅ MIGRATED
 * Design System: Linear UI (Midnight Violet)
 * Migration Date: 2024-11-23
 * 
 * Features:
 * - ✅ Design tokens
 * - ✅ CenteredContainer
 * - ✅ Skeleton screens
 * - ✅ 4px grid
 * - ✅ Midnight Violet palette
 * - ✅ Inter typography
 */
```

For legacy components:

```typescript
/**
 * Component Name
 * 
 * Brief description of the component.
 * 
 * Migration Status: ⚠️ LEGACY
 * TODO: Migrate to Linear UI design system
 * Priority: High
 * Tracker ID: component-name
 */
```

For in-progress components:

```typescript
/**
 * Component Name
 * 
 * Brief description of the component.
 * 
 * Migration Status: 🔄 IN PROGRESS
 * Started: 2024-11-23
 * Tracker ID: component-name
 * 
 * Completed:
 * - ✅ Design tokens
 * - ✅ 4px grid
 * 
 * TODO:
 * - ⏳ Add CenteredContainer
 * - ⏳ Add skeleton screens
 */
```

## Best Practices

### 1. Update Status Regularly

Keep the tracker up-to-date as you work on migrations. This helps the team understand what's been done and what's left.

### 2. Add Meaningful Notes

When updating status, add notes about what was done or any challenges encountered:

```bash
npm run migration:update landing-page migrated "Applied all design tokens, added skeleton screens, wrapped in CenteredContainer. Note: Had to refactor hero section for proper spacing."
```

### 3. Prioritize High-Priority Items

Focus on high-priority components first (dashboard, landing page, marketing pages) as these have the most user impact.

### 4. Test After Migration

Always run the property-based tests after migrating a component to ensure it follows the design system correctly.

### 5. Document Edge Cases

If a component can't use certain design system features (e.g., a full-width hero section can't use CenteredContainer), document this in the notes.

### 6. Review Progress Weekly

Run `npm run migration:report` weekly to track progress and identify any blockers.

## Troubleshooting

### "Migration entry not found"

The component ID doesn't exist in the tracker. Check the ID with:

```bash
npm run migration:list
```

### "Invalid status"

You used an invalid status. Valid statuses are: `legacy`, `in-progress`, `migrated`

### Stats Don't Update

The stats are automatically recalculated when you save the tracker. If they seem wrong, check that all entries have valid status values.

## Related Documentation

- [Design Document](./design.md) - Full design system specification
- [Requirements Document](./requirements.md) - Requirements and acceptance criteria
- [Tasks Document](./tasks.md) - Implementation task list
- [Design Tokens](../../../styles/linear-design-tokens.css) - CSS custom properties

## Support

For questions or issues with the migration tracking system:

1. Check this guide first
2. Review the migration tracker JSON file
3. Run `npm run migration:status` to see current state
4. Check the implementation in `lib/utils/migration-tracker.ts`
