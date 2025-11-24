# Linear UI Migration Tracking System

A comprehensive system for tracking the progressive migration from legacy styles to the new Linear UI design system (Midnight Violet theme).

## What is This?

The migration tracking system helps manage the transition from the old UI to the new Linear-inspired design system. It provides:

- **Status Tracking** - Know which components are migrated, in-progress, or legacy
- **Progress Monitoring** - See overall progress with statistics and visual indicators
- **Priority Management** - Focus on high-impact components first
- **Feature Tracking** - Track which design system features each component uses
- **CLI Tools** - Easy-to-use command-line interface for developers
- **Programmatic API** - Use the tracker in your code

## Quick Start

### View Current Status

```bash
npm run migration:status
```

This shows:
- Overall progress percentage
- Visual progress bar
- Breakdown by category (page, layout, form, ui, marketing, dashboard)
- Breakdown by priority (high, medium, low)
- Number of high-priority items remaining

### See What to Work On Next

```bash
npm run migration:next
```

Shows the top 5 components to migrate, sorted by priority.

### Update a Component's Status

When you start migrating a component:

```bash
npm run migration:update landing-page in-progress "Starting migration"
```

When you finish:

```bash
npm run migration:update landing-page migrated "Migration complete with all features"
```

### Generate a Full Report

```bash
npm run migration:report
```

Generates a comprehensive markdown report with all migration details.

## Documentation

- **[Full Guide](./MIGRATION_TRACKING_GUIDE.md)** - Complete documentation with examples
- **[Quick Reference](./MIGRATION_QUICK_REFERENCE.md)** - Cheat sheet for common tasks
- **[Design Document](./design.md)** - Design system specification
- **[Requirements](./requirements.md)** - Requirements and acceptance criteria

## Key Concepts

### Migration Status

Each component has one of three statuses:

- **legacy** - Not yet migrated to the new design system
- **in-progress** - Currently being migrated
- **migrated** - Fully migrated and using the new design system

### Priority Levels

Components are prioritized for migration:

- **high** - Critical user-facing components (dashboard, landing page)
- **medium** - Important but not critical (settings, profile)
- **low** - Nice-to-have (admin pages, rarely-used features)

### Design System Features

The tracker monitors which features each component uses:

- ✅ **Design Tokens** - Uses CSS custom properties
- ✅ **CenteredContainer** - Wrapped in layout container
- ✅ **Skeleton Screens** - Has loading states
- ✅ **Lazy Loading** - Heavy components load on demand
- ✅ **4px Grid** - Follows spacing system
- ✅ **Midnight Violet** - Uses color palette
- ✅ **Inter Font** - Uses typography system

## Current Progress

Run `npm run migration:status` to see the latest progress.

As of the initial setup:
- **5 components migrated** (33.33%)
- **10 components remaining**
- Core design system components complete
- Dashboard migrated
- Marketing pages pending

## Workflow

1. **Identify** - Run `npm run migration:next` to see what to work on
2. **Start** - Mark component as in-progress
3. **Migrate** - Apply design system features
4. **Test** - Run property-based tests to verify
5. **Complete** - Mark component as migrated
6. **Verify** - Check progress with status command

## Files

```
.kiro/specs/linear-ui-performance-refactor/
├── migration-tracker.json          # Tracker database
├── MIGRATION_README.md             # This file
├── MIGRATION_TRACKING_GUIDE.md     # Full documentation
└── MIGRATION_QUICK_REFERENCE.md    # Quick reference

types/
└── migration.ts                    # TypeScript types

lib/utils/
└── migration-tracker.ts            # Utility functions

scripts/
└── migration-tracker.ts            # CLI tool
```

## Requirements

This migration tracking system fulfills:

- **Requirement 11.1** - Allow coexistence of old and new styles during migration
- **Requirement 11.2** - Mark migrated components in the codebase

## Support

For detailed information, see the [Full Guide](./MIGRATION_TRACKING_GUIDE.md).

For quick commands, see the [Quick Reference](./MIGRATION_QUICK_REFERENCE.md).

## Example Usage

```bash
# Check status
npm run migration:status

# See what's next
npm run migration:next

# Start working on landing page
npm run migration:update landing-page in-progress

# Complete landing page migration
npm run migration:update landing-page migrated "Applied all design tokens and features"

# Generate report
npm run migration:report > migration-report.md
```

## Benefits

- **Organized** - Clear structure for managing migrations
- **Trackable** - Know exactly what's done and what's left
- **Prioritized** - Focus on high-impact work first
- **Documented** - Automatic progress reports
- **Collaborative** - Team can see status at a glance
- **Verifiable** - Track which features are applied

## Next Steps

1. Run `npm run migration:status` to see current state
2. Run `npm run migration:next` to see what to work on
3. Read the [Full Guide](./MIGRATION_TRACKING_GUIDE.md) for detailed instructions
4. Start migrating high-priority components!
