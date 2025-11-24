# Server Actions

This directory contains Next.js Server Actions for handling server-side mutations and data operations.

## Overview

Server Actions are asynchronous functions that execute on the server and can be called directly from Client Components. They provide a secure way to handle data mutations without creating separate API routes.

## Security Principles

All server actions in this directory follow these security principles:

1. **Session-Based Authentication**: User identity is extracted from the server-side session using `requireUser()`, never from client input
2. **Authorization**: Actions verify user permissions before performing operations
3. **Input Validation**: All inputs are validated before processing
4. **Error Handling**: Generic error messages prevent information leakage
5. **Audit Logging**: Critical operations are logged for security monitoring

## Available Actions

### Onboarding Actions (`onboarding.ts`)

#### `toggleOnboardingStep(stepId: string)`

Marks an onboarding step as completed for the authenticated user.

**Security Features:**
- User ID extracted from session (not client input)
- Prevents duplicate step completion
- Uses upsert for safe record creation/update
- Revalidates affected paths for UI consistency

**Usage:**
```typescript
'use client';

import { toggleOnboardingStep } from '@/app/actions/onboarding';

async function handleStepComplete(stepId: string) {
  const result = await toggleOnboardingStep(stepId);
  
  if (!result.success) {
    console.error('Failed to update:', result.error);
  }
}
```

**Returns:**
```typescript
{
  success: boolean;
  error?: string;
}
```

#### `getOnboardingProgress()`

Retrieves the current user's onboarding progress.

**Usage:**
```typescript
import { getOnboardingProgress } from '@/app/actions/onboarding';

const progress = await getOnboardingProgress();
if (progress) {
  console.log('Completed steps:', progress.completedSteps);
}
```

**Returns:**
```typescript
{
  completedSteps: string[];
  createdAt: Date;
  updatedAt: Date;
} | null
```

#### `resetOnboardingProgress()`

Clears all completed steps for the current user. Useful for testing or allowing users to restart onboarding.

**Usage:**
```typescript
import { resetOnboardingProgress } from '@/app/actions/onboarding';

const result = await resetOnboardingProgress();
if (result.success) {
  console.log('Onboarding reset successfully');
}
```

**Returns:**
```typescript
{
  success: boolean;
  error?: string;
}
```

## Best Practices

### 1. Always Use 'use server' Directive

```typescript
'use server';

export async function myAction() {
  // Server-side code
}
```

### 2. Extract User ID from Session

```typescript
// ✅ CORRECT
const user = await requireUser();
const userId = user.id;

// ❌ WRONG - Never trust client input for user identity
export async function badAction(userId: string) {
  // Client could pass any userId!
}
```

### 3. Validate All Inputs

```typescript
import { z } from 'zod';

const schema = z.object({
  stepId: z.string().min(1),
});

export async function myAction(input: unknown) {
  const validated = schema.parse(input);
  // Use validated data
}
```

### 4. Handle Errors Gracefully

```typescript
try {
  // Database operation
} catch (error) {
  console.error('Detailed error for logs:', error);
  
  // Return generic error to client
  return { 
    success: false, 
    error: 'Operation failed' 
  };
}
```

### 5. Revalidate Affected Paths

```typescript
import { revalidatePath } from 'next/cache';

await db.update(/* ... */);

// Revalidate specific paths
revalidatePath('/dashboard');
revalidatePath('/(app)', 'layout');
```

### 6. Use Optimistic Updates in Client Components

```typescript
'use client';

import { useOptimistic } from 'react';
import { toggleOnboardingStep } from '@/app/actions/onboarding';

export function OnboardingChecklist({ steps }) {
  const [optimisticSteps, updateOptimisticSteps] = useOptimistic(
    steps,
    (state, stepId: string) => {
      return state.map(step =>
        step.id === stepId ? { ...step, completed: true } : step
      );
    }
  );

  async function handleComplete(stepId: string) {
    // Update UI immediately
    updateOptimisticSteps(stepId);
    
    // Sync to server
    const result = await toggleOnboardingStep(stepId);
    
    if (!result.success) {
      // Handle error (optimistic update will revert)
    }
  }

  return (
    // Render optimisticSteps
  );
}
```

## Testing

All server actions have comprehensive unit tests in `tests/unit/actions/`.

Run tests:
```bash
npm run test tests/unit/actions/onboarding.test.ts
```

## Database Schema

Server actions interact with the following Prisma models:

### UserOnboarding

```prisma
model UserOnboarding {
  id             String   @id @default(cuid())
  userId         Int      @unique
  completedSteps String[]
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  user users @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_onboarding")
}
```

## Performance Considerations

1. **Database Queries**: Actions use `findUnique` and `upsert` for optimal performance
2. **Revalidation**: Only revalidate specific paths that are affected by the mutation
3. **Error Handling**: Catch errors early to avoid unnecessary database operations
4. **Caching**: Server Actions automatically benefit from Next.js caching strategies

## Related Documentation

- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Optimistic Updates](https://react.dev/reference/react/useOptimistic)
- [Prisma Client](https://www.prisma.io/docs/concepts/components/prisma-client)
- [Requirements: Onboarding Flow](../../.kiro/specs/mobile-ux-marketing-refactor/requirements.md#requirement-8)
- [Design: Onboarding Checklist](../../.kiro/specs/mobile-ux-marketing-refactor/design.md#8-onboarding-checklist)
