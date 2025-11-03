# Adaptive Onboarding System - Developer Guide

## Architecture Overview

The Adaptive Onboarding System is a modular, scalable solution for intelligent user onboarding with progressive feature unlocking.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [Core Services](#core-services)
4. [API Endpoints](#api-endpoints)
5. [Frontend Components](#frontend-components)
6. [Adding New Features](#adding-new-features)
7. [Adding New Steps](#adding-new-steps)
8. [Testing](#testing)
9. [Deployment](#deployment)

---

## System Architecture

### Layers

```
┌─────────────────────────────────────┐
│         UI Components               │
│  (React, Next.js App Router)        │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│         API Routes                  │
│  (Next.js API Routes)               │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│         Services Layer              │
│  (Business Logic)                   │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│         Repository Layer            │
│  (Data Access)                      │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│         Database                    │
│  (PostgreSQL)                       │
└─────────────────────────────────────┘
```

### Key Principles

- **Separation of Concerns**: Each layer has a specific responsibility
- **Dependency Injection**: Services are injected, not instantiated
- **Type Safety**: Full TypeScript coverage
- **Error Handling**: Graceful degradation at every level

---

## Database Schema

### Tables

#### `onboarding_profiles`
Stores user onboarding state and progress.

```sql
CREATE TABLE onboarding_profiles (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES users(id),
  creator_level VARCHAR(20),
  primary_goals TEXT[],
  completed_steps TEXT[],
  skipped_steps TEXT[],
  current_step VARCHAR(100),
  progress_percentage INTEGER,
  custom_path JSONB,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### `feature_unlock_states`
Tracks unlocked/locked features per user.

```sql
CREATE TABLE feature_unlock_states (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES users(id),
  unlocked_features TEXT[],
  locked_features JSONB,
  last_unlock_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### `onboarding_events`
Analytics events for tracking.

```sql
CREATE TABLE onboarding_events (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  event_type VARCHAR(50),
  step_id VARCHAR(100),
  timestamp TIMESTAMP,
  duration INTEGER,
  metadata JSONB,
  created_at TIMESTAMP
);
```

#### `feature_tour_progress`
Tracks feature tour completion.

```sql
CREATE TABLE feature_tour_progress (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  tour_id VARCHAR(100),
  completed_steps TEXT[],
  completed BOOLEAN,
  dismissed_permanently BOOLEAN,
  last_viewed_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(user_id, tour_id)
);
```

---

## Core Services

### LevelAssessor

Evaluates user experience level and assigns configuration.

```typescript
import { levelAssessor } from '@/lib/services/levelAssessor';

// Assess user level
const level = await levelAssessor.assessLevel(userId, {
  experience: 'intermediate',
  platforms: ['instagram', 'tiktok'],
  contentTypes: ['video', 'image'],
});

// Get level configuration
const config = levelAssessor.getLevelConfig(level);
```

### FeatureUnlocker

Manages feature unlocking based on conditions.

```typescript
import { featureUnlocker } from '@/lib/services/featureUnlocker';

// Check if feature is unlocked
const isUnlocked = await featureUnlocker.isFeatureUnlocked(userId, 'ai_content_generation');

// Unlock feature
await featureUnlocker.unlockFeature(userId, 'ai_content_generation');

// Get locked features with requirements
const locked = await featureUnlocker.getLockedFeatures(userId);
```

### AIAdapter

Configures AI behavior based on user level.

```typescript
import { aiAdapter } from '@/lib/services/aiAdapter';

// Apply AI configuration
await aiAdapter.applyConfiguration(userId, {
  verbosity: 'moderate',
  helpFrequency: 'moderate',
  suggestionComplexity: 'moderate',
});

// Get AI response adapted to user level
const response = await aiAdapter.adaptResponse(userId, rawResponse);
```

### OnboardingOrchestrator

Coordinates the onboarding flow.

```typescript
import { onboardingOrchestrator } from '@/lib/services/onboardingOrchestrator';

// Generate personalized path
const path = await onboardingOrchestrator.generatePath(userId, {
  goals: ['content_creation', 'audience_growth'],
  creatorLevel: 'intermediate',
});

// Complete step
await onboardingOrchestrator.completeStep(userId, 'creator_assessment', data);

// Get progress
const progress = await onboardingOrchestrator.getProgress(userId);
```

### FeatureTourService

Manages feature tours for re-onboarding.

```typescript
import { featureTourService } from '@/lib/services/featureTourService';

// Register a new tour
featureTourService.registerTour({
  id: 'new-feature-tour',
  featureId: 'new_feature',
  title: 'New Feature Tour',
  description: 'Learn about our new feature',
  category: 'new_feature',
  releaseDate: new Date(),
  priority: 'high',
  steps: [/* tour steps */],
});

// Get pending tours for user
const tours = await featureTourService.getPendingTours(userId);
```

---

## API Endpoints

### Onboarding

```
POST   /api/onboarding/start
GET    /api/onboarding/status
POST   /api/onboarding/step/:stepId/complete
POST   /api/onboarding/step/:stepId/skip
PATCH  /api/onboarding/creator-level
GET    /api/onboarding/path
```

### Features

```
GET    /api/features/unlocked
GET    /api/features/locked
GET    /api/features/:featureId/requirements
```

### Tours

```
GET    /api/onboarding/tours/:tourId/progress
POST   /api/onboarding/tours/:tourId/steps/:stepId/complete
POST   /api/onboarding/tours/:tourId/complete
POST   /api/onboarding/tours/:tourId/dismiss
```

### Analytics

```
POST   /api/onboarding/event
GET    /api/onboarding/analytics (admin only)
```

---

## Frontend Components

### OnboardingWizard

Main container for the onboarding flow.

```tsx
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

<OnboardingWizard 
  userId={userId}
  onComplete={() => router.push('/dashboard')}
/>
```

### FeatureTourGuide

Interactive tour guide component.

```tsx
import FeatureTourGuide from '@/components/onboarding/FeatureTourGuide';

<FeatureTourGuide
  tour={tour}
  userId={userId}
  onComplete={handleComplete}
  onDismiss={handleDismiss}
/>
```

### TourNotificationBadge

Notification badge for new features.

```tsx
import TourNotificationBadge from '@/components/onboarding/TourNotificationBadge';

<TourNotificationBadge 
  userId={userId}
  position="bottom-right"
/>
```

### OnboardingGuard

Route protection component.

```tsx
import OnboardingGuard from '@/components/onboarding/OnboardingGuard';

export default function ProtectedLayout({ children }) {
  return (
    <OnboardingGuard>
      {children}
    </OnboardingGuard>
  );
}
```

---

## Adding New Features

### 1. Define the Feature

```typescript
// In lib/services/featureUnlocker.ts
const newFeature: Feature = {
  id: 'my_new_feature',
  name: 'My New Feature',
  description: 'Description of the feature',
  category: 'content',
  priority: 'high',
  requirements: [
    {
      type: 'platform_connected',
      platform: 'instagram',
    },
    {
      type: 'step_completed',
      stepId: 'creator_assessment',
    },
  ],
};
```

### 2. Register the Feature

```typescript
featureUnlocker.registerFeature(newFeature);
```

### 3. Create a Feature Tour

```typescript
featureTourService.registerTour({
  id: 'my-new-feature-tour',
  featureId: 'my_new_feature',
  title: 'My New Feature',
  description: 'Learn how to use this feature',
  category: 'new_feature',
  releaseDate: new Date(),
  priority: 'high',
  steps: [
    {
      id: 'step-1',
      title: 'Introduction',
      content: 'Welcome to the new feature!',
      target: '#feature-button',
      placement: 'bottom',
    },
  ],
});
```

### 4. Add Feature Gate

```typescript
import { featureUnlocker } from '@/lib/services/featureUnlocker';

// In your component
const isUnlocked = await featureUnlocker.isFeatureUnlocked(userId, 'my_new_feature');

if (!isUnlocked) {
  return <FeatureLockedMessage featureId="my_new_feature" />;
}
```

---

## Adding New Steps

### 1. Create Step Component

```tsx
// components/onboarding/MyNewStep.tsx
export function MyNewStep({ onComplete, onSkip }) {
  const handleSubmit = (data) => {
    onComplete('my_new_step', data);
  };

  return (
    <div>
      <h2>My New Step</h2>
      {/* Step content */}
      <button onClick={handleSubmit}>Continue</button>
      <button onClick={onSkip}>Skip</button>
    </div>
  );
}
```

### 2. Add to Wizard

```tsx
// In OnboardingWizard.tsx
import { MyNewStep } from './MyNewStep';

const renderStep = () => {
  switch (currentStep) {
    case 'my_new_step':
      return <MyNewStep onComplete={handleStepComplete} onSkip={handleSkip} />;
    // ... other steps
  }
};
```

### 3. Update Path Generator

```typescript
// In onboardingOrchestrator.ts
const steps = [
  // ... existing steps
  {
    id: 'my_new_step',
    title: 'My New Step',
    description: 'Description',
    required: true,
    estimatedTime: 2, // minutes
  },
];
```

---

## Testing

### Unit Tests

```bash
npm run test:unit
```

### Integration Tests

```bash
npm run test:integration
```

### E2E Tests

```bash
npm run test:e2e
```

### Test Coverage

```bash
npm run test:coverage
```

---

## Deployment

### Database Migration

```bash
npm run migrate:onboarding
```

### Environment Variables

```env
DATABASE_URL=postgresql://...
NEXT_PUBLIC_API_URL=https://api.example.com
```

### Build

```bash
npm run build
```

### Deploy

```bash
npm run deploy
```

---

## Monitoring

### Key Metrics

- **Completion Rate**: % of users who complete onboarding
- **Average Time**: Time to complete onboarding
- **Drop-off Points**: Where users abandon onboarding
- **Feature Adoption**: % of users who use unlocked features

### Analytics Dashboard

Access at `/admin/onboarding/analytics` (admin only)

---

## Troubleshooting

### Common Issues

**Onboarding not starting**
- Check user authentication
- Verify database connection
- Check API endpoint availability

**Features not unlocking**
- Verify unlock conditions are met
- Check feature definitions
- Review unlock service logs

**Tours not appearing**
- Verify tour registration
- Check user tour progress
- Ensure target elements exist

---

## Support

- **Documentation**: [docs.huntaze.com](https://docs.huntaze.com)
- **Issues**: [github.com/huntaze/issues](https://github.com/huntaze/issues)
- **Slack**: #onboarding-dev

---

**Happy coding!** 🚀
