# Design Document - TypeScript Catch Errors Fix

## Overview

This design addresses TypeScript compilation errors caused by accessing properties on `unknown` type variables in catch blocks. The solution implements a centralized error handling system with proper type narrowing and reusable utilities.

## Architecture

### Core Components

1. **Error Utilities Library** (`lib/errors/`)
   - Central error message extraction functions
   - Type guards for different error types
   - Consistent error response builders

2. **Type Guards Module** (`lib/errors/typeGuards.ts`)
   - `isError(value: unknown): value is Error`
   - `isZodError(value: unknown): value is ZodError`
   - `isAxiosError(value: unknown): value is AxiosError`

3. **Error Message Extractor** (`lib/errors/messageExtractor.ts`)
   - Safe error message extraction
   - Fallback handling for unknown error types
   - JSON serialization for complex objects

## Components and Interfaces

### Error Utilities Interface

```typescript
interface ErrorMessageExtractor {
  getErrorMessage(error: unknown): string;
  getErrorDetails(error: unknown): ErrorDetails;
  createErrorResponse(error: unknown, context?: string): ErrorResponse;
}

interface ErrorDetails {
  message: string;
  type: string;
  stack?: string;
  code?: string | number;
}

interface ErrorResponse {
  error: string;
  details?: string;
  code?: string;
  timestamp: string;
}
```

### Type Guard Functions

```typescript
// Core type guards
function isError(value: unknown): value is Error;
function isZodError(value: unknown): value is ZodError;
function isAxiosError(value: unknown): value is AxiosError;

// Utility function for safe message extraction
function getErrorMessage(err: unknown): string;
```

## Data Models

### Error Handling Patterns

1. **Basic Pattern** - For simple error message extraction
2. **API Route Pattern** - For consistent API error responses
3. **Logging Pattern** - For safe error logging
4. **Specialized Pattern** - For specific error types (Zod, Axios)

### Error Response Format

```typescript
interface StandardErrorResponse {
  error: string;           // User-friendly error message
  details?: string;        // Technical details (development only)
  code?: string;          // Error code for client handling
  timestamp: string;      // ISO timestamp
  requestId?: string;     // For tracing (optional)
}
```

## Error Handling

### Type Narrowing Strategy

1. **Primary Check**: `instanceof Error` for standard Error objects
2. **String Check**: `typeof error === 'string'` for string errors
3. **Object Check**: Attempt JSON serialization for objects
4. **Fallback**: Return generic "Unknown error" message

### Specialized Error Handling

- **Zod Errors**: Extract validation issues and field-specific messages
- **Axios Errors**: Extract HTTP status, response data, and network information
- **Database Errors**: Handle connection, query, and constraint violations
- **Authentication Errors**: Sanitize sensitive information

## Testing Strategy

### Unit Tests

1. **Type Guard Tests**
   - Test each type guard with various input types
   - Verify correct type narrowing behavior
   - Test edge cases and null/undefined inputs

2. **Message Extraction Tests**
   - Test with Error instances, strings, objects
   - Verify fallback behavior for unknown types
   - Test circular reference handling

3. **API Response Tests**
   - Test consistent error response format
   - Verify sensitive information is not leaked
   - Test different error scenarios

### Integration Tests

1. **API Route Error Handling**
   - Test actual API routes with various error conditions
   - Verify proper error responses and status codes
   - Test error logging and monitoring integration

2. **Cross-Module Compatibility**
   - Test error handling across different modules
   - Verify consistent behavior in different contexts
   - Test with existing error handling patterns

## Implementation Approach

### Phase 1: Core Utilities
- Create error handling utilities library
- Implement type guards and message extractors
- Add comprehensive unit tests

### Phase 2: API Route Updates
- Update all API routes to use new error handling
- Ensure consistent error response formats
- Test all endpoints for proper error handling

### Phase 3: Logging and Monitoring
- Update logging statements to use safe error extraction
- Ensure monitoring systems receive proper error data
- Test error tracking and alerting

### Phase 4: Specialized Error Types
- Add support for Zod and Axios error types
- Implement domain-specific error handling
- Update relevant modules to use specialized handlers

## Migration Strategy

1. **Backward Compatibility**: New utilities work alongside existing patterns
2. **Gradual Migration**: Update files incrementally to avoid breaking changes
3. **Testing**: Comprehensive testing at each migration step
4. **Documentation**: Update coding guidelines and examples

## Performance Considerations

- Minimal runtime overhead for type checking
- Efficient error message extraction
- Avoid expensive operations in error paths
- Cache compiled regular expressions for error parsing

## Security Considerations

- Sanitize error messages in production
- Avoid exposing sensitive information in error details
- Implement proper error logging without data leaks
- Ensure error responses don't reveal system internals