# Huntaze Onboarding Components

Non-blocking onboarding UI components for the Huntaze platform with flexible configuration guide.

## Components

### SetupGuide

Main onboarding checklist component displaying progress and step list.

**Features:**
- Responsive layout (mobile-first)
- Animated progress bar
- Loading states
- Empty state handling
- Full accessibility (WCAG 2.1 AA)

**Usage:**
```tsx
import { SetupGuide } from '@/components/onboarding/huntaze-onboarding';

<SetupGuide
  steps={steps}
  progress={45}
  onStepUpdate={handleUpdate}
  onLearnMore={handleLearnMore}
  userRole="owner"
/>
```

### SetupGuideContainer

Container component that manages state and connects SetupGuide to the API.

**Features:**
- Automatic data fetching
- Error handling with retry
- Optimistic UI updates
- Loading states

**Usage:**
```tsx
import { SetupGuideContainer } from '@/components/onboarding/huntaze-onboarding';

<SetupGuideContainer
  userId="user-123"
  userRole="owner"
  market="FR"
  onLearnMore={(stepId) => console.log(stepId)}
/>
```

### StepItem

Individual step item with action buttons and status display.

**Features:**
- Role-based permissions
- Status indicators (todo, done, skipped)
- Action buttons (Faire, Passer, En savoir plus)
- Responsive button layout
- Accessibility labels

### ProgressIndicator

Enhanced progress visualization with milestones and animations.

**Features:**
- Animated progress bar with shimmer effect
- Milestone celebrations (25%, 50%, 75%, 100%)
- Screen reader announcements
- Visual feedback

**Usage:**
```tsx
import { ProgressIndicator } from '@/components/onboarding/huntaze-onboarding';

<ProgressIndicator
  progress={60}
  totalSteps={10}
  completedSteps={6}
  showMilestones={true}
/>
```

### useOnboarding Hook

Custom hook for managing onboarding state and API interactions.

**Features:**
- Optimistic UI updates
- Error rollback
- Retry mechanism
- Loading states

**Usage:**
```tsx
import { useOnboarding } from '@/components/onboarding/shopify-style';

const {
  steps,
  progress,
  loading,
  error,
  updateStep,
  fetchOnboarding,
  retry,
} = useOnboarding({
  userId: 'user-123',
  market: 'FR',
  onError: (error) => console.error(error),
  onSuccess: (stepId, status) => console.log(stepId, status),
});
```

## Types

### OnboardingStep
```typescript
interface OnboardingStep {
  id: string;
  version: number;
  title: string;
  description?: string;
  required: boolean;
  weight: number;
  status: 'todo' | 'done' | 'skipped';
  roleRestricted?: 'owner' | 'staff' | 'admin';
  completedAt?: string;
  completedBy?: string;
}
```

## Accessibility

All components follow WCAG 2.1 AA standards:

- ✅ Keyboard navigation
- ✅ Screen reader support with ARIA labels
- ✅ Focus indicators
- ✅ aria-live regions for dynamic updates
- ✅ Semantic HTML
- ✅ Color contrast compliance

## Responsive Design

Mobile-first approach with breakpoints:

- **Mobile**: < 640px (vertical stack, full-width buttons)
- **Tablet**: 640px - 1024px (flexible layout)
- **Desktop**: > 1024px (horizontal layout)

## Requirements Mapping

- **Requirement 1.3**: Non-blocking dashboard access with setup guide
- **Requirement 2.1**: Display required steps with "Obligatoire" badge
- **Requirement 3.1**: Three action buttons per step
- **Requirement 3.2**: Optimistic UI updates
- **Requirement 5.1-5.4**: Progress tracking and visualization
- **Requirement 14.2-14.3**: Role-based step visibility
- **Requirement 22.1-22.3**: Enhanced accessibility
- **Requirement 23.1**: Mobile-first responsive design

## Testing

Run component tests:
```bash
npm test components/onboarding/shopify-style
```

## Related Files

- API Endpoints: `app/api/onboarding/`
- Repositories: `lib/db/repositories/`
- Design Doc: `.kiro/specs/shopify-style-onboarding/design.md`
