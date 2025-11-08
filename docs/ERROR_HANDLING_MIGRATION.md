# Error Handling Migration Guide

## Overview

This guide helps developers migrate existing error handling code to use the new TypeScript-safe error utilities. This migration resolves TypeScript compilation errors and improves error handling consistency.

## Quick Start

### 1. Install Dependencies
The error utilities are already available in `lib/errors/index.ts`. No additional dependencies needed.

### 2. Import the Utilities
```typescript
import { getErrorMessage } from '@/lib/errors/index';
```

### 3. Replace Unsafe Error Access
```typescript
// Before (TypeScript error)
catch (error) {
  console.log(error.message);
}

// After (TypeScript safe)
catch (error) {
  const message = getErrorMessage(error);
  console.log(message);
}
```

## Common Migration Patterns

### Pattern 1: Basic Error Message Access

**Before:**
```typescript
try {
  await someOperation();
} catch (error) {
  console.error('Operation failed:', error.message); // ❌ TypeScript error
  throw new Error(error.message || 'Unknown error'); // ❌ TypeScript error
}
```

**After:**
```typescript
import { getErrorMessage } from '@/lib/errors/index';

try {
  await someOperation();
} catch (error) {
  const errorMessage = getErrorMessage(error); // ✅ Type safe
  console.error('Operation failed:', errorMessage);
  throw new Error(errorMessage);
}
```

### Pattern 2: API Route Error Handling

**Before:**
```typescript
export async function POST(request: NextRequest) {
  try {
    // API logic
  } catch (error) {
    console.error('API error:', error); // ❌ Unsafe logging
    return NextResponse.json(
      { error: error.message || 'Unknown error' }, // ❌ TypeScript error
      { status: 500 }
    );
  }
}
```

**After:**
```typescript
import { getErrorMessage } from '@/lib/errors/index';

export async function POST(request: NextRequest) {
  try {
    // API logic
  } catch (error) {
    const errorMessage = getErrorMessage(error); // ✅ Type safe
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
}
```

### Pattern 3: Logger Integration

**Before:**
```typescript
try {
  await processData();
} catch (error) {
  logger.error('Processing failed:', error); // ❌ Unsafe parameter
  logger.error('Processing failed', { error: error.message }); // ❌ TypeScript error
}
```

**After:**
```typescript
import { getErrorMessage } from '@/lib/errors/index';

try {
  await processData();
} catch (error) {
  const errorMessage = getErrorMessage(error); // ✅ Type safe
  logger.error('Processing failed', { error: errorMessage });
}
```

### Pattern 4: Conditional Error Handling

**Before:**
```typescript
try {
  await apiCall();
} catch (error) {
  if (error instanceof Error) { // ❌ Limited type checking
    if (error.message.includes('timeout')) {
      return handleTimeout(error.message);
    }
  }
  return handleGenericError(error.message || 'Unknown'); // ❌ TypeScript error
}
```

**After:**
```typescript
import { getErrorMessage, isAxiosError } from '@/lib/errors/index';

try {
  await apiCall();
} catch (error) {
  const errorMessage = getErrorMessage(error); // ✅ Always safe
  
  if (isAxiosError(error)) { // ✅ Specific type checking
    if (error.code === 'ECONNABORTED') {
      return handleTimeout(errorMessage);
    }
  }
  
  if (errorMessage.includes('timeout')) {
    return handleTimeout(errorMessage);
  }
  
  return handleGenericError(errorMessage);
}
```

## File-by-File Migration Examples

### API Routes (`app/api/**/*.ts`)

**Example: `app/api/users/route.ts`**

```typescript
// Before
export async function GET() {
  try {
    const users = await db.users.findMany();
    return NextResponse.json(users);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: error.message || 'Database error' },
      { status: 500 }
    );
  }
}

// After
import { getErrorMessage } from '@/lib/errors/index';

export async function GET() {
  try {
    const users = await db.users.findMany();
    return NextResponse.json(users);
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error('Database error:', errorMessage);
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
}
```

### Service Layer (`lib/services/**/*.ts`)

**Example: `lib/services/userService.ts`**

```typescript
// Before
export class UserService {
  async createUser(data: UserData) {
    try {
      return await db.users.create({ data });
    } catch (error) {
      logger.error('User creation failed:', error);
      throw new Error(error.message || 'Failed to create user');
    }
  }
}

// After
import { getErrorMessage, isDatabaseError, getDatabaseErrorMessage } from '@/lib/errors/index';

export class UserService {
  async createUser(data: UserData) {
    try {
      return await db.users.create({ data });
    } catch (error) {
      const errorMessage = isDatabaseError(error) 
        ? getDatabaseErrorMessage(error)
        : getErrorMessage(error);
      
      logger.error('User creation failed', { error: errorMessage });
      throw new Error(errorMessage);
    }
  }
}
```

### Utility Functions (`lib/utils/**/*.ts`)

**Example: `lib/utils/apiClient.ts`**

```typescript
// Before
export async function fetchData(url: string) {
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error(`Fetch failed for ${url}:`, error);
    throw new Error(error.message || 'Network error');
  }
}

// After
import { getErrorMessage, isAxiosError } from '@/lib/errors/index';

export async function fetchData(url: string) {
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error(`Fetch failed for ${url}:`, errorMessage);
    
    // Provide more specific error messages
    if (isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 404) {
        throw new Error('Resource not found');
      } else if (status >= 500) {
        throw new Error('Server error occurred');
      }
    }
    
    throw new Error(errorMessage);
  }
}
```

## Advanced Migration Patterns

### Custom Error Classes

