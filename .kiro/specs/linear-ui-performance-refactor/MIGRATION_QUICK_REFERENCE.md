# Migration Tracking Quick Reference

Quick commands and patterns for the Linear UI migration tracking system.

## Commands

```bash
# View status
npm run migration:status

# See next to migrate
npm run migration:next

# Generate report
npm run migration:report

# List all components
npm run migration:list

# List by status
npm run migration:list legacy
npm run migration:list in-progress
npm run migration:list migrated

# Update status
npm run migration:update <id> <status> [notes]
```

## Status Values

- `legacy` - Not yet migrated
- `in-progress` - Currently being migrated
- `migrated` - Migration complete

## Component ID Examples

- `design-tokens` - Design token system
- `centered-container` - CenteredContainer component
- `skeleton-screen` - SkeletonScreen component
- `dashboard-page` - Dashboard page
- `landing-page` - Landing page
- `about-page` - About page

## Code Markers

### Migrated Component

```typescript
/**
 * Component Name
 * 
 * Migration Status: ✅ MIGRATED
 * Design System: Linear UI (Midnight Violet)
 * Migration Date: 2024-11-23
 */
```

### Legacy Component

```typescript
/**
 * Component Name
 * 
 * Migration Status: ⚠️ LEGACY
 * TODO: Migrate to Linear UI design system
 * Priority: High
 * Tracker ID: component-name
 */
```

### In Progress

```typescript
/**
 * Component Name
 * 
 * Migration Status: 🔄 IN PROGRESS
 * Started: 2024-11-23
 * Tracker ID: component-name
 */
```

## Design System Checklist

When migrating a component, ensure:

- [ ] Uses design tokens (CSS custom properties)
- [ ] Wrapped in CenteredContainer (if applicable)
- [ ] Has skeleton loading states
- [ ] Heavy components are lazy loaded
- [ ] Follows 4px spacing grid
- [ ] Uses Midnight Violet colors
- [ ] Uses Inter typography

## Common Patterns

### Apply Design Tokens

```css
/* Before */
background-color: #0F0F10;
color: #EDEDEF;
padding: 24px;

/* After */
background-color: var(--color-bg-app);
color: var(--color-text-primary);
padding: var(--spacing-6);
```

### Add CenteredContainer

```tsx
/* Before */
<div className="w-full">
  <Content />
</div>

/* After */
<CenteredContainer maxWidth="lg">
  <Content />
</CenteredContainer>
```

### Add Skeleton Screens

```tsx
{isLoading ? (
  <SkeletonScreen variant="dashboard" />
) : (
  <Content />
)}
```

### Add Lazy Loading

```tsx
const HeavyComponent = lazy(() => import('./HeavyComponent'));

<Suspense fallback={<SkeletonScreen variant="card" />}>
  <HeavyComponent />
</Suspense>
```

## Workflow

1. **Check next**: `npm run migration:next`
2. **Start**: `npm run migration:update <id> in-progress`
3. **Migrate**: Apply design system features
4. **Test**: Run property-based tests
5. **Complete**: `npm run migration:update <id> migrated`
6. **Verify**: `npm run migration:status`

## Priority Order

1. **High** - Dashboard, landing page, marketing pages
2. **Medium** - Settings, integrations, analytics
3. **Low** - Admin pages, rarely-used features

## Files

- **Tracker Data**: `.kiro/specs/linear-ui-performance-refactor/migration-tracker.json`
- **Types**: `types/migration.ts`
- **Utils**: `lib/utils/migration-tracker.ts`
- **CLI**: `scripts/migration-tracker.ts`
- **Guide**: `.kiro/specs/linear-ui-performance-refactor/MIGRATION_TRACKING_GUIDE.md`
