# Smart Onboarding - Performance Module (Isolated)

## Overview

This directory contains performance optimization code that is **isolated from the main build** to enable faster delivery of core functionality.

## Build Strategy

### Main Build (`npm run build`)
- Excludes this performance directory
- Focuses on core onboarding functionality
- Enables rapid deployment

### Performance Build (`npm run build:perf`)
- Separate TypeScript compilation
- Uses `tsconfig.perf.json` configuration
- Outputs to `dist-perf/`
- Can be developed and tested independently

## Type Checking

```bash
# Check main codebase (excludes performance)
npm run typecheck

# Check performance module separately
npm run typecheck:perf
```

## Files in This Module

- `cacheOptimizer.ts` - Cache optimization strategies
- `databaseOptimizer.ts` - Database query optimization
- `horizontalScaler.ts` - Horizontal scaling logic
- `tsconfig.perf.json` - Isolated TypeScript configuration

## Development Workflow

1. **Core Development**: Work on main onboarding features without performance concerns
2. **Performance Optimization**: Separately improve performance module when needed
3. **Integration**: Performance improvements don't block core feature delivery

## Type Definitions

All types needed by performance files are defined in:
- `../types/index.ts` - Core types (already complete)
- Local type definitions in each performance file

## Progressive Enhancement

This isolation strategy allows:
- ✅ Fast initial delivery of core features
- ✅ Progressive performance improvements
- ✅ Independent testing and validation
- ✅ Technical debt tracking without blocking releases

## Future Work

Track performance module improvements as technical debt tickets:
- Complete type definitions for cache strategies
- Add comprehensive error handling
- Implement monitoring and metrics
- Performance benchmarking suite