**Before:**
```typescript
class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
  }
}

try {
  validateInput(data);
} catch (error) {
  if (error instanceof ValidationError) {
    return { field: error.field, message: error.message };
  }
  return { message: error.message || 'Unknown error' }; // ❌ TypeScript error
}
```

**After:**
```typescript
import { getErrorMessage, isObject } from '@/lib/errors/index';

class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
  }
}

// Type guard for custom error
function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

try {
  validateInput(data);
} catch (error) {
  if (isValidationError(error)) {
    return { field: error.field, message: error.message };
  }
  
  const errorMessage = getErrorMessage(error); // ✅ Always safe
  return { message: errorMessage };
}
```

### Async Error Handling

**Before:**
```typescript
async function processItems(items: Item[]) {
  const results = [];
  
  for (const item of items) {
    try {
      const result = await processItem(item);
      results.push({ success: true, data: result });
    } catch (error) {
      results.push({ 
        success: false, 
        error: error.message || 'Processing failed' // ❌ TypeScript error
      });
    }
  }
  
  return results;
}
```

**After:**
```typescript
import { getErrorMessage } from '@/lib/errors/index';

async function processItems(items: Item[]) {
  const results = [];
  
  for (const item of items) {
    try {
      const result = await processItem(item);
      results.push({ success: true, data: result });
    } catch (error) {
      const errorMessage = getErrorMessage(error); // ✅ Type safe
      results.push({ 
        success: false, 
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  return results;
}
```

## Migration Checklist

### Pre-Migration
- [ ] Review existing error handling patterns in your codebase
- [ ] Identify files with TypeScript errors in catch blocks
- [ ] Plan migration order (start with critical paths)

### During Migration
- [ ] Import error utilities: `import { getErrorMessage } from '@/lib/errors/index';`
- [ ] Replace `error.message` with `getErrorMessage(error)`
- [ ] Replace `error instanceof Error ? error.message : 'fallback'` with `getErrorMessage(error)`
- [ ] Update console.error calls to use safe error messages
- [ ] Update logger calls to pass error messages safely
- [ ] Standardize API error responses
- [ ] Add proper error context and timestamps

### Post-Migration
- [ ] Run TypeScript compilation: `npx tsc --noEmit`
- [ ] Run tests to ensure functionality is preserved
- [ ] Test error scenarios in development
- [ ] Update error handling documentation
- [ ] Review error logs for consistency

## Testing Your Migration

### 1. TypeScript Compilation
```bash
npx tsc --noEmit
```
Should show fewer TypeScript errors after migration.

### 2. Unit Tests
```bash
npm test tests/unit/errors/error-utilities.test.ts
```

### 3. Integration Tests
Test error scenarios:
```typescript
// Test API error responses
const response = await fetch('/api/test-endpoint', {
  method: 'POST',
  body: JSON.stringify({ invalid: 'data' })
});

const errorData = await response.json();
console.log(errorData); // Should have consistent structure
```

### 4. Manual Testing
- Trigger validation errors
- Test network failures
- Test database constraint violations
- Verify error messages are user-friendly

## Common Pitfalls

### 1. Forgetting to Import Utilities
```typescript
// ❌ Will cause runtime error
catch (error) {
  const message = getErrorMessage(error); // ReferenceError
}

// ✅ Always import first
import { getErrorMessage } from '@/lib/errors/index';
```

### 2. Mixing Old and New Patterns
```typescript
// ❌ Inconsistent
catch (error) {
  const message = getErrorMessage(error);
  console.error('Error:', error); // Still unsafe
}

// ✅ Consistent
catch (error) {
  const message = getErrorMessage(error);
  console.error('Error:', message);
}
```

### 3. Not Handling Specific Error Types
```typescript
// ❌ Generic handling only
catch (error) {
  const message = getErrorMessage(error);
  return { error: message };
}

// ✅ Handle specific types when beneficial
catch (error) {
  if (isZodError(error)) {
    return { validationErrors: error.issues };
  }
  
  const message = getErrorMessage(error);
  return { error: message };
}
```

## Performance Considerations

The error utilities are designed to be performant:
- Type guards use simple instanceof/typeof checks
- No heavy serialization or processing
- Minimal memory allocation
- Fast path for common error types

## Rollback Plan

If issues arise during migration:

1. **Revert specific files:**
   ```bash
   git checkout HEAD~1 -- path/to/problematic/file.ts
   ```

2. **Gradual rollback:**
   - Revert non-critical files first
   - Keep API routes migrated (most important)
   - Address issues incrementally

3. **Temporary workarounds:**
   ```typescript
   // Temporary: suppress TypeScript errors
   catch (error: any) {
     console.error('Error:', error.message);
   }
   ```

## Getting Help

### Resources
- [Error Handling Guide](./ERROR_HANDLING_GUIDE.md)
- [API Documentation](./API_ERROR_CODES.md)
- [Test Examples](../tests/unit/errors/error-utilities.test.ts)

### Common Questions

**Q: Can I use the old error handling in some places?**
A: While possible with type assertions, it's recommended to migrate consistently for maintainability.

**Q: What about third-party libraries that throw specific error types?**
A: The utilities handle common types (Axios, Zod). For others, you can extend the type guards or use getErrorMessage() as a fallback.

**Q: How do I handle errors that need specific properties?**
A: Use type guards first, then access properties safely:
```typescript
if (isAxiosError(error)) {
  const statusCode = error.response?.status;
  // Handle HTTP-specific logic
}
```

**Q: Should I migrate all files at once?**
A: No, migrate incrementally starting with API routes and critical paths. This allows for testing and validation at each step.