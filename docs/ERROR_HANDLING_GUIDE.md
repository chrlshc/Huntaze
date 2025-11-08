# Error Handling Guide

## Overview

This guide documents the error handling patterns and utilities implemented to resolve TypeScript catch block errors and improve error handling consistency across the application.

## Problem Statement

TypeScript 4.4+ introduced stricter error handling in catch blocks, where the `error` parameter is typed as `unknown` instead of `any`. This caused compilation errors when accessing properties like `error.message` directly.

## Solution

We've implemented a comprehensive error handling system with type-safe utilities that handle various error types gracefully.

## Core Error Utilities

### Location
All error utilities are located in `lib/errors/index.ts`.

### Type Guards

#### `isError(value: unknown): value is Error`
Checks if a value is an Error instance.

```typescript
if (isError(error)) {
  console.log(error.message); // Safe to access
}
```

#### `isString(value: unknown): value is string`
Checks if a value is a string.

#### `isObject(value: unknown): value is Record<string, unknown>`
Checks if a value is a plain object (not null or array).

#### `isZodError(value: unknown)`
Checks if a value is a Zod validation error.

#### `isAxiosError(value: unknown)`
Checks if a value is an Axios HTTP error.

#### `isDatabaseError(value: unknown)`
Checks if a value is a database error with error codes.

### Error Message Extraction

#### `getErrorMessage(error: unknown): string`
Safely extracts error messages from any error type.

```typescript
try {
  // Some operation
} catch (error) {
  const message = getErrorMessage(error); // Always returns a string
  console.error('Operation failed:', message);
}
```

**Handles:**
- Error objects → `error.message`
- String errors → returns as-is
- Zod errors → formatted validation messages
- Axios errors → HTTP response messages
- Objects with message/error properties
- Unknown types → fallback message

### API Response Creation

#### `createErrorResponse(error: unknown, statusCode?: number, requestId?: string): Response`
Creates standardized error responses for API routes.

```typescript
export async function POST(request: NextRequest) {
  try {
    // API logic
  } catch (error) {
    return createErrorResponse(error, 500);
  }
}
```

**Features:**
- Consistent error response format
- Environment-aware (hides sensitive details in production)
- Optional request ID tracking
- Proper HTTP status codes

### Safe Logging

#### `logError(message: string, error: unknown, context?: Record<string, any>): void`
Safely logs errors with structured data.

```typescript
try {
  // Some operation
} catch (error) {
  logError('Operation failed', error, { userId: '123', action: 'upload' });
}
```

### Database Error Handling

#### `getDatabaseErrorMessage(error: unknown): string`
Converts database error codes to user-friendly messages.

```typescript
try {
  await db.insert(data);
} catch (error) {
  const message = getDatabaseErrorMessage(error);
  // Returns: "This record already exists" for unique constraint violations
}
```

**Supported Error Codes:**
- `23505` → "This record already exists" (unique_violation)
- `23503` → "Referenced record does not exist" (foreign_key_violation)
- `23502` → "Required field is missing" (not_null_violation)
- `23514` → "Invalid data format" (check_violation)
- `08006` → "Database connection failed"
- `08001` → "Unable to connect to database"

## Usage Patterns

### API Routes

**Before:**
```typescript
} catch (error) {
  console.error('API error:', error); // TypeScript error
  return NextResponse.json(
    { error: error.message || 'Unknown error' }, // TypeScript error
    { status: 500 }
  );
}
```

**After:**
```typescript
import { getErrorMessage } from '@/lib/errors/index';

} catch (error) {
  const errorMessage = getErrorMessage(error);
  console.error('API error:', errorMessage);
  return NextResponse.json(
    { 
      success: false,
      error: {
        message: errorMessage,
        code: 500,
        timestamp: new Date().toISOString()
      }
    },
    { status: 500 }
  );
}
```

### Service Layer

**Before:**
```typescript
} catch (error) {
  logger.error('Service error:', error); // Unsafe
  throw error;
}
```

