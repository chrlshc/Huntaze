# OnboardingChecklist Component

## Overview

The `OnboardingChecklist` component provides an interactive, animated checklist for guiding new users through the onboarding process. It features optimistic UI updates, confetti celebration on completion, and a collapsible interface with progress tracking.

## Features

✅ **Optimistic UI Updates** - Instant feedback before server confirmation  
✅ **Confetti Celebration** - Triggers when all steps are completed (Task 21)  
✅ **Collapsible Interface** - Compact progress indicator when collapsed  
✅ **Framer Motion Animations** - Smooth transitions and animations  
✅ **Accessibility** - Proper ARIA labels and keyboard navigation  
✅ **Progress Tracking** - Visual progress bar and percentage display  
✅ **Server-Side Persistence** - Secure server actions for data storage  

## Usage

### Basic Example

```typescript
import { OnboardingChecklist } from '@/components/engagement/OnboardingChecklist';
import { getOnboardingProgress } from '@/app/actions/onboarding';

export default async function DashboardPage() {
  // Fetch user's onboarding progress from server
  const progress = await getOnboardingProgress();
  
  // Define onboarding steps
  const steps = [
    {
      id: 'complete-profile',
      title: 'Complete your profile',
      description: 'Add your name, avatar, and bio',
      completed: progress?.completedSteps.includes('complete-profile') || false,
      order: 1,
    },
    {
      id: 'connect-integration',
      title: 'Connect your first integration',
      description: 'Link your social media account',
      completed: progress?.completedSteps.includes('connect-integration') || false,
      order: 2,
    },
    {
      id: 'create-post',
      title: 'Create your first post',
      description: 'Share something with your audience',
      completed: progress?.completedSteps.includes('create-post') || false,
      order: 3,
    },
  ];

  return (
    <div className="p-4">
      <h1>Welcome to Huntaze!</h1>
      <OnboardingChecklist initialSteps={steps} />
    </div>
  );
}
```

## Props

### `OnboardingStep` Interface

```typescript
interface OnboardingStep {
  id: string;           // Unique identifier for the step
  title: string;        // Display title of the step
  description: string;  // Brief description of what the step involves
  completed: boolean;   // Whether the step has been completed
  order: number;        // Display order (steps are sorted by this)
}
```

### Component Props

```typescript
interface Props {
  initialSteps: OnboardingStep[];  // Array of onboarding steps
}
```

## Confetti Integration (Task 21)

The component automatically triggers a confetti celebration when the user completes the final step:

```typescript
// Confetti configuration
confetti({
  particleCount: 100,
  spread: 70,
  origin: { y: 0.6 },
  colors: ['#5E6AD2', '#EDEDED', '#8A8F98'], // Brand colors
});
```

### Confetti Behavior

- ✅ Triggers only when completing the **last remaining step**
- ✅ Does **not** trigger if the server action fails
- ✅ Does **not** trigger when completing non-final steps
- ✅ Uses brand colors for visual consistency

## Server Actions

The component integrates with the following server actions:

### `toggleOnboardingStep(stepId: string)`

Marks an onboarding step as completed. The user ID is extracted from the server-side session for security.

```typescript
import { toggleOnboardingStep } from '@/app/actions/onboarding';

const result = await toggleOnboardingStep('complete-profile');

if (result.success) {
  console.log('Step completed!');
} else {
  console.error('Failed:', result.error);
}
```

### `getOnboardingProgress()`

Retrieves the current user's onboarding progress.

```typescript
import { getOnboardingProgress } from '@/app/actions/onboarding';

const progress = await getOnboardingProgress();
// Returns: { completedSteps: string[], createdAt: Date, updatedAt: Date } | null
```

## States

### Expanded State

Shows the full checklist with:
- All steps with checkboxes
- Step titles and descriptions
- Progress bar
- Completion count

### Collapsed State

Shows a compact indicator with:
- Progress percentage
- Chevron icon to expand
- Minimal space usage

## Styling

The component uses Tailwind CSS with semantic design tokens:

- `bg-surface` - Surface background color
- `bg-background` - Background color for hover states
- `bg-primary` - Primary brand color for progress bar and checkboxes
- `text-foreground` - Primary text color
- `text-muted` - Muted text color for descriptions
- `border-border` - Border color

## Animations

Powered by Framer Motion:

