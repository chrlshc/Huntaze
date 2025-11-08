# Design Document

## Overview

This system addresses 9 specific React Hook dependency warnings that remain in the Next.js build. Each warning represents a potential bug where components may not update correctly due to missing dependencies in React Hook dependency arrays. The solution implements proper dependency management patterns including useCallback, useMemo, and ref cleanup strategies.

## Architecture

### Warning Classification System

```
React Hook Warnings (9 total)
├── Missing Function Dependencies (5)
│   ├── lazy-components.tsx (2 warnings)
│   ├── campaign-details.tsx (1 warning)
│   ├── cache-manager.ts (2 warnings)
├── Unstable Logical Expressions (1)
│   └── conversation-view.tsx (1 warning)
├── Missing Variable Dependencies (2)
│   ├── theme-provider.tsx (1 warning)
│   └── useSSE.ts (2 warnings)
└── Ref Cleanup Issues (1)
    └── use-intersection-observer.ts (1 warning)
```

### Fix Strategy Pipeline

```
Warning Detection → Pattern Analysis → Fix Selection → Implementation → Validation
```

## Components and Interfaces

### 1. Function Dependency Fixer

**Purpose**: Wrap functions with useCallback to stabilize references in dependency arrays

**Affected Files**:
- `src/components/mobile/lazy-components.tsx:216:6` - Missing 'prefetch' dependency
- `src/components/of/campaign-details.tsx:20:6` - Missing 'fetchCampaignDetails' dependency
- `src/lib/cache-manager.ts:350:6` - Missing 'options' dependency in useCallback
- `src/lib/cache-manager.ts:405:6` - Missing 'options' dependency in useEffect

**Fix Pattern**:
```typescript
// Before
useEffect(() => {
  prefetch();
}, [inView, prefetchOn]);

// After
const prefetch = useCallback(() => {
  // logic
}, [isPrefetched, href]);

useEffect(() => {
  if (prefetchOn === 'visible' && inView) {
    prefetch();
  }
}, [inView, prefetchOn, prefetch]);
```

**Implementation Strategy**:
1. Identify all functions used in useEffect hooks
2. Wrap them with useCallback with proper dependencies
3. Add the memoized function to the useEffect dependency array
4. Ensure no circular dependencies are created

### 2. Logical Expression Stabilizer

**Purpose**: Wrap logical expressions in useMemo to prevent unnecessary re-renders

**Affected Files**:
- `src/components/of/conversation-view.tsx:22:9` - 'messages' logical expression changes on every render

**Fix Pattern**:
```typescript
// Before
const messages = data?.messages || [];
useEffect(() => {
  // uses messages
}, [messages]); // messages changes every render

// After
const messages = useMemo(() => data?.messages || [], [data?.messages]);
useEffect(() => {
  // uses messages
}, [messages]); // messages only changes when data.messages changes
```

**Implementation Strategy**:
1. Identify logical expressions that create new references
2. Wrap them in useMemo with proper dependencies
3. Ensure the memoized value is used consistently
4. Validate that the optimization doesn't break functionality

### 3. Variable Dependency Manager

**Purpose**: Add missing variable dependencies to useEffect hooks

**Affected Files**:
- `src/components/theme-provider.tsx:32:6` - Missing 'defaultTheme' dependency
- `src/hooks/useSSE.ts:91:6` - Missing 'permission' and 'showLocalNotification' dependencies

**Fix Pattern**:
```typescript
// Before
useEffect(() => {
  const initial = defaultTheme || stored || 'light';
  setTheme(initial);
}, []); // Missing defaultTheme

// After
useEffect(() => {
  const initial = defaultTheme || stored || 'light';
  setTheme(initial);
}, [defaultTheme]); // Added defaultTheme
```

**Implementation Strategy**:
1. Analyze all variables referenced in useEffect
2. Add missing variables to dependency array
3. Consider if the effect should run on every change
4. Use useCallback for function dependencies if needed

### 4. Ref Cleanup Handler

**Purpose**: Implement proper ref cleanup patterns to prevent memory leaks

**Affected Files**:
- `src/hooks/use-intersection-observer.ts:38:32` - ref.current will likely have changed by cleanup time

**Fix Pattern**:
```typescript
// Before
useEffect(() => {
  observer.observe(ref.current);
  return () => {
    if (ref.current) { // ref.current may be stale
      observer.unobserve(ref.current);
    }
  };
}, []);

// After
useEffect(() => {
  const element = ref.current; // Copy to variable
  if (!element) return;
  
  observer.observe(element);
  return () => {
    observer.unobserve(element); // Use copied variable
  };
}, []);
```

**Implementation Strategy**:
1. Copy ref.current to a local variable at the start of the effect
2. Use the local variable in the cleanup function
3. Add null checks before using the ref
4. Ensure the observer is properly disconnected

## Data Models

### Warning Model

