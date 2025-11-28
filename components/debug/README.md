# Debug Components

This directory contains components used for debugging and development purposes only.

## Purpose

Debug components are:
- Used during development to test and visualize features
- Not intended for production use
- Isolated from production components to prevent accidental usage

## Guidelines

1. **Naming Convention**: All debug components should have "Debug" in their name
2. **Import Path**: Always import from `components/debug` to make debug usage explicit
3. **Production Builds**: These components should be tree-shaken in production builds
4. **Documentation**: Each debug component should document its purpose

## Usage

```typescript
// Development only
import { DebugComponent } from '@/components/debug';

// Use in development environment
if (process.env.NODE_ENV === 'development') {
  return <DebugComponent />;
}
```

## Current Debug Components

Currently, this directory is empty as all debug components have been removed during cleanup.
Add new debug components here as needed during development.