- **Initial Load**: Fade in with slide down effect
- **Step Completion**: Smooth checkbox fill animation
- **Progress Bar**: Animated width transition
- **Collapse/Expand**: Fade and slide animations

## Accessibility

- ✅ Proper ARIA labels for all interactive elements
- ✅ Keyboard navigation support
- ✅ Disabled state for completed steps
- ✅ Screen reader friendly descriptions

## Requirements Validation

### Requirement 8.1: Collapsible Onboarding Checklist
✅ Implemented with expand/collapse functionality

### Requirement 8.2: Server Action for Progress Persistence
✅ Integrated with `toggleOnboardingStep` server action

### Requirement 8.3: Framer Motion Animations
✅ Smooth animations for all state changes

### Requirement 8.4: Confetti Trigger at 100% Completion
✅ Confetti fires when all steps are completed (Task 21)

### Requirement 8.5: Compact Progress Indicator
✅ Collapsed state shows percentage and chevron

### Requirement 8.6: Optimistic UI Updates
✅ Uses React's `useOptimistic` hook for instant feedback

## Testing

Comprehensive test coverage includes:

- ✅ Rendering in expanded and collapsed states
- ✅ Step completion and server action integration
- ✅ Confetti trigger on final step completion
- ✅ Progress calculation accuracy
- ✅ Accessibility features
- ✅ Error handling

Run tests:

```bash
npm test tests/unit/components/onboarding-checklist.test.tsx --run
```

## Example Integration

### In a Dashboard Layout

```typescript
// app/(app)/dashboard/layout.tsx
import { OnboardingChecklist } from '@/components/engagement/OnboardingChecklist';
import { getOnboardingProgress } from '@/app/actions/onboarding';

export default async function DashboardLayout({ children }) {
  const progress = await getOnboardingProgress();
  
  const steps = [
    // ... define steps
  ];

  return (
    <div className="flex">
      <aside className="w-64 p-4">
        <OnboardingChecklist initialSteps={steps} />
      </aside>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
```

### With Dynamic Steps

```typescript
// Define steps based on user role or subscription
const getStepsForUser = (user: User): OnboardingStep[] => {
  const baseSteps = [
    { id: 'profile', title: 'Complete Profile', ... },
  ];
  
  if (user.role === 'creator') {
    baseSteps.push({
      id: 'connect-onlyfans',
      title: 'Connect OnlyFans',
      description: 'Link your OnlyFans account',
      completed: false,
      order: 2,
    });
  }
  
  return baseSteps;
};
```

## Performance Considerations

- **Optimistic Updates**: UI updates immediately, reducing perceived latency
- **Server Actions**: Secure, server-side mutations with automatic revalidation
- **Minimal Re-renders**: Uses React's `useOptimistic` for efficient state management
- **Lazy Loading**: Can be dynamically imported if not immediately needed

## Browser Support

- ✅ Modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- ✅ Requires JavaScript enabled
- ✅ Graceful degradation for older browsers

## Related Components

- `ChangelogWidget` - Similar engagement component for feature updates
- `AppShell` - Layout component that can contain the checklist
- `SafeArea` - Mobile viewport utilities

## Related Documentation

- [Server Actions README](../../app/actions/README.md)
- [Design Document](.kiro/specs/mobile-ux-marketing-refactor/design.md)
- [Requirements Document](.kiro/specs/mobile-ux-marketing-refactor/requirements.md)
- [Task 19 Completion](.kiro/specs/mobile-ux-marketing-refactor/TASK_19_COMPLETION.md)

## Troubleshooting

### Confetti Not Triggering

- Ensure `canvas-confetti` is installed: `npm install canvas-confetti`
- Check that the step being completed is the last remaining step
- Verify the server action returns `{ success: true }`

### Optimistic Updates Not Working

- Ensure React version supports `useOptimistic` (React 19+)
- Check that `initialSteps` prop is being passed correctly
- Verify server action is being called

### Steps Not Persisting

- Check server action implementation in `app/actions/onboarding.ts`
- Verify database schema includes `UserOnboarding` model
- Check authentication - user must be logged in

## Future Enhancements

- [ ] Add step dependencies (e.g., step 2 requires step 1)
- [ ] Support for optional vs required steps
- [ ] Custom confetti configurations per step
- [ ] Analytics tracking for step completion rates
- [ ] Tooltips with additional guidance
- [ ] Video tutorials embedded in steps

## License

Part of the Huntaze application. See main project LICENSE.