**After:**
```typescript
import { getErrorMessage } from '@/lib/errors/index';

} catch (error) {
  const errorMessage = getErrorMessage(error);
  logger.error('Service error', { error: errorMessage });
  throw error;
}
```

### Complex Error Handling

```typescript
import { 
  getErrorMessage, 
  isAxiosError, 
  isZodError, 
  isDatabaseError 
} from '@/lib/errors/index';

try {
  // Some operation
} catch (error) {
  const errorMessage = getErrorMessage(error);
  
  if (isAxiosError(error)) {
    // Handle HTTP errors
    const statusCode = error.response?.status || 500;
    return handleHttpError(statusCode, errorMessage);
  }
  
  if (isZodError(error)) {
    // Handle validation errors
    return handleValidationError(error.issues);
  }
  
  if (isDatabaseError(error)) {
    // Handle database errors
    return handleDatabaseError(error.code, errorMessage);
  }
  
  // Generic error handling
  return handleGenericError(errorMessage);
}
```

## Testing

Comprehensive tests are available in `tests/unit/errors/error-utilities.test.ts`.

Run tests:
```bash
npm test tests/unit/errors/error-utilities.test.ts
```

## Migration Checklist

When updating existing error handling:

1. **Import the utilities:**
   ```typescript
   import { getErrorMessage } from '@/lib/errors/index';
   ```

2. **Replace direct error property access:**
   ```typescript
   // Before
   error.message
   
   // After
   getErrorMessage(error)
   ```

3. **Update console.error calls:**
   ```typescript
   // Before
   console.error('Message:', error);
   
   // After
   const errorMessage = getErrorMessage(error);
   console.error('Message:', errorMessage);
   ```

4. **Update logger calls:**
   ```typescript
   // Before
   logger.error('Message', { error: error.message });
   
   // After
   const errorMessage = getErrorMessage(error);
   logger.error('Message', { error: errorMessage });
   ```

5. **Standardize API responses:**
   ```typescript
   // Before
   return NextResponse.json({ error: error.message }, { status: 500 });
   
   // After
   return createErrorResponse(error, 500);
   ```

## Best Practices

1. **Always use type guards** when you need to access specific error properties
2. **Use getErrorMessage()** for safe message extraction
3. **Provide context** in error logs with relevant data
4. **Use structured error responses** in API routes
5. **Handle specific error types** when appropriate (Zod, Axios, Database)
6. **Don't expose sensitive information** in production error messages
7. **Include request IDs** for traceability in API responses

## Environment Considerations

### Development
- Full error details including stack traces
- Detailed error messages
- Debug information preserved

### Production
- Sanitized error messages for 5xx errors
- No stack traces exposed
- Generic messages for internal server errors
- Detailed logging for debugging (server-side only)

## Performance Impact

The error utilities are lightweight and have minimal performance impact:
- Type guards use simple checks
- Message extraction is optimized for common cases
- No heavy serialization or processing
- Caching where appropriate

## Future Enhancements

Potential improvements to consider:
- Error tracking integration (Sentry, Bugsnag)
- Structured logging with correlation IDs
- Error rate limiting and circuit breakers
- Custom error classes for domain-specific errors
- Automated error categorization and alerting

## Troubleshooting

### Common Issues

1. **Import errors**: Ensure you're importing from `@/lib/errors/index`
2. **Type errors**: Make sure to use the utilities instead of direct property access
3. **Missing context**: Always provide relevant context in error logs
4. **Inconsistent responses**: Use the standardized response creators

### Debugging

Enable detailed error logging in development:
```typescript
process.env.NODE_ENV = 'development';
```

Check error utility tests:
```bash
npm test tests/unit/errors/error-utilities.test.ts
```

## Related Documentation

- [API Error Codes](./API_ERROR_CODES.md)
- [Logging Guidelines](./LOGGING_GUIDE.md)
- [Testing Error Scenarios](./ERROR_TESTING_GUIDE.md)