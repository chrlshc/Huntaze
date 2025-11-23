# Server Actions Quick Reference

## Import

```typescript
import { 
  toggleOnboardingStep,
  getOnboardingProgress,
  resetOnboardingProgress 
} from '@/app/actions/onboarding';
```

## toggleOnboardingStep

Mark an onboarding step as completed.

```typescript
const result = await toggleOnboardingStep('step-1');

if (result.success) {
  // Step completed successfully
} else {
  console.error(result.error);
}
```

**Returns:**
```typescript
{ success: boolean; error?: string }
```

**Features:**
- ✅ Prevents duplicate completions
- ✅ Creates record if user is new
- ✅ Revalidates `/dashboard` and `/(app)` paths
- ✅ Session-based auth (no userId needed)

## getOnboardingProgress

Retrieve current user's onboarding progress.

```typescript
const progress = await getOnboardingProgress();

if (progress) {
  console.log('Completed:', progress.completedSteps);
  console.log('Last updated:', progress.updatedAt);
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

## resetOnboardingProgress

Clear all completed steps (for testing/restart).

```typescript
const result = await resetOnboardingProgress();

if (result.success) {
  // Progress reset successfully
}
```

**Returns:**
```typescript
{ success: boolean; error?: string }
```

## Optimistic UI Pattern

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
    await toggleOnboardingStep(stepId);
  }

  return (
    // Render optimisticSteps
  );
}
```

## Security Notes

- ✅ User ID extracted from session (server-side)
- ✅ Client cannot manipulate other users' data
- ✅ Generic error messages (no info leakage)
- ✅ Input validation on all parameters

## Error Handling

All actions return `{ success: boolean; error?: string }` format:

```typescript
const result = await toggleOnboardingStep(stepId);

if (!result.success) {
  // Show error to user
  toast.error(result.error || 'Something went wrong');
  
  // Optimistic update will revert automatically
}
```

## Testing

```bash
npm run test tests/unit/actions/onboarding.test.ts --run
```

## Full Documentation

See `app/actions/README.md` for complete documentation.
