# Hydration Error Detection System

This system provides comprehensive detection, logging, and recovery for React hydration errors, specifically targeting React error #130.

## Quick Start

### 1. Wrap your app with HydrationProvider

```tsx
import { HydrationProvider } from '@/components/hydration';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <HydrationProvider>
          {children}
        </HydrationProvider>
      </body>
    </html>
  );
}
```

### 2. Use HydrationErrorBoundary for specific components

```tsx
import { HydrationErrorBoundary } from '@/components/hydration';

function MyComponent() {
  return (
    <HydrationErrorBoundary>
      <SomeProblematicComponent />
    </HydrationErrorBoundary>
  );
}
```

### 3. Monitor errors in development

The debug panel will automatically appear in development mode. You can also use browser console commands:

```javascript
// Get all hydration errors
__hydrationDebug.getErrors()

// Clear all errors
__hydrationDebug.clearErrors()

// Get error statistics
__hydrationDebug.getStats()

// Log a test error
__hydrationDebug.logError(new Error('Test hydration error'))
```

## Components

### HydrationProvider

Main wrapper component that provides hydration error detection and debugging tools.

**Props:**
- `children`: React nodes to wrap
- `fallback?`: Custom error fallback component
- `enableDebugPanel?`: Enable debug panel (default: development mode only)

### HydrationErrorBoundary

Error boundary specifically designed for hydration errors.

**Props:**
- `children`: React nodes to protect
- `fallback?`: Custom error fallback component
- `onError?`: Custom error handler function

### HydrationDebugPanel

Development tool for monitoring and debugging hydration errors.

**Features:**
- Real-time error monitoring
- Error statistics and categorization
- Detailed error inspection
- Error clearing functionality

## Hooks

### useHydrationError

Hook for accessing hydration error data.

```tsx
import { useHydrationError } from '@/components/hydration';

function MyComponent() {
  const { errors, errorCount, hasErrors, clearErrors, getErrorStats } = useHydrationError();
  
  return (
    <div>
      {hasErrors && <div>Hydration errors detected: {errorCount}</div>}
    </div>
  );
}
```

### useHydrationDebug

Development hook with additional debugging features.

```tsx
import { useHydrationDebug } from '@/components/hydration';

function DebugComponent() {
  const { isEnabled, errors, clearErrors } = useHydrationDebug();
  
  if (!isEnabled) return null;
  
  return (
    <div>
      <button onClick={clearErrors}>Clear Errors</button>
      <div>Errors: {errors.length}</div>
    </div>
  );
}
```

## Services

### hydrationErrorLogger

Service for logging and managing hydration errors.

```tsx
import { hydrationErrorLogger } from '@/components/hydration';

// Get all errors
const errors = hydrationErrorLogger.getErrors();

// Get error statistics
const stats = hydrationErrorLogger.getErrorStats();

// Clear all errors
hydrationErrorLogger.clearErrors();
```

## API Endpoints

### POST /api/monitoring/hydration-errors

Endpoint for receiving hydration error reports in production.

**Request Body:**
```json
{
  "id": "string",
  "timestamp": "string",
  "errorType": "mismatch" | "timeout" | "component_error",
  "componentStack": "string",
  "url": "string",
  "userAgent": "string",
  "message": "string",
  "stack": "string",
  "htmlDiffers": boolean,
  "serverHTMLLength": number,
  "clientHTMLLength": number
}
```

### GET /api/monitoring/hydration-errors

Endpoint for retrieving hydration error statistics.

## Error Types

- **mismatch**: Server and client HTML don't match (React error #130)
- **timeout**: Hydration process timed out
- **component_error**: General component-level hydration error

## Best Practices

1. **Wrap critical components**: Use HydrationErrorBoundary around components that might cause hydration issues
2. **Monitor in development**: Use the debug panel to catch issues early
3. **Handle gracefully**: Provide meaningful fallback components for users
4. **Log for analysis**: Errors are automatically logged for debugging and monitoring
5. **Test thoroughly**: Use the debugging tools to simulate and test error scenarios

## Troubleshooting

### Common Issues

1. **Time-sensitive data**: Use consistent timestamps between server and client
2. **Browser APIs**: Avoid using browser-only APIs during SSR
3. **Dynamic content**: Ensure consistent rendering logic across environments
4. **Conditional rendering**: Use stable conditions that work on both server and client

### Debug Commands

```javascript
// Check if hydration errors are being detected
console.log(__hydrationDebug.getStats());

// Manually trigger an error for testing
__hydrationDebug.logError(new Error('Test error'));

// Clear all stored errors
__hydrationDebug.clearErrors();
```