```typescript
interface ReactHookWarning {
  file: string;
  line: number;
  column: number;
  rule: 'react-hooks/exhaustive-deps';
  message: string;
  missingDependencies?: string[];
  fixStrategy: 'useCallback' | 'useMemo' | 'addDependency' | 'refCleanup';
}
```

### Fix Result Model

```typescript
interface FixResult {
  file: string;
  warning: ReactHookWarning;
  applied: boolean;
  changes: string[];
  validation: {
    buildPasses: boolean;
    functionalityPreserved: boolean;
  };
}
```

## Error Handling

### Fix Validation Strategy

1. **Pre-Fix Validation**: Capture current behavior and test coverage
2. **Incremental Fixes**: Apply one fix at a time to isolate issues
3. **Build Validation**: Ensure build passes after each fix
4. **Functionality Testing**: Verify components still work correctly
5. **Rollback Capability**: Revert if a fix causes issues

### Specific Fix Handlers

#### 1. PrefetchLink Component (lazy-components.tsx)
- **Issue**: Missing 'prefetch' function in dependency array
- **Risk**: Medium - prefetch may not update when dependencies change
- **Fix**: Wrap prefetch with useCallback including all its dependencies
- **Validation**: Test that prefetching works on hover/focus/visible

#### 2. CampaignDetails Component (campaign-details.tsx)
- **Issue**: Missing 'fetchCampaignDetails' function in dependency array
- **Risk**: High - campaign data may not refresh when campaignId changes
- **Fix**: Wrap fetchCampaignDetails with useCallback
- **Validation**: Test that campaign details load correctly

#### 3. ConversationView Component (conversation-view.tsx)
- **Issue**: 'messages' logical expression creates new array on every render
- **Risk**: High - causes unnecessary re-renders and scroll issues
- **Fix**: Wrap messages with useMemo
- **Validation**: Test that messages display and scroll correctly

#### 4. ThemeProvider Component (theme-provider.tsx)
- **Issue**: Missing 'defaultTheme' dependency
- **Risk**: Low - theme initialization may not respect defaultTheme changes
- **Fix**: Add defaultTheme to dependency array
- **Validation**: Test theme switching and persistence

#### 5. useIntersectionObserver Hook (use-intersection-observer.ts)
- **Issue**: ref.current accessed in cleanup may be stale
- **Risk**: Medium - may cause memory leaks or errors
- **Fix**: Copy ref.current to variable before cleanup
- **Validation**: Test intersection observer functionality

#### 6. useSSE Hook (useSSE.ts)
- **Issue**: Missing 'permission' and 'showLocalNotification' dependencies
- **Risk**: Medium - notifications may not work correctly
- **Fix**: Add missing dependencies or wrap in useCallback
- **Validation**: Test SSE connection and notifications

#### 7. useCachedFetch Hook (cache-manager.ts)
- **Issue**: Missing 'options' dependency in useCallback and useEffect
- **Risk**: Medium - cache refresh may not respect options changes
- **Fix**: Add options to dependency arrays
- **Validation**: Test cached data fetching with different options

## Testing Strategy

### Validation Approach

1. **Component-Level Testing**: Test each fixed component individually
2. **Integration Testing**: Verify components work together correctly
3. **Build Testing**: Confirm build completes with zero warnings
4. **Performance Testing**: Ensure fixes don't degrade performance

### Test Categories

#### Unit Tests
- Test that useCallback functions maintain correct behavior
- Test that useMemo values update when dependencies change
- Test that ref cleanup doesn't cause errors

#### Integration Tests
- Test PrefetchLink with navigation
- Test CampaignDetails with API calls
- Test ConversationView with real-time updates
- Test ThemeProvider with theme switching
- Test useSSE with event stream
- Test useCachedFetch with cache operations

#### Build Tests
- Run `npm run build` and verify zero warnings
- Check that all 9 warnings are resolved
- Confirm no new warnings are introduced

#### Performance Tests
- Measure re-render counts before and after fixes
- Verify useMemo optimizations reduce renders
- Check that prefetching doesn't impact performance

### Continuous Validation

- Run tests after each fix
- Validate build after each file change
- Monitor for any regressions
- Ensure all functionality remains intact

## Implementation Priority

### Phase 1: High-Risk Fixes (Critical for Functionality)
1. Fix ConversationView messages memoization (prevents scroll issues)
2. Fix CampaignDetails fetchCampaignDetails (ensures data loads)
3. Fix useIntersectionObserver ref cleanup (prevents memory leaks)

### Phase 2: Medium-Risk Fixes (Important for Stability)
4. Fix PrefetchLink prefetch function (ensures prefetching works)
5. Fix useSSE missing dependencies (ensures notifications work)
6. Fix useCachedFetch options dependency (ensures cache works correctly)

### Phase 3: Low-Risk Fixes (Code Quality)
7. Fix ThemeProvider defaultTheme dependency (ensures theme initialization)
8. Fix cache-manager useCallback options (code quality)

### Phase 4: Final Validation
- Run complete build to verify all warnings resolved
- Execute full test suite
- Validate performance metrics
- Confirm production readiness